"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  FileText,
  PlayCircle,
  Sparkles,
  CheckCircle,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { SignInButton, SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import ResumeUpload from "@/components/ResumeUpload";
import InterviewSession from "@/components/InterviewSession";

export default function Home() {
  const { isSignedIn } = useAuth();
  const [questions, setQuestions] = useState<string[]>([]);
  const [applicantName, setApplicantName] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [positionApplied, setPositionApplied] = useState<string>("");
  const [resumeText, setResumeText] = useState<string>("");
  const [companyDescription, setCompanyDescription] = useState<string>("");
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [userStatus, setUserStatus] = useState<{ tier: string; credits: number; limit: number } | null>(null);
  const [feedback, setFeedback] = useState<{
    summary: string;
    improvingPoints: string[];
    qaBreakdown: {
      question: string;
      candidateAnswer: string;
      suggestedAnswer: string;
    }[];
  } | null>(null);

  const fetchUserStatus = async () => {
    try {
      const res = await fetch("/api/user/status");
      if (res.ok) {
        const data = await res.json();
        setUserStatus(data);
      }
    } catch (e) {
      console.error("Error fetching user status:", e);
    }
  };

  useEffect(() => {
    fetchUserStatus();
  }, [isSignedIn]); // Refresh when sign-in state changes

  const handleInterviewEnd = async (
    transcript: { role: string; text: string }[],
  ) => {
    setIsInterviewStarted(false);
    setQuestions([]);

    if (transcript.length < 2) {
      return;
    }

    setIsGeneratingFeedback(true);
    try {
      const res = await fetch("/api/generate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          questions,
          companyName,
          positionApplied,
          resumeText,
        }),
      });
      const data = await res.json();
      if (data.feedback) {
        setFeedback(data.feedback);
      }
    } catch (e) {
      console.error("Error fetching feedback:", e);
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-950 font-sans">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10 flex flex-col items-center">
        {/* Nav / Logo */}
        <header className="w-full flex justify-between items-center mb-10 sm:mb-16">
          <div className="flex items-center gap-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">
            <Sparkles className="text-indigo-400 w-6 h-6" />
            PrepStep
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/vapi-ai"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Powered by Vapi + Gemini
            </a>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-5 py-2 rounded-full font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10">
                  Log In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-2 sm:gap-4">
                <Link
                  href="/pricing"
                  className="px-3 sm:px-5 py-2 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 text-xs sm:text-sm"
                >
                  Upgrade
                </Link>
                <Link
                  href="/dashboard"
                  className="px-3 sm:px-5 py-2 rounded-full font-semibold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20 text-xs sm:text-sm"
                >
                  Dashboard
                </Link>
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox:
                        "w-10 h-10 border-2 border-indigo-500/50",
                    },
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {isInterviewStarted ? (
            <motion.div
              key="interview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-4xl"
            >
              <InterviewSession
                questions={questions}
                applicantName={applicantName}
                companyName={companyName}
                positionApplied={positionApplied}
                resumeText={resumeText}
                companyDescription={companyDescription}
                onEnd={handleInterviewEnd}
              />
            </motion.div>
          ) : isGeneratingFeedback ? (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-2xl flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-3xl p-12 backdrop-blur-md shadow-2xl mt-8"
            >
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
              <h2 className="text-2xl text-white font-semibold mb-2">
                Analyzing Your Interview...
              </h2>
              <p className="text-slate-400 text-center">
                Our AI is preparing your summary and personalized feedback.
              </p>
            </motion.div>
          ) : feedback ? (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-4xl bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 backdrop-blur-md shadow-2xl mt-8 mb-20 text-left"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-8">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-400 shrink-0" />
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                  Interview Feedback
                </h2>
              </div>

              <div className="bg-slate-900/50 rounded-xl sm:rounded-2xl p-5 sm:p-8 mb-6 border border-slate-800">
                <h3 className="text-xl font-semibold text-indigo-400 mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6" /> Interview Summary
                </h3>
                <p className="text-slate-300 leading-relaxed text-lg">
                  {feedback.summary}
                </p>
              </div>

              {/* Q&A Breakdown */}
              {feedback.qaBreakdown && feedback.qaBreakdown.length > 0 && (
                <div className="bg-slate-900/50 rounded-2xl p-6 md:p-8 mb-6 border border-slate-800">
                  <h3 className="text-xl font-semibold text-violet-400 mb-6 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z"
                      />
                    </svg>
                    Question-by-Question Breakdown
                  </h3>
                  <div className="space-y-6">
                    {feedback.qaBreakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="border border-slate-700 rounded-xl overflow-hidden flex flex-col"
                      >
                        <div className="bg-indigo-600/10 border-b border-slate-700 px-4 sm:px-5 py-3">
                          <p className="text-indigo-300 font-semibold text-xs sm:text-sm uppercase tracking-wide mb-1">
                            Question {idx + 1}
                          </p>
                          <p className="text-white font-medium text-sm sm:text-base leading-snug">
                            {item.question}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700">
                          <div className="p-4 sm:p-5">
                            <p className="text-amber-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">
                              Your Answer
                            </p>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              {item.candidateAnswer}
                            </p>
                          </div>
                          <div className="p-4 sm:p-5 bg-teal-500/5">
                            <p className="text-teal-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">
                              Suggested Better Answer
                            </p>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              {item.suggestedAnswer}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-900/50 rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-slate-800">
                <h3 className="text-xl font-semibold text-teal-400 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" /> Areas for Improvement
                </h3>
                <ul className="space-y-4">
                  {feedback.improvingPoints.map(
                    (point: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold">
                          {idx + 1}
                        </div>
                        <span className="text-slate-300 text-lg leading-relaxed">
                          {point}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setFeedback(null)}
                  className="px-8 py-4 rounded-full font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
                >
                  Start New Interview
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-4xl flex flex-col items-center text-center mt-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs sm:text-sm font-medium mb-6 sm:mb-8 border border-indigo-500/20">
                <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                Voice-First AI Interviewer
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4 sm:mb-6 leading-[1.1] sm:leading-tight px-2">
                Nail your next interview <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-teal-400">
                  with pure confidence.
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mb-10 sm:mb-12 px-2">
                Upload your resume. Our AI instantly analyzes your experience
                and conducts a realistic, real-time voice interview tailored to
                your background.
              </p>

              {/* Upload Section Widget */}
              <div className="w-full max-w-xl mx-auto">
                <SignedIn>
                  {userStatus && (
                    <div className="mb-4 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${userStatus.tier === 'PREMIUM' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-300'}`}>
                        {userStatus.tier === 'PREMIUM' ? 'Pro' : 'Free'}
                      </span>
                      <div className="h-4 w-[1px] bg-white/10" />
                      <span className={`text-sm font-semibold ${userStatus.credits <= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {userStatus.credits} / {userStatus.limit} interviews remaining
                      </span>
                    </div>
                  )}
                  <ResumeUpload
                    onQuestionsGenerated={(
                      generatedQuestions,
                      name,
                      compName,
                      posApplied,
                      resumeTxt,
                      compDesc,
                    ) => {
                      setQuestions(generatedQuestions);
                      setApplicantName(name);
                      setCompanyName(compName);
                      setPositionApplied(posApplied);
                      setResumeText(resumeTxt);
                      setCompanyDescription(compDesc);
                      setIsInterviewStarted(true);
                      fetchUserStatus(); // Refresh credits
                    }}
                  />
                </SignedIn>
                <SignedOut>
                  <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-8 sm:p-12 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 shadow-inner">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="w-10 h-10 text-slate-400"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      Sign in to start practicing
                    </h3>
                    <p className="text-slate-400 mb-8 max-w-sm">
                      Create a free account to upload your resume, take mock
                      interviews, and save your feedback history.
                    </p>
                    <SignInButton mode="modal">
                      <button className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95">
                        Create Free Account
                      </button>
                    </SignInButton>
                  </div>
                </SignedOut>
              </div>

              {/* Features grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full text-left">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <FileText className="w-8 h-8 text-indigo-400 mb-4" />
                  <h3 className="font-semibold text-white mb-2">
                    Smart Resume Parsing
                  </h3>
                  <p className="text-sm text-slate-400">
                    Powered by Gemini 1.5, we extract the core of your
                    experience to ask highly relevant questions.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <Mic className="w-8 h-8 text-blue-400 mb-4" />
                  <h3 className="font-semibold text-white mb-2">
                    Real-Time Voice AI
                  </h3>
                  <p className="text-sm text-slate-400">
                    Engage in a fluid conversation. The AI listens to you,
                    interrupts naturally, and responds in less than 500ms.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <PlayCircle className="w-8 h-8 text-teal-400 mb-4" />
                  <h3 className="font-semibold text-white mb-2">
                    Instant Feedback
                  </h3>
                  <p className="text-sm text-slate-400">
                    After the call, get actionable advice on exactly how to
                    improve your answers using the STAR method.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
