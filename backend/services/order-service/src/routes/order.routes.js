const express = require("express");
const controller = require("../controllers/order.controller");

const router = express.Router();

router.post("/", controller.createOrder);
router.get("/", controller.getOrders);

router.get("/daily-sales", controller.getDailySales);

router.get("/:id", controller.getOrderById);
router.put("/:id", controller.updateOrder);
router.patch("/:id/status", controller.updateOrderStatus);
router.patch("/:id/payment", controller.confirmPayment);
router.delete("/:id", controller.deleteOrder);

module.exports = router;