"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleShare(interviewId: string, makePublic: boolean) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await prisma.interviewSession.updateMany({
        where: {
            id: interviewId,
            user: { clerkId: userId }
        },
        data: {
            isPublic: makePublic
        }
    });

    revalidatePath(`/dashboard/${interviewId}`);
    return { success: true };
}
