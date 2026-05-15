const Attendance = require("../models/attendance.model");
const authStaffService = require("../services/authStaff.service");

const VALID_STATUSES = ["Present", "Absent", "Half Shift", "Leave"];

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

function normalizeDate(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return getColomboDateString(0);
}

function staffIdOf(staff) {
  return String(staff._id || staff.id || "");
}

function buildAttendancePageRow(staff, record, date) {
  return {
    id: record ? String(record._id) : "",
    staffId: staffIdOf(staff),
    fullName: staff.fullName || "",
    role: staff.role || "STAFF",
    date,
    shiftStart: staff.shiftStart || "",
    shiftEnd: staff.shiftEnd || "",
    status: record?.status || "",
    markedAt: record?.markedAt || null,
    markedBy: record?.markedBy || null,
  };
}

function serializeRecord(record) {
  return {
    id: String(record._id),
    _id: String(record._id),
    staffId: record.staffId,
    staffName: record.staffName || "",
    fullName: record.staffName || "",
    role: record.role || "STAFF",
    date: record.date,
    shiftStart: record.shiftStart || "",
    shiftEnd: record.shiftEnd || "",
    status: record.status,
    markedAt: record.markedAt,
    markedBy: record.markedBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

exports.getAttendance = async (req, res) => {
  try {
    const cookie = req.headers.cookie || "";
    const date = normalizeDate(req.query.date);

    const staffList = await authStaffService.getStaffList({ cookie });
    const records = await Attendance.find({ date });

    const recordMap = new Map(
      records.map((record) => [String(record.staffId), record])
    );

    const rows = staffList.map((staff) => {
      const staffId = staffIdOf(staff);
      return buildAttendancePageRow(staff, recordMap.get(staffId), date);
    });

    return res.json(rows);
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to load attendance",
    });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    const cookie = req.headers.cookie || "";
    const { staffId, date, status, shiftStart, shiftEnd } = req.body;

    if (!staffId) {
      return res.status(400).json({ message: "staffId is required" });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const attendanceDate = normalizeDate(date);
    const staff = await authStaffService.getStaffById({ cookie, id: staffId });

    const record = await Attendance.findOneAndUpdate(
      {
        staffId: String(staffId),
        date: attendanceDate,
      },
      {
        staffId: String(staffId),
        staffName: staff.fullName || "",
        role: staff.role || "STAFF",
        date: attendanceDate,
        shiftStart: shiftStart ?? staff.shiftStart ?? "",
        shiftEnd: shiftEnd ?? staff.shiftEnd ?? "",
        status,
        markedAt: new Date(),
        markedBy: {
          id: req.user?.id || req.user?._id || "",
          fullName: req.user?.fullName || "",
          role: req.user?.role || "",
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.json({
      id: String(record._id),
      staffId: record.staffId,
      fullName: record.staffName,
      role: record.role,
      date: record.date,
      shiftStart: record.shiftStart,
      shiftEnd: record.shiftEnd,
      status: record.status,
      markedAt: record.markedAt,
      markedBy: record.markedBy,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Failed to update attendance",
    });
  }
};

exports.getAttendanceRecords = async (req, res) => {
  try {
    const startDate = normalizeDate(req.query.startDate);
    const endDate = normalizeDate(req.query.endDate || req.query.startDate);

    const records = await Attendance.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ date: -1, staffName: 1 })
      .lean();

    return res.json(records.map(serializeRecord));
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to load attendance records",
    });
  }
};