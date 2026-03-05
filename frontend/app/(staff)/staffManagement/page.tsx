"use client";

import { useEffect, useState } from "react";
import { Plus, ChevronDown, ArrowLeft, Eye, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import DataTable, { Column } from "../../src/components/DataTable";
import AddStaffModal from "./AddStaffModal";
import EditStaffModal from "./EditStaffModal";

import type { Staff } from "../../../app/src/types/staff";
import { getAllStaff } from "../../../app/src/lib/api/staff.api";

type UIStaff = {
  id: string;
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
  image?: string;
};

export default function StaffManagementPage() {
  const router = useRouter();

  const [openAddStaff, setOpenAddStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UIStaff | null>(null);

  const [staffList, setStaffList] = useState<UIStaff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toUIStaff(u: Staff): UIStaff {
    // fallback id if backend _id missing
    const id =
      u._id ||
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`);

    return {
      id,
      name: u.fullName || "",
      role: u.role || "STAFF",
      email: u.email || "",
      phone: u.phone || "",
      dob: u.dob || "",
      salary: u.salary ?? 0,
      startTime: u.shiftStart || "",
      endTime: u.shiftEnd || "",
      address: u.address || "",
      additional: u.additionalDetails || "",
    };
  }

  async function loadStaff() {
    try {
      setLoading(true);
      setError("");

      const list = await getAllStaff();
      const mapped = list.map(toUIStaff);

      setStaffList(mapped);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load staff";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  const staffColumns: Column<UIStaff>[] = [
    { key: "id", label: "ID", render: (r) => `#${r.id.slice(-6)}` },
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
    { key: "email", label: "Email", render: (r) => r.email || "-" },
    { key: "phone", label: "Phone", render: (r) => r.phone || "-" },
    {
      key: "age",
      label: "Age",
      render: (r) => {
        if (!r.dob) return "-";
        const age = Math.floor(
          (Date.now() - new Date(r.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );
        return `${age} yr`;
      },
    },
    {
      key: "salary",
      label: "Salary",
      render: (r) => `$${Number(r.salary || 0).toFixed(2)}`,
    },
    {
      key: "time",
      label: "Timings",
      render: (r) => {
        if (!r.startTime && !r.endTime) return "-";
        return `${r.startTime || ""} to ${r.endTime || ""}`;
      },
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

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-black">
          Staff Management
        </button>

        <button
          onClick={() => router.push("/staffManagement/attendance")}
          className="px-4 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-gray-200"
        >
          Attendance
        </button>
      </div>

      {/* Errors / Loading */}
      {error && <p className="text-red-400 mb-4">{error}</p>}
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <DataTable columns={staffColumns} data={staffList} />
      )}

      {/* Modals */}
      <AddStaffModal
        open={openAddStaff}
        onClose={() => setOpenAddStaff(false)}
        onCreated={() => {
          setOpenAddStaff(false);
          loadStaff();
        }}
      />

      <EditStaffModal
        open={!!editingStaff}
        staff={editingStaff}
        onClose={() => setEditingStaff(null)}
      />
    </main>
  );
}
