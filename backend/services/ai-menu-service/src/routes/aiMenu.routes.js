const express = require("express");

const {
  generateMenu,
  getGeneratedMenus,
  getTodayMenu,
  approveGeneratedMenu,
} = require("../controllers/aiMenu.controller");

const router = express.Router();

router.post("/generate", generateMenu);
router.get("/today", getTodayMenu);
router.get("/", getGeneratedMenus);
router.patch("/:id/approve", approveGeneratedMenu);

module.exports = router;