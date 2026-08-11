"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Plus,
  RefreshCcw,
  UserCheck,
  UserX,
} from "lucide-react";
import { useRouter } from "next/navigation";

import AddStaffModal from "../AddStaffModal";
import type {
  AttendanceStatus,
  Staff,
  StaffAttendance,
  StaffRole,
} from "../../../src/types/staff";
import {
  getAllStaff,
  getAttendanceByDate,
  getStaffImageSrc,
  updateStaffAttendance,
} from "../../../src/lib/api/staff.api";
import { verify } from "../../../src/lib/auth";

const STAFF_PANEL_ROLES = ["OWNER", "MANAGER"];

const ATTENDANCE_OPTIONS: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Half Shift",
  "Leave",
];

function getColomboDateString() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function staffIdOf(staff: Staff) {
  return staff._id || staff.id || "";
}

function getAttendanceKey(record: StaffAttendance) {
  return record._id || record.id || record.staffId;
}

function getStatusBadgeClass(status?: AttendanceStatus | "") {
  if (status === "Present") {
    return "bg-green-500/10 text-green-400 border-green-500/30";
  }

  if (status === "Absent") {
    return "bg-red-500/10 text-red-400 border-red-500/30";
  }

  if (status === "Half Shift") {
    return "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
  }

  if (status === "Leave") {
    return "bg-blue-500/10 text-blue-300 border-blue-500/30";
  }

  return "bg-gray-500/10 text-gray-400 border-gray-500/30";
}

export default function AttendancePage() {
  const router = useRouter();

  const [openAddStaff, setOpenAddStaff] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<StaffRole>("STAFF");

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendanceList, setAttendanceList] = useState<StaffAttendance[]>([]);

  const [selectedDate, setSelectedDate] = useState(getColomboDateString());

  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingStaffId, setSavingStaffId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const staffImageMap = useMemo(() => {
    const map = new Map<string, string>();

    staffList.forEach((staff) => {
      const id = staffIdOf(staff);
      if (id) {
        map.set(id, staff.image || "");
      }
    });

    return map;
  }, [staffList]);

  const totalStaff = attendanceList.length;

  const presentCount = attendanceList.filter(
    (item) => item.status === "Present"
  ).length;

  const absentCount = attendanceList.filter(
    (item) => item.status === "Absent"
  ).length;

  const leaveCount = attendanceList.filter(
    (item) => item.status === "Leave"
  ).length;

  const halfShiftCount = attendanceList.filter(
    (item) => item.status === "Half Shift"
  ).length;

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [staffData, attendanceData] = await Promise.all([
        getAllStaff(),
        getAttendanceByDate(selectedDate),
      ]);

      setStaffList(staffData);
      setAttendanceList(attendanceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(
    record: StaffAttendance,
    status: AttendanceStatus
  ) {
    try {
      setSavingStaffId(record.staffId);
      setError("");
      setSuccess("");

      const updated = await updateStaffAttendance({
        staffId: record.staffId,
        date: selectedDate,
        status,
        shiftStart: record.shiftStart,
        shiftEnd: record.shiftEnd,
      });

      setAttendanceList((prev) =>
        prev.map((item) =>
          item.staffId === record.staffId
            ? {
                ...item,
                ...updated,
                status: updated.status || status,
              }
            : item
        )
      );

      setSuccess("Attendance updated successfully");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update attendance"
      );
    } finally {
      setSavingStaffId("");
    }
  }

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError("");

        const data = await verify();
        const role = data?.user?.role as StaffRole;

        if (!STAFF_PANEL_ROLES.includes(role)) {
          router.replace("/login");
          return;
        }

        setCurrentUserRole(role);
        setAllowed(true);
      } catch {
        router.replace("/login");
      }
    }

    init();
  }, [router]);

  useEffect(() => {
    if (allowed) {
      loadData();
    }
  }, [allowed, selectedDate]);

  if (!allowed && loading) {
    return (
      <main className="flex-1 p-8">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  if (!allowed) return null;

  return (
    <main className="flex-1 p-8 bg-bg-1 text-white min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-bg-2 hover:bg-bg-1"
          type="button"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <h1 className="text-h4 font-semibold">Staff Attendance</h1>
          <p className="text-sm text-gray-400">
            Mark and review daily staff attendance records.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center gap-4 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/staffManagement")}
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-gray-200"
            type="button"
          >
            Staff Management
          </button>

          <button
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-black"
            type="button"
          >
            Attendance
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setOpenAddStaff(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg"
            type="button"
          >
            <Plus size={18} />
            Add Staff
          </button>

          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-bg-2 rounded-lg text-sm"
            type="button"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <SummaryCard
          title="Total Staff"
          value={totalStaff}
          icon={<UserCheck size={20} />}
        />

        <SummaryCard
          title="Present"
          value={presentCount}
          icon={<CheckCircle2 size={20} />}
        />

        <SummaryCard
          title="Absent"
          value={absentCount}
          icon={<UserX size={20} />}
        />

        <SummaryCard
          title="Half Shift"
          value={halfShiftCount}
          icon={<Clock size={20} />}
        />

        <SummaryCard
          title="Leave"
          value={leaveCount}
          icon={<CalendarDays size={20} />}
        />
      </div>

      <div className="bg-bg-2 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Attendance Records
          </h2>
          <p className="text-sm text-gray-400">
            Select date and update staff status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="bg-bg-1 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-300 rounded-lg px-4 py-3 mb-4">
          {success}
        </div>
      )}

      <div className="bg-bg-2 rounded-xl overflow-hidden border border-white/10">
        {loading ? (
          <div className="p-10 text-center text-gray-400">
            Loading attendance...
          </div>
        ) : attendanceList.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-white font-semibold">No attendance records</p>
            <p className="text-gray-400 text-sm mt-2">
              Add staff members or refresh the selected date.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-1 text-gray-400">
                <tr>
                  <th className="text-left p-4">Staff</th>
                  <th className="text-left p-4">Role</th>
                  <th className="text-left p-4">Shift</th>
                  <th className="text-left p-4">Current Status</th>
                  <th className="text-left p-4">Update Status</th>
                  <th className="text-left p-4">Marked At</th>
                </tr>
              </thead>

              <tbody>
                {attendanceList.map((record) => {
                  const image = staffImageMap.get(record.staffId) || "";
                  const saving = savingStaffId === record.staffId;

                  return (
                    <tr
                      key={getAttendanceKey(record)}
                      className="border-t border-white/10 hover:bg-white/[0.02]"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getStaffImageSrc(image)}
                            alt={record.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                            onError={(event) => {
                              event.currentTarget.src = "/AddImage.png";
                            }}
                          />

                          <div>
                            <p className="text-white font-medium">
                              {record.fullName}
                            </p>
                            <p className="text-xs text-gray-500">
                              #{record.staffId.slice(-6)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-gray-300">{record.role}</td>

                      <td className="p-4 text-gray-300">
                        {record.shiftStart || "-"} to {record.shiftEnd || "-"}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full border text-xs font-medium ${getStatusBadgeClass(
                            record.status
                          )}`}
                        >
                          {record.status || "Not Marked"}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="relative inline-flex items-center">
                          <select
                            value={record.status || ""}
                            disabled={saving}
                            onChange={(event) =>
                              handleStatusChange(
                                record,
                                event.target.value as AttendanceStatus
                              )
                            }
                            className="appearance-none bg-bg-1 border border-white/10 rounded-lg px-4 py-2 pr-9 text-white outline-none disabled:opacity-60"
                          >
                            <option value="" disabled>
                              Select status
                            </option>

                            {ATTENDANCE_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>

                          <ChevronDown
                            size={14}
                            className="absolute right-3 text-gray-400 pointer-events-none"
                          />
                        </div>
                      </td>

                      <td className="p-4 text-gray-400">
                        {record.markedAt
                          ? new Date(record.markedAt).toLocaleString("en-LK", {
                              timeZone: "Asia/Colombo",
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddStaffModal
        open={openAddStaff}
        currentUserRole={currentUserRole}
        onClose={() => setOpenAddStaff(false)}
        onCreated={() => {
          setOpenAddStaff(false);
          setSuccess("Staff member created successfully");
          loadData();
        }}
      />
    </main>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-bg-2 rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-400">{title}</p>
        <div className="text-primary">{icon}</div>
      </div>

      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}