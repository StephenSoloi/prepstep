/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInterviews() {
    try {
        const interviews = await prisma.interviewSession.findMany({
            include: { user: true }
        });
        console.log('DEBUG: Found interviews:');
        console.log(JSON.stringify(interviews, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}
checkInterviews();
