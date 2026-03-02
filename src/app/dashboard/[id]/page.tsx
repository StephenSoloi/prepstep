import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  TrendingUp,
  FileText,
  Calendar,
  Building2,
  Lock,
  Sparkles,
} from "lucide-react";
import ShareButton from "@/components/ShareButton";
import BackToTop from "@/components/BackToTop";

export default async function InterviewDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  // Validate the session exists and belongs to the authenticated user
  const session = await prisma.interviewSession.findFirst({
    where: {
      id: params.id,
      user: {
        clerkId: userId,
      },
    },
    include: {
      user: true,
    },
  });

  if (!session) {
    redirect("/dashboard");
  }

  const feedback = session.feedback as any;

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-950 font-sans text-slate-50">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10 w-full">
        {/* Header Nav */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-12">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-3 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-6 h-6 text-indigo-400 shrink-0" />
                {session.companyName}
              </h1>
              <p className="text-sm font-medium text-teal-400">
                {session.positionApplied}
              </p>
            </div>
          </div>
          <ShareButton
            interviewId={session.id}
            initialIsPublic={session.isPublic}
            isLocked={session.user.tier === "FREE"}
          />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 backdrop-blur-md shadow-2xl space-y-8 relative">
          {/* Summary Section */}
          <div className="bg-slate-900/50 rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-slate-800 relative overflow-hidden">
            <h3 className="text-xl font-semibold text-indigo-400 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6" /> Interview Summary
            </h3>
            <div className={session.user.tier === "FREE" ? "blur-md select-none opacity-50" : ""}>
              <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                {feedback?.summary ||
                  "No summary was generated during this session."}
              </p>
            </div>
          </div>

          {/* Performance Metrics for PRO users */}
          {session.user.tier === "PREMIUM" && feedback?.metrics && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-4 text-center">
                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mb-1">Overall</p>
                <p className="text-2xl font-black text-white">{feedback.metrics.overallScore}%</p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Confidence</p>
                <p className="text-xl font-bold text-white">{feedback.metrics.confidence}%</p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Technical</p>
                <p className="text-xl font-bold text-white">{feedback.metrics.technicalPrecision}%</p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">STAR Method</p>
                <p className="text-xl font-bold text-white">{feedback.metrics.starMethodAlignment}%</p>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center col-span-2 md:col-span-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Clarity</p>
                <p className="text-xl font-bold text-white">{feedback.metrics.clarityConciseness}%</p>
              </div>
            </div>
          )}

          {/* Breakdown Section */}
          {feedback?.qaBreakdown && feedback.qaBreakdown.length > 0 && (
            <div className="bg-slate-900/50 rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-slate-800 relative">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2 tracking-tight">
                <CheckCircle className="w-5 h-5 text-amber-400" /> Question
                Breakdown
              </h3>

              <div className="relative">
                <div className={`space-y-6 ${session.user.tier === "FREE" ? "blur-sm select-none opacity-40" : ""}`}>
                  {/* Show only first question for FREE tier, all for PREMIUM */}
                  {feedback.qaBreakdown
                    .slice(0, session.user.tier === "FREE" ? 1 : undefined)
                    .map((item: any, idx: number) => (
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

                {/* Paywall Overlay for FREE tier */}
                {session.user.tier === "FREE" && (
                  <div className="absolute inset-x-0 -bottom-8 -top-8 flex flex-col items-center justify-center text-center z-20">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-950 pointer-events-none" />

                    <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10 max-w-lg mx-4 shadow-2xl">
                      <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <Lock className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
                        Upgrade to View Insights
                      </h2>
                      <p className="text-sm sm:text-base text-slate-300 mb-8 leading-relaxed">
                        Unlock detailed AI summaries, question breakdowns, and
                        the ability to share your interview reports with mentors for
                        personalized feedback.
                      </p>
                      <Link
                        href="/pricing"
                        className="inline-block px-8 py-4 rounded-full font-bold text-sm sm:text-base bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95"
                      >
                        Upgrade to Pro ($8/month)
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Improvement Section */}
          {session.user.tier !== "FREE" &&
            feedback?.improvingPoints &&
            feedback.improvingPoints.length > 0 && (
              <div className="bg-slate-900/50 rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-slate-800">
                <h3 className="text-xl font-semibold text-teal-400 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" /> Areas for Improvement
                </h3>
                <ul className="space-y-4">
                  {feedback.improvingPoints.map(
                    (point: string, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50"
                      >
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                          {point}
                        </p>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}
        </div>
      </div>
      <BackToTop />
    </main>
  );
}
