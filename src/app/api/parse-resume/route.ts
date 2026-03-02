import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getResolvedPDFJS, extractText } from "unpdf";

export const runtime = "nodejs";

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
                    { error: `You have used all your ${dbUser.tier === 'PREMIUM' ? 'Pro' : 'free'} interview credits. Please upgrade or contact support to continue.` },
                    { status: 403 }
                );
            }
        }

        // 1. Convert PDF to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Extract text from PDF
        let extractedText = "";
        try {
            // unpdf requires the pdfjs-dist worker to be resolved
            await getResolvedPDFJS();
            const { text } = await extractText(buffer);
            extractedText = Array.isArray(text) ? text.join("\n") : text;
        } catch (parseError) {
            console.error("PDF Parsing Error:", parseError);
            return NextResponse.json(
                { error: "Could not parse the PDF file. Ensure it is a valid text-based PDF." },
                { status: 400 }
            );
        }

        if (!extractedText || extractedText.trim().length === 0) {
            return NextResponse.json(
                { error: "No readable text found in the PDF. It might be an image-only PDF." },
                { status: 400 }
            );
        }

        // truncate resume text to avoid excessive tokens
        const resumeSnippet = extractedText.substring(0, 12000);

        // 3. Initialize Groq
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

        // 4. Build the prompt
        const prompt = `You are an expert technical and behavioral interviewer for top companies.

Job Context:
- Company: ${companyName}
- Position Applied For: ${positionApplied}
- Company Description: ${companyDescription}

Carefully read the candidate's resume below. Extract their full name. Then generate exactly 4 highly relevant interview questions tailored to their background and this specific role.

QUESTION REQUIREMENTS:
1. First question MUST be "Tell us about yourself." — this is standard in every real interview.
2. Include at least one question about how they will contribute to ${companyName} as a ${positionApplied}.
3. Include at least one scenario/behavioral question (e.g. how they handle a specific challenge relevant to the role).
4. Make all questions specific to the candidate's actual experience — reference their schools, jobs, or skills where appropriate.

OUTPUT FORMAT — CRITICAL:
Return ONLY a raw JSON object. No markdown, no code fences, no backticks, no explanation text. Just the JSON:
{"name":"Actual Candidate Name","questions":["Tell us about yourself.","Question 2?","Question 3?","Question 4?"]}

RESUME:
${resumeSnippet}`;

        // 5. Call Groq
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1024,
        });

        const responseText = completion.choices[0]?.message?.content || "";
        if (!responseText) {
            throw new Error("AI returned an empty response.");
        }

        console.log("Groq raw response:", responseText.substring(0, 500));

        // 6. Robust JSON extraction — strips markdown fences if present, then parses
        let questionsArray: string[] = [];
        let candidateName = "Candidate";

        try {
            // Strip common markdown code fences Groq sometimes wraps around JSON
            let cleaned = responseText.trim();
            cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

            // Find the outermost JSON object
            const startIdx = cleaned.indexOf("{");
            const endIdx = cleaned.lastIndexOf("}");

            if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
                console.error("No JSON object found in Groq response. Raw:", responseText);
                throw new Error("No JSON object found in response");
            }

            const jsonStr = cleaned.substring(startIdx, endIdx + 1);
            const parsed = JSON.parse(jsonStr);

            if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
                questionsArray = parsed.questions.filter((q: unknown) => typeof q === "string" && q.trim().length > 0);
            } else {
                throw new Error("Parsed JSON has no valid questions array");
            }

            if (parsed.name && typeof parsed.name === "string") {
                candidateName = parsed.name.trim();
            }
        } catch (jsonError) {
            console.error("JSON Parsing Error:", jsonError);
            console.error("Full Groq response:", responseText);
            return NextResponse.json(
                { error: "The AI returned an unexpected format. Please try again." },
                { status: 500 }
            );
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

        // Handle Groq Quota/Rate Limit Errors
        if (err.message?.includes("RESOURCE_EXHAUSTED") || err.status === "RESOURCE_EXHAUSTED") {
            return NextResponse.json(
                { error: "AI service is currently busy (Rate Limit reached). Please wait 60 seconds and try again." },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
