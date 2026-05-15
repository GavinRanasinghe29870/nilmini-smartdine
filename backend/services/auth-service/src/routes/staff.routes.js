const router = require("express").Router();

const staffController = require("../controllers/staff.controller");
const requireAuth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

router.use(requireAuth);
router.use(requireRole("OWNER", "MANAGER"));

router.get("/", staffController.listUsers);
router.get("/:id", staffController.getUserById);
router.post("/", staffController.createUser);

module.exports = router;