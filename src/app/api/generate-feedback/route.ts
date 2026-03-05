import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const maxDuration = 60; // Allow enough time for LLM generation
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { transcript, questions, companyName, positionApplied, resumeText } = body;

        if (!transcript || transcript.length === 0) {
            return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
        }

        const transcriptText = transcript.map((t: { role: string; text: string }) => `${t.role.toUpperCase()}: ${t.text}`).join("\n");

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

        const prompt = `You are an expert technical and behavioral interview coach.
Please carefully review the following interview transcript.

CRITICAL INSTRUCTION: Return a valid JSON object matching this EXACT structure — NO MARKDOWN, NO EXTRA TEXT, ONLY RAW JSON:
{
    "summary": "A 2-3 sentence overall summary of how the interviewee performed.",
    "metrics": {
       "overallScore": 0-100,
       "confidence": 0-100,
       "technicalPrecision": 0-100,
       "starMethodAlignment": 0-100,
       "clarityConciseness": 0-100
    },
    "improvingPoints": ["General improvement point 1", "General improvement point 2", "General improvement point 3"],
    "qaBreakdown": [
    {
        "question": "The exact question the interviewer asked",
        "candidateAnswer": "A concise summary of what the candidate actually said in response",
        "suggestedAnswer": "A model, ideal answer to this question using the STAR method or best practice for this question type"
    }
    ]
}

For the metrics:
- overallScore: An overall readiness percentage.
- confidence: Based on the candidate's flow and professional tone.
- technicalPrecision: Depth and accuracy of the answers to specific skills mentioned in the resume.
- starMethodAlignment: How well they structured their behavioral responses.
- clarityConciseness: Ability to get to the point without rambling.

For the qaBreakdown array:
- Only include question-answer pairs where the candidate actually gave a spoken answer (skip unanswered questions).
- The "question" must be the exact question as asked by the ASSISTANT.
- The "candidateAnswer" should be a fair paraphrase of what the USER (candidate) said.
- The "suggestedAnswer" should be a clear, practical, better answer the candidate could have used.

TRANSCRIPT:
${transcriptText.substring(0, 28000)}`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.5,
        });

        const responseText = completion.choices[0]?.message?.content;

        if (!responseText) {
            throw new Error("No response from AI.");
        }


        let feedback;
        try {
            feedback = JSON.parse(responseText.trim());
        } catch (e) {
            console.error("JSON parse error:", responseText, e);
            throw new Error("Failed to parse feedback from the AI model.");
        }

        // --- Save the interview to Supabase if the user is authenticated ---
        try {
            const { userId } = await auth();

            if (userId) {
                // Get the Clerk user details to ensure they exist in our local database
                const user = await currentUser();

                if (user) {
                    const email = user.emailAddresses[0]?.emailAddress || `${userId}@placeholder.com`;

                    // Robust Sync Logic: Find by Clerk ID first, then by Email
                    let dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });

                    if (!dbUser) {
                        // User not found by clerkId, check for existing by Email
                        const existingByEmail = await prisma.user.findUnique({ where: { email } });
                        if (existingByEmail) {
                            // Link existing record to this Clerk ID
                            dbUser = await prisma.user.update({
                                where: { id: existingByEmail.id },
                                data: { clerkId: userId, firstName: user.firstName, lastName: user.lastName }
                            });
                        } else {
                            // Create new
                            dbUser = await prisma.user.create({
                                data: {
                                    clerkId: userId,
                                    email: email,
                                    firstName: user.firstName,
                                    lastName: user.lastName,
                                    tier: "FREE",
                                    credits: 2
                                }
                            });
                        }
                    } else {
                        // Update existing Clerk user just in case name/email changed
                        dbUser = await prisma.user.update({
                            where: { id: dbUser.id },
                            data: { email: email, firstName: user.firstName, lastName: user.lastName }
                        });
                    }

                    // Save the completed interview session
                    await prisma.$transaction([
                        prisma.interviewSession.create({
                            data: {
                                userId: dbUser.id,
                                companyName: companyName || "Unknown Company",
                                positionApplied: positionApplied || "Unknown Role",
                                resumeText: resumeText || "",
                                questionsGen: questions || [],
                                transcript: transcript,
                                feedback: feedback
                            }
                        }),
                        prisma.user.update({
                            where: { id: dbUser.id },
                            data: { credits: { decrement: 1 } }
                        })
                    ]);
                }
            }
        } catch (dbError) {
            console.error("Failed to save interview to database:", dbError);
            // We do not throw here! If the DB fails, we still want to return the feedback to the user on the UI.
        }

        return NextResponse.json({ feedback }, { status: 200 });

    } catch (error: unknown) {
        console.error("Feedback Generation Error:", error);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any;

        // Handle Quota/Rate Limit Errors
        if (err.message?.includes("RESOURCE_EXHAUSTED") || err.status === "RESOURCE_EXHAUSTED" || err.code === 429) {
            return NextResponse.json(
                { error: "AI service is currently busy (Rate Limit reached). Please wait 60 seconds and try again." },
                { status: 429 }
            );
        }

        return NextResponse.json({ error: (error instanceof Error ? error.message : "Something went wrong") }, { status: 500 });
    }
}
