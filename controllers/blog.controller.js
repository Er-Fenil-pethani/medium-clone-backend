const db = require("../config/db")

const getWordStats = (content) => {
    const words = content.trim().split(/\s+/).length
    const reading_time = Math.ceil(words / 200)
    return { words, reading_time }
}

exports.createblog = (req, res) => {
    const { title, content, tags } = req.body
    const userId = req.user.id

    if (!title || !content) return res.send("Title and content required")

    let imagePath = null

    if (req.files && req.files.image) {
        const image = req.files.image
        const fileName = Date.now() + "_" + image.name

        image.mv("uploads/" + fileName, (err) => {
            if (err) return res.status(500).send(err)
        })

        imagePath = "uploads/" + fileName
    }

    const { reading_time } = getWordStats(content)

    const sql = `
        INSERT INTO blogs (title, content, user_id, reading_time, image, view_count, created_at, updated_at, is_draft)
        VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW(), false)
    `

    db.query(sql, [title, content, userId, reading_time, imagePath], (err, result) => {
        if (err) return res.send(err)

        const blogId = result.insertId

        if (tags && tags.length) {
            tags.forEach(tag => {
                db.query("INSERT IGNORE INTO tags (name) VALUES (?)", [tag])

                db.query(
                    "INSERT INTO blog_tags (blog_id, tag_id) SELECT ?, id FROM tags WHERE name = ?",
                    [blogId, tag]
                )
            })
        }

        res.send("Blog Created")
    })
}

exports.getblogs = (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 5
    const search = req.query.search || ""
    const tag = req.query.tag || ""
    const sort = req.query.sort === "oldest" ? "ASC" : "DESC"

    const offset = (page - 1) * limit

    let sql = `
        SELECT 
            b.*,
            u.name AS author,
            (SELECT COUNT(*) FROM comments WHERE blog_id = b.id) AS comment_count,
            (SELECT COALESCE(SUM(count),0) FROM claps WHERE blog_id = b.id) AS total_claps
        FROM blogs b
        JOIN users u ON b.user_id = u.id
        WHERE b.title LIKE ? AND b.is_draft = false
    `

    const params = [`%${search}%`]

    if (tag) {
        sql += `
            AND b.id IN (
                SELECT blog_id FROM blog_tags bt
                JOIN tags t ON bt.tag_id = t.id
                WHERE t.name = ?
            )
        `
        params.push(tag)
    }

    sql += ` ORDER BY b.created_at ${sort} LIMIT ? OFFSET ?`
    params.push(limit, offset)

    db.query(sql, params, (err, result) => {
        if (err) return res.send(err)

        res.json({ page, limit, data: result })
    })
}

exports.getblogById = (req, res) => {
    const id = req.params.id

    const sql = `
        SELECT b.*, u.name
        FROM blogs b
        JOIN users u ON b.user_id = u.id
        WHERE b.id = ? AND b.is_draft = false
    `

    db.query(sql, [id], (err, result) => {
        if (err) return res.send(err)
        if (!result.length) return res.send("Blog not found")

        db.query("UPDATE blogs SET view_count = view_count + 1 WHERE id = ?", [id])

        res.json(result[0])
    })
}

exports.getRelatedBlogs = (req, res) => {
    const id = req.params.id

    const sql = `
        SELECT DISTINCT b.id, b.title, b.reading_time, b.view_count
        FROM blogs b
        JOIN blog_tags bt ON b.id = bt.blog_id
        WHERE bt.tag_id IN (
            SELECT tag_id FROM blog_tags WHERE blog_id = ?
        )
        AND b.id != ?
        LIMIT 5
    `

    db.query(sql, [id, id], (err, result) => {
        if (err) return res.send(err)
        res.json(result)
    })
}

exports.getMyblogs = (req, res) => {
    const userId = req.user.id

    db.query("SELECT * FROM blogs WHERE user_id = ?", [userId], (err, result) => {
        if (err) return res.send(err)
        res.json(result)
    })
}

exports.getFeed = (req, res) => {
    const userId = req.user.id

    const sql = `
        SELECT b.*
        FROM blogs b
        JOIN follows f ON b.user_id = f.following_id
        WHERE f.follower_id = ? AND b.is_draft = false
        ORDER BY b.created_at DESC
    `

    db.query(sql, [userId], (err, result) => {
        if (err) return res.send(err)
        res.json(result)
    })
}

exports.getTrendingBlogs = (req, res) => {
    const sql = `
        SELECT 
            b.*,
            (SELECT COALESCE(SUM(count),0) FROM claps WHERE blog_id = b.id) AS total_claps
        FROM blogs b
        WHERE b.is_draft = false
        ORDER BY (total_claps * 2 + b.view_count) DESC
        LIMIT 10
    `

    db.query(sql, (err, result) => {
        if (err) return res.send(err)
        res.json(result)
    })
}

exports.getDashboard = (req, res) => {
    const userId = req.user.id

    const sql = `
        SELECT 
            COUNT(*) AS total_blogs,
            COALESCE(SUM(view_count),0) AS total_views,
            COALESCE(SUM(
                (SELECT SUM(count) FROM claps WHERE blog_id = blogs.id)
            ),0) AS total_claps
        FROM blogs
        WHERE user_id = ?
    `

    db.query(sql, [userId], (err, result) => {
        if (err) return res.send(err)
        res.json(result[0])
    })
}

exports.updateblog = (req, res) => {
    const id = req.params.id
    const { title, content } = req.body
    const userId = req.user.id

    db.query("SELECT * FROM blogs WHERE id = ?", [id], (err, result) => {
        if (err) return res.send(err)
        if (!result.length) return res.send("Blog not found")

        if (result[0].user_id != userId)
            return res.send("Not allowed")

        const { reading_time } = getWordStats(content)

        db.query(
            "UPDATE blogs SET title=?, content=?, reading_time=?, updated_at=NOW() WHERE id=?",
            [title, content, reading_time, id],
            (err) => {
                if (err) return res.send(err)
                res.send("Blog Updated")
            }
        )
    })
}

exports.deleteblog = (req, res) => {
    const id = req.params.id
    const userId = req.user.id

    db.query("SELECT * FROM blogs WHERE id = ?", [id], (err, result) => {
        if (err) return res.send(err)
        if (!result.length) return res.send("Blog not found")

        if (result[0].user_id != userId)
            return res.send("Not allowed")

        db.query("DELETE FROM blogs WHERE id = ?", [id], (err) => {
            if (err) return res.send(err)
            res.send("Blog Deleted")
        })
    })
}