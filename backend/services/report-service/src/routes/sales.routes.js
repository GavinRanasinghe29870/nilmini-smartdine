const express = require("express");
const { getSalesReport } = require("../controllers/sales.controller");

const router = express.Router();

router.get("/", getSalesReport);

module.exports = router;