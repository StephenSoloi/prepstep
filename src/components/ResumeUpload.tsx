"use client";

import { useState } from "react";
import { FileText, UploadCloud, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ResumeUpload({
    onQuestionsGenerated,
    userStatus,
}: {
    onQuestionsGenerated: (questions: string[], applicantName: string, companyName: string, positionApplied: string, resumeText: string, companyDescription: string, backgroundHighlight: string) => void;
    userStatus: { tier: string; credits: number; limit: number } | null;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");
    const [applicantName, setApplicantName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [companyDescription, setCompanyDescription] = useState("");
    const [positionApplied, setPositionApplied] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selected = e.target.files[0];
            if (selected.type !== "application/pdf") {
                setError("Please upload a PDF file.");
                return;
            }
            setFile(selected);
            setError("");
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please upload a resume first.");
            return;
        }

        if (!applicantName || !companyName || !positionApplied || !companyDescription) {
            setError("Please fill in all the details (Name, Company, Position and Description) before starting the interview.");
            return;
        }

        setIsUploading(true);
        setError("");

        const MAX_RETRIES = 2;
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                if (attempt > 0) {
                    // Brief wait before retrying (cold start warmup)
                    await new Promise(res => setTimeout(res, 2000));
                }

                const formData = new FormData();
                formData.append("resume", file);
                formData.append("companyName", companyName);
                formData.append("companyDescription", companyDescription);
                formData.append("positionApplied", positionApplied);

                const res = await fetch("/api/parse-resume", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    const text = await res.text();
                    let errorMsg = "Failed to process resume";
                    try {
                        const parsed = JSON.parse(text);
                        if (parsed.error) {
                            errorMsg = parsed.error;
                            console.error("API Error:", errorMsg);
                        } else {
                            console.error("Server returned an error:", res.status, text);
                        }
                    } catch {
                        errorMsg = `Server Error (${res.status}): ${text.substring(0, 100)}...`;
                        console.error("Raw Server Error:", text);
                    }
                    throw new Error(errorMsg);
                }

                const data = await res.json();
                if (data.questions && data.questions.length > 0) {
                    onQuestionsGenerated(data.questions, applicantName, companyName, positionApplied, data.resumeText || "", companyDescription, data.backgroundHighlight || "");
                    return; // success — exit the loop and the function
                } else {
                    throw new Error("No questions could be generated.");
                }

            } catch (err: unknown) {
                lastError = err instanceof Error ? err : new Error("An error occurred.");
                const isNetworkError = lastError.message === "Failed to fetch" || lastError.message.includes("fetch");

                // Only retry on network-level errors (cold start), not API errors
                if (!isNetworkError || attempt === MAX_RETRIES) {
                    break; // Exit loop if not a network error or if max retries reached
                }
                // else: loop will retry
            }
        }

        // All attempts failed or a non-retryable error occurred
        if (lastError) {
            console.error(lastError);
            const msg = lastError.message;
            setError(msg);

            // Scroll to error message on mobile or if out of view
            setTimeout(() => {
                const errorElement = document.getElementById("upload-error");
                if (errorElement) {
                    errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 100);
        }

        setIsUploading(false);
    };

    const isLimitReached = userStatus && userStatus.credits <= 0;
    const isPremium = userStatus?.tier === "PREMIUM";

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors w-full">
            {/* Background decorative blob */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />

            <div className="flex flex-col items-center justify-center text-center">
                {isLimitReached ? (
                    <div className="py-6 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 ring-1 ring-red-500/30 group-hover:scale-110 transition-transform duration-500">
                            <UploadCloud className="w-10 h-10 text-red-400" />
                            <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-pulse" />
                        </div>

                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
                            {isPremium ? "Credit Limit Reached" : "Free Plan Exhausted"}
                        </h3>

                        <p className="text-slate-400 mb-8 max-w-sm leading-relaxed text-sm sm:text-base text-center">
                            {isPremium
                                ? "You've used all 5 of your Pro interviews for this cycle. Renew your subscription to get 5 more instant credits!"
                                : "You've successfully completed your 2 free interviews! Upgrade to Pro to unlock unlimited interviews and full career analytics."
                            }
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center relative z-40">
                            <button
                                onClick={() => window.location.href = "/pricing#pro-tier"}
                                className="px-8 py-3.5 rounded-full font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 text-sm sm:text-base relative z-50 touch-manipulation cursor-pointer"
                            >
                                <span>{isPremium ? "Get More Credits" : "Upgrade to Pro"}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                            {isPremium && (
                                <button
                                    onClick={() => window.location.href = "/dashboard"}
                                    className="px-8 py-3.5 rounded-full font-semibold border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all active:scale-95 text-sm sm:text-base relative z-50 touch-manipulation cursor-pointer"
                                >
                                    View History
                                </button>
                            )}
                        </div>
                    </div>
                ) : !file ? (
                    <>
                        <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 transition-transform duration-500 ring-1 ring-indigo-500/20">
                            <UploadCloud className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">Ready to Practice?</h3>
                        <p className="text-slate-400 mb-8 text-sm sm:text-base">Upload your resume (PDF) to start your AI interview</p>
                        <label className="relative cursor-pointer bg-white text-slate-900 px-10 py-4 rounded-full font-bold hover:bg-indigo-50 transition-all shadow-xl shadow-white/5 hover:scale-105 active:scale-95">
                            <span>Choose Resume</span>
                            <input
                                type="file"
                                className="hidden"
                                accept="application/pdf"
                                onChange={handleFileChange}
                            />
                        </label>
                        <p className="mt-6 text-slate-500 text-xs">Professional parsing & instant generation</p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6 text-green-400 ring-1 ring-green-500/30">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 leading-tight">{file.name}</h3>
                        <p className="text-emerald-400 font-medium mb-8 text-sm flex items-center gap-1.5 justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Document analyzed & ready
                        </p>

                        <div className="w-full max-w-sm flex flex-col gap-5 text-left mb-10 mx-auto">
                            <div className="group/input">
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 group-focus-within/input:text-indigo-400 transition-colors">Your First Name</label>
                                <input type="text" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm sm:text-base" placeholder="e.g. John" required />
                            </div>
                            <div className="group/input">
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 group-focus-within/input:text-indigo-400 transition-colors">Target Company</label>
                                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm sm:text-base" placeholder="e.g. Google / Safaricom" required />
                            </div>
                            <div className="group/input">
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 group-focus-within/input:text-indigo-400 transition-colors">Target Position</label>
                                <input type="text" value={positionApplied} onChange={(e) => setPositionApplied(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm sm:text-base" placeholder="e.g. Software Engineer" required />
                            </div>
                            <div className="group/input">
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 group-focus-within/input:text-indigo-400 transition-colors">Job Description Snippet</label>
                                <textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all h-28 resize-none text-sm sm:text-base" placeholder="Paste the key roles or requirements here..." required />
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 w-full justify-center">
                            <button
                                onClick={() => setFile(null)}
                                className="w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all active:scale-95 text-sm sm:text-base"
                                disabled={isUploading}
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="w-full sm:w-auto px-10 py-3.5 rounded-full font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 text-sm sm:text-base"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                                        <span>Designing Tasks...</span>
                                    </>
                                ) : (
                                    "Launch Interview"
                                )}
                            </button>
                        </div>
                    </>
                )}

                {error && (
                    <div id="upload-error" className="w-full mt-8 z-50 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/30 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-start gap-2 sm:gap-3 shadow-2xl shadow-red-900/20 max-w-2xl mx-auto">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/20">
                                <span className="text-red-500 font-bold text-base sm:text-lg">!</span>
                            </div>
                            <div className="flex-1 pt-0.5 sm:pt-1 text-left">
                                <h4 className="text-red-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-0.5 sm:mb-1">Upload Issue</h4>
                                <p className="text-white text-xs sm:text-sm leading-relaxed">{error}</p>
                            </div>
                            <button
                                onClick={() => setError("")}
                                className="text-slate-500 hover:text-white transition-colors p-1"
                                aria-label="Close error"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 4.293z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
