const express = require("express")
const router = express.Router()
const db = require("../config/db")
const auth = require("../middleware/auth.middleware")

router.post("/bookmark/:blogId", auth, (req, res) => {
    const userId = req.user.id
    const blogId = req.params.blogId

    db.query(
        "INSERT INTO bookmarks (user_id, blog_id) VALUES (?, ?)",
        [userId, blogId],
        (err) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({ message: "Already bookmarked" })
                }
                return res.status(500).json(err)
            }
            res.json({ message: "Bookmarked" })
        }
    )
})

router.delete("/bookmark/:blogId", auth, (req, res) => {
    db.query(
        "DELETE FROM bookmarks WHERE user_id = ? AND blog_id = ?",
        [req.user.id, req.params.blogId],
        (err, result) => {
            if (err) return res.status(500).json(err)
            if (result.affectedRows === 0) {
                return res.status(400).json({ message: "Not found" })
            }
            res.json({ message: "Removed" })
        }
    )
})

router.get("/bookmarks", auth, (req, res) => {
    db.query(
        `SELECT blogs.* FROM bookmarks 
         JOIN blogs ON bookmarks.blog_id = blogs.id 
         WHERE bookmarks.user_id = ?`,
        [req.user.id],
        (err, results) => {
            if (err) return res.status(500).json(err)
            res.json(results)
        }
    )
})

module.exports = router