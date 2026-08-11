/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  HandCoins,
  Pencil,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import EditStaffModal from "../EditStaffModal";
import type {
  Staff,
  StaffExpense,
  StaffExpenseType,
  StaffRole,
} from "../../../src/types/staff";
import {
  deleteStaff,
  getStaffById,
  getStaffExpenses,
  getStaffImageSrc,
} from "../../../src/lib/api/staff.api";
import { verify } from "../../../src/lib/auth";

const STAFF_PANEL_ROLES = ["OWNER", "MANAGER"];

const EXPENSE_FILTER_OPTIONS: Array<StaffExpenseType | "All"> = [
  "All",
  "Salary Payment",
  "Salary Advance",
  "Medical",
  "Emergency",
  "Transport",
  "Food",
  "Other",
];

function formatLkr(value?: number) {
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

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(value?: string) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-LK", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getExpenseBadgeClass(type?: StaffExpenseType) {
  if (type === "Salary Payment") {
    return "bg-green-500/10 text-green-300 border-green-500/30";
  }

  if (type === "Salary Advance") {
    return "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
  }

  if (type === "Medical") {
    return "bg-blue-500/10 text-blue-300 border-blue-500/30";
  }

  if (type === "Emergency") {
    return "bg-red-500/10 text-red-300 border-red-500/30";
  }

  return "bg-purple-500/10 text-purple-300 border-purple-500/30";
}

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();

  const staffId = String(params?.id || "");

  const [staff, setStaff] = useState<Staff | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<StaffRole>("STAFF");
  const [currentUserId, setCurrentUserId] = useState("");

  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [expenseMonth, setExpenseMonth] = useState(getCurrentMonth());
  const [expenseTypeFilter, setExpenseTypeFilter] =
    useState<StaffExpenseType | "All">("All");
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseError, setExpenseError] = useState("");
  const [expenseRecords, setExpenseRecords] = useState<StaffExpense[]>([]);

  const isOwner = currentUserRole === "OWNER";
  const isManager = currentUserRole === "MANAGER";

  const canManage =
    !!staff && (isOwner || (isManager && !isProtectedRole(staff.role)));

  const filteredExpenses = useMemo(() => {
    if (expenseTypeFilter === "All") {
      return expenseRecords;
    }

    return expenseRecords.filter(
      (expense) => expense.expenseType === expenseTypeFilter
    );
  }, [expenseRecords, expenseTypeFilter]);

  const totalFilteredExpenses = useMemo(() => {
    return filteredExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    );
  }, [filteredExpenses]);

  const totalSalaryPayments = useMemo(() => {
    return expenseRecords
      .filter((expense) => expense.expenseType === "Salary Payment")
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [expenseRecords]);

  const totalExtraExpenses = useMemo(() => {
    return expenseRecords
      .filter((expense) => expense.expenseType !== "Salary Payment")
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [expenseRecords]);

  const totalDeductibleAdvances = useMemo(() => {
    return expenseRecords
      .filter(
        (expense) =>
          expense.expenseType === "Salary Advance" && expense.deductFromSalary
      )
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [expenseRecords]);

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getStaffById(staffId);
      setStaff(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load staff";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  const loadStaffExpenses = useCallback(async () => {
    if (!staffId) return;

    try {
      setExpenseLoading(true);
      setExpenseError("");

      const data = await getStaffExpenses({
        staffId,
        paymentMonth: expenseMonth,
      });

      setExpenseRecords(data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load staff expenses";
      setExpenseError(message);
      setExpenseRecords([]);
    } finally {
      setExpenseLoading(false);
    }
  }, [staffId, expenseMonth]);

  async function handleDelete() {
    if (!staff) return;

    const id = staffIdOf(staff);

    if (!canManage) {
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
      await deleteStaff(id);
      router.push("/staffManagement");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete staff";
      setError(message);
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

    if (staffId) {
      init();
    }
  }, [staffId, router, loadStaff]);

  useEffect(() => {
    if (allowed && expensesOpen) {
      loadStaffExpenses();
    }
  }, [allowed, expensesOpen, loadStaffExpenses]);

  if (!allowed && loading) {
    return (
      <main className="flex-1 p-8">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  if (!allowed) return null;

  if (loading) {
    return (
      <main className="flex-1 p-8">
        <p className="text-gray-400">Loading staff details...</p>
      </main>
    );
  }

  if (!staff) {
    return (
      <main className="flex-1 p-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-bg-2 hover:bg-secondary transition mb-4"
          type="button"
        >
          <ArrowLeft size={20} />
        </button>

        <p className="text-red-400">{error || "Staff member not found"}</p>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-bg-1 text-white">
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-bg-2 hover:bg-secondary transition"
            type="button"
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="text-2xl font-semibold">{staff.fullName}</h1>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}
        {success && <p className="text-green-400 mb-4">{success}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <div className="bg-bg-2 rounded-xl p-6 flex flex-col items-center">
            <div className="relative mb-6">
              <img
                src={getStaffImageSrc(staff.image)}
                alt={staff.fullName}
                className="w-64 h-64 object-cover rounded-lg border border-white/10"
                onError={(event) => {
                  event.currentTarget.src = "/AddImage.png";
                }}
              />
            </div>

            {canManage && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="w-full bg-primary text-text-black font-medium py-3 rounded-lg hover:bg-secondary transition flex items-center justify-center gap-2"
                  type="button"
                >
                  <Pencil size={18} />
                  Edit profile
                </button>

                <button
                  onClick={handleDelete}
                  className="w-full mt-4 border border-red-500/50 text-red-400 font-medium py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-500/10 transition"
                  type="button"
                >
                  <Trash2 size={18} />
                  Delete profile
                </button>
              </>
            )}

            {!canManage && (
              <p className="text-sm text-gray-400 text-center">
                You can view this profile, but you cannot edit or delete this
                staff account.
              </p>
            )}
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-bg-2 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-6 text-text-white">
                Employee Personal Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <Detail label="Full Name" value={staff.fullName} />
                <Detail label="Email" value={staff.email || "-"} />
                <Detail label="Username" value={staff.username || "-"} />
                <Detail label="Phone number" value={staff.phone || "-"} />
                <Detail label="Date of birth" value={staff.dob || "-"} />

                <div className="md:col-span-2">
                  <Detail label="Address" value={staff.address || "-"} />
                </div>

                <div className="md:col-span-2">
                  <Detail
                    label="Additional Details"
                    value={staff.additionalDetails || "-"}
                  />
                </div>
              </div>
            </div>

            <div className="bg-bg-2 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-6 text-text-white">
                Employee Job Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div>
                  <p className="text-text-white">Role</p>
                  <p className="text-2xl font-semibold text-[#a5b4fc]">
                    {staff.role}
                  </p>
                </div>

                <div>
                  <p className="text-text-white">Salary</p>
                  <p className="text-2xl font-semibold text-[#a5b4fc]">
                    {formatLkr(staff.salary)}
                  </p>
                </div>

                <Detail
                  label="Shift start timing"
                  value={staff.shiftStart || "-"}
                />

                <Detail label="Shift end timing" value={staff.shiftEnd || "-"} />
              </div>
            </div>

            <div className="bg-bg-2 rounded-xl p-6">
              <button
                type="button"
                onClick={() => setExpensesOpen((previous) => !previous)}
                className="w-full flex items-center justify-between gap-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <HandCoins size={20} />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-white">
                      Staff Expenses & Salary Records
                    </h3>
                    <p className="text-sm text-gray-400">
                      View salary payments, advances, medical, emergency, and
                      other expenses with paid date.
                    </p>
                  </div>
                </div>

                <ChevronDown
                  size={20}
                  className={`text-gray-400 transition ${
                    expensesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expensesOpen && (
                <div className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">
                        Payment Month
                      </label>

                      <input
                        type="month"
                        value={expenseMonth}
                        onChange={(event) => setExpenseMonth(event.target.value)}
                        className="w-full bg-bg-1 border border-white/10 rounded-lg px-4 py-3 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-2">
                        Expense Type
                      </label>

                      <select
                        value={expenseTypeFilter}
                        onChange={(event) =>
                          setExpenseTypeFilter(
                            event.target.value as StaffExpenseType | "All"
                          )
                        }
                        className="w-full bg-bg-1 border border-white/10 rounded-lg px-4 py-3 text-white outline-none"
                      >
                        {EXPENSE_FILTER_OPTIONS.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={loadStaffExpenses}
                        className="w-full bg-primary text-black font-semibold rounded-lg px-4 py-3 hover:bg-secondary transition"
                      >
                        Load Expenses
                      </button>
                    </div>
                  </div>

                  {expenseError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 mb-5">
                      {expenseError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                    <ExpenseSummaryCard
                      title="Salary Payments"
                      value={formatLkr(totalSalaryPayments)}
                    />

                    <ExpenseSummaryCard
                      title="Extra Expenses"
                      value={formatLkr(totalExtraExpenses)}
                    />

                    <ExpenseSummaryCard
                      title="Deductible Advances"
                      value={formatLkr(totalDeductibleAdvances)}
                    />

                    <ExpenseSummaryCard
                      title="Filtered Total"
                      value={formatLkr(totalFilteredExpenses)}
                      highlight
                    />
                  </div>

                  {expenseLoading ? (
                    <p className="text-gray-400">Loading staff expenses...</p>
                  ) : filteredExpenses.length === 0 ? (
                    <div className="bg-bg-1 rounded-xl p-6 text-center border border-white/10">
                      <CalendarDays
                        size={28}
                        className="text-gray-500 mx-auto mb-3"
                      />
                      <p className="text-white font-semibold">
                        No expense records found
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        No records were found for {expenseMonth}
                        {expenseTypeFilter !== "All"
                          ? ` under ${expenseTypeFilter}`
                          : ""}
                        .
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-white/10 rounded-xl">
                      <table className="w-full text-sm">
                        <thead className="bg-bg-1 text-gray-400">
                          <tr>
                            <th className="text-left p-4">Paid Date</th>
                            <th className="text-left p-4">Expense Type</th>
                            <th className="text-left p-4">Month</th>
                            <th className="text-left p-4">Deduct</th>
                            <th className="text-left p-4">Note</th>
                            <th className="text-right p-4">Amount</th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredExpenses.map((expense) => (
                            <tr
                              key={expense._id || expense.id}
                              className="border-t border-white/10 hover:bg-white/5"
                            >
                              <td className="p-4 text-gray-300">
                                {formatDate(expense.paidAt)}
                              </td>

                              <td className="p-4">
                                <span
                                  className={`inline-flex px-3 py-1 rounded-full border text-xs font-medium ${getExpenseBadgeClass(
                                    expense.expenseType
                                  )}`}
                                >
                                  {expense.expenseType}
                                </span>
                              </td>

                              <td className="p-4 text-gray-300">
                                {expense.paymentMonth}
                              </td>

                              <td className="p-4">
                                {expense.deductFromSalary ? (
                                  <span className="text-yellow-300">Yes</span>
                                ) : (
                                  <span className="text-gray-400">No</span>
                                )}
                              </td>

                              <td className="p-4 text-gray-300 max-w-[240px] truncate">
                                {expense.note || "-"}
                              </td>

                              <td className="p-4 text-right text-primary font-semibold">
                                {formatLkr(expense.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <EditStaffModal
          open={editing}
          staff={staff}
          currentUserRole={currentUserRole}
          onClose={() => setEditing(false)}
          onUpdated={() => {
            setEditing(false);
            setSuccess("Staff profile updated successfully");
            loadStaff();
          }}
        />
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-text-white">{label}</p>
      <p className="font-medium text-gray-300">{value}</p>
    </div>
  );
}

function ExpenseSummaryCard({
  title,
  value,
  highlight = false,
}: {
  title: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        highlight
          ? "bg-primary text-black border-primary"
          : "bg-bg-1 text-white border-white/10"
      }`}
    >
      <p className={`text-xs ${highlight ? "text-black/70" : "text-gray-400"}`}>
        {title}
      </p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}