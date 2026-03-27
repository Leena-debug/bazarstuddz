const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// LOGIN
router.post("/login", userController.login);

// REGISTER
router.post("/register", userController.register);

module.exports = router;