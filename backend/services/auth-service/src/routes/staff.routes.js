const router = require("express").Router();
const staffController = require("../controllers/staff.controller");

// public staff routes
router.post("/", staffController.createUser);
router.get("/", staffController.listUsers);

module.exports = router;