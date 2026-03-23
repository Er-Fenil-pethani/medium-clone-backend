const db = require("../config/db")
const bcrypt = require("bcrypt")

exports.register = async (req, res) => {
    const { name, email, password } = req.body

    const hashed = await bcrypt.hash(password, 10)

    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)"

    db.query(sql, [name, email, hashed], (err, result) => {
        if (err) return res.send(err)

        res.send("User Registered")
    })
}

const jwt = require("jsonwebtoken")

exports.login = (req, res) => {
    const { email, password } = req.body

    const sql = "SELECT * FROM users WHERE email = ?"

    db.query(sql, [email], async (err, result) => {
        if (err) return res.send(err)

        if (result.length === 0) return res.send("User not found")

        const user = result[0]

        const match = await bcrypt.compare(password, user.password)

        if (!match) return res.send("Wrong password")

        const token = jwt.sign({ id: user.id },process.env.JWT_SECRET)

        res.json({ token })
    })
}