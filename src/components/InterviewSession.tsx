"use client";

import { useEffect, useState, useRef } from "react";
import Vapi from "@vapi-ai/web";
import { Mic, MicOff, PhoneOff, AudioLines, ShieldAlert, Sparkles, Loader2 } from "lucide-react";

interface VapiMessage {
    type: string;
    transcriptType?: string;
    role?: string;
    transcript?: string;
}

export default function InterviewSession({
    questions,
    applicantName,
    companyName,
    positionApplied,
    resumeText,
    companyDescription,
    backgroundHighlight,
    onEnd,
}: {
    questions: string[];
    applicantName: string;
    companyName: string;
    positionApplied: string;
    resumeText: string;
    companyDescription: string;
    backgroundHighlight?: string;
    onEnd: (transcript: { role: string; text: string }[]) => void;
}) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vapiRef = useRef<any>(null); // Kept as any for the ref itself since SDK typing can be inconsistent
    const transcriptRef = useRef<{ role: string; text: string }[]>([]);
    const [isCallActive, setIsCallActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState("");

    const startInterview = async () => {
        if (!vapiRef.current) {
            vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "");
            const vapi = vapiRef.current;

            vapi.on("call-start", () => {
                setIsConnecting(false);
                setIsCallActive(true);
            });

            vapi.on("call-end", () => {
                setIsCallActive(false);
                setIsConnecting(false);
                onEnd(transcriptRef.current);
            });

            vapi.on("message", (message: VapiMessage) => {
                if (message.type === "transcript" && message.transcriptType === "final" && message.role && message.transcript) {
                    transcriptRef.current.push({
                        role: message.role,
                        text: message.transcript,
                    });
                }
            });

            vapi.on("error", (e: unknown) => {
                try {
                    console.error("VAPI ERROR (raw):", e);
                    console.error("VAPI ERROR (json):", JSON.stringify(e, null, 2));
                } catch {
                    console.error("VAPI ERROR (unparseable):", String(e));
                }
                let errorStr = "Unknown error";
                if (typeof e === "string") {
                    errorStr = e;
                } else if (e && typeof e === "object") {
                    const obj = e as Record<string, unknown>;
                    const msg = obj.message ?? obj.type ?? obj.errorMsg ?? obj.code;
                    const inner = obj.error ? JSON.stringify(obj.error) : obj.statusCode ? "HTTP " + String(obj.statusCode) : null;
                    errorStr = msg ? String(msg) : JSON.stringify(e);
                    if (inner) errorStr += " — " + inner;
                }
                setError("AI connection error: " + errorStr);
                setIsCallActive(false);
                setIsConnecting(false);
            });
        }

        try {
            setError("");
            setIsConnecting(true);
            transcriptRef.current = [];

            // Sanitize names to avoid unicode and newline breaking Vapi's strict input validator
            const sanitizedName = applicantName.replace(/[\n\r\t\\]/g, "").trim();
            const firstName = sanitizedName.split(" ")[0] || "there";
            const questionsBlock = questions.map((q, i) => `${i + 1}. ${q}`).join("\n");

            // Keep resume snippet short — large prompts slow GPT responses and risk Vapi timeouts
            const resumeSnippet = resumeText ? resumeText.substring(0, 3500) : "Not provided.";

            const systemContext = `You are an elite Executive Hiring Manager conducting a high-stakes, professional voice interview for ${companyName}.
            
Your goal is to conduct a "Deep-Dive" interview. You have analyzed ${firstName}'s resume thoroughly, and you must prove it by grounding your conversation in their specific history.

ROLE: ${positionApplied}
CANDIDATE: ${firstName}
${companyDescription ? `TARGET COMPANY CONTEXT: ${companyDescription}` : ""}

CANDIDATE RESUME DATA (INTERNALIZED):
---
${resumeSnippet}
---

MANDATORY VOICE PERSONALITY:
- Professional, observant, and highly intelligent.
- You are not a chatbot; you are a senior leader who has "done their homework" on this candidate.

STRICT RULES FOR AUTHENTICITY AND CONVERSATION FLOW (YOU MUST FOLLOW THESE):
1. DEEP RESUME INTEGRATION: For EVERY single question, you MUST explicitly name a past company, a specific project, or a concrete skill exactly as it appears in the candidate's resume. (Example: "In your experience at [Company Name], we saw that you [Specific Task]. How will you apply that here at ${companyName}?")
2. ACTIVE LISTENING & TRANSITIONS: After the candidate answers, DO NOT immediately fire off the next question. First, provide a brief, thoughtful 1-2 sentence reaction to what they just said. Then, explicitly transition using a phrase like "That makes sense. Now, let's move to the next question..." or "Interesting approach. Moving on..."
3. ONE AT A TIME: Ask exactly ONE question at a time. Never ask compound questions. Wait for a full spoken response.
4. VOICE ONLY: Never ask the candidate to type or look at a screen. Speak as naturally as a human.

INTERVIEW STRUCTURE (EXACTLY 5 QUESTIONS TOTAL):
1. START: You MUST ask some variation of "Tell us about yourself" as the very first question, but pivot it slightly to their background. (e.g., "Tell us about yourself, specifically how your journey from [University/First Job] led you to this role at ${companyName}.")
2. MIDDLE (Q2, Q3, Q4): Ask the remaining prepared questions, but you MUST frame them entirely around exact experiences or skills from their resume.
3. THE COMPETENCY TEST (Question 5): A specific behavioral scenario based on a gap or strength in their resume.
4. WRAP UP: Close warmly and end the call.

PREPARED QUESTIONS TO WEAVE INTO YOUR PERSONALLY TAILORED FLOW:
${questionsBlock}`;

            // Pool of varied greetings — one is picked at random each session
            const greetingFact = backgroundHighlight ? ` ${backgroundHighlight}` : " I've reviewed your profile and I'm genuinely excited to learn more about you.";
            const greetingTemplates = [
                `Hi ${firstName}! Wonderful to have you here today.${greetingFact} We're going to have a great conversation — take a deep breath, and let me know when you're set to go!`,
                `Welcome, ${firstName}! It's great to put a voice to the name.${greetingFact} We'll take it one step at a time, so just relax and we'll get started whenever you're ready.`,
                `Good day, ${firstName}! Thank you so much for making time for this interview.${greetingFact} Feel free to take a moment to settle in, and then we'll dive right in.`,
                `Hello ${firstName}, and welcome! I'm delighted you're here.${greetingFact} There's no rush at all — this is a conversation, not a quiz. Whenever you feel comfortable, just let me know and we'll begin.`,
                `${firstName}, welcome! It's a pleasure to meet you.${greetingFact} We'll keep this conversational and relaxed. Just say the word and we'll get things rolling!`,
                `Hey ${firstName}, so glad you could make it!${greetingFact} I want this to feel like a real, open conversation — so just be yourself. Ready when you are!`,
                `Welcome aboard, ${firstName}! Thank you for joining us today.${greetingFact} We have a few questions lined up that I think you'll find engaging. Take your time, and whenever you're comfortable, we'll get started.`,
                `${firstName}, it's great to have you here!${greetingFact} This will be a relaxed, professional conversation — just speak naturally and we'll begin whenever you give the go-ahead.`,
            ];
            const firstMessage = greetingTemplates[Math.floor(Math.random() * greetingTemplates.length)];


            const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "";
            if (!assistantId) {
                throw new Error("NEXT_PUBLIC_VAPI_ASSISTANT_ID is not set in .env");
            }

            await vapiRef.current.start(assistantId, {
                firstMessage,
                model: {
                    provider: "openai",
                    model: "gpt-4o-mini",
                    messages: [{ role: "system", content: systemContext }],
                },
            });
        } catch (e: unknown) {
            console.error("Start error:", e);
            const msg = e instanceof Error ? e.message : String(e);
            setError("Could not start interview: " + msg);
            setIsConnecting(false);
        }
    };

    const stopInterview = () => {
        if (vapiRef.current) {
            vapiRef.current.stop();
        }
    };

    const toggleMute = () => {
        if (vapiRef.current) {
            vapiRef.current.setMuted(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    useEffect(() => {
        return () => {
            if (vapiRef.current) {
                vapiRef.current.stop();
                vapiRef.current.removeAllListeners();
            }
        };
    }, []);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-10 backdrop-blur-md shadow-2xl relative overflow-hidden group w-full">
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-indigo-500/10 rounded-full blur-[60px] sm:blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-teal-500/10 rounded-full blur-[60px] sm:blur-[80px]" />

            <div className="relative z-10 flex flex-col items-center justify-center min-h-[350px] sm:min-h-[400px]">
                {error && (
                    <div className="absolute top-0 left-0 right-0 bg-red-500/20 text-red-200 p-3 rounded-lg flex items-center gap-2 text-sm justify-center mb-4">
                        <ShieldAlert className="w-4 h-4" /> {error}
                    </div>
                )}

                {/* ── CONNECTING ── */}
                {isConnecting && (
                    <div className="text-center w-full px-2">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-inner">
                            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400 animate-spin" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Connecting…</h2>
                        <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
                            Your AI interviewer is reviewing your resume and preparing. This usually takes a few seconds.
                        </p>
                    </div>
                )}

                {/* ── IDLE ── */}
                {!isConnecting && !isCallActive && (
                    <div className="text-center w-full px-2">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-inner">
                            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Questions Generated!</h2>
                        <p className="text-slate-400 text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto">
                            Our AI has analyzed your resume and crafted {questions.length} tailored questions for your {positionApplied} interview.
                            Find a quiet room and click start when ready.
                        </p>
                        <button
                            onClick={startInterview}
                            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-full font-bold text-base sm:text-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95"
                        >
                            Start Interview Call
                        </button>
                        <button
                            onClick={() => onEnd([])}
                            className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-full font-semibold text-slate-400 hover:text-white transition-colors block mx-auto sm:mt-4 active:scale-95"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {/* ── ACTIVE CALL ── */}
                {!isConnecting && isCallActive && (
                    <div className="text-center w-full px-2">
                        <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-8 sm:mb-12 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                            <div className="absolute inset-2 rounded-full bg-green-500/30 animate-pulse" />
                            <div className="absolute inset-4 rounded-full bg-slate-800 flex items-center justify-center shadow-2xl border border-green-500/50">
                                <AudioLines className="w-10 h-10 sm:w-12 sm:h-12 text-green-400" />
                            </div>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">Interview in Progress</h2>
                        <p className="text-green-400 font-medium tracking-widest uppercase text-xs sm:text-sm mb-8 sm:mb-12">Listening &amp; Speaking...</p>

                        <div className="flex items-center justify-center gap-5 sm:gap-6">
                            <button
                                onClick={toggleMute}
                                className={"p-4 sm:p-5 rounded-full backdrop-blur-md transition-colors border shadow-lg active:scale-95 " +
                                    (isMuted
                                        ? "bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-amber-500/20"
                                        : "bg-slate-800 text-white border-white/10 hover:bg-slate-700 shadow-transparent")}
                            >
                                {isMuted ? <MicOff className="w-6 h-6 sm:w-6 sm:h-6" /> : <Mic className="w-6 h-6 sm:w-6 sm:h-6" />}
                            </button>

                            <button
                                onClick={stopInterview}
                                className="p-4 sm:p-5 rounded-full bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30 transition-colors shadow-lg shadow-red-500/20 active:scale-95"
                            >
                                <PhoneOff className="w-6 h-6 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                        <p className="text-slate-500 mt-6 sm:mt-8 text-xs sm:text-sm">Remember your STAR format (Situation, Task, Action, Result)</p>
                    </div>
                )}
            </div>
        </div>
    );
}
