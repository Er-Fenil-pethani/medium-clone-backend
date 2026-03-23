const db = require("../config/db")

exports.addBookmark = (req, res) => {
    db.query(
        "INSERT INTO bookmarks (user_id, blog_id) VALUES (?, ?)",
        [req.user.id, req.params.blogId],
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
}

exports.removeBookmark = (req, res) => {
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
}

exports.getBookmarks = (req, res) => {
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
}