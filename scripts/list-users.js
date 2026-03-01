const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAll() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, clerkId: true, email: true, credits: true, tier: true }
        });
        console.log(JSON.stringify(users, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}
listAll();
