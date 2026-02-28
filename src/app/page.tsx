"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, FileText, PlayCircle, Sparkles } from "lucide-react";
import ResumeUpload from "@/components/ResumeUpload";
import InterviewSession from "@/components/InterviewSession";

export default function Home() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-950 font-sans">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10 flex flex-col items-center">
        {/* Nav / Logo */}
        <header className="w-full flex justify-between items-center mb-16">
          <div className="flex items-center gap-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400">
            <Sparkles className="text-indigo-400 w-6 h-6" />
            PrepStep
          </div>
          <a
            href="https://github.com/vapi-ai"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Powered by Vapi + Gemini
          </a>
        </header>

        <AnimatePresence mode="wait">
          {!isInterviewStarted ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-4xl flex flex-col items-center text-center mt-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-8 border border-indigo-500/20">
                <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                Voice-First AI Interviewer
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                Nail your next interview <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-teal-400">
                  with pure confidence.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12">
                Upload your resume. Our AI instantly analyzes your experience and conducts a realistic, real-time voice interview tailored to your background.
              </p>

              {/* Upload Section Widget */}
              <div className="w-full max-w-xl mx-auto">
                <ResumeUpload
                  onQuestionsGenerated={(generatedQuestions) => {
                    setQuestions(generatedQuestions);
                    setIsInterviewStarted(true);
                  }}
                />
              </div>

              {/* Features grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full text-left">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <FileText className="w-8 h-8 text-indigo-400 mb-4" />
                  <h3 className="font-semibold text-white mb-2">Smart Resume Parsing</h3>
                  <p className="text-sm text-slate-400">Powered by Gemini 1.5, we extract the core of your experience to ask highly relevant questions.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <Mic className="w-8 h-8 text-blue-400 mb-4" />
                  <h3 className="font-semibold text-white mb-2">Real-Time Voice AI</h3>
                  <p className="text-sm text-slate-400">Engage in a fluid conversation. The AI listens to you, interrupts naturally, and responds in less than 500ms.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <PlayCircle className="w-8 h-8 text-teal-400 mb-4" />
                  <h3 className="font-semibold text-white mb-2">Instant Feedback</h3>
                  <p className="text-sm text-slate-400">After the call, get actionable advice on exactly how to improve your answers using the STAR method.</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="interview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-4xl"
            >
              <InterviewSession
                questions={questions}
                onEnd={() => {
                  setIsInterviewStarted(false);
                  setQuestions([]);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
