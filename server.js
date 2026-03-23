require("dotenv").config()
const express = require("express")
const db = require("./config/db")

const app = express()

app.use(express.json())

app.get("/", (req, res) => {
    res.send("API running with MySQL")
})

const authRoutes = require("./routes/auth.routes")
app.use("/api/auth", authRoutes)

const blogRoutes = require("./routes/blog.routes")
app.use("/api/blogs", blogRoutes)

const commentRoutes = require("./routes/comment.routes")
app.use("/api/comments", commentRoutes)

// 🔥 ALL NEW FEATURES
app.use("/api", require("./routes/clapRoutes"))
app.use("/api", require("./routes/followRoutes"))
app.use("/api", require("./routes/bookmarkRoutes"))
app.use("/api", require("./routes/draftRoutes"))

app.listen(3000, () => {
    console.log("Server running on port 3000")
})