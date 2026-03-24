require("dotenv").config()
const express = require("express")
const db = require("./config/db")
const fileUpload = require("express-fileupload")
const path = require("path")

const app = express()

// BODY PARSER
app.use(express.json())

// FILE UPLOAD (for blog images)
app.use(fileUpload({
    useTempFiles: true,
    createParentPath: true
}))

// STATIC FOLDER FOR IMAGES
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// TEST ROUTE
app.get("/", (req, res) => {
    res.send("API running with MySQL")
})

// ROUTES
const authRoutes = require("./routes/auth.routes")
app.use("/api/auth", authRoutes)

const blogRoutes = require("./routes/blog.routes")
app.use("/api/blogs", blogRoutes)

const commentRoutes = require("./routes/comment.routes")
app.use("/api/comments", commentRoutes)

// 🔥 FEATURE ROUTES
app.use("/api", require("./routes/clapRoutes"))
app.use("/api", require("./routes/followRoutes"))
app.use("/api", require("./routes/bookmarkRoutes"))
app.use("/api", require("./routes/draftRoutes"))

// 👤 USER PROFILE ROUTES (NEW)
app.use("/api/users", require("./routes/user.routes"))

// SERVER START
app.listen(3000, () => {
    console.log("Server running on port 3000")
})