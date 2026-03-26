const db = require("../config/db")

exports.clap = (req, res) => {
    const userId = req.user.id
    const blogId = req.params.blogId

    const checkSql = "SELECT count FROM claps WHERE user_id = ? AND blog_id = ?"

    db.query(checkSql, [userId, blogId], (err, result) => {
        if (err) return res.status(500).send(err)

        if (result.length > 0) {
            if (result[0].count >= 50) {
                return res.status(400).send("Max 50 claps reached")
            }

            db.query(
                "UPDATE claps SET count = count + 1 WHERE user_id = ? AND blog_id = ?",
                [userId, blogId],
                (err) => {
                    if (err) return res.status(500).send(err)
                    res.send("Clap added")
                }
            )
        } else {
            db.query(
                "INSERT INTO claps (user_id, blog_id, count) VALUES (?, ?, 1)",
                [userId, blogId],
                (err) => {
                    if (err) return res.status(500).send(err)
                    res.send("First clap added")
                }
            )
        }
    })
}

exports.unclap = (req, res) => {
    const userId = req.user.id
    const blogId = req.params.blogId

    db.query(
        "SELECT count FROM claps WHERE user_id = ? AND blog_id = ?",
        [userId, blogId],
        (err, result) => {
            if (err) return res.status(500).send(err)

            if (!result.length) return res.send("No claps")

            if (result[0].count <= 1) {
                db.query(
                    "DELETE FROM claps WHERE user_id = ? AND blog_id = ?",
                    [userId, blogId],
                    () => res.send("Claps removed")
                )
            } else {
                db.query(
                    "UPDATE claps SET count = count - 1 WHERE user_id = ? AND blog_id = ?",
                    [userId, blogId],
                    () => res.send("Clap removed")
                )
            }
        }
    )
}

exports.getClaps = (req, res) => {
    const blogId = req.params.blogId

    db.query(
        "SELECT COALESCE(SUM(count),0) AS total_claps FROM claps WHERE blog_id = ?",
        [blogId],
        (err, result) => {
            if (err) return res.status(500).send(err)

            res.json({ totalClaps: result[0].total_claps })
        }
    )
}