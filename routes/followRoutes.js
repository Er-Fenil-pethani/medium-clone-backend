const express = require("express")
const router = express.Router()
const db = require("../config/db")
const auth = require("../middleware/auth.middleware")

router.post("/follow/:userId", auth, (req, res) => {
    const followerId = req.user.id
    const followingId = req.params.userId

    if (followerId == followingId) {
        return res.status(400).json({ message: "You cannot follow yourself" })
    }

    db.query(
        "INSERT INTO follows (follower_id, following_id) VALUES (?, ?)",
        [followerId, followingId],
        (err) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({ message: "Already following" })
                }
                return res.status(500).json(err)
            }
            res.json({ message: "Followed successfully" })
        }
    )
})

router.delete("/unfollow/:userId", auth, (req, res) => {
    const followerId = req.user.id
    const followingId = req.params.userId

    db.query(
        "DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
        [followerId, followingId],
        (err, result) => {
            if (err) return res.status(500).json(err)
            if (result.affectedRows === 0) {
                return res.status(400).json({ message: "Not following" })
            }
            res.json({ message: "Unfollowed" })
        }
    )
})

router.get("/followers/:userId", (req, res) => {
    db.query(
        "SELECT follower_id FROM follows WHERE following_id = ?",
        [req.params.userId],
        (err, results) => {
            if (err) return res.status(500).json(err)
            res.json(results)
        }
    )
})

router.get("/following/:userId", (req, res) => {
    db.query(
        "SELECT following_id FROM follows WHERE follower_id = ?",
        [req.params.userId],
        (err, results) => {
            if (err) return res.status(500).json(err)
            res.json(results)
        }
    )
})

module.exports = router