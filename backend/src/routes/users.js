const express = require('express')
const { prisma } = require('../prismaClient')
const { authRequired } = require('../middleware/auth')

const router = express.Router()

router.get('/me', authRequired, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            include: { gameInterests: true },
        })
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }
        return res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            city: user.city,
            games: user.gameInterests.map((g) => g.name),
        })
    } catch (error) {
        console.error('Users/me error', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

module.exports = router


