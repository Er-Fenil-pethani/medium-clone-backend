const express = require("express")
const router = express.Router()
const auth = require("../middleware/auth.middleware")
const ctrl = require("../controllers/clapController")

router.post("/clap/:blogId", auth, ctrl.clap)
router.post("/unclap/:blogId", auth, ctrl.unclap)
router.get("/claps/:blogId", ctrl.getClaps)

module.exports = router