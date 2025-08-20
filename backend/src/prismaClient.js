const { PrismaClient } = require('@prisma/client')

let prismaClient

function getPrismaClient() {
    if (!prismaClient) {
        prismaClient = new PrismaClient({
            log: ['query', 'info', 'warn', 'error'],
            errorFormat: 'pretty',
        })

        // Handle connection events
        prismaClient.$on('beforeExit', async () => {
            await prismaClient.$disconnect()
        })
    }
    return prismaClient
}

// Test database connection
async function testConnection() {
    try {
        const client = getPrismaClient()
        await client.$connect()
        console.log('✅ Database connection successful')
        return true
    } catch (error) {
        console.error('❌ Database connection failed:', error.message)
        return false
    }
}

module.exports = {
    prisma: getPrismaClient(),
    testConnection
}


