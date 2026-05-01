const express = require("express");

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/order.controller");

const router = express.Router();

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.put("/:id", updateOrder);
router.patch("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);

module.exports = router;