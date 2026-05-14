const express = require("express");
const controller = require("../controllers/product.controller");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.post("/upload", upload.single("file"), controller.uploadImage);

router.get("/", controller.getProducts);
router.post("/", controller.createProduct);
router.put("/:id", controller.updateProduct);
router.delete("/:id", controller.deleteProduct);

module.exports = router;