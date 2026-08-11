const StaffExpense = require("../models/staffExpense.model");
const authStaffService = require("../services/authStaff.service");

const STAFF_EXPENSE_TYPES = [
  "Salary Payment",
  "Salary Advance",
  "Medical",
  "Emergency",
  "Transport",
  "Food",
  "Other",
];

function normalizeMoney(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Number(number.toFixed(2));
}

function getColomboMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  return `${year}-${month}`;
}

function parsePaidAt(value) {
  if (!value) {
    return new Date();
  }

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return new Date(`${text}T12:00:00.000+05:30`);
  }

  return new Date(text);
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const text = String(value).toLowerCase();

  return text === "true" || text === "yes" || text === "1";
}

function getDateRange(startDate, endDate) {
  if (!startDate && !endDate) {
    return null;
  }

  const start = startDate
    ? new Date(`${startDate}T00:00:00.000+05:30`)
    : new Date("1970-01-01T00:00:00.000Z");

  const end = endDate
    ? new Date(`${endDate}T23:59:59.999+05:30`)
    : new Date();

  return { start, end };
}

function serializeExpense(record) {
  return {
    id: String(record._id),
    _id: String(record._id),
    staffId: record.staffId,
    staffName: record.staffName,
    role: record.role,
    baseSalary: Number(record.baseSalary || 0),
    amount: Number(record.amount || 0),
    currency: record.currency || "LKR",
    expenseType: record.expenseType || "Salary Payment",
    deductFromSalary: Boolean(record.deductFromSalary),
    paymentMonth: record.paymentMonth,
    paidAt: record.paidAt,
    note: record.note || "",
    createdBy: record.createdBy || null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function buildFilter(query) {
  const { staffId, paymentMonth, startDate, endDate, expenseType } = query;

  const filter = {};

  if (staffId) {
    filter.staffId = String(staffId);
  }

  if (paymentMonth) {
    filter.paymentMonth = String(paymentMonth);
  }

  if (expenseType) {
    filter.expenseType = String(expenseType);
  }

  const range = getDateRange(startDate, endDate);

  if (range) {
    filter.paidAt = {
      $gte: range.start,
      $lte: range.end,
    };
  }

  return filter;
}

async function getStaffByIdFromAuth(req, staffId) {
  const cookie = req.headers.cookie || "";

  return authStaffService.getStaffById({
    cookie,
    id: staffId,
  });
}

exports.paySalary = async (req, res) => {
  try {
    const staffId = req.params.id;
    const { amount, paymentMonth, paidAt, note } = req.body;

    if (!staffId) {
      return res.status(400).json({
        message: "Staff ID is required",
      });
    }

    const cleanAmount = normalizeMoney(amount);

    if (cleanAmount <= 0) {
      return res.status(400).json({
        message: "Salary amount must be greater than 0",
      });
    }

    const staff = await getStaffByIdFromAuth(req, staffId);

    if (!staff) {
      return res.status(404).json({
        message: "Staff member not found",
      });
    }

    const record = await StaffExpense.create({
      staffId,
      staffName: staff.fullName || staff.name || "Staff Member",
      role: staff.role || "STAFF",
      baseSalary: Number(staff.salary || 0),
      amount: cleanAmount,
      currency: "LKR",
      expenseType: "Salary Payment",
      deductFromSalary: false,
      paymentMonth: paymentMonth || getColomboMonth(),
      paidAt: parsePaidAt(paidAt),
      note: note || "",
      createdBy: {
        id: req.user?.id || req.user?.sub || "",
        fullName: req.user?.fullName || "",
        role: req.user?.role || "",
      },
    });

    return res.status(201).json({
      message: "Salary payment recorded successfully",
      expense: serializeExpense(record),
      payment: serializeExpense(record),
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Failed to record salary payment",
    });
  }
};

exports.createStaffExpense = async (req, res) => {
  try {
    const staffId = req.params.id;

    const {
      amount,
      expenseType,
      deductFromSalary,
      paymentMonth,
      paidAt,
      note,
    } = req.body;

    if (!staffId) {
      return res.status(400).json({
        message: "Staff ID is required",
      });
    }

    const cleanAmount = normalizeMoney(amount);

    if (cleanAmount <= 0) {
      return res.status(400).json({
        message: "Expense amount must be greater than 0",
      });
    }

    const finalExpenseType = expenseType || "Salary Advance";

    if (!STAFF_EXPENSE_TYPES.includes(finalExpenseType)) {
      return res.status(400).json({
        message: `Invalid expense type. Allowed: ${STAFF_EXPENSE_TYPES.join(
          ", "
        )}`,
      });
    }

    if (finalExpenseType === "Salary Payment") {
      return res.status(400).json({
        message: "Use salary payment action to record salary payments",
      });
    }

    const staff = await getStaffByIdFromAuth(req, staffId);

    if (!staff) {
      return res.status(404).json({
        message: "Staff member not found",
      });
    }

    const record = await StaffExpense.create({
      staffId,
      staffName: staff.fullName || staff.name || "Staff Member",
      role: staff.role || "STAFF",
      baseSalary: Number(staff.salary || 0),
      amount: cleanAmount,
      currency: "LKR",
      expenseType: finalExpenseType,
      deductFromSalary: parseBoolean(
        deductFromSalary,
        finalExpenseType === "Salary Advance"
      ),
      paymentMonth: paymentMonth || getColomboMonth(),
      paidAt: parsePaidAt(paidAt),
      note: note || "",
      createdBy: {
        id: req.user?.id || req.user?.sub || "",
        fullName: req.user?.fullName || "",
        role: req.user?.role || "",
      },
    });

    return res.status(201).json({
      message: "Staff expense recorded successfully",
      expense: serializeExpense(record),
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Failed to record staff expense",
    });
  }
};

exports.listStaffExpenses = async (req, res) => {
  try {
    const filter = buildFilter(req.query);

    if (req.query.onlyExtra === "true") {
      filter.expenseType = { $ne: "Salary Payment" };
    }

    const records = await StaffExpense.find(filter).sort({
      paidAt: -1,
      createdAt: -1,
    });

    return res.json(records.map(serializeExpense));
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to load staff expenses",
    });
  }
};

exports.listSalaryPayments = async (req, res) => {
  try {
    const filter = {
      ...buildFilter(req.query),
      expenseType: "Salary Payment",
    };

    const records = await StaffExpense.find(filter).sort({
      paidAt: -1,
      createdAt: -1,
    });

    return res.json(records.map(serializeExpense));
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to load salary payments",
    });
  }
};

exports.getStaffExpenseSummary = async (req, res) => {
  try {
    const filter = buildFilter(req.query);

    delete filter.expenseType;

    const rows = await StaffExpense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$expenseType",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          totalAmount: -1,
        },
      },
    ]);

    const salaryRow = rows.find((row) => row._id === "Salary Payment");

    const totalSalaryPayments = normalizeMoney(salaryRow?.totalAmount || 0);

    const totalStaffExtraExpenses = normalizeMoney(
      rows
        .filter((row) => row._id !== "Salary Payment")
        .reduce((sum, row) => sum + Number(row.totalAmount || 0), 0)
    );

    const totalStaffExpenses = normalizeMoney(
      totalSalaryPayments + totalStaffExtraExpenses
    );

    const deductibleRows = await StaffExpense.aggregate([
      {
        $match: {
          ...filter,
          deductFromSalary: true,
          expenseType: "Salary Advance",
        },
      },
      {
        $group: {
          _id: null,
          totalDeductibleAdvances: { $sum: "$amount" },
        },
      },
    ]);

    return res.json({
      totalSalaryPayments,
      totalStaffExtraExpenses,
      totalStaffExpenses,
      totalDeductibleAdvances: normalizeMoney(
        deductibleRows[0]?.totalDeductibleAdvances || 0
      ),
      breakdown: rows.map((row) => ({
        expenseType: row._id || "Other",
        totalAmount: normalizeMoney(row.totalAmount),
        count: row.count,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to load staff expense summary",
    });
  }
};

exports.deleteStaffExpense = async (req, res) => {
  try {
    const record = await StaffExpense.findById(req.params.expenseId);

    if (!record) {
      return res.status(404).json({
        message: "Staff expense record not found",
      });
    }

    await StaffExpense.findByIdAndDelete(req.params.expenseId);

    return res.json({
      message: "Staff expense deleted successfully",
      expense: serializeExpense(record),
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to delete staff expense",
    });
  }
};