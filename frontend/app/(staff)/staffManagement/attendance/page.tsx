"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, Plus, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import DataTable, { Column } from "../../../src/components/DataTable";
import AddStaffModal from "../AddStaffModal";

import type {
  AttendanceStatus,
  StaffAttendance,
} from "../../../src/types/staff";
import {
  getAttendanceByDate,
  updateStaffAttendance,
} from "../../../src/lib/api/staff.api";

type AttendanceRow = {
  staffId: string;
  fullName: string;
  role: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  status: AttendanceStatus | "";
};

const STATUS_OPTIONS: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Half Shift",
  "Leave",
];

function todayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

function statusClass(status: AttendanceStatus | "") {
  if (status === "Present") return "bg-primary text-black";
  if (status === "Absent") return "bg-yellow-400 text-black";
  if (status === "Half Shift") return "bg-cyan-400 text-black";
  if (status === "Leave") return "bg-red-500 text-black";
  return "bg-bg-2 text-gray-300";
}

export default function AttendancePage() {
  const router = useRouter();

  const [openAddStaff, setOpenAddStaff] = useState(false);
  const [date, setDate] = useState(todayDateString());
  const [attendanceList, setAttendanceList] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  function toRow(item: StaffAttendance): AttendanceRow {
    return {
      staffId: item.staffId,
      fullName: item.fullName || "",
      role: item.role || "STAFF",
      date: item.date,
      shiftStart: item.shiftStart || "",
      shiftEnd: item.shiftEnd || "",
      status: item.status || "",
    };
  }

  async function loadAttendance(selectedDate = date) {
    try {
      setLoading(true);
      setError("");

      const list = await getAttendanceByDate(selectedDate);
      setAttendanceList(list.map(toRow));
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to load attendance";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(
    row: AttendanceRow,
    status: AttendanceStatus
  ) {
    try {
      setSavingId(row.staffId);
      setError("");

      const updated = await updateStaffAttendance({
        staffId: row.staffId,
        date,
        status,
        shiftStart: row.shiftStart,
        shiftEnd: row.shiftEnd,
      });

      setAttendanceList((prev) =>
        prev.map((item) =>
          item.staffId === row.staffId ? toRow(updated) : item
        )
      );
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to update attendance";
      setError(message);
    } finally {
      setSavingId("");
    }
  }

  useEffect(() => {
    loadAttendance(date);
  }, [date]);

  const columns: Column<AttendanceRow>[] = [
    {
      key: "staffId",
      label: "ID",
      render: (r) => `#${r.staffId.slice(-6)}`,
    },
    {
      key: "fullName",
      label: "Name",
      render: (r) => (
        <div>
          <p className="font-medium text-white">{r.fullName}</p>
          <p className="text-xs text-primary">{r.role}</p>
        </div>
      ),
    },
    { key: "date", label: "Date" },
    {
      key: "time",
      label: "Timings",
      render: (r) => {
        if (!r.shiftStart && !r.shiftEnd) return "-";
        return `${r.shiftStart || ""} to ${r.shiftEnd || ""}`;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <select
          value={r.status}
          disabled={savingId === r.staffId}
          onChange={(e) => {
            const value = e.target.value as AttendanceStatus | "";
            if (!value) return;
            handleStatusChange(r, value);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-medium outline-none cursor-pointer disabled:opacity-60 ${statusClass(
            r.status
          )}`}
        >
          <option value="">Not Marked</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <main className="flex-1 p-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-bg-2 hover:bg-bg-1"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-h4 font-semibold">Staff Management</h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-h5 font-medium">
          Attendance{" "}
          <span className="text-gray-400">({attendanceList.length})</span>
        </h2>

        <div className="flex gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 rounded-lg bg-bg-2 text-white text-sm outline-none"
          />

          <button
            onClick={() => loadAttendance(date)}
            className="flex items-center gap-2 px-4 py-2 bg-bg-2 rounded-lg text-sm hover:bg-bg-1"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>

          <button
            onClick={() => setOpenAddStaff(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg"
          >
            <Plus size={18} />
            Add Staff
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-bg-2 rounded-lg text-sm">
            Sort by <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => router.push("/staffManagement")}
          className="px-4 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-gray-200"
        >
          Staff Management
        </button>

        <button className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-black">
          Attendance
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-400">Loading attendance...</p>
      ) : (
        <DataTable columns={columns} data={attendanceList} />
      )}

      <AddStaffModal
        open={openAddStaff}
        onClose={() => setOpenAddStaff(false)}
        onCreated={() => {
          setOpenAddStaff(false);
          loadAttendance(date);
        }}
      />
    </main>
  );
}