const { fetchJson, buildQueryUrl } = require("./httpClient.service");

const STAFF_SERVICE_URL =
  process.env.STAFF_SERVICE_URL || "http://staff-service:5002";

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://order-service:5006";

function getColomboDateString(offsetDays = 0) {
  const now = new Date();
  const targetDate = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(targetDate);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function normalizeDateRange(startDate, endDate) {
  const safeEndDate = endDate || getColomboDateString(0);
  const safeStartDate = startDate || safeEndDate;

  return {
    safeStartDate,
    safeEndDate,
  };
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function roundPercent(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function extractArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.payments)) return payload.payments;
  return [];
}

function staffIdOf(staff) {
  return String(staff._id || staff.id || "").trim();
}

function isOwnerRole(role) {
  return normalizeText(role) === "owner";
}

function isValidOrder(order) {
  return order.orderStatus !== "Cancelled" && order.paymentStatus !== "Cancelled";
}

function getOrderIncome(order) {
  const totalCost = Number(order.totalCost || 0);

  if (Number.isFinite(totalCost) && totalCost > 0) {
    return totalCost;
  }

  return (order.items || []).reduce((sum, item) => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice || item.price || 0);
    const lineTotal =
      Number(item.lineTotal || 0) > 0
        ? Number(item.lineTotal)
        : quantity * unitPrice;

    return sum + lineTotal;
  }, 0);
}

function toDateOnly(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function latestDateValue(items, fieldName) {
  let latest = "";

  for (const item of items || []) {
    const value = item?.[fieldName];

    if (!value) continue;

    const iso = new Date(value).toISOString();

    if (!latest || iso > latest) {
      latest = iso;
    }
  }

  return latest;
}

async function getStaffList(cookie) {
  const payload = await fetchJson(`${STAFF_SERVICE_URL}/api/staff`, {
    headers: cookie ? { Cookie: cookie } : {},
  });

  return extractArray(payload).filter((staff) => !isOwnerRole(staff.role));
}

async function getAttendanceRecords(startDate, endDate, cookie) {
  const url = buildQueryUrl(`${STAFF_SERVICE_URL}/api/staff/attendance-records`, {
    startDate,
    endDate,
  });

  const payload = await fetchJson(url, {
    headers: cookie ? { Cookie: cookie } : {},
  });

  return extractArray(payload);
}

async function getSalaryPayments(startDate, endDate, cookie) {
  const url = buildQueryUrl(`${STAFF_SERVICE_URL}/api/staff/salary-payments`, {
    startDate,
    endDate,
  });

  const payload = await fetchJson(url, {
    headers: cookie ? { Cookie: cookie } : {},
  });

  return extractArray(payload);
}

async function getOrders(startDate, endDate) {
  const url = buildQueryUrl(`${ORDER_SERVICE_URL}/api/orders`, {
    startDate,
    endDate,
    limit: 100000,
  });

  const payload = await fetchJson(url);

  return extractArray(payload);
}

function buildGroupedMap(items, keyGetter) {
  const map = new Map();

  for (const item of items || []) {
    const key = String(keyGetter(item) || "").trim();

    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key).push(item);
  }

  return map;
}

function countAttendance(records = []) {
  const counts = {
    presentDays: 0,
    absentDays: 0,
    halfShiftDays: 0,
    leaveDays: 0,
    markedDays: 0,
    workedDayUnits: 0,
  };

  for (const record of records) {
    const status = String(record.status || "").trim();

    if (!status) continue;

    counts.markedDays += 1;

    if (status === "Present") {
      counts.presentDays += 1;
      counts.workedDayUnits += 1;
    } else if (status === "Absent") {
      counts.absentDays += 1;
    } else if (status === "Half Shift") {
      counts.halfShiftDays += 1;
      counts.workedDayUnits += 0.5;
    } else if (status === "Leave") {
      counts.leaveDays += 1;
    }
  }

  return counts;
}

function buildRows(staffList, attendanceRecords, salaryPayments) {
  const allowedStaffIds = new Set(staffList.map((staff) => staffIdOf(staff)));

  const filteredAttendanceRecords = attendanceRecords.filter((record) =>
    allowedStaffIds.has(String(record.staffId || ""))
  );

  const filteredSalaryPayments = salaryPayments.filter((payment) =>
    allowedStaffIds.has(String(payment.staffId || ""))
  );

  const attendanceMap = buildGroupedMap(
    filteredAttendanceRecords,
    (record) => record.staffId
  );

  const salaryMap = buildGroupedMap(
    filteredSalaryPayments,
    (payment) => payment.staffId
  );

  return staffList.map((staff) => {
    const staffId = staffIdOf(staff);
    const staffAttendance = attendanceMap.get(staffId) || [];
    const staffPayments = salaryMap.get(staffId) || [];

    const attendanceCounts = countAttendance(staffAttendance);

    const totalPaid = staffPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    const registeredSalary = Number(staff.salary || 0);

    const attendanceRate =
      attendanceCounts.markedDays > 0
        ? (attendanceCounts.workedDayUnits / attendanceCounts.markedDays) * 100
        : 0;

    const lastPaymentDate = toDateOnly(latestDateValue(staffPayments, "paidAt"));

    const lastAttendanceDate =
      staffAttendance.length > 0
        ? [...staffAttendance]
            .map((record) => record.date)
            .filter(Boolean)
            .sort()
            .reverse()[0]
        : "";

    return {
      id: staffId,
      staffId,
      fullName: staff.fullName || "",
      email: staff.email || "",
      role: staff.role || "STAFF",
      phone: staff.phone || "",

      registeredSalary: roundMoney(registeredSalary),

      totalPaid: staffPayments.length > 0 ? roundMoney(totalPaid) : 0,
      totalPayment: staffPayments.length > 0 ? roundMoney(totalPaid) : 0,
      paymentStatus: staffPayments.length > 0 ? "Paid" : "No Payment",

      remainingSalary: roundMoney(Math.max(registeredSalary - totalPaid, 0)),

      presentDays: attendanceCounts.presentDays,
      absentDays: attendanceCounts.absentDays,
      halfShiftDays: attendanceCounts.halfShiftDays,
      leaveDays: attendanceCounts.leaveDays,
      markedDays: attendanceCounts.markedDays,
      workedDayUnits: attendanceCounts.workedDayUnits,
      attendanceRate: roundPercent(attendanceRate),

      paymentCount: staffPayments.length,
      lastPaymentDate,
      lastAttendanceDate,
    };
  });
}

function filterRows(rows, { search, role }) {
  const searchText = normalizeText(search);
  const roleText = normalizeText(role);

  return rows.filter((row) => {
    if (roleText && normalizeText(row.role) !== roleText) {
      return false;
    }

    if (!searchText) return true;

    return (
      normalizeText(row.staffId).includes(searchText) ||
      normalizeText(row.fullName).includes(searchText) ||
      normalizeText(row.email).includes(searchText) ||
      normalizeText(row.role).includes(searchText) ||
      normalizeText(row.phone).includes(searchText)
    );
  });
}

function sortRows(rows, sortBy, sortOrder) {
  const direction = sortOrder === "desc" ? -1 : 1;

  return [...rows].sort((a, b) => {
    if (
      [
        "fullName",
        "role",
        "email",
        "lastPaymentDate",
        "lastAttendanceDate",
        "paymentStatus",
      ].includes(sortBy)
    ) {
      return (
        String(a[sortBy] || "").localeCompare(String(b[sortBy] || "")) *
        direction
      );
    }

    const aValue = Number(a[sortBy] || 0);
    const bValue = Number(b[sortBy] || 0);

    return (aValue - bValue) * direction;
  });
}

function calculateTotalIncome(orders) {
  return roundMoney(
    (orders || [])
      .filter(isValidOrder)
      .reduce((sum, order) => sum + getOrderIncome(order), 0)
  );
}

function buildSummary(rows, orders) {
  const totalIncome = calculateTotalIncome(orders);

  const summary = rows.reduce(
    (acc, row) => {
      acc.totalStaff += 1;
      acc.totalRegisteredSalary += Number(row.registeredSalary || 0);

      acc.totalSalaryPaid += Number(row.totalPayment || 0);
      acc.totalStaffExpenses += Number(row.totalPayment || 0);

      acc.totalRemainingSalary += Number(row.remainingSalary || 0);

      acc.totalPresentDays += Number(row.presentDays || 0);
      acc.totalAbsentDays += Number(row.absentDays || 0);
      acc.totalHalfShiftDays += Number(row.halfShiftDays || 0);
      acc.totalLeaveDays += Number(row.leaveDays || 0);
      acc.totalMarkedDays += Number(row.markedDays || 0);
      acc.totalWorkedDayUnits += Number(row.workedDayUnits || 0);

      if (Number(row.paymentCount || 0) > 0) {
        acc.staffWithPayments += 1;
      } else {
        acc.unpaidStaff += 1;
      }

      return acc;
    },
    {
      totalStaff: 0,
      totalRegisteredSalary: 0,
      totalSalaryPaid: 0,
      totalStaffExpenses: 0,
      totalRemainingSalary: 0,
      totalPresentDays: 0,
      totalAbsentDays: 0,
      totalHalfShiftDays: 0,
      totalLeaveDays: 0,
      totalMarkedDays: 0,
      totalWorkedDayUnits: 0,
      averageAttendanceRate: 0,
      staffWithPayments: 0,
      unpaidStaff: 0,
    }
  );

  summary.averageAttendanceRate =
    summary.totalMarkedDays > 0
      ? roundPercent((summary.totalWorkedDayUnits / summary.totalMarkedDays) * 100)
      : 0;

  summary.totalRegisteredSalary = roundMoney(summary.totalRegisteredSalary);
  summary.totalSalaryPaid = roundMoney(summary.totalSalaryPaid);
  summary.totalStaffExpenses = roundMoney(summary.totalStaffExpenses);
  summary.totalRemainingSalary = roundMoney(summary.totalRemainingSalary);

  summary.totalIncome = totalIncome;
  summary.netAfterStaffExpenses = roundMoney(
    totalIncome - summary.totalStaffExpenses
  );
  summary.staffExpenseRate =
    totalIncome > 0
      ? roundPercent((summary.totalStaffExpenses / totalIncome) * 100)
      : 0;

  return summary;
}

function buildFilterOptions(staffList) {
  const roles = new Set();

  for (const staff of staffList || []) {
    if (staff.role && !isOwnerRole(staff.role)) {
      roles.add(staff.role);
    }
  }

  return {
    roles: Array.from(roles).sort(),
  };
}

async function buildStaffReport({
  startDate,
  endDate,
  search = "",
  sortBy = "fullName",
  sortOrder = "asc",
  role = "",
  cookie = "",
}) {
  const { safeStartDate, safeEndDate } = normalizeDateRange(startDate, endDate);

  const warnings = [];

  let staffList = [];
  let attendanceRecords = [];
  let salaryPayments = [];
  let orders = [];

  try {
    [staffList, attendanceRecords, salaryPayments, orders] = await Promise.all([
      getStaffList(cookie),
      getAttendanceRecords(safeStartDate, safeEndDate, cookie),
      getSalaryPayments(safeStartDate, safeEndDate, cookie),
      getOrders(safeStartDate, safeEndDate),
    ]);
  } catch (error) {
    warnings.push(error.message);
  }

  const allRows = buildRows(staffList, attendanceRecords, salaryPayments);

  const filteredRows = filterRows(allRows, {
    search,
    role,
  });

  const sortedRows = sortRows(filteredRows, sortBy, sortOrder);
  const summary = buildSummary(sortedRows, orders);
  const filterOptions = buildFilterOptions(staffList);

  return {
    success: true,
    filters: {
      startDate: safeStartDate,
      endDate: safeEndDate,
      search,
      sortBy,
      sortOrder,
      role,
    },
    summary,
    filterOptions,
    warnings,
    data: sortedRows,
  };
}

module.exports = {
  buildStaffReport,
};