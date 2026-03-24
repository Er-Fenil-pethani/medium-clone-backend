const db = require("../config/db")

exports.clap = (req, res) => {
    const userId = req.user.id
    const blogId = req.params.blogId

    const checkSql = "SELECT count FROM claps WHERE user_id = ? AND blog_id = ?"

    db.query(checkSql, [userId, blogId], (err, result) => {
        if (err) return res.send(err)

        if (result.length > 0) {
            let current = result[0].count

            if (current >= 50) {
                return res.send("Max 50 claps reached")
            }

            let newCount = Math.min(current + 2, 50)

            const updateSql = "UPDATE claps SET count = ? WHERE user_id = ? AND blog_id = ?"

            db.query(updateSql, [newCount, userId, blogId], (err) => {
                if (err) return res.send(err)

                res.send("Clapped")
            })
        } else {
            const insertSql = "INSERT INTO claps (user_id, blog_id, count) VALUES (?, ?, 2)"

            db.query(insertSql, [userId, blogId], (err) => {
                if (err) return res.send(err)

                res.send("Clapped")
            })
        }
    })
}


exports.unclap = (req, res) => {
    const userId = req.user.id
    const blogId = req.params.blogId

    const sql = `
        UPDATE claps 
        SET count = GREATEST(count - 1, 0)
        WHERE user_id = ? AND blog_id = ?
    `

    db.query(sql, [userId, blogId], (err) => {
        if (err) return res.send(err)

        res.send("Unclapped")
    })
}


exports.getClaps = (req, res) => {
    const blogId = req.params.blogId

    const sql = `
        SELECT SUM(count) AS total_claps 
        FROM claps 
        WHERE blog_id = ?
    `

    db.query(sql, [blogId], (err, result) => {
        if (err) return res.send(err)

        res.json({
            totalClaps: result[0].total_claps || 0
        })
    })
}