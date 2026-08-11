const router = require("express").Router();

const requireAuth = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/role.middleware");

const upload = require("../middlewares/upload.middleware");

const staffController = require("../controllers/staff.controller");
const attendanceController = require("../controllers/attendance.controller");
const staffExpenseController = require("../controllers/staffExpense.controller");

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
  "/staff-expenses",
  ...ownerManagerOnly,
  staffExpenseController.listStaffExpenses
);

router.get(
  "/staff-expense-summary",
  ...ownerManagerOnly,
  staffExpenseController.getStaffExpenseSummary
);

router.delete(
  "/staff-expenses/:expenseId",
  ...ownerManagerOnly,
  staffExpenseController.deleteStaffExpense
);

router.post(
  "/:id/staff-expenses",
  ...ownerManagerOnly,
  staffExpenseController.createStaffExpense
);

router.post(
  "/:id/pay-salary",
  ...ownerManagerOnly,
  staffExpenseController.paySalary
);

router.get(
  "/salary-payments",
  ...ownerManagerOnly,
  staffExpenseController.listSalaryPayments
);

router.get("/", ...ownerManagerOnly, staffController.listUsers);

router.post(
  "/",
  ...ownerManagerOnly,
  upload.single("image"),
  staffController.createUser
);

router.get("/:id", ...ownerManagerOnly, staffController.getUserById);

router.put(
  "/:id",
  ...ownerManagerOnly,
  upload.single("image"),
  staffController.updateUser
);

router.delete("/:id", ...ownerManagerOnly, staffController.deleteUser);

module.exports = router;