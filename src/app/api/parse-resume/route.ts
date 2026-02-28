import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

// We force the standard Node.js runtime because pdf-parse needs native node modules (fs, etc).
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("resume") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // 1. Convert the uploaded file to a Node Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Extract text from the PDF using pdf-parse
        let extractedText = "";
        try {
            const data = await pdfParse(buffer);
            extractedText = data.text;
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

        // 3. Initialize Gemini SDK
        // The SDK automatically picks up GEMINI_API_KEY from the environment
        const ai = new GoogleGenAI({});

        // 4. Create the strict prompt to get ONLY a JSON array
        const prompt = `
      You are an expert technical and behavioral interviewer for top technology companies.
      I am going to provide you with a candidate's resume text.

      Analyze their experience, education, and skills. Then, generate exactly 5 highly relevant, 
      challenging interview questions tailored to their background. Do not ask generic questions like 
      "Tell me about yourself". Ask about specific projects or technologies listed on their resume.

      CRITICAL INSTRUCTION: Return ONLY a valid JSON array of strings. Do not include markdown blocks, 
      explanations, or polite text. Just the raw array.

      Example output format:
      ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]

      RESUME TEXT:
      ${extractedText.substring(0, 15000)} // truncate to avoid token limits if the resume is ridiculously long
    `;

        // 5. Call Gemini API (using gemini-2.5-flash as the fast default model from @google/genai)
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const responseText = response.text;
        if (!responseText) {
            throw new Error("Gemini returned an empty response.");
        }

        // 6. Clean and parse the response
        let questionsArray: string[] = [];
        try {
            // Find the start of the JSON array (in case Gemini still included markdown)
            const startIdx = responseText.indexOf("[");
            const endIdx = responseText.lastIndexOf("]");

            if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                const jsonStr = responseText.substring(startIdx, endIdx + 1);
                questionsArray = JSON.parse(jsonStr);
            } else {
                // Fallback parsing if it didn't use an array
                questionsArray = responseText.split("\n").filter(line => line.trim().length > 10).slice(0, 5);
            }
        } catch (jsonError) {
            console.error("JSON Parsing Error from Gemini:", jsonError);
            return NextResponse.json(
                { error: "Failed to format questions from AI. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json({ questions: questionsArray }, { status: 200 });

    } catch (error: unknown) {
        console.error("API Route Error:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
    }
}
