/* eslint-disable @next/next/no-img-element */
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
  HandCoins,
} from "lucide-react";
import { useRouter } from "next/navigation";

import DataTable, { Column } from "../../src/components/DataTable";
import AddStaffModal from "./AddStaffModal";
import EditStaffModal from "./EditStaffModal";
import PaySalaryModal from "./PaySalaryModal";
import AddStaffExpenseModal from "./AddStaffExpenseModal";

import type { Staff, StaffRole } from "../../src/types/staff";
import {
  deleteStaff,
  getAllStaff,
  getStaffImageSrc,
} from "../../src/lib/api/staff.api";
import { verify } from "../../src/lib/auth";

const STAFF_PANEL_ROLES = ["OWNER", "MANAGER"];

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function staffIdOf(staff: Staff) {
  return staff._id || staff.id || "";
}

function isProtectedRole(role?: string) {
  return role === "OWNER" || role === "MANAGER";
}

export default function StaffManagementPage() {
  const router = useRouter();

  const [openAddStaff, setOpenAddStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [payingStaff, setPayingStaff] = useState<Staff | null>(null);
  const [expenseStaff, setExpenseStaff] = useState<Staff | null>(null);

  const [currentUserRole, setCurrentUserRole] = useState<StaffRole>("STAFF");
  const [currentUserId, setCurrentUserId] = useState("");

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isOwner = currentUserRole === "OWNER";
  const isManager = currentUserRole === "MANAGER";

  function canManageStaff(staff: Staff) {
    if (isOwner) return true;
    if (isManager && isProtectedRole(staff.role)) return false;
    return true;
  }

  async function loadStaff() {
    try {
      setLoading(true);
      setError("");

      const list = await getAllStaff();
      setStaffList(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteStaff(staff: Staff) {
    const id = staffIdOf(staff);

    if (!id) {
      setError("Staff ID is missing");
      return;
    }

    if (!canManageStaff(staff)) {
      setError("Managers cannot delete Owner or Manager staff accounts");
      return;
    }

    if (id === currentUserId) {
      setError("You cannot delete your own account");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${staff.fullName}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteStaff(id);

      setSuccess("Staff member deleted successfully");
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete staff");
    }
  }

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError("");

        const data = await verify();
        const role = data?.user?.role as StaffRole;
        const id = data?.user?.id || "";

        if (!STAFF_PANEL_ROLES.includes(role)) {
          router.replace("/login");
          return;
        }

        setCurrentUserRole(role);
        setCurrentUserId(id);
        setAllowed(true);

        await loadStaff();
      } catch {
        router.replace("/login");
      }
    }

    init();
  }, [router]);

  const staffColumns: Column<Staff>[] = [
    {
      key: "id",
      label: "ID",
      render: (staff) => `#${staffIdOf(staff).slice(-6)}`,
    },
    {
      key: "name",
      label: "Name",
      render: (staff) => (
        <div className="flex items-center gap-3">
          <img
            src={getStaffImageSrc(staff.image)}
            alt={staff.fullName}
            className="w-11 h-11 rounded-full object-cover border border-white/10 bg-bg-1"
            onError={(event) => {
              event.currentTarget.src = "/AddImage.png";
            }}
          />

          <div className="min-w-0">
            <p className="font-medium text-white truncate">
              {staff.fullName}
            </p>
            <p className="text-xs text-primary">{staff.role}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (staff) => staff.email || "-",
    },
    {
      key: "phone",
      label: "Phone",
      render: (staff) => staff.phone || "-",
    },
    {
      key: "age",
      label: "Age",
      render: (staff) => {
        if (!staff.dob) return "-";

        const age = Math.floor(
          (Date.now() - new Date(staff.dob).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        );

        return `${age} yr`;
      },
    },
    {
      key: "salary",
      label: "Salary",
      render: (staff) => formatLkr(staff.salary || 0),
    },
    {
      key: "time",
      label: "Timings",
      render: (staff) => {
        if (!staff.shiftStart && !staff.shiftEnd) return "-";
        return `${staff.shiftStart || "-"} to ${staff.shiftEnd || "-"}`;
      },
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (staff) => {
        const canManage = canManageStaff(staff);

        return (
          <div className="flex justify-end gap-3">
            <button
              onClick={() =>
                router.push(`/staffManagement/${staffIdOf(staff)}`)
              }
              className="text-primary hover:opacity-80"
              title="View staff"
              type="button"
            >
              <Eye size={16} />
            </button>

            {canManage && (
              <>
                <button
                  onClick={() => setEditingStaff(staff)}
                  className="text-gray-400 hover:text-white"
                  title="Edit staff"
                  type="button"
                >
                  <Pencil size={16} />
                </button>

                <button
                  onClick={() => setPayingStaff(staff)}
                  className="text-green-400 hover:text-green-300"
                  title="Pay salary"
                  type="button"
                >
                  <Banknote size={16} />
                </button>

                <button
                  onClick={() => setExpenseStaff(staff)}
                  className="text-yellow-400 hover:text-yellow-300"
                  title="Add staff expense / advance"
                  type="button"
                >
                  <HandCoins size={16} />
                </button>

                <button
                  onClick={() => handleDeleteStaff(staff)}
                  className="text-red-500 hover:text-red-400"
                  title="Delete"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        );
      },
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
          type="button"
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
            type="button"
          >
            <Plus size={18} />
            Add Staff
          </button>

          <button
            className="flex items-center gap-2 px-4 py-2 bg-bg-2 rounded-lg text-sm"
            type="button"
          >
            Sort by <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-black"
          type="button"
        >
          Staff Management
        </button>

        <button
          onClick={() => router.push("/staffManagement/attendance")}
          className="px-4 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-gray-200"
          type="button"
        >
          Attendance
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}
      {success && <p className="text-green-400 mb-4">{success}</p>}

      {loading ? (
        <p className="text-gray-400">Loading staff members...</p>
      ) : (
        <DataTable columns={staffColumns} data={staffList} />
      )}

      <AddStaffModal
        open={openAddStaff}
        currentUserRole={currentUserRole}
        onClose={() => setOpenAddStaff(false)}
        onCreated={() => {
          setOpenAddStaff(false);
          setSuccess("Staff member created successfully");
          loadStaff();
        }}
      />

      <EditStaffModal
        open={!!editingStaff}
        staff={editingStaff}
        currentUserRole={currentUserRole}
        onClose={() => setEditingStaff(null)}
        onUpdated={() => {
          setEditingStaff(null);
          setSuccess("Staff member updated successfully");
          loadStaff();
        }}
      />

      <PaySalaryModal
        open={!!payingStaff}
        staff={
          payingStaff
            ? {
                id: staffIdOf(payingStaff),
                name: payingStaff.fullName,
                role: payingStaff.role,
                salary: payingStaff.salary || 0,
              }
            : null
        }
        onClose={() => setPayingStaff(null)}
        onPaid={() => {
          setSuccess("Salary payment recorded successfully");
          setPayingStaff(null);
        }}
      />

      <AddStaffExpenseModal
        open={!!expenseStaff}
        staff={expenseStaff}
        onClose={() => setExpenseStaff(null)}
        onCreated={() => {
          setExpenseStaff(null);
          setSuccess("Staff expense recorded successfully");
        }}
      />
    </main>
  );
}