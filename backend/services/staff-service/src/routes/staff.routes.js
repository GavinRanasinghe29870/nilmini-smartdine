const router = require("express").Router();
const requireAuth = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/role.middleware");
const staffController = require("../controllers/staff.controller");

router.get("/me", requireAuth, (req, res) => {
  res.json({ tokenUser: req.user });
});

router.post("/", requireAuth, requireRole("OWNER"), staffController.createUser);
router.get("/", requireAuth, requireRole("OWNER"), staffController.listUsers);

module.exports = router;