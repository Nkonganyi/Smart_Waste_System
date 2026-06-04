const express = require("express")
const router = express.Router()
const routeController = require("../controllers/routeController")
const { authenticate, authorize } = require("../middleware/authMiddleware")

/**
 * Admin-only route optimization routes
 */

// Get optimized route (admin)
router.get("/", authenticate, authorize(["admin"]), routeController.getOptimizedRoute)

// Get all routes (admin)
router.get("/all", authenticate, authorize(["admin"]), routeController.getAllRoutes)

// Optimize route between specific points (POST)
router.post("/optimize", authenticate, authorize(["admin"]), routeController.optimizeCustomRoute)
module.exports = router
