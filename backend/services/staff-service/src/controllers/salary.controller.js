const SalaryPayment = require("../models/salaryPayment.model");
const authStaffService = require("../services/authStaff.service");

function currentMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function normalizeMonth(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}$/.test(value)) {
    return value;
  }

  return currentMonthString();
}

function normalizeDateString(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return "";
}

function startOfDate(dateString) {
  return new Date(`${dateString}T00:00:00.000Z`);
}

function endOfDate(dateString) {
  return new Date(`${dateString}T23:59:59.999Z`);
}

function serializePayment(payment) {
  return {
    id: String(payment._id),
    _id: String(payment._id),
    staffId: payment.staffId,
    staffName: payment.staffName || "",
    role: payment.role || "STAFF",
    baseSalary: Number(payment.baseSalary || 0),
    amount: Number(payment.amount || 0),
    currency: payment.currency || "LKR",
    paymentMonth: payment.paymentMonth,
    paidAt: payment.paidAt,
    note: payment.note || "",
    paidBy: payment.paidBy || null,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

exports.paySalary = async (req, res) => {
  try {
    const cookie = req.headers.cookie || "";
    const staffId = req.params.id;

    const amount = Number(req.body.amount || 0);
    const paymentMonth = normalizeMonth(req.body.paymentMonth);
    const paidAt = req.body.paidAt ? new Date(req.body.paidAt) : new Date();
    const note = req.body.note || "";

    if (!staffId) {
      return res.status(400).json({ message: "staffId is required" });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Salary amount must be greater than 0",
      });
    }

    const staff = await authStaffService.getStaffById({ cookie, id: staffId });

    const payment = await SalaryPayment.create({
      staffId: String(staffId),
      staffName: staff.fullName || "",
      role: staff.role || "STAFF",
      baseSalary: Number(staff.salary || 0),
      amount,
      currency: "LKR",
      paymentMonth,
      paidAt,
      note,
      paidBy: {
        id: req.user?.id || req.user?._id || "",
        fullName: req.user?.fullName || "",
        role: req.user?.role || "",
      },
    });

    return res.status(201).json({
      message: "Salary payment recorded",
      payment: serializePayment(payment),
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to pay salary",
    });
  }
};

exports.listSalaryPayments = async (req, res) => {
  try {
    const query = {};

    if (req.query.staffId) {
      query.staffId = String(req.query.staffId);
    }

    const startDate = normalizeDateString(req.query.startDate);
    const endDate = normalizeDateString(req.query.endDate);

    if (startDate && endDate) {
      query.paidAt = {
        $gte: startOfDate(startDate),
        $lte: endOfDate(endDate),
      };
    }

    const payments = await SalaryPayment.find(query)
      .sort({ paidAt: -1, createdAt: -1 })
      .limit(10000)
      .lean();

    return res.json(payments.map(serializePayment));
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to load salary payments",
    });
  }
};