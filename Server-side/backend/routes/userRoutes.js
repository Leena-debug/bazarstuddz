const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
// const { protect } = require('../middleware/authMiddleware'); // Uncomment once Auth is ready

// LOGIN
 router.post("/login", userController.login);

// register
router.post("/register", userController.register);

router.get("/", (req, res) => {
  res.send("Users route working");
});

// ✅ ROUTE: Switch User Role
// URL: PUT /api/users/switch-role
router.put('/switch-role', userController.switchRole);

module.exports = router;