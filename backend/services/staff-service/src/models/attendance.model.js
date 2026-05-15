const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      required: true,
      index: true,
    },

    staffName: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      default: "STAFF",
      trim: true,
    },

    date: {
      type: String,
      required: true,
      index: true,
    },

    shiftStart: {
      type: String,
      default: "",
      trim: true,
    },

    shiftEnd: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Present", "Absent", "Half Shift", "Leave"],
      required: true,
    },

    markedAt: {
      type: Date,
      default: Date.now,
    },

    markedBy: {
      id: { type: String, default: "" },
      fullName: { type: String, default: "" },
      role: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);