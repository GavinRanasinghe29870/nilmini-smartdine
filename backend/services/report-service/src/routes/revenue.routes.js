const express = require("express");
const { getRevenueReport } = require("../controllers/revenue.controller");

const router = express.Router();

router.get("/", getRevenueReport);

module.exports = router;