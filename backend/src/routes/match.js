const express = require('express')
const { prisma } = require('../prismaClient')
const { authRequired } = require('../middleware/auth')

const router = express.Router()

// Naive matching by shared games and optional city filter
router.get('/search', authRequired, async (req, res) => {
    try {
        const { city, game } = req.query
        const userId = req.userId

        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { gameInterests: true },
        })
        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' })
        }

        const interestNames = currentUser.gameInterests.map((g) => g.name)
        const filterGames = game ? [String(game)] : interestNames

        const candidates = await prisma.user.findMany({
            where: {
                id: { not: userId },
                ...(city ? { city: String(city) } : {}),
                gameInterests: {
                    some: { name: { in: filterGames } },
                },
            },
            include: { gameInterests: true },
            take: 25,
        })

        const results = candidates.map((u) => ({
            id: u.id,
            name: u.name,
            city: u.city,
            email: u.email,
            sharedGames: u.gameInterests
                .map((g) => g.name)
                .filter((n) => filterGames.includes(n)),
        }))

        return res.json({ results })
    } catch (error) {
        console.error('Match search error', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

module.exports = router


