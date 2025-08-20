const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { prisma } = require('../prismaClient')
const { OAuth2Client } = require('google-auth-library')

const router = express.Router()

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, city, games } = req.body || {}

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' })
        }

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return res.status(409).json({ error: 'Email already in use' })
        }

        const passwordHash = password ? await bcrypt.hash(password, 10) : null

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name: name || null,
                city: city || null,
                gameInterests: {
                    create: Array.isArray(games)
                        ? games
                            .filter((g) => typeof g === 'string' && g.trim().length > 0)
                            .map((g) => ({ name: g.trim() }))
                        : [],
                },
            },
            include: { gameInterests: true },
        })

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev_secret', {
            expiresIn: '7d',
        })

        return res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                city: user.city,
                games: user.gameInterests.map((g) => g.name),
            },
        })
    } catch (error) {
        console.error('Register error', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body || {}
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' })
        }

        const user = await prisma.user.findUnique({ where: { email }, include: { gameInterests: true } })
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev_secret', {
            expiresIn: '7d',
        })

        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                city: user.city,
                games: user.gameInterests.map((g) => g.name),
            },
        })
    } catch (error) {
        console.error('Login error', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

// Request OTP to email (demo: we return the OTP in response; wire real email later)
router.post('/otp/request', async (req, res) => {
    try {
        const { email } = req.body || {}
        if (!email) return res.status(400).json({ error: 'Email is required' })

        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: { email },
        })

        const otp = (Math.floor(100000 + Math.random() * 900000)).toString()
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex')
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)

        await prisma.user.update({
            where: { id: user.id },
            data: { otpHash, otpExpiresAt },
        })

        // TODO: send OTP via email provider
        return res.json({ message: 'OTP sent', demoOtp: otp })
    } catch (error) {
        console.error('OTP request error', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

// Verify OTP and issue JWT
router.post('/otp/verify', async (req, res) => {
    try {
        const { email, otp } = req.body || {}
        if (!email || !otp) return res.status(400).json({ error: 'Email and otp are required' })

        const user = await prisma.user.findUnique({ where: { email }, include: { gameInterests: true } })
        if (!user || !user.otpHash || !user.otpExpiresAt) return res.status(400).json({ error: 'No OTP pending' })
        if (user.otpExpiresAt.getTime() < Date.now()) return res.status(400).json({ error: 'OTP expired' })

        const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex')
        if (otpHash !== user.otpHash) return res.status(400).json({ error: 'Invalid OTP' })

        await prisma.user.update({ where: { id: user.id }, data: { otpHash: null, otpExpiresAt: null, emailVerifiedAt: new Date() } })

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' })
        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                city: user.city,
                games: user.gameInterests.map((g) => g.name),
            },
        })
    } catch (error) {
        console.error('OTP verify error', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

// Google OAuth (token verification to be wired with Google SDK on client; backend accepts id_token)
router.post('/google', async (req, res) => {
    try {
        const { idToken, name, city } = req.body || {}
        if (!idToken) return res.status(400).json({ error: 'idToken is required' })

        const clientId = process.env.GOOGLE_CLIENT_ID
        if (!clientId) return res.status(500).json({ error: 'Server missing GOOGLE_CLIENT_ID' })

        const client = new OAuth2Client(clientId)
        const ticket = await client.verifyIdToken({ idToken, audience: clientId })
        const payload = ticket.getPayload()
        const email = payload?.email
        const providerId = payload?.sub || null
        if (!email) return res.status(401).json({ error: 'Invalid Google token' })

        const user = await prisma.user.upsert({
            where: { email },
            update: { provider: 'google', providerId, name: name || undefined, city: city || undefined, emailVerifiedAt: new Date() },
            create: { email, name: name || null, city: city || null, provider: 'google', providerId, emailVerifiedAt: new Date() },
            include: { gameInterests: true },
        })

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' })
        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                city: user.city,
                games: user.gameInterests.map((g) => g.name),
            },
        })
    } catch (error) {
        console.error('Google login error', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

module.exports = router


