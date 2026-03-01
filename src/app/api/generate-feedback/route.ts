import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { transcript, questions, companyName, positionApplied, resumeText } = body;

        if (!transcript || transcript.length === 0) {
            return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
        }

        const transcriptText = transcript.map((t: any) => `${t.role.toUpperCase()}: ${t.text}`).join("\n");

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `You are an expert technical and behavioral interview coach.
Please carefully review the following interview transcript.

CRITICAL INSTRUCTION: Return ONLY a valid JSON object matching this EXACT structure (no markdown, no code blocks, no extra text):
{
    "summary": "A 2-3 sentence overall summary of how the interviewee performed.",
    "improvingPoints": ["General improvement point 1", "General improvement point 2", "General improvement point 3"],
    "qaBreakdown": [
    {
        "question": "The exact question the interviewer asked",
        "candidateAnswer": "A concise summary of what the candidate actually said in response",
        "suggestedAnswer": "A model, ideal answer to this question using the STAR method or best practice for this question type"
    }
    ]
}

For the qaBreakdown array:
- Only include question-answer pairs where the candidate actually gave a spoken answer (skip unanswered questions).
- The "question" must be the exact question as asked by the ASSISTANT.
- The "candidateAnswer" should be a fair paraphrase of what the USER (candidate) said.
- The "suggestedAnswer" should be a clear, practical, better answer the candidate could have used.

TRANSCRIPT:
${transcriptText.substring(0, 30000)}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        if (!responseText) {
            throw new Error("No response from AI.");
        }

        let feedback;
        try {
            // Strip markdown formatting if Gemini wrapped it
            let cleaned = responseText.trim();
            cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

            const startIdx = cleaned.indexOf("{");
            const endIdx = cleaned.lastIndexOf("}");
            if (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx) {
                feedback = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
            } else {
                throw new Error("Could not parse feedback");
            }
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

    } catch (error: any) {
        console.error("Feedback Generation Error:", error);

        // Handle Gemini Quota/Rate Limit Errors
        if (error.message?.includes("RESOURCE_EXHAUSTED") || error.status === "RESOURCE_EXHAUSTED" || error.code === 429) {
            return NextResponse.json(
                { error: "AI service is currently busy (Rate Limit reached). Please wait 60 seconds and try again." },
                { status: 429 }
            );
        }

        return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
    }
}
