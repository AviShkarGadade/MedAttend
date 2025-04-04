const express = require("express")
const router = express.Router()

// @desc    Test route to check if API is working
// @route   GET /api/debug/test
// @access  Public
router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is working correctly",
    timestamp: new Date().toISOString(),
  })
})

// @desc    List all registered routes
// @route   GET /api/debug/routes
// @access  Public
router.get("/routes", (req, res) => {
  const routes = []

  // Get the Express app from the request
  const app = req.app

  // Function to extract routes from a layer
  const extractRoutes = (layer, basePath = "") => {
    if (layer.route) {
      // It's a route
      const path = basePath + (layer.route.path || "")
      const methods = Object.keys(layer.route.methods).map((method) => method.toUpperCase())
      routes.push({ path, methods })
    } else if (layer.name === "router" && layer.handle.stack) {
      // It's a router
      const path =
        basePath +
        (layer.regexp
          .toString()
          .match(/^\/\^((?:\\\/)?(?:[^/$$$$?+*\\]+\\\/)*)/)?.[1]
          .replace(/\\\//g, "/") || "")
      layer.handle.stack.forEach((stackItem) => {
        extractRoutes(stackItem, path)
      })
    }
  }

  // Extract routes from the main stack
  if (app._router && app._router.stack) {
    app._router.stack.forEach((layer) => {
      extractRoutes(layer)
    })
  }

  res.status(200).json({
    success: true,
    count: routes.length,
    routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
  })
})

module.exports = router

