const router = require("express").Router();
const auth = require("../controllers/auth.controller");
const requireAuth = require("../middleware/auth.middleware");

router.post("/login", auth.login);
router.get("/verify", requireAuth, auth.verify);
router.post("/refresh", auth.refresh);
router.post("/logout", auth.logout);

module.exports = router;