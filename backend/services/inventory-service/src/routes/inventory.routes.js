const express = require("express");
const upload = require("../middlewares/upload.middleware");
const controller = require("../controllers/inventory.controller");

const router = express.Router();

router.get("/", controller.getAllItems);
router.post("/", upload.single("image"), controller.createItem);
router.put("/:id", upload.single("image"), controller.updateItem);
router.patch("/:id/quantity", controller.addQuantity);
router.delete("/:id", controller.deleteItem);

module.exports = router;