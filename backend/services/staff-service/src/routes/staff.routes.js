const router = require("express").Router();
const requireAuth = require("../middlewares/auth.middleware");
const staffController = require("../controllers/staff.controller");

router.get("/me", requireAuth, staffController.getMe);
router.get("/", requireAuth, staffController.listUsers);
router.post("/", requireAuth, staffController.createUser);

module.exports = router;