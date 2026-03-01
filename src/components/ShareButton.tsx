"use client";

import { useState } from "react";
import { Share2, Lock, CheckCircle2, Globe } from "lucide-react";
import { toggleShare } from "@/app/actions/toggleShare";

export default function ShareButton({
  interviewId,
  initialIsPublic,
  isLocked = false,
}: {
  interviewId: string;
  initialIsPublic: boolean;
  isLocked?: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/report/${interviewId}`
      : "";

  const handleToggle = async () => {
    if (isLocked) {
      if (typeof window !== "undefined") {
        window.location.href = "/pricing";
      }
      return;
    }

    setIsLoading(true);
    try {
      await toggleShare(interviewId, !isPublic);
      setIsPublic(!isPublic);
      if (!isPublic) {
        // If we just made it public, auto-copy to clipboard
        navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
          isLocked
            ? "bg-slate-800/50 text-slate-400 border border-slate-700 cursor-not-allowed"
            : isPublic
              ? "bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30"
              : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
        }`}
        title={isLocked ? "Upgrade to unlock sharing" : ""}
      >
        {isLocked ? (
          <Lock className="w-4 h-4" />
        ) : isPublic ? (
          <Globe className="w-4 h-4" />
        ) : (
          <Lock className="w-4 h-4" />
        )}
        {isLocked ? "Locked" : isPublic ? "Publicly Shared" : "Private"}
      </button>

      {isPublic && !isLocked && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2 w-full sm:w-64 focus:outline-none"
            onClick={(e) => e.currentTarget.select()}
          />
          <button
            onClick={copyToClipboard}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center justify-center shrink-0"
            title="Copy Link"
          >
            {isCopied ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Share2 className="w-5 h-5" />
            )}
          </button>
        </div>
      )}

      {isPublic && isCopied && !isLocked && (
        <span className="text-xs text-teal-400 font-medium animate-pulse">
          Link Copied!
        </span>
      )}
    </div>
  );
}
