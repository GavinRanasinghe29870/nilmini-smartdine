const router = require("express").Router();
const auth = require("../controllers/auth.controller");

router.post("/login", auth.login);
router.get("/verify", auth.verify);
router.post("/refresh", auth.refresh);
router.post("/logout", auth.logout);

module.exports = router;
