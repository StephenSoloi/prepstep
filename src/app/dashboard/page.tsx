import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Building2,
  Calendar,
  FileText,
  LayoutDashboard,
  Video,
  ChevronRight,
  UserCircle2,
} from "lucide-react";
import { SignedIn, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import ProgressTracker from "@/components/ProgressTracker";
import BackToTop from "@/components/BackToTop";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const clerkUser = await currentUser();

  // Find the internal user and their interviews, ordered by newest first
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      interviews: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const interviews = user?.interviews || [];

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-950 font-sans text-slate-50">
      {/* Background Effects */}
      <div className="absolute top-0 right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10 w-full">
        {/* Header Navbar */}
        <header className="w-full flex justify-between items-center mb-10 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition"
            >
              <Video className="w-6 h-6 text-indigo-400" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400 flex items-center gap-2">
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/pricing"
              className="px-3 sm:px-5 py-2 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 text-xs sm:text-sm"
            >
              Pricing
            </Link>
            <Link
              href="/"
              className="px-3 sm:px-5 py-2 rounded-full font-semibold bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 transition-colors border border-indigo-600/20 text-xs sm:text-sm inline-flex sm:hidden"
            >
              Interview
            </Link>
            <Link
              href={((user?.tier === "PREMIUM" ? 5 : 2) - interviews.length) <= 0 ? "/pricing" : "/"}
              className={`hidden sm:inline-flex items-center justify-center px-5 py-2 rounded-full font-semibold transition-all shadow-lg active:scale-95 text-sm ${((user?.tier === "PREMIUM" ? 5 : 2) - interviews.length) <= 0
                  ? "bg-slate-800 text-slate-300 border border-white/10"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/30"
                }`}
            >
              {((user?.tier === "PREMIUM" ? 5 : 2) - interviews.length) <= 0 ? "Get Credits" : "New Interview"}
            </Link>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox:
                      "w-10 h-10 border-2 border-indigo-500/50",
                  },
                }}
              />
            </SignedIn>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Left Sidebar Profile View */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-teal-400" />
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700">
                {clerkUser?.imageUrl ? (
                  <Image
                    src={clerkUser.imageUrl}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserCircle2 className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                {clerkUser?.firstName} {clerkUser?.lastName}
              </h2>
              <p className="text-sm text-slate-400 break-all mb-6">
                {clerkUser?.emailAddresses[0]?.emailAddress}
              </p>

              <div className="pt-6 border-t border-slate-800/50 space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Interviews Left</span>
                    <span className={`font-bold ${((user?.tier === "PREMIUM" ? 5 : 2) - interviews.length) <= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {Math.max(0, (user?.tier === "PREMIUM" ? 5 : 2) - interviews.length)} / {user?.tier === "PREMIUM" ? 5 : 2}
                    </span>
                  </div>
                  {((user?.tier === "PREMIUM" ? 5 : 2) - interviews.length) <= 0 && (
                    <Link href="/pricing" className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors font-bold uppercase tracking-tight flex items-center gap-1 justify-end animate-pulse">
                      {user?.tier === "PREMIUM" ? "Renew to get more" : "Upgrade to unlock more"} →
                    </Link>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Account Tier</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${user?.tier === 'PREMIUM' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-300'}`}>
                    {user?.tier || 'FREE'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Interviews</span>
                  <span className="font-bold text-white">
                    {interviews.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile CTA */}
            <Link
              href={((user?.tier === "PREMIUM" ? 5 : 2) - interviews.length) <= 0 ? "/pricing" : "/"}
              className={`sm:hidden w-full inline-flex items-center justify-center px-6 py-4 rounded-xl font-semibold transition-all shadow-lg active:scale-95 ${((user?.tier === "PREMIUM" ? 5 : 2) - interviews.length) <= 0
                  ? "bg-slate-800 text-slate-300 border border-white/10"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/30"
                }`}
            >
              {((user?.tier === "PREMIUM" ? 5 : 2) - interviews.length) <= 0 ? "Get More Credits" : "Start New Interview"}
            </Link>
          </div>

          {/* Right Main Panel (Interview History) */}
          <div className="lg:col-span-9 flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <LayoutDashboard className="w-7 h-7 text-teal-400" />
              <h2 className="text-2xl font-bold text-white">
                Your Interview History
              </h2>
            </div>


            {/* Existing History Grid */}
            {interviews.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center backdrop-blur-sm flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <FileText className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  No Interviews Yet
                </h3>
                <p className="text-slate-400 max-w-sm mb-8 text-center">
                  It looks like you haven&apos;t taken any mock interviews. Start
                  your first session to get personalized AI feedback.
                </p>
                <Link
                  href="/"
                  className="px-8 py-4 rounded-full font-bold text-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30"
                >
                  Start First Interview
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {interviews.map((session) => {
                  const feedbackData = session.feedback as unknown as { summary?: string };
                  const summaryObj =
                    feedbackData?.summary ||
                    "No summary available for this session.";
                  const dtString = formatDistanceToNow(
                    new Date(session.createdAt),
                    { addSuffix: true },
                  );

                  return (
                    <Link
                      href={"/dashboard/" + session.id}
                      key={session.id}
                      className="group flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex flex-col">
                          <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-2 line-clamp-1">
                            <Building2 className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                            {session.companyName}
                          </h3>
                          <p className="text-sm font-medium text-teal-400 mt-1">
                            {session.positionApplied}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-block px-2 py-1 text-xs font-semibold bg-indigo-600/80 text-white rounded-full group-hover:bg-indigo-500 transition-all">
                            View Report
                          </span>
                          <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-slate-400 line-clamp-2 mt-4 flex-grow">
                        {summaryObj}
                      </p>

                      <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-800/80 text-xs text-slate-500 font-medium">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span className="capitalize">{dtString}</span>
                      </div>

                      {/* CTA Section */}
                      <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between gap-4 group-hover:text-indigo-300 transition-colors">
                        <span className="text-xs font-semibold text-slate-400">
                          📊 View insights & details
                        </span>
                        <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Progress Analytics Section (moved after history) */}
            <div className="mt-16">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <ProgressTracker interviews={interviews as any} isPremium={user?.tier === "PREMIUM"} />
            </div>
          </div>
        </div>
      </div>
      <BackToTop />
    </main>
  );
}
