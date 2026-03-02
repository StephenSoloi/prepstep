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
  Lock,
  Star,
  Zap,
  Shield,
  BarChart2,
  ChevronRight,
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
    if (typeof window === "undefined" || !window.location) return;
    try {
      const res = await fetch(`${window.location.origin}/api/user/status`, { cache: "no-store" });
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
  }, [isSignedIn]);

  const handleInterviewEnd = async (transcript: { role: string; text: string }[]) => {
    setIsInterviewStarted(false);
    setQuestions([]);
    if (transcript.length < 2) return;
    setIsGeneratingFeedback(true);
    try {
      const res = await fetch("/api/generate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, questions, companyName, positionApplied, resumeText }),
      });
      const data = await res.json();
      if (data.feedback) {
        setFeedback(data.feedback);
        fetchUserStatus();
      }
    } catch (e) {
      console.error("Error fetching feedback:", e);
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const isFree = userStatus?.tier === "FREE";

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-950 font-sans text-slate-50">
      {/* Ambient background blobs */}
      <div className="fixed top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-700/20 blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-700/20 blur-[140px] pointer-events-none" />
      <div className="fixed top-[40%] right-[20%] w-[25%] h-[25%] rounded-full bg-violet-700/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10 flex flex-col items-center">

        {/* ── NAV ─────────────────────────────────────── */}
        <header className="w-full flex justify-between items-center mb-10 sm:mb-16">
          <div className="flex items-center gap-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">
            <Sparkles className="text-indigo-400 w-6 h-6" />
            PrepStep
          </div>
          <div className="flex items-center gap-3">
            <SignedOut>
              <Link href="#pricing" className="hidden sm:inline-flex px-4 py-2 rounded-full text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <SignInButton mode="modal">
                <button className="px-3 py-1.5 sm:px-5 sm:py-2 rounded-full font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors border border-white/10 text-xs sm:text-sm">
                  Log In
                </button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="px-3 py-1.5 sm:px-5 sm:py-2 rounded-full font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 text-xs sm:text-sm">
                  Get Started →
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="#pricing"
                  className="hidden sm:inline-flex px-4 py-2 rounded-full text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="/pricing"
                  className="px-3 sm:px-4 py-2 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 text-xs sm:text-sm"
                >
                  Upgrade
                </Link>
                <Link
                  href="/dashboard"
                  className="px-3 sm:px-4 py-2 rounded-full font-semibold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20 text-xs sm:text-sm"
                >
                  Dashboard
                </Link>
                <UserButton appearance={{ elements: { userButtonAvatarBox: "w-9 h-9 border-2 border-indigo-500/50" } }} />
              </div>
            </SignedIn>
          </div>
        </header>

        {/* ── MAIN CONTENT SWITCHER ─────────────────────── */}
        <AnimatePresence mode="wait">

          {/* ── INTERVIEW ACTIVE ─── */}
          {isInterviewStarted ? (
            <motion.div key="interview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-4xl">
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
          ) :

            /* ── GENERATING FEEDBACK ─── */
            isGeneratingFeedback ? (
              <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-full max-w-2xl flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-3xl p-12 backdrop-blur-md shadow-2xl mt-8"
              >
                <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
                <h2 className="text-2xl text-white font-semibold mb-2">Analyzing Your Interview...</h2>
                <p className="text-slate-400 text-center">Our AI is preparing your personalized feedback and summary.</p>
              </motion.div>
            ) :

              /* ── FEEDBACK VIEW ─── */
              feedback ? (
                <motion.div key="feedback" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="w-full max-w-4xl bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 backdrop-blur-md shadow-2xl mt-8 mb-20 text-left"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-8">
                    <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-400 shrink-0" />
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">Interview Feedback</h2>
                  </div>

                  {/* Summary — always visible but blurred for free */}
                  <div className={`bg-slate-900/50 rounded-xl sm:rounded-2xl p-5 sm:p-8 mb-6 border border-slate-800 transition-all ${isFree ? "blur-sm select-none pointer-events-none opacity-50" : ""}`}>
                    <h3 className="text-xl font-semibold text-indigo-400 mb-4 flex items-center gap-2">
                      <FileText className="w-6 h-6" /> Interview Summary
                    </h3>
                    <p className="text-slate-300 leading-relaxed text-lg">{feedback.summary}</p>
                  </div>

                  {/* PRO: full breakdown */}
                  {!isFree && (
                    <>
                      {feedback.qaBreakdown && feedback.qaBreakdown.length > 0 && (
                        <div className="bg-slate-900/50 rounded-2xl p-6 md:p-8 mb-6 border border-slate-800">
                          <h3 className="text-xl font-semibold text-violet-400 mb-6 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                            </svg>
                            Question-by-Question Breakdown
                          </h3>
                          <div className="space-y-6">
                            {feedback.qaBreakdown.map((item: any, idx: number) => (
                              <div key={idx} className="border border-slate-700 rounded-xl overflow-hidden">
                                <div className="bg-indigo-600/10 border-b border-slate-700 px-4 sm:px-5 py-3">
                                  <p className="text-indigo-300 font-semibold text-xs uppercase tracking-wide mb-1">Question {idx + 1}</p>
                                  <p className="text-white font-medium text-sm sm:text-base leading-snug">{item.question}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700">
                                  <div className="p-4 sm:p-5">
                                    <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">Your Answer</p>
                                    <p className="text-slate-300 text-sm leading-relaxed">{item.candidateAnswer}</p>
                                  </div>
                                  <div className="p-4 sm:p-5 bg-teal-500/5">
                                    <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mb-2">Suggested Better Answer</p>
                                    <p className="text-slate-300 text-sm leading-relaxed">{item.suggestedAnswer}</p>
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
                          {feedback.improvingPoints.map((point: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-4">
                              <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold">{idx + 1}</div>
                              <span className="text-slate-300 text-base leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {/* FREE: show first Q&A blurred with upgrade CTA overlaid inside the card */}
                  {isFree && feedback.qaBreakdown && feedback.qaBreakdown.length > 0 && (
                    <div className="relative mt-2 rounded-xl overflow-hidden border border-indigo-500/30">
                      {/* Section header */}
                      <div className="bg-slate-900/70 px-5 py-3 border-b border-slate-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                        </svg>
                        <span className="text-violet-400 font-semibold text-sm">Question Breakdown</span>
                      </div>

                      {/* Blurred first card */}
                      <div className="blur-sm select-none pointer-events-none opacity-40 p-4">
                        <div className="border border-slate-700 rounded-xl overflow-hidden">
                          <div className="bg-indigo-600/10 border-b border-slate-700 px-4 py-3">
                            <p className="text-indigo-300 font-semibold text-xs uppercase tracking-wide mb-1">Question 1</p>
                            <p className="text-white font-medium text-sm leading-snug">{feedback.qaBreakdown[0].question}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700">
                            <div className="p-4">
                              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">Your Answer</p>
                              <p className="text-slate-300 text-sm leading-relaxed">{feedback.qaBreakdown[0].candidateAnswer}</p>
                            </div>
                            <div className="p-4 bg-teal-500/5">
                              <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mb-2">Suggested Better Answer</p>
                              <p className="text-slate-300 text-sm leading-relaxed">{feedback.qaBreakdown[0].suggestedAnswer}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Upgrade CTA — overlaid directly inside the card container */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-slate-950/70 backdrop-blur-md p-6 top-[48px]">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-3 mx-auto ring-1 ring-indigo-500/30">
                          <Lock className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Upgrade to View Insights</h2>
                        <p className="text-slate-400 mb-5 text-sm leading-relaxed max-w-xs mx-auto">
                          Unlock your full Q&amp;A breakdown, suggested ideal answers, and personalized coaching tips.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-xs mx-auto">
                          <Link
                            href="/pricing"
                            className="px-6 py-2.5 rounded-full font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 text-sm"
                          >
                            Upgrade to Pro — $8/mo
                          </Link>
                          <button
                            onClick={() => setFeedback(null)}
                            className="px-6 py-2.5 rounded-full font-bold bg-white/5 text-white hover:bg-white/10 transition-all border border-white/10 text-sm"
                          >
                            Take Another Test
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-10 flex justify-center">
                    <button onClick={() => setFeedback(null)}
                      className="px-8 py-4 rounded-full font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30">
                      Start New Interview
                    </button>
                  </div>
                </motion.div>
              ) :

                /* ── LANDING PAGE ─── */
                (
                  <motion.div key="landing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.5 }}
                    className="w-full max-w-5xl flex flex-col items-center text-center mt-4"
                  >
                    {/* Pill badge */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 text-xs sm:text-sm font-medium mb-8 border border-indigo-500/20"
                    >
                      <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                      Voice-First AI Mock Interviewer
                    </motion.div>

                    {/* HERO HEADING with animated nail emoji */}
                    <motion.h1
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                      className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-5 leading-[1.08] px-2"
                    >
                      <motion.span
                        animate={{ rotate: [0, 25, -15, 0], y: [0, -8, 0], x: [0, 4, 0] }}
                        transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
                        style={{ display: "inline-block", transformOrigin: "bottom right" }}
                        className="relative mr-1 mb-1 translate-y-[4px] sm:translate-y-[8px] md:translate-y-[10px]"
                      >
                        <span className="inline-block transform -scale-x-100 select-none">🔨</span>
                      </motion.span>
                      {" "}
                      <motion.span
                        animate={{ y: [0, -6, 0] }}
                        transition={{ delay: 1.0, duration: 0.45, ease: "easeOut" }}
                        style={{ display: "inline-block" }}
                        className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-300 to-indigo-400"
                      >
                        Nail
                      </motion.span>{" "}
                      your next<br className="hidden sm:block" />{" "}
                      interview{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-teal-400">
                        with confidence.
                      </span>
                    </motion.h1>

                    {/* Sub-text */}
                    <motion.p
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                      className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mb-10 px-2 leading-relaxed"
                    >
                      Upload your resume — our AI reads it, understands your background, and conducts a{" "}
                      <span className="text-white font-medium">realistic real-time voice interview</span> tailored exactly to the role you're applying for.
                    </motion.p>

                    {/* ── SIGNED IN: Upload widget + credits ── */}
                    <SignedIn>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="w-full max-w-xl mx-auto mb-16">
                        {userStatus && (
                          <div className="mb-4 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${userStatus.tier === "PREMIUM" ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-700 text-slate-300"}`}>
                              {userStatus.tier === "PREMIUM" ? "Pro" : "Free"}
                            </span>
                            <div className="h-4 w-[1px] bg-white/10" />
                            <span className={`text-sm font-semibold ${userStatus.credits <= 0 ? "text-red-400" : "text-emerald-400"}`}>
                              {userStatus.credits} / {userStatus.limit} interviews remaining
                            </span>
                          </div>
                        )}
                        <ResumeUpload
                          onQuestionsGenerated={(generatedQuestions, name, compName, posApplied, resumeTxt, compDesc) => {
                            setQuestions(generatedQuestions);
                            setApplicantName(name);
                            setCompanyName(compName);
                            setPositionApplied(posApplied);
                            setResumeText(resumeTxt);
                            setCompanyDescription(compDesc);
                            setIsInterviewStarted(true);
                            fetchUserStatus();
                          }}
                        />
                      </motion.div>
                    </SignedIn>

                    {/* ── SIGNED OUT: Compelling CTA ── */}
                    <SignedOut>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="w-full max-w-xl mx-auto mb-16">
                        <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900/80 border border-indigo-500/20 rounded-2xl sm:rounded-3xl p-8 sm:p-10 backdrop-blur-md shadow-2xl shadow-indigo-900/30">
                          <div className="flex justify-center mb-5">
                            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center ring-1 ring-indigo-500/30">
                              <Mic className="w-8 h-8 text-indigo-400" />
                            </div>
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">Ready to practice?</h3>
                          <p className="text-slate-400 mb-3 text-sm leading-relaxed max-w-sm mx-auto">
                            Get <span className="text-white font-semibold">2 free AI voice interviews</span> — no credit card needed. Real questions. Real-time feedback.
                          </p>
                          <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-400 mb-7">
                            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Personalized questions</span>
                            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Voice-to-voice AI</span>
                            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Instant feedback report</span>
                          </div>
                          <SignInButton mode="modal">
                            <button className="w-full px-8 py-4 rounded-full font-bold text-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-95">
                              Start Free — No Card Needed
                            </button>
                          </SignInButton>
                          <p className="text-slate-500 text-xs mt-4">Already have an account?{" "}
                            <SignInButton mode="modal">
                              <span className="text-indigo-400 cursor-pointer hover:underline">Log in</span>
                            </SignInButton>
                          </p>
                        </div>
                      </motion.div>
                    </SignedOut>

                    {/* ── FEATURES ── */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 w-full text-left mb-20"
                    >
                      {[
                        {
                          icon: <FileText className="w-7 h-7 text-indigo-400" />,
                          title: "Smart Resume Analysis",
                          desc: "Upload any PDF resume. Our AI extracts your skills, experience, and role context to craft highly personalized interview questions.",
                          color: "indigo",
                        },
                        {
                          icon: <Mic className="w-7 h-7 text-blue-400" />,
                          title: "Real-Time Voice Interview",
                          desc: "Practice out loud. The AI listens, understands, follows up naturally — just like a real interviewer. Sub-500ms response time.",
                          color: "blue",
                        },
                        {
                          icon: <BarChart2 className="w-7 h-7 text-violet-400" />,
                          title: "Detailed Performance Report",
                          desc: "After every session, get a full breakdown: your answers, suggested improvements, and an overall performance summary.",
                          color: "violet",
                        },
                        {
                          icon: <Zap className="w-7 h-7 text-amber-400" />,
                          title: "Instant — No Waiting",
                          desc: "No scheduling. No booking. Start a mock interview in under 60 seconds, any time of day, from any device.",
                          color: "amber",
                        },
                        {
                          icon: <Shield className="w-7 h-7 text-teal-400" />,
                          title: "Your Data, Private & Secure",
                          desc: "Resumes and transcripts are processed securely. We do not sell your data or use it to train public models.",
                          color: "teal",
                        },
                        {
                          icon: <Star className="w-7 h-7 text-rose-400" />,
                          title: "STAR Method Coaching",
                          desc: "Feedback is framed using the proven STAR method (Situation, Task, Action, Result) so you know exactly how to improve.",
                          color: "rose",
                        },
                      ].map((f, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.55 + i * 0.07 }}
                          whileHover={{ y: -4, transition: { duration: 0.2 } }}
                          className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.07] hover:border-white/[0.15] transition-all group cursor-default"
                        >
                          <div className="mb-4">{f.icon}</div>
                          <h3 className="font-bold text-white mb-2 text-base">{f.title}</h3>
                          <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* ── HOW IT WORKS ── */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="w-full mb-20">
                      <div className="text-center mb-10">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">How it works</h2>
                        <p className="text-slate-400">From resume to feedback in under 3 minutes.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
                        {[
                          { step: "01", title: "Upload Your Resume", desc: "Drop in your PDF and fill in the company name and role you're interviewing for." },
                          { step: "02", title: "Voice Interview Begins", desc: "The AI interviewer greets you, asks tailored questions, and listens to your spoken answers live." },
                          { step: "03", title: "Get Your Report", desc: "Instantly receive a detailed breakdown with suggested better answers and tips to level up." },
                        ].map((s, i) => (
                          <div key={i} className="relative flex flex-col items-center text-center p-7 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                            <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-lg mb-5">{s.step}</div>
                            <h3 className="font-bold text-white mb-2">{s.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                            {i < 2 && <ChevronRight className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-600 hidden sm:block" />}
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* ── PRICING ── */}
                    <motion.div id="pricing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="w-full mb-20">
                      <div className="text-center mb-10">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Simple Pricing</h2>
                        <p className="text-slate-400">Start free. Upgrade when you need more.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        {/* Free card */}
                        <div className="p-8 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex flex-col">
                          <div className="mb-6">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-800 px-3 py-1 rounded-full">Free</span>
                            <div className="mt-4 flex items-end gap-1">
                              <span className="text-5xl font-black text-white">$0</span>
                              <span className="text-slate-400 mb-2">/forever</span>
                            </div>
                          </div>
                          <ul className="space-y-3 mb-8 flex-1">
                            {["2 AI voice interviews", "Resume-based questions", "Interview summary (blurred)", "Upgrade anytime"].map((item, i) => (
                              <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> {item}
                              </li>
                            ))}
                          </ul>
                          <SignedOut>
                            <SignInButton mode="modal">
                              <button className="w-full py-3 rounded-full font-bold bg-white/10 text-white hover:bg-white/15 transition-all border border-white/10">
                                Get Started Free
                              </button>
                            </SignInButton>
                          </SignedOut>
                          <SignedIn>
                            <div className="w-full py-3 rounded-full font-bold bg-white/5 text-slate-400 border border-white/5 text-center text-sm">
                              Current Plan
                            </div>
                          </SignedIn>
                        </div>

                        {/* Pro card */}
                        <div className="relative p-8 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-blue-700/10 border border-indigo-500/40 flex flex-col shadow-xl shadow-indigo-900/20">
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="text-xs font-black uppercase tracking-widest bg-indigo-600 text-white px-4 py-1 rounded-full shadow">Most Popular</span>
                          </div>
                          <div className="mb-6 mt-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">Pro</span>
                            <div className="mt-4 flex items-end gap-1">
                              <span className="text-5xl font-black text-white">$8</span>
                              <span className="text-slate-400 mb-2">/month</span>
                            </div>
                          </div>
                          <ul className="space-y-3 mb-8 flex-1">
                            {[
                              "Unlimited AI voice interviews",
                              "Full Q&A breakdown report",
                              "Suggested ideal answers",
                              "Areas for improvement analysis",
                              "Interview history & dashboard",
                              "Priority support",
                            ].map((item, i) => (
                              <li key={i} className="flex items-center gap-3 text-sm text-slate-200">
                                <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" /> {item}
                              </li>
                            ))}
                          </ul>
                          <Link href="/pricing" className="w-full py-3 rounded-full font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 text-center block hover:scale-[1.02] active:scale-95">
                            Upgrade to Pro
                          </Link>
                        </div>
                      </div>
                    </motion.div>

                    {/* ── FINAL CTA BANNER ── */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                      className="w-full max-w-3xl bg-gradient-to-br from-indigo-600/20 to-blue-700/10 border border-indigo-500/20 rounded-2xl p-10 text-center mb-8"
                    >
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Your dream job is one practice away.</h2>
                      <p className="text-slate-400 mb-7 text-sm sm:text-base max-w-lg mx-auto">
                        PrepStep gives you a private space to practice, stumble, improve — and walk into that real interview ready.
                      </p>
                      <SignedOut>
                        <SignInButton mode="modal">
                          <button className="px-8 py-4 rounded-full font-bold text-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-95">
                            Start Practicing — It&apos;s Free
                          </button>
                        </SignInButton>
                      </SignedOut>
                      <SignedIn>
                        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                          className="px-8 py-4 rounded-full font-bold text-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-95">
                          Start a New Interview ↑
                        </button>
                      </SignedIn>
                    </motion.div>

                    {/* Footer */}
                    <footer className="w-full text-center text-slate-600 text-xs pb-6">
                      © {new Date().getFullYear()} PrepStep · Built for job seekers, by job seekers.
                    </footer>

                  </motion.div>
                )}
        </AnimatePresence>
      </div>
    </main>
  );
}
