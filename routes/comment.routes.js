const express = require("express")
const router = express.Router()
const commentController = require("../controllers/comment.controller")
const auth = require("../middleware/auth.middleware")

router.post("/", auth, commentController.addComment)
router.get("/:blogId", commentController.getComments)
router.put("/:id", auth, commentController.updateComment)
router.delete("/:id", auth, commentController.deleteComment)


router.post("/:id/clap", auth, commentController.addClap)
router.get("/:id/claps", commentController.getClaps)
router.delete("/:id/clap", auth, commentController.undoClap)

module.exports = router