const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            where: {
                email: {
                    in: ['regma254@gmail.com', 'stephensoloi11@gmail.com', '1700745@students.kcau.ac.ke']
                }
            },
            include: {
                interviews: true
            }
        });
        console.log('DEBUG: Found users in DB:');
        console.log(JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
