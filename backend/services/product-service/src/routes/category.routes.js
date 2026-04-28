const express = require("express");
const controller = require("../controllers/category.controller");

const router = express.Router();

router.get("/", controller.getCategories);
router.post("/", controller.createCategory);
router.put("/:id", controller.updateCategory);

module.exports = router;