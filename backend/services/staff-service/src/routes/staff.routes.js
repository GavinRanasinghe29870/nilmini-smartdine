const router = require("express").Router();

const requireAuth = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/role.middleware");

const staffController = require("../controllers/staff.controller");
const attendanceController = require("../controllers/attendance.controller");
const salaryController = require("../controllers/salary.controller");

const ownerManagerOnly = [requireAuth, requireRole("OWNER", "MANAGER")];

router.get("/me", requireAuth, staffController.getMe);

router.get(
  "/attendance-records",
  ...ownerManagerOnly,
  attendanceController.getAttendanceRecords
);

router.get(
  "/attendance",
  ...ownerManagerOnly,
  attendanceController.getAttendance
);

router.put(
  "/attendance",
  ...ownerManagerOnly,
  attendanceController.updateAttendance
);

router.get(
  "/salary-payments",
  ...ownerManagerOnly,
  salaryController.listSalaryPayments
);

router.post(
  "/:id/pay-salary",
  ...ownerManagerOnly,
  salaryController.paySalary
);

router.get("/", ...ownerManagerOnly, staffController.listUsers);
router.post("/", ...ownerManagerOnly, staffController.createUser);

module.exports = router;