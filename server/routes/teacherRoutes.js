const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacherController");
const {
  protect,
  teacherOnly,
} = require("../controllers/middleware/authMiddleware");

router.use(protect, teacherOnly);

// Endpoint: GET /api/teacher/stats
router.get("/stats", teacherController.getClassroomStats);

module.exports = router;
