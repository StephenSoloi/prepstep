"use client";

import { useEffect, useState, useRef } from "react";
import Vapi from "@vapi-ai/web";
import { Mic, MicOff, PhoneOff, AudioLines, ShieldAlert, Sparkles } from "lucide-react";

export default function InterviewSession({
    questions,
    onEnd,
}: {
    questions: string[];
    onEnd: () => void;
}) {
    // Store Vapi instance in a ref to persist across renders without triggering effects
    const vapiRef = useRef<Vapi | null>(null);
    const [isCallActive, setIsCallActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState("");



    // Provide a stable start interface
    const startInterview = async () => {
        if (!vapiRef.current) {
            vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "");
            const vapiInstance = vapiRef.current;

            vapiInstance.on("call-start", () => setIsCallActive(true));
            vapiInstance.on("call-end", () => {
                setIsCallActive(false);
                onEnd();
            });
            vapiInstance.on("error", (e: unknown) => {
                console.error("VAPI ERROR OBJ:", e);
                let errorStr = String(e);
                if (e && typeof e === "object") {
                    const errorObj = e as Record<string, unknown>;
                    errorStr = String(errorObj.message || errorObj.type || JSON.stringify(e));
                    if (errorObj.error) {
                        const innerErrorObj = errorObj.error as Record<string, unknown>;
                        const innerError = String(innerErrorObj.message || innerErrorObj.name || String(innerErrorObj));
                        errorStr += ` | Detail: ${innerError}`;
                    }
                }
                setError(`AI connection error: ${errorStr}`);
                setIsCallActive(false);
            });
        }

        try {
            setError("");

            // Format the questions into a conversational starting prompt
            const startingMessage = `Hello! I've analyzed your resume and prepared ${questions.length} questions for you. Are you ready to begin?`;

            await vapiRef.current.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "", {
                firstMessage: startingMessage,
                // Passing a variable value just in case the Vapi template in the dashboard expects it
                variableValues: {
                    questions: questions.join(", ")
                },
                startSpeakingPlan: {
                    transcriptionEndpointingPlan: {
                        onNoPunctuationSeconds: 2.5,
                        onPunctuationSeconds: 1.5
                    }
                }
            });
        } catch (e: unknown) {
            console.error(e);
            setError("Microphone permission denied or connection failed.");
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
            // Clean up on component unmount
            if (vapiRef.current) {
                vapiRef.current.stop();
                vapiRef.current.removeAllListeners();
            }
        };
    }, []);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 backdrop-blur-md shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px]" />

            <div className="relative z-10 flex flex-col items-center justify-center min-h-[400px]">
                {error && (
                    <div className="absolute top-0 left-0 right-0 bg-red-500/20 text-red-200 p-3 rounded-lg flex items-center gap-2 text-sm justify-center mb-4">
                        <ShieldAlert className="w-4 h-4" /> {error}
                    </div>
                )}

                {!isCallActive ? (
                    <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <Sparkles className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">Questions Generated!</h2>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">
                            Our AI has analyzed your resume and crafted {questions.length} tailored questions for you. Ensure you are in a quiet room and click start when ready.
                        </p>
                        <button
                            onClick={startInterview}
                            className="px-8 py-4 rounded-full font-bold text-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 hover:scale-105"
                        >
                            Start Interview Call
                        </button>
                        <button
                            onClick={onEnd}
                            className="px-8 py-4 rounded-full font-semibold text-slate-400 hover:text-white transition-colors block mx-auto mt-4"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="text-center w-full">
                        <div className="relative w-40 h-40 mx-auto mb-12 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                            <div className="absolute inset-2 rounded-full bg-green-500/30 animate-pulse" />
                            <div className="absolute inset-4 rounded-full bg-slate-800 flex items-center justify-center shadow-2xl border border-green-500/50">
                                <AudioLines className="w-12 h-12 text-green-400" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Interview in Progress</h2>
                        <p className="text-green-400 font-medium tracking-widest uppercase text-sm mb-12">Listening & Speaking...</p>

                        <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={toggleMute}
                                className={"p-5 rounded-full backdrop-blur-md transition-colors border " + (isMuted ? "bg-amber-500/20 text-amber-500 border-amber-500/50" : "bg-slate-800 text-white border-white/10 hover:bg-slate-700")}
                            >
                                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </button>

                            <button
                                onClick={stopInterview}
                                className="p-5 rounded-full bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30 transition-colors shadow-lg shadow-red-500/20"
                            >
                                <PhoneOff className="w-6 h-6" />
                            </button>
                        </div>
                        <p className="text-slate-500 mt-8 text-sm">Remember your STAR format (Situation, Task, Action, Result)</p>
                    </div>
                )}
            </div>
        </div>
    );
}
