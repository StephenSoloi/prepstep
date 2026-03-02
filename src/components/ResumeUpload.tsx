"use client";

import { useState } from "react";
import { FileText, UploadCloud, Loader2 } from "lucide-react";

export default function ResumeUpload({
    onQuestionsGenerated,
}: {
    onQuestionsGenerated: (questions: string[], applicantName: string, companyName: string, positionApplied: string, resumeText: string, companyDescription: string) => void;
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
            alert("Please upload a resume first.");
            return;
        }

        if (!applicantName || !companyName || !positionApplied || !companyDescription) {
            alert("Please fill in all the details (Name, Company, Position and Description) before starting the interview.");
            return;
        }

        setIsUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("resume", file);
            formData.append("companyName", companyName);
            formData.append("companyDescription", companyDescription);
            formData.append("positionApplied", positionApplied);

            // We will create this API route next
            const res = await fetch("/api/parse-resume", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("Server returned an error:", res.status, text);
                let errorMsg = "Failed to process resume";
                try {
                    const parsed = JSON.parse(text);
                    if (parsed.error) errorMsg = parsed.error;
                } catch {
                    errorMsg = `Server Error (${res.status}): ${text.substring(0, 100)}...`;
                }
                throw new Error(errorMsg);
            }

            const data = await res.json();
            if (data.questions && data.questions.length > 0) {
                onQuestionsGenerated(data.questions, applicantName, companyName, positionApplied, data.resumeText || "", companyDescription);
            } else {
                throw new Error("No questions could be generated.");
            }
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An error occurred.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden group hover:border-indigo-500/50 transition-colors w-full">
            <div className="flex flex-col items-center justify-center text-center">
                {!file ? (
                    <>
                        <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400">
                            <UploadCloud className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-2">Upload your Resume</h3>
                        <p className="text-slate-400 mb-8">PDF format, max 5MB</p>
                        <label className="relative cursor-pointer bg-white text-slate-900 px-8 py-3 rounded-full font-semibold hover:bg-indigo-50 transition-colors shadow-lg shadow-white/10">
                            <span>Choose File</span>
                            <input
                                type="file"
                                className="hidden"
                                accept="application/pdf"
                                onChange={handleFileChange}
                            />
                        </label>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6 text-green-400">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">{file.name}</h3>
                        <p className="text-slate-400 mb-8 text-sm">Ready to analyze</p>

                        <div className="w-full max-w-sm flex flex-col gap-4 text-left mb-8">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Your First Name</label>
                                <input type="text" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" placeholder="e.g. John/Jane" required />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Company/Institution Applying To</label>
                                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" placeholder="e.g. IEBC/UN" required />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Position Applied For</label>
                                <input type="text" value={positionApplied} onChange={(e) => setPositionApplied(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" placeholder="e.g. IT Professional" required />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Brief description of the job roles/role applying for</label>
                                <textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 h-24 resize-none" placeholder="e.g. Set-up, configure and operate ICT equipments....." required />
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 w-full justify-center">
                            <button
                                onClick={() => setFile(null)}
                                className="w-full sm:w-auto px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-full font-semibold border border-white/20 text-white hover:bg-white/10 transition-colors active:scale-95"
                                disabled={isUploading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="w-full sm:w-auto px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-full font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                                        <span>Analyzing...</span>
                                    </>
                                ) : (
                                    "Start Interview"
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {error && (
                <p className="text-red-400 mt-4 text-center text-sm bg-red-400/10 py-2 rounded-lg">
                    {error}
                </p>
            )}
        </div>
    );
}
