const express = require("express");
const { getDashboardReport } = require("../controllers/dashboard.controller");

const router = express.Router();

router.get("/", getDashboardReport);

module.exports = router;