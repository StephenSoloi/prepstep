"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, LayoutDashboard, CreditCard, PlusCircle, Home as HomeIcon, Menu, X } from "lucide-react";
import { SignInButton, SignOutButton, SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import { LogOut, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const pathname = usePathname();
    const { isSignedIn } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userStatus, setUserStatus] = useState<{ tier: string; credits: number; limit: number } | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);

        if (isSignedIn) {
            fetch("/api/user/status")
                .then(res => res.json())
                .then(data => setUserStatus(data))
                .catch(err => console.error("Error fetching status:", err));
        }

        return () => window.removeEventListener("scroll", handleScroll);
    }, [isSignedIn, pathname]); // Re-fetch on path change to update credits

    const navLinks = [
        { name: "Home", href: "/", icon: <HomeIcon className="w-4 h-4" /> },
        { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" />, authRequired: true },
        { name: "Pricing", href: "/pricing", icon: <CreditCard className="w-4 h-4" /> },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? "py-3 bg-slate-950/80 backdrop-blur-md border-b border-white/10 shadow-xl"
                : "py-5 bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
                {/* Logo */}
                <Link
                    href="/"
                    className="flex items-center gap-2 text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-400 hover:opacity-80 transition-opacity"
                >
                    <Sparkles className="text-indigo-400 w-6 h-6" />
                    <span className="hidden sm:inline">PrepStep</span>
                    <span className="sm:hidden">PS</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-1.5 py-1 backdrop-blur-sm shadow-inner">
                    {navLinks.map((link) => {
                        if (link.authRequired && !isSignedIn) return null;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${isActive
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {link.icon}
                                {link.name}
                            </Link>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 text-xs sm:text-sm active:scale-95">
                                Join Now
                            </button>
                        </SignInButton>
                    </SignedOut>

                    <SignedIn>
                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Tier Badge / Upgrade CTA */}
                            {userStatus && (
                                <div className="hidden lg:flex items-center gap-2">
                                    {userStatus.tier === "FREE" && (
                                        <Link
                                            href="/pricing"
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border border-emerald-500/20 text-[10px] uppercase tracking-wider active:scale-95"
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            Upgrade
                                        </Link>
                                    )}
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs shadow-inner">
                                        <span className={`h-1.5 w-1.5 rounded-full ${userStatus.credits > 0 ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
                                        <span className="text-slate-400 font-medium">
                                            {userStatus.credits} {userStatus.credits === 1 ? 'Credit' : 'Credits'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <Link
                                href="/"
                                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all text-sm ${pathname === "/"
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                                    : "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20"
                                    }`}
                            >
                                <PlusCircle className="w-4 h-4" />
                                New Interview
                            </Link>

                            <UserButton
                                appearance={{
                                    elements: {
                                        userButtonAvatarBox: "w-9 h-9 border-2 border-indigo-500/50 hover:border-indigo-400 transition-colors shadow-lg",
                                    },
                                }}
                            />

                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </SignedIn>

                    <SignedOut>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </SignedOut>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden absolute top-full left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-b border-white/10 overflow-hidden shadow-2xl"
                    >
                        <div className="px-4 py-8 flex flex-col gap-4">
                            {navLinks.map((link) => {
                                if (link.authRequired && !isSignedIn) return null;
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-lg font-semibold transition-all ${isActive
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                            : "text-slate-400 bg-white/5 border border-white/5"
                                            }`}
                                    >
                                        {link.icon}
                                        {link.name}
                                    </Link>
                                );
                            })}
                            <SignedIn>
                                <Link
                                    href="/"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-4 px-5 py-4 rounded-2xl text-lg font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                    New Interview
                                </Link>

                                <div className="h-px bg-white/10 my-2" />

                                <SignOutButton>
                                    <button
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-4 px-5 py-4 rounded-2xl text-lg font-semibold text-red-400 bg-red-400/5 hover:bg-red-400/10 transition-all border border-red-400/10 w-full text-left"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Log Out
                                    </button>
                                </SignOutButton>
                            </SignedIn>
                            <SignedOut>
                                <div className="h-px bg-white/10 my-2" />
                                <SignInButton mode="modal">
                                    <button
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-4 px-5 py-4 rounded-2xl text-lg font-bold bg-indigo-600 text-white w-full text-left"
                                    >
                                        <LogIn className="w-5 h-5" />
                                        Log In / Join
                                    </button>
                                </SignInButton>
                            </SignedOut>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
