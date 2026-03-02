"use client";

import { useState } from "react";
import { Check, Loader2, CreditCard, Sparkles } from "lucide-react";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function PricingPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handlePayment = async () => {
    // Strict Sanitization/Validation: Check if raw input has spaces or illegal characters
    if (/\s/.test(phone)) {
      setErrorMsg("Please enter the number without any spaces.");
      return;
    }

    // Sanitize: Remove anything not a digit
    const cleanPhone = phone.replace(/\D/g, "");

    // Validate Kenyan format: 
    // 1. Local format: 07... or 01... (10 digits)
    // 2. International: 2547... or 2541... (12 digits)
    const isLocal = cleanPhone.length === 10 && (cleanPhone.startsWith("07") || cleanPhone.startsWith("01"));
    const isIntl = cleanPhone.length === 12 && (cleanPhone.startsWith("2547") || cleanPhone.startsWith("2541"));

    if (!isLocal && !isIntl) {
      setErrorMsg("Please enter a valid Kenyan number (e.g. +2547XXXXXXXX or 07XXXXXXXX)");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Universal Format: Ensure we always send 254... to the backend
    let finalPhone = cleanPhone;
    if (cleanPhone.startsWith("0")) {
      finalPhone = "254" + cleanPhone.substring(1);
    }

    try {
      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: finalPhone,
          amount: 1000, // 1000 KES for Pro tier
          accountReference: "PrepStep Pro",
          transactionDesc: "Upgrade to Pro Tier",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(
          "STK Push sent to your phone! Please enter your M-Pesa PIN to complete payment.",
        );
        setPhone("");
      } else {
        setErrorMsg(
          data.error || "Failed to initiate payment. Please check your number.",
        );
      }
    } catch {
      setErrorMsg("An error occurred during payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-950 font-sans text-white pb-20">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-12 relative z-10 flex flex-col items-center">

        <div className="text-center max-w-2xl mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Upgrade Your Interview Game
          </h1>
          <p className="text-slate-400 text-lg">
            Start with 2 free interviews, or upgrade to Pro for 5 monthly
            interviews, detailed AI feedback, and mentor sharing.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md flex flex-col">
            <h2 className="text-2xl font-bold mb-2">Basic</h2>
            <div className="text-3xl font-extrabold mb-6">Free</div>
            <ul className="space-y-4 mb-8 flex-1 text-slate-300">
              <li className="flex items-center gap-3">
                <Check className="text-emerald-400 w-5 h-5" />{" "}
                <span>2 mock interviews per month</span>
              </li>
              <li className="flex items-center gap-3 opacity-50">
                <Check className="text-slate-500 w-5 h-5" />{" "}
                <span className="line-through decoration-slate-500">
                  View detailed interview summary
                </span>
              </li>
              <li className="flex items-center gap-3 opacity-50">
                <Check className="text-slate-500 w-5 h-5" />{" "}
                <span className="line-through decoration-slate-500">
                  Share interview summaries with mentors
                </span>
              </li>
            </ul>
            <Link
              href="/"
              className="block w-full text-center px-6 py-3 rounded-full font-bold bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
            >
              Current Plan
            </Link>
          </div>

          {/* Pro Tier */}
          <div id="pro-tier" className="bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 backdrop-blur-md relative transform md:-translate-y-4 shadow-2xl shadow-indigo-600/20 flex flex-col">
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-3xl uppercase tracking-wider">
              Most Popular
            </div>
            <h2 className="text-2xl font-bold mb-2 text-indigo-400">Pro</h2>
            <div className="text-3xl font-extrabold mb-1">
              $8 USD{" "}
              <span className="text-sm font-normal text-slate-400">
                / month
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Perfect for interview preparation
            </p>

            <ul className="space-y-4 mb-8 flex-1 text-slate-300">
              <li className="flex items-center gap-3">
                <Check className="text-indigo-400 w-5 h-5" />{" "}
                <span>5 mock interviews per month</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="text-indigo-400 w-5 h-5" />{" "}
                <span>Detailed AI interview summaries</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="text-indigo-400 w-5 h-5" />{" "}
                <span>Share interview summaries with mentors</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="text-indigo-400 w-5 h-5" />{" "}
                <span>Priority AI feedback & analysis</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="text-indigo-400 w-5 h-5" />{" "}
                <span>Performance analytics dashboard</span>
              </li>
            </ul>

            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 mt-auto shadow-inner">
              <h3 id="payment-section" className="font-semibold mb-3 flex items-center gap-2 text-green-400">
                <CreditCard className="w-5 h-5" /> Pay with M-Pesa
              </h3>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="e.g. +2547XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono"
                />
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 px-6 py-3 rounded-xl font-bold bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white shadow-lg shadow-green-600/20"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Pay via STK Push"
                  )}
                </button>
              </div>

              {errorMsg && (
                <p className="text-red-400 text-sm mt-3 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                  {errorMsg}
                </p>
              )}
              {successMsg && (
                <p className="text-green-400 text-sm mt-3 bg-green-400/10 p-2 rounded-lg border border-green-400/20">
                  {successMsg}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
