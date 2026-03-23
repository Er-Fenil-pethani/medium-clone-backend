const db = require("../config/db")

exports.createblog = (req, res) => {
    const { title, content } = req.body
    const userId = req.user.id

    const words = content.split(" ").length
    const reading_time = Math.ceil(words / 200)

    const sql = "INSERT INTO blogs (title, content, user_id, reading_time) VALUES (?, ?, ?, ?)"

    db.query(sql, [title, content, userId, reading_time], (err) => {
        if (err) return res.send(err)

        res.send("Blog Created")
    })
}

exports.getblogs = (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 5
    const search = req.query.search || ""

    const offset = (page - 1) * limit

    const sql = `
        SELECT 
            blogs.id,
            blogs.title,
            blogs.content,
            blogs.reading_time,
            blogs.view_count,
            blogs.created_at,
            users.name AS author,
            COUNT(DISTINCT comments.id) AS comment_count,
            COALESCE(SUM(claps.count), 0) AS total_claps
        FROM blogs
        JOIN users ON blogs.user_id = users.id
        LEFT JOIN comments ON comments.blog_id = blogs.id
        LEFT JOIN claps ON claps.blog_id = blogs.id
        WHERE blogs.title LIKE ? AND blogs.is_draft = false
        GROUP BY blogs.id, users.name
        ORDER BY blogs.created_at DESC
        LIMIT ? OFFSET ?
    `

    db.query(sql, [`%${search}%`, limit, offset], (err, result) => {
        if (err) return res.send(err)

        res.json({
            page,
            limit,
            data: result
        })
    })
}

exports.getblogById = (req, res) => {
    const id = req.params.id

    db.query("UPDATE blogs SET view_count = view_count + 1 WHERE id = ?", [id])

    const sql = `
        SELECT 
            blogs.*,
            users.name,
            COALESCE(SUM(claps.count), 0) AS total_claps
        FROM blogs
        JOIN users ON blogs.user_id = users.id
        LEFT JOIN claps ON claps.blog_id = blogs.id
        WHERE blogs.id = ? AND blogs.is_draft = false
        GROUP BY blogs.id, users.name
    `

    db.query(sql, [id], (err, result) => {
        if (err) return res.send(err)

        res.json(result[0])
    })
}

exports.getMyblogs = (req, res) => {
    const userId = req.user.id

    const sql = `
        SELECT 
            blogs.*,
            COALESCE(SUM(claps.count), 0) AS total_claps
        FROM blogs
        LEFT JOIN claps ON claps.blog_id = blogs.id
        WHERE blogs.user_id = ?
        GROUP BY blogs.id
    `

    db.query(sql, [userId], (err, result) => {
        if (err) return res.send(err)

        res.json(result)
    })
}

exports.updateblog = (req, res) => {
    const id = req.params.id
    const { title, content } = req.body
    const userId = req.user.id

    const checkSql = "SELECT * FROM blogs WHERE id = ?"

    db.query(checkSql, [id], (err, result) => {
        if (err) return res.send(err)

        if (!result.length) return res.send("Blog not found")

        if (result[0].user_id != userId)
            return res.send("Not allowed")

        const words = content.split(" ").length
        const reading_time = Math.ceil(words / 200)

        const updateSql = "UPDATE blogs SET title = ?, content = ?, reading_time = ? WHERE id = ?"

        db.query(updateSql, [title, content, reading_time, id], (err) => {
            if (err) return res.send(err)

            res.send("Blog Updated")
        })
    })
}

exports.deleteblog = (req, res) => {
    const id = req.params.id
    const userId = req.user.id

    const checkSql = "SELECT * FROM blogs WHERE id = ?"

    db.query(checkSql, [id], (err, result) => {
        if (err) return res.send(err)

        if (!result.length) return res.send("Blog not found")

        if (result[0].user_id != userId)
            return res.send("Not allowed")

        const deleteSql = "DELETE FROM blogs WHERE id = ?"

        db.query(deleteSql, [id], (err) => {
            if (err) return res.send(err)

            res.send("Blog Deleted")
        })
    })
}