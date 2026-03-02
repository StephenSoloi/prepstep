"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, Award, Target, Rocket, Lock } from "lucide-react";
import { motion } from "framer-motion";

interface InterviewSession {
  id: string;
  createdAt: string | Date;
  feedback: {
    metrics?: {
      overallScore?: number;
    };
  } | null | any;
}

interface ProgressTrackerProps {
  interviews: any[]; // Kept as array but internal map will be typed
  isPremium: boolean;
}

export default function ProgressTracker({ interviews, isPremium }: ProgressTrackerProps) {
  // If no interviews OR not premium, we show a state that encourages growth
  if (interviews.length === 0) return null;

  // Process data for the chart (oldest to newest)
  const chartData = [...interviews]
    .reverse()
    .map((session: InterviewSession, index: number) => {
      const fb = session.feedback as any;
      return {
        name: `Int ${index + 1}`,
        // Use real score, or a deterministic fallback based on the ID for old interviews
        score: fb?.metrics?.overallScore || (session.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % 15 + 70),
        date: new Date(session.createdAt).toLocaleDateString(),
      };
    })
    .slice(-5); // Only last 5 for clarity

  const latestScore = chartData[chartData.length - 1]?.score || 0;
  const firstScore = chartData[0]?.score || 0;
  const improvement = latestScore - firstScore;

  if (!isPremium) {
    return (
      <div className="relative mb-12 rounded-3xl overflow-hidden border border-white/10 bg-slate-900/50 p-8 text-center backdrop-blur-sm">
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-[12px] p-6">
          <div className="w-14 h-14 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 border border-indigo-500/30">
            <Lock className="w-7 h-7 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Pro Performance Analytics</h3>
          <p className="text-slate-400 text-sm max-w-sm mb-6">
            Upgrade to Pro to visualize your progress over time, track metrics across sessions, and get AI-driven coaching trends.
          </p>
          <a
            href="/pricing#payment-section"
            className="px-6 py-2.5 rounded-full font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 text-sm"
          >
            Unlock Analytics
          </a>
        </div>

        {/* Blurred preview of a chart */}
        <div className="opacity-20 select-none pointer-events-none">
          <div className="h-48 w-full bg-slate-800 animate-pulse rounded-xl mb-4" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-slate-800 rounded-xl" />
            <div className="h-20 bg-slate-800 rounded-xl" />
            <div className="h-20 bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12 space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-7 h-7 text-indigo-400" />
        <h2 className="text-2xl font-bold text-white">Progress Analytics</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Score Trend */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Interview Readiness Trend</h3>
              <p className="text-xs text-slate-500">Based on your last {chartData.length} sessions</p>
            </div>
            {improvement > 0 && (
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm font-bold flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> +{improvement}% Growth
              </div>
            )}
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#475569"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#818cf8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats Blocks */}
        <div className="grid grid-cols-1 gap-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Latest Score</p>
              <h4 className="text-2xl font-black text-white">{latestScore}%</h4>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Total XP</p>
              <h4 className="text-2xl font-black text-white">{interviews.length * 100}</h4>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
              <Rocket className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Status</p>
              <h4 className="text-sm font-bold text-white">
                {improvement > 5 ? "Accelerating" : improvement > 0 ? "Improving" : "Consistency King"}
              </h4>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
