const express = require("express")
const router = express.Router()
const { protect, authorize } = require("../middleware/auth")
const {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
  generateQRCode,
  completeSession,
} = require("../controllers/sessionController")

router.post("/", protect, authorize("faculty"), createSession)
router.get("/", protect, getSessions)
router.get("/:id", protect, getSessionById)
router.put("/:id", protect, authorize("faculty", "admin"), updateSession)
router.delete("/:id", protect, authorize("faculty"), deleteSession)
router.get("/:id/qrcode", protect, authorize("faculty"), generateQRCode)
router.put("/:id/complete", protect, authorize("faculty"), completeSession)

module.exports = router
