const router = require("express").Router();
const requireAuth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const staffController = require("../controllers/staff.controller");

router.get("/me", requireAuth, (req, res) => {
  res.json({ tokenUser: req.user });
});

// OWNER creates users
router.post("/", requireAuth, requireRole("OWNER"), staffController.createUser);
router.get("/", requireAuth, requireRole("OWNER"), staffController.listUsers);

module.exports = router;
