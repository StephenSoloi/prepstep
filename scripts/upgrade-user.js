const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function upgradeUser() {
    try {
        const user = await prisma.user.update({
            where: { email: 'regma254@gmail.com' },
            data: {
                tier: 'FREE',
                credits: 2
            }
        });
        console.log('SUCCESS: User downgraded to FREE with 2 credits.');
        console.log('User Details:', JSON.stringify(user, null, 2));
    } catch (error) {
        if (error.code === 'P2025') {
            console.error('ERROR: User not found with email: regma254@gmail.com');
            console.log('Note: The user must have signed in to the app at least once to exist in the database.');
        } else {
            console.error('ERROR:', error.message);
        }
    } finally {
        await prisma.$disconnect();
    }
}

upgradeUser();
