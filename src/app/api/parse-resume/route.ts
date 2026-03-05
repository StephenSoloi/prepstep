import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const maxDuration = 60; // Allow 60s for cold starts and LLM response
export const runtime = "nodejs";

/**
 * Extracts plain text from a PDF buffer without any external library.
 * Works in every serverless environment — no worker, no native binaries.
 * Handles standard text streams (BT/ET blocks) in spec-compliant PDFs.
 */
function extractPdfText(buffer: Buffer): string {
    const raw = buffer.toString("latin1");
    const texts: string[] = [];

    // Pull every BT … ET (Begin Text / End Text) block
    const btEtRegex = /BT[\s\S]*?ET/g;
    let btMatch: RegExpExecArray | null;

    while ((btMatch = btEtRegex.exec(raw)) !== null) {
        const block = btMatch[0];

        // Match Tj, TJ, and ' operators that carry text
        const textOpRegex = /\(([^)]*)\)\s*(?:Tj|'|")|(\[([^\]]*)\])\s*TJ/g;
        let opMatch: RegExpExecArray | null;

        while ((opMatch = textOpRegex.exec(block)) !== null) {
            if (opMatch[1] !== undefined) {
                // Single string: (Hello) Tj
                texts.push(decodePdfString(opMatch[1]));
            } else if (opMatch[3] !== undefined) {
                // Array: [(Hello) 20 (World)] TJ
                const parts = opMatch[3].match(/\(([^)]*)\)/g) || [];
                for (const p of parts) {
                    texts.push(decodePdfString(p.slice(1, -1)));
                }
            }
        }
        texts.push(" "); // space between blocks
    }

    // Fallback: also grab any raw string literals outside BT/ET (e.g. form fields)
    if (texts.join("").trim().length < 50) {
        const fallback = raw.match(/\(([^\x00-\x08\x0e-\x1f)\\]{2,})\)/g) || [];
        return fallback
            .map(s => decodePdfString(s.slice(1, -1)))
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
    }

    return texts.join("").replace(/\s+/g, " ").trim();
}

/** Decode common PDF string escape sequences */
function decodePdfString(s: string): string {
    return s
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\\\/g, "\\")
        .replace(/\\([0-7]{3})/g, (_, oct) =>
            String.fromCharCode(parseInt(oct, 8))
        );
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("resume") as File;
        const companyName = formData.get("companyName") as string || "Not specified";
        const companyDescription = formData.get("companyDescription") as string || "Not specified";
        const positionApplied = formData.get("positionApplied") as string || "Not specified";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // --- Credit Check ---
        const { userId } = await auth();
        if (userId) {
            const dbUser = await prisma.user.findUnique({
                where: { clerkId: userId }
            });

            if (dbUser && dbUser.credits <= 0) {
                return NextResponse.json(
                    { error: `You have used all your ${dbUser.tier === "PREMIUM" ? "Pro" : "free"} interview credits. Please upgrade or contact support to continue.` },
                    { status: 403 }
                );
            }
        }

        // 1. Read file into a Node Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Quick sanity check — all PDFs start with %PDF
        if (!buffer.slice(0, 5).toString("ascii").startsWith("%PDF")) {
            return NextResponse.json(
                { error: "The uploaded file does not appear to be a valid PDF." },
                { status: 400 }
            );
        }

        // 2. Extract text
        let extractedText = "";
        try {
            extractedText = extractPdfText(buffer);
        } catch (parseError) {
            console.error("PDF Parsing Error:", parseError);
            return NextResponse.json(
                { error: "Could not parse the PDF file. Ensure it is a valid text-based PDF." },
                { status: 400 }
            );
        }

        if (!extractedText || extractedText.trim().length < 20) {
            return NextResponse.json(
                { error: "No readable text found in the PDF. It might be an image-only or password-protected PDF." },
                { status: 400 }
            );
        }

        // Truncate to avoid excessive tokens
        const resumeSnippet = extractedText.substring(0, 12000);

        // 3. Call Groq (free-tier, fast, reliable)
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

        const prompt = `You are an expert technical and behavioral interviewer preparing to interview a candidate.
        
Below is the text extracted from the candidate's uploaded document (resume, CV, or professional summary). Do your best to ignore any raw PDF formatting, technical metadata, encoding artifacts, or "garbage" characters. Extract the candidate's full name if possible (otherwise default to "Candidate"), and unconditionally generate exactly 5 highly relevant interview questions tailored to their background and the Job Context below.

Job Context:
- Company: ${companyName}
- Position Applied For: ${positionApplied}
- Company Description: ${companyDescription}

QUESTION REQUIREMENTS:
1. First question MUST be "Tell us about yourself."
2. Include at least one question about how they will contribute to ${companyName} as a ${positionApplied}.
3. Include at least one scenario/behavioral question.
4. Reference their actual experience from the extracted document text if possible. If the text is completely unreadable, base the questions mostly on the Job Context instead.
5. The 5th question MUST be a general, sensible, and relevant "up-to-date" question related to their field or the job (e.g., about a recent trend, a common tool, or a basic industry standard) that is easy to answer but shows they are current.

OUTPUT FORMAT — YOU MUST RETURN ONLY VALID JSON, NO MARKDOWN, NO EXTRA TEXT:
{
  "name": "Full Name or 'Candidate'",
  "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
}

DOCUMENT TEXT:
${resumeSnippet}`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 4096,
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) throw new Error("AI returned an empty response.");

        // 4. Parse Gemini JSON response
        const parsed = JSON.parse(responseText.trim());

        let questionsArray: string[] = [];
        let candidateName = "Candidate";

        if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            questionsArray = parsed.questions.filter(
                (q: unknown) => typeof q === "string" && q.trim().length > 0
            );
        } else {
            throw new Error("AI response has no valid questions array");
        }

        if (parsed.name && typeof parsed.name === "string") {
            candidateName = parsed.name.trim();
        }

        if (questionsArray.length === 0) {
            return NextResponse.json(
                { error: "No questions could be generated from this resume. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { questions: questionsArray, name: candidateName, resumeText: extractedText.trim() },
            { status: 200 }
        );

    } catch (error: unknown) {
        console.error("API Route Error:", error);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any;

        if (err.message?.includes("RESOURCE_EXHAUSTED") || err.status === "RESOURCE_EXHAUSTED" || err.status === 429 || err.statusCode === 429) {
            return NextResponse.json(
                { error: "AI service is currently busy. Please wait 60 seconds and try again." },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
