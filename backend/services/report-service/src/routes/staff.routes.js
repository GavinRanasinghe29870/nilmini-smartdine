const express = require("express");
const { getStaffReport } = require("../controllers/staff.controller");

const router = express.Router();

router.get("/", getStaffReport);

module.exports = router;