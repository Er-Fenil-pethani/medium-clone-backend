require("dotenv").config()
const express = require("express")
const db = require("./config/db")
const fileUpload = require("express-fileupload")
const path = require("path")

const app = express()

app.use(express.json())

app.use(fileUpload({
    useTempFiles: true,
    createParentPath: true
}))

app.use("/uploads", express.static(path.join(__dirname, "uploads")))

app.get("/", (req, res) => {
    res.send("API running with MySQL")
})

const authRoutes = require("./routes/auth.routes")
app.use("/api/auth", authRoutes)

const blogRoutes = require("./routes/blog.routes")
app.use("/api/blogs", blogRoutes)

const commentRoutes = require("./routes/comment.routes")
app.use("/api/comments", commentRoutes)

app.use("/api", require("./routes/clapRoutes"))
app.use("/api", require("./routes/followRoutes"))
app.use("/api", require("./routes/bookmarkRoutes"))
app.use("/api", require("./routes/draftRoutes"))

app.use("/api/users", require("./routes/user.routes"))

app.listen(3000, () => {
    console.log("Server running on port 3000")
})