const util = require("util")
const db = require("../config/db")

const queryAsync = util.promisify(db.query).bind(db)

const sendServerError = (res, err) => {
    console.error(err)
    return res.status(500).json({ error: "Internal server error" })
}

const validateId = (value) => Number.isInteger(Number(value)) && Number(value) > 0

exports.addComment = async (req, res) => {
    const { blogId, content, parent_comment_id } = req.body
    const userId = req.user.id

    if (!validateId(blogId) || !content || !content.trim()) {
        return res.status(400).json({ error: "blogId and content are required" })
    }

    let parentId = null

    if (parent_comment_id) {
        if (!validateId(parent_comment_id)) {
            return res.status(400).json({ error: "Invalid parent_comment_id" })
        }

        const parent = await queryAsync(
            "SELECT id FROM comments WHERE id = ? AND blog_id = ?",
            [parent_comment_id, blogId]
        )

        if (!parent.length) {
            return res.status(404).json({ error: "Parent comment not found" })
        }

        parentId = parent_comment_id
    }

    const sql = `
        INSERT INTO comments (blog_id, user_id, content, parent_comment_id)
        VALUES (?, ?, ?, ?)
    `

    try {
        await queryAsync(sql, [blogId, userId, content.trim(), parentId])
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

    const sql = `
        SELECT c.*, u.name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.blog_id = ?
        ORDER BY c.created_at ASC
    `

    try {
        const comments = await queryAsync(sql, [blogId])

        const parentComments = comments.filter(c => !c.parent_comment_id)

        const result = parentComments.map(parent => {
            const replies = comments.filter(
                c => c.parent_comment_id === parent.id
            )

            return {
                ...parent,
                replies
            }
        })

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

    try {
        const comment = await queryAsync("SELECT * FROM comments WHERE id = ?", [id])

        if (!comment.length) {
            return res.status(404).json({ error: "Comment not found" })
        }

        if (comment[0].user_id !== userId) {
            return res.status(403).json({ error: "Not allowed" })
        }

        await queryAsync("UPDATE comments SET content = ? WHERE id = ?", [content.trim(), id])

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

    try {
        const comment = await queryAsync("SELECT * FROM comments WHERE id = ?", [id])

        if (!comment.length) {
            return res.status(404).json({ error: "Comment not found" })
        }

        if (comment[0].user_id !== userId) {
            return res.status(403).json({ error: "Not allowed" })
        }

        await queryAsync("DELETE FROM comments WHERE id = ?", [id])

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

    try {
        const rows = await queryAsync(
            "SELECT * FROM comment_claps WHERE user_id = ? AND comment_id = ?",
            [userId, commentId]
        )

        if (rows.length) {
            if (rows[0].clap_count >= 50) {
                return res.status(400).json({ error: "Max clap reached" })
            }

            await queryAsync(
                "UPDATE comment_claps SET clap_count = clap_count + 1 WHERE user_id = ? AND comment_id = ?",
                [userId, commentId]
            )

            return res.status(200).json({ message: "Clap added" })
        }

        await queryAsync(
            "INSERT INTO comment_claps (user_id, comment_id, clap_count) VALUES (?, ?, 1)",
            [userId, commentId]
        )

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

    try {
        const result = await queryAsync(
            "SELECT SUM(clap_count) AS totalClaps FROM comment_claps WHERE comment_id = ?",
            [commentId]
        )

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

    try {
        await queryAsync(
            "DELETE FROM comment_claps WHERE user_id = ? AND comment_id = ?",
            [userId, commentId]
        )

        return res.status(200).json({ message: "Claps removed" })
    } catch (err) {
        return sendServerError(res, err)
    }
}