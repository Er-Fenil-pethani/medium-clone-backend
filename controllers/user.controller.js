const db = require("../config/db")

exports.getProfile = (req, res) => {
    const userId = req.user.id

    const sql = "SELECT id, name, email, bio FROM users WHERE id = ?"

    db.query(sql, [userId], (err, result) => {
        if (err) return res.send(err)

        if (!result.length) return res.send("User not found")

        res.json(result[0])
    })
}

exports.updateProfile = (req, res) => {
    const userId = req.user.id
    const { name, bio } = req.body

    const sql = "UPDATE users SET name = ?, bio = ? WHERE id = ?"

    db.query(sql, [name, bio, userId], (err) => {
        if (err) return res.send(err)

        res.send("Profile Updated")
    })
}