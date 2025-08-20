const jwt = require('jsonwebtoken')

function authRequired(req, res, next) {
    try {
        const authHeader = req.headers.authorization || ''
        const [scheme, token] = authHeader.split(' ')

        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({ error: 'Missing or invalid Authorization header' })
        }

        const secret = process.env.JWT_SECRET || 'dev_secret'
        const payload = jwt.verify(token, secret)
        req.userId = payload.userId
        next()
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' })
    }
}

module.exports = { authRequired }


