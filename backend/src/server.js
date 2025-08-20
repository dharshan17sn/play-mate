require('dotenv').config()
const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const matchRoutes = require('./routes/match')

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
}))
app.use(express.json())

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/match', matchRoutes)

const port = process.env.PORT || 5000
app.listen(port, () => {
    console.log(`Playmate backend running on http://localhost:${port}`)
})

