"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  ChevronDown,
  ArrowLeft,
  Eye,
  Pencil,
  Trash2,
  Banknote,
} from "lucide-react";
import { useRouter } from "next/navigation";

import DataTable, { Column } from "../../src/components/DataTable";
import AddStaffModal from "./AddStaffModal";
import EditStaffModal from "./EditStaffModal";
import PaySalaryModal from "./PaySalaryModal";

import type { Staff } from "../../src/types/staff";
import { getAllStaff } from "../../src/lib/api/staff.api";
import { verify } from "../../src/lib/auth";

const STAFF_PANEL_ROLES = ["OWNER", "MANAGER"];

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

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function StaffManagementPage() {
  const router = useRouter();

  const [openAddStaff, setOpenAddStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UIStaff | null>(null);
  const [payingStaff, setPayingStaff] = useState<UIStaff | null>(null);

  const [staffList, setStaffList] = useState<UIStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allowed, setAllowed] = useState(false);
  const [success, setSuccess] = useState("");

  function toUIStaff(u: Staff): UIStaff {
    const id = u._id || u.id || "";

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
      setStaffList(list.map(toUIStaff));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load staff";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError("");

        const data = await verify();

        if (!STAFF_PANEL_ROLES.includes(data?.user?.role)) {
          router.replace("/login");
          return;
        }

        setAllowed(true);
        await loadStaff();
      } catch {
        router.replace("/login");
      }
    }

    init();
  }, [router]);

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
          (Date.now() - new Date(r.dob).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        );

        return `${age} yr`;
      },
    },
    {
      key: "salary",
      label: "Salary",
      render: (r) => formatLkr(r.salary),
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
            className="text-primary hover:opacity-80"
            title="View staff"
          >
            <Eye size={16} />
          </button>

          <button
            onClick={() => setEditingStaff(row)}
            className="text-gray-400 hover:text-white"
            title="Edit staff"
          >
            <Pencil size={16} />
          </button>

          <button
            onClick={() => setPayingStaff(row)}
            className="text-green-400 hover:text-green-300"
            title="Pay salary"
          >
            <Banknote size={16} />
          </button>

          <button className="text-red-500 hover:text-red-400" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (!allowed && loading) {
    return (
      <main className="flex-1 p-8">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  if (!allowed) return null;

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

      {error && <p className="text-red-400 mb-4">{error}</p>}
      {success && <p className="text-green-400 mb-4">{success}</p>}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <DataTable columns={staffColumns} data={staffList} />
      )}

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

      <PaySalaryModal
        open={!!payingStaff}
        staff={payingStaff}
        onClose={() => setPayingStaff(null)}
        onPaid={() => {
          setSuccess("Salary payment recorded successfully");
          setPayingStaff(null);
        }}
      />
    </main>
  );
}