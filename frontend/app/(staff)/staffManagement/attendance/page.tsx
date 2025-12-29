"use client";

import { useState } from "react";
import { ArrowLeft, ChevronDown, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import DataTable, { Column } from "../../../src/components/DataTable";
import AddStaffModal from "../AddStaffModal";

type AttendanceStatus = "Present" | "Absent" | "Half Shift" | "Leave";

type Attendance = {
  id: number;
  name: string;
  role: string;
  date: string;
  time: string;
  status?: AttendanceStatus;
};

export default function AttendancePage() {
  const router = useRouter();
  const [openAddStaff, setOpenAddStaff] = useState(false);

  const attendanceList: Attendance[] = Array.from({ length: 22 }).map(
    (_, i) => ({
      id: 101 + i,
      name: "Watson Joyce",
      role: "Manager",
      date: "16 Apr 2024",
      time: "9am to 6pm",
      status:
        i % 4 === 0
          ? "Present"
          : i % 4 === 1
          ? "Absent"
          : i % 4 === 2
          ? "Half Shift"
          : "Leave",
    })
  );

  const columns: Column<Attendance>[] = [
    { key: "id", label: "ID", render: (r) => `#${r.id}` },
    {
      key: "name",
      label: "Name",
      render: (r) => (
        <div>
          <p className="font-medium">{r.name}</p>
          <p className="text-xs text-primary">{r.role}</p>
        </div>
      ),
    },
    { key: "date", label: "Date" },
    { key: "time", label: "Timings" },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium
            ${
              r.status === "Present"
                ? "bg-primary text-black"
                : r.status === "Absent"
                ? "bg-yellow-400 text-black"
                : r.status === "Half Shift"
                ? "bg-cyan-400 text-black"
                : "bg-red-500 text-black"
            }`}
        >
          {r.status}
          <Pencil size={12} />
        </button>
      ),
    },
  ];

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-bg-2 hover:bg-bg-1"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-h4 font-semibold">Staff Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-6 border-b border-gray-800">
        <button
          onClick={() => router.push("/staffManagement")}
          className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-300"
        >
          Staff Management
        </button>

        <button className="relative pb-3 text-sm font-medium text-white">
          Attendance
          <span className="absolute left-0 right-0 bottom-0 h-1 bg-primary rounded-t-md" />
        </button>
      </div>

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-h5 font-medium">
          Staff <span className="text-gray-400">(22)</span>
        </h2>

        <div className="flex gap-3">
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

      <DataTable columns={columns} data={attendanceList} />

      <AddStaffModal
        open={openAddStaff}
        onClose={() => setOpenAddStaff(false)}
      />
    </main>
  );
}
