const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            where: {
                email: 'regma254@gmail.com'
            }
        });
        console.log('DEBUG: regma254@gmail.com users:');
        console.log(JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
