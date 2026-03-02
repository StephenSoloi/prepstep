import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Try to find the user with their interview count
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: {
                _count: {
                    select: { interviews: true }
                }
            }
        });

        const limits: Record<string, number> = {
            FREE: 2,
            PREMIUM: 5,
        };

        if (!user) {
            // Simplified fallback for new users during this specific fetch
            return NextResponse.json({ tier: "FREE", credits: 2, limit: 2 });
        }

        const limit = limits[user.tier] || 2;
        const used = user._count.interviews;

        // We override the 'credits' field with the real-time calculated balance
        const currentCredits = Math.max(0, limit - used);

        return NextResponse.json({
            tier: user.tier,
            credits: currentCredits,
            limit: limit,
        });
    } catch (error) {
        console.error("User status error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
