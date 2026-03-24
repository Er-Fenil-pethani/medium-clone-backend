const express = require("express")
const router = express.Router()
const blogController = require("../controllers/blog.controller")
const auth = require("../middleware/auth.middleware")

router.post("/", auth, blogController.createblog)

router.get("/", blogController.getblogs)

router.get("/me", auth, blogController.getMyblogs)

router.get("/:id", blogController.getblogById)

router.put("/:id", auth, blogController.updateblog)

router.delete("/:id", auth, blogController.deleteblog)

module.exports = router