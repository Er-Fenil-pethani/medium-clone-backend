const util = require("util")
const db = require("../config/db")

const queryAsync = util.promisify(db.query).bind(db)

const sendServerError = (res, err) => {
    console.error(err)
    return res.status(500).json({ error: "Internal server error" })
}

const validateId = (value) => Number.isInteger(Number(value)) && Number(value) > 0

exports.addComment = async (req, res) => {
    const { blogId, content } = req.body
    const userId = req.user.id

    if (!validateId(blogId) || !content || !content.trim()) {
        return res.status(400).json({ error: "blogId and content are required" })
    }

    const sql = "INSERT INTO comments (blog_id, user_id, content) VALUES (?, ?, ?)"

    try {
        await queryAsync(sql, [blogId, userId, content.trim()])
        return res.status(201).json({ message: "Comment added" })
    } catch (err) {
        return sendServerError(res, err)
    }
}

exports.getComments = async (req, res) => {
    const blogId = req.params.blogId

    if (!validateId(blogId)) {
        return res.status(400).json({ error: "Invalid blogId" })
    }

    const sql = `SELECT comments.*, users.name
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.blog_id = ?
        ORDER BY comments.created_at DESC`

    try {
        const result = await queryAsync(sql, [blogId])
        return res.status(200).json(result)
    } catch (err) {
        return sendServerError(res, err)
    }
}

exports.updateComment = async (req, res) => {
    const id = req.params.id
    const { content } = req.body
    const userId = req.user.id

    if (!validateId(id) || !content || !content.trim()) {
        return res.status(400).json({ error: "id and content are required" })
    }

    const checkSql = "SELECT * FROM comments WHERE id = ?"

    try {
        const comment = await queryAsync(checkSql, [id])

        if (!comment.length) {
            return res.status(404).json({ error: "Comment not found" })
        }

        if (comment[0].user_id !== userId) {
            return res.status(403).json({ error: "Not allowed" })
        }

        const updateSql = "UPDATE comments SET content = ? WHERE id = ?"
        await queryAsync(updateSql, [content.trim(), id])

        return res.status(200).json({ message: "Comment updated" })
    } catch (err) {
        return sendServerError(res, err)
    }
}

exports.deleteComment = async (req, res) => {
    const id = req.params.id
    const userId = req.user.id

    if (!validateId(id)) {
        return res.status(400).json({ error: "Invalid id" })
    }

    const checkSql = "SELECT * FROM comments WHERE id = ?"

    try {
        const comment = await queryAsync(checkSql, [id])

        if (!comment.length) {
            return res.status(404).json({ error: "Comment not found" })
        }

        if (comment[0].user_id !== userId) {
            return res.status(403).json({ error: "Not allowed" })
        }

        const deleteSql = "DELETE FROM comments WHERE id = ?"
        await queryAsync(deleteSql, [id])

        return res.status(200).json({ message: "Comment deleted" })
    } catch (err) {
        return sendServerError(res, err)
    }
}

exports.addClap = async (req, res) => {
    const commentId = req.params.id
    const userId = req.user.id

    if (!validateId(commentId)) {
        return res.status(400).json({ error: "Invalid comment id" })
    }

    const checkSql = "SELECT * FROM comment_claps WHERE user_id = ? AND comment_id = ?"

    try {
        const rows = await queryAsync(checkSql, [userId, commentId])

        if (rows.length) {
            const currentClaps = rows[0].clap_count
            if (currentClaps >= 50) {
                return res.status(400).json({ error: "Max clap reached" })
            }

            const updateSql = "UPDATE comment_claps SET clap_count = clap_count + 1 WHERE user_id = ? AND comment_id = ?"
            await queryAsync(updateSql, [userId, commentId])
            return res.status(200).json({ message: "Clap added" })
        }

        const insertSql = "INSERT INTO comment_claps (user_id, comment_id, clap_count) VALUES (?, ?, 1)"
        await queryAsync(insertSql, [userId, commentId])
        return res.status(201).json({ message: "First clap added" })
    } catch (err) {
        return sendServerError(res, err)
    }
}

exports.getClaps = async (req, res) => {
    const commentId = req.params.id

    if (!validateId(commentId)) {
        return res.status(400).json({ error: "Invalid comment id" })
    }

    const sql = "SELECT SUM(clap_count) AS totalClaps FROM comment_claps WHERE comment_id = ?"

    try {
        const result = await queryAsync(sql, [commentId])
        return res.status(200).json({ totalClaps: result[0].totalClaps || 0 })
    } catch (err) {
        return sendServerError(res, err)
    }
}

exports.undoClap = async (req, res) => {
    const commentId = req.params.id
    const userId = req.user.id

    if (!validateId(commentId)) {
        return res.status(400).json({ error: "Invalid comment id" })
    }

    const sql = "DELETE FROM comment_claps WHERE user_id = ? AND comment_id = ?"

    try {
        await queryAsync(sql, [userId, commentId])
        return res.status(200).json({ message: "Claps removed" })
    } catch (err) {
        return sendServerError(res, err)
    }
}
