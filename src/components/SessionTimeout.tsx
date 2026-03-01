"use client";

import { useEffect, useCallback, useRef } from "react";
import { useClerk, useAuth } from "@clerk/nextjs";

const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes in milliseconds

export default function SessionTimeout() {
    const { signOut } = useClerk();
    const { isSignedIn } = useAuth();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (isSignedIn) {
            timeoutRef.current = setTimeout(() => {
                signOut();
            }, INACTIVITY_LIMIT);
        }
    }, [isSignedIn, signOut]);

    useEffect(() => {
        if (!isSignedIn) return;

        // Track user activity
        const events = [
            "mousedown",
            "mousemove",
            "keypress",
            "scroll",
            "touchstart",
            "click",
        ];

        const handleActivity = () => {
            resetTimeout();
        };

        // Initialize timeout
        resetTimeout();

        // Add event listeners
        events.forEach((event) => {
            window.addEventListener(event, handleActivity);
        });

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [isSignedIn, resetTimeout]);

    return null; // This component doesn't render anything
}
