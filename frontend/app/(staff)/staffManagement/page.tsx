"use client";

import { useState } from "react";
import {
  Plus,
  ChevronDown,
  ArrowLeft,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import DataTable, { Column } from "../../src/components/DataTable";
import AddStaffModal from "./AddStaffModal";
import EditStaffModal from "./EditStaffModal";

type Staff = {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  dob: string;
  salary: number;
  startTime: string;
  endTime: string;
  address: string;
  additional: string;
};

export default function StaffManagementPage() {
  const router = useRouter();
  const [openAddStaff, setOpenAddStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const staffList: Staff[] = Array.from({ length: 22 }).map((_, i) => ({
    id: 101 + i,
    name: "Watson Joyce",
    role: "Manager",
    email: "watsonjoyce112@gmail.com",
    phone: "+1 (123) 123 4654",
    dob: "1980-01-01",
    salary: 2200,
    startTime: "9am",
    endTime: "6pm",
    address: "",
    additional: "",
  }));

  const staffColumns: Column<Staff>[] = [
    { key: "id", label: "ID", render: (r) => `#${r.id}` },
    {
      key: "name",
      label: "Name",
      render: (r) => (
        <div>
          <p className="font-medium text-white">{r.name}</p>
          <p className="text-xs text-primary">{r.role}</p>
        </div>
      ),
    },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    {
      key: "age",
      label: "Age",
      render: (r) =>
        `${Math.floor(
          (Date.now() - new Date(r.dob).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )} yr`,
    },
    {
      key: "salary",
      label: "Salary",
      render: (r) => `$${r.salary.toFixed(2)}`,
    },
    {
      key: "time",
      label: "Timings",
      render: (r) => `${r.startTime} to ${r.endTime}`,
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.push(`/staffManagement/${row.id}`)}
            className="text-primary"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => setEditingStaff(row)}
            className="text-gray-400 hover:text-white"
          >
            <Pencil size={16} />
          </button>
          <button className="text-red-500">
            <Trash2 size={16} />
          </button>
        </div>
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
        <button className="relative pb-3 text-sm font-medium text-white">
          Staff Management
          <span className="absolute left-0 right-0 bottom-0 h-1 bg-primary rounded-t-md" />
        </button>

        <button
          onClick={() => router.push("/staffManagement/attendance")}
          className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-300"
        >
          Attendance
        </button>
      </div>

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-h5 font-medium">
          Staff <span className="text-gray-400">({staffList.length})</span>
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

      <DataTable columns={staffColumns} data={staffList} />

      {/* Modals */}
      <AddStaffModal open={openAddStaff} onClose={() => setOpenAddStaff(false)} />
      <EditStaffModal
        open={!!editingStaff}
        staff={editingStaff}
        onClose={() => setEditingStaff(null)}
      />
    </main>
  );
}
