import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Try to find the user
        let dbUser = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: {
                tier: true,
                credits: true,
            },
        });

        // 2. If user doesn't exist, create them (Sync from Clerk)
        if (!dbUser) {
            const clerkUser = await currentUser();
            if (clerkUser) {
                const email = clerkUser.emailAddresses[0]?.emailAddress;
                if (email) {
                    dbUser = await prisma.user.create({
                        data: {
                            clerkId: userId,
                            email: email,
                            firstName: clerkUser.firstName,
                            lastName: clerkUser.lastName,
                            tier: "FREE",
                            credits: 2
                        },
                        select: {
                            tier: true,
                            credits: true,
                        }
                    });
                }
            }
        }

        const limits: Record<string, number> = {
            FREE: 2,
            PREMIUM: 5,
        };

        if (!dbUser) {
            return NextResponse.json({ tier: "FREE", credits: 2, limit: 2 });
        }

        return NextResponse.json({
            ...dbUser,
            limit: limits[dbUser.tier] || 2,
        });
    } catch (error) {
        console.error("User status error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
