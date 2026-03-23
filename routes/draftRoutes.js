const express = require("express")
const router = express.Router()
const db = require("../config/db")
const auth = require("../middleware/auth.middleware")

// CREATE DRAFT
router.post("/draft", auth, (req, res) => {
    const { title, content } = req.body

    db.query(
        "INSERT INTO blogs (title, content, user_id, is_draft) VALUES (?, ?, ?, true)",
        [title, content, req.user.id],
        (err, result) => {
            if (err) return res.status(500).json(err)
            res.json({ message: "Draft created", id: result.insertId })
        }
    )
})

// UPDATE DRAFT
router.put("/draft/:id", auth, (req, res) => {
    const { title, content } = req.body

    db.query(
        "UPDATE blogs SET title=?, content=? WHERE id=? AND user_id=? AND is_draft=true",
        [title, content, req.params.id, req.user.id],
        (err) => {
            if (err) return res.status(500).json(err)
            res.json({ message: "Draft updated" })
        }
    )
})

// PUBLISH
router.post("/publish/:id", auth, (req, res) => {
    db.query(
        "UPDATE blogs SET is_draft=false, published_at=NOW() WHERE id=? AND user_id=?",
        [req.params.id, req.user.id],
        (err) => {
            if (err) return res.status(500).json(err)
            res.json({ message: "Published" })
        }
    )
})

// GET DRAFTS
router.get("/drafts", auth, (req, res) => {
    db.query(
        "SELECT * FROM blogs WHERE user_id=? AND is_draft=true",
        [req.user.id],
        (err, results) => {
            if (err) return res.status(500).json(err)
            res.json(results)
        }
    )
})

module.exports = router