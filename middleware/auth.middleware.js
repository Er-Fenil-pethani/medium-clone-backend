const jwt = require("jsonwebtoken")

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader) return res.send("No token")

        const token = authHeader.split(" ")[1]

        const decoded =jwt.verify(token, process.env.JWT_SECRET)

        req.user = {
            id: decoded.id
        }

        next()
    } catch (err) {
        console.log("JWT ERROR:", err)
        res.send("Invalid token")
    }
}