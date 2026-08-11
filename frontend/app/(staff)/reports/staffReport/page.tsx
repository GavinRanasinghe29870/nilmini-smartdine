"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  RefreshCcw,
  Wallet,
  Banknote,
  HandCoins,
  ListChecks,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import DataTable, { Column } from "../../../src/components/DataTable";
import {
  getStaffExpenseSummary,
  getStaffExpenses,
} from "../../../src/lib/api/staff.api";
import { verify } from "../../../src/lib/auth";
import type {
  StaffExpense,
  StaffExpenseSummary,
  StaffExpenseType,
  StaffRole,
} from "../../../src/types/staff";

const STAFF_PANEL_ROLES = ["OWNER", "MANAGER"];

const reportTabs = [
  { label: "Revenue Report", path: "/reports/revenueReport" },
  { label: "Staff Report", path: "/reports/staffReport" },
  { label: "Sales Report", path: "/reports/salesReport" },
];

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

type MonthPickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

function openNativePicker(input: HTMLInputElement | null) {
  if (!input) return;

  input.focus();

  const pickerInput = input as HTMLInputElement & {
    showPicker?: () => void;
  };

  if (typeof pickerInput.showPicker === "function") {
    try {
      pickerInput.showPicker();
    } catch {
      // Browser may block showPicker outside direct user action.
      // Focus still keeps the native input usable.
    }
  }
}

function MonthPickerField({ value, onChange }: MonthPickerFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openNativePicker(inputRef.current)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openNativePicker(inputRef.current);
        }
      }}
      className="flex items-center gap-2 bg-bg-1 border border-white/10 rounded-lg px-4 py-2 text-white cursor-pointer"
    >
      <Calendar size={18} className="text-primary shrink-0" />

      <input
        ref={inputRef}
        type="month"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onClick={(event) => {
          event.stopPropagation();
          openNativePicker(event.currentTarget);
        }}
        className="bg-transparent text-white outline-none cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
      />
    </div>
  );
}

function formatMoney(value: number) {
  return `LKR ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

function getExpenseBadgeClass(type: StaffExpenseType) {
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

const emptySummary: StaffExpenseSummary = {
  totalSalaryPayments: 0,
  totalStaffExtraExpenses: 0,
  totalStaffExpenses: 0,
  totalDeductibleAdvances: 0,
  breakdown: [],
};

export default function StaffReportPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [currentUserRole, setCurrentUserRole] = useState<StaffRole>("STAFF");
  const [allowed, setAllowed] = useState(false);

  const [paymentMonth, setPaymentMonth] = useState(getCurrentMonth());
  const [summary, setSummary] = useState<StaffExpenseSummary>(emptySummary);
  const [expenseRecords, setExpenseRecords] = useState<StaffExpense[]>([]);

  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryData, recordsData] = await Promise.all([
        getStaffExpenseSummary({
          paymentMonth,
        }),
        getStaffExpenses({
          paymentMonth,
        }),
      ]);

      setSummary(summaryData || emptySummary);
      setExpenseRecords(recordsData || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load staff report"
      );
      setSummary(emptySummary);
      setExpenseRecords([]);
    } finally {
      setLoading(false);
    }
  }, [paymentMonth]);

  useEffect(() => {
    async function init() {
      try {
        setCheckingAccess(true);

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
      } finally {
        setCheckingAccess(false);
      }
    }

    init();
  }, [router]);

  useEffect(() => {
    if (allowed) {
      loadReport();
    }
  }, [allowed, loadReport]);

  const expenseColumns: Column<StaffExpense>[] = [
    {
      key: "staffName",
      label: "Staff Member",
      render: (record) => (
        <div>
          <p className="font-medium text-white">{record.staffName}</p>
          <p className="text-xs text-gray-400">{record.role}</p>
        </div>
      ),
    },
    {
      key: "expenseType",
      label: "Expense Type",
      render: (record) => (
        <span
          className={`inline-flex px-3 py-1 rounded-full border text-xs font-medium ${getExpenseBadgeClass(
            record.expenseType
          )}`}
        >
          {record.expenseType}
        </span>
      ),
    },
    {
      key: "paymentMonth",
      label: "Month",
      render: (record) => record.paymentMonth,
    },
    {
      key: "paidAt",
      label: "Paid Date",
      render: (record) => formatDate(record.paidAt),
    },
    {
      key: "deductFromSalary",
      label: "Deduct",
      render: (record) =>
        record.deductFromSalary ? (
          <span className="text-yellow-300">Yes</span>
        ) : (
          <span className="text-gray-400">No</span>
        ),
    },
    {
      key: "amount",
      label: "Amount",
      align: "right",
      render: (record) => formatMoney(record.amount),
    },
    {
      key: "note",
      label: "Note",
      render: (record) => record.note || "-",
    },
  ];

  if (checkingAccess) {
    return (
      <main className="flex-1 p-8 bg-bg-1 min-h-screen text-white">
        <p className="text-gray-400">Checking access...</p>
      </main>
    );
  }

  if (!allowed) return null;

  return (
    <main className="flex-1 p-8 bg-bg-1 min-h-screen text-white">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-bg-2 hover:bg-bg-1"
          type="button"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <h1 className="text-h4 font-semibold">Staff Report</h1>
          <p className="text-sm text-gray-400">
            View salary payments, staff advances, emergency expenses, and total
            staff expenses.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        {reportTabs.map((tab) => {
          const active = pathname === tab.path;

          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                active
                  ? "bg-primary text-black"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-bg-2 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-white/10">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Staff Expense Summary
          </h2>
          <p className="text-sm text-gray-400">
            Salary payments and extra staff expenses are calculated together.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <MonthPickerField value={paymentMonth} onChange={setPaymentMonth} />

          <button
            onClick={loadReport}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg"
            type="button"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="Salary Payments"
          value={formatMoney(summary.totalSalaryPayments)}
          icon={<Banknote size={22} />}
        />

        <SummaryCard
          title="Advances / Extra Expenses"
          value={formatMoney(summary.totalStaffExtraExpenses)}
          icon={<HandCoins size={22} />}
        />

        <SummaryCard
          title="Total Staff Expenses"
          value={formatMoney(summary.totalStaffExpenses)}
          icon={<Wallet size={22} />}
          highlight
        />

        <SummaryCard
          title="Deductible Advances"
          value={formatMoney(summary.totalDeductibleAdvances)}
          icon={<ListChecks size={22} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-bg-2 rounded-xl p-5 border border-white/10">
          <h3 className="text-lg font-semibold mb-4">
            Staff Expenses Breakdown
          </h3>

          {summary.breakdown.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No staff expense records found for this month.
            </p>
          ) : (
            <div className="space-y-3">
              {summary.breakdown.map((item) => {
                const percentage =
                  summary.totalStaffExpenses > 0
                    ? (item.totalAmount / summary.totalStaffExpenses) * 100
                    : 0;

                return (
                  <div
                    key={item.expenseType}
                    className="bg-bg-1 rounded-lg p-4"
                  >
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white">{item.expenseType}</span>
                      <span className="text-primary font-semibold">
                        {formatMoney(item.totalAmount)}
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                      {item.count} record{item.count === 1 ? "" : "s"} ·{" "}
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-bg-2 rounded-xl p-5 border border-white/10">
          <h3 className="text-lg font-semibold mb-4">Report Notes</h3>

          <div className="space-y-4 text-sm text-gray-400">
            <p>
              <span className="text-white font-medium">Salary Payments</span>{" "}
              are normal monthly salary payments recorded from the Pay Salary
              action.
            </p>

            <p>
              <span className="text-white font-medium">
                Advances / Extra Expenses
              </span>{" "}
              include salary advances, medical, emergency, transport, food, and
              other staff support payments.
            </p>

            <p>
              <span className="text-white font-medium">
                Total Staff Expenses
              </span>{" "}
              is calculated as salary payments plus all extra staff expenses.
            </p>

            <p>
              <span className="text-white font-medium">
                Deductible Advances
              </span>{" "}
              shows salary advances that should be deducted during salary
              settlement.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-bg-2 rounded-xl p-5 border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Staff Expense Records</h3>
            <p className="text-sm text-gray-400">
              Showing {expenseRecords.length} record
              {expenseRecords.length === 1 ? "" : "s"} for {paymentMonth}.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading staff report...</p>
        ) : expenseRecords.length === 0 ? (
          <p className="text-gray-400">
            No staff expense records found for the selected month.
          </p>
        ) : (
          <DataTable columns={expenseColumns} data={expenseRecords} />
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  highlight = false,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-5 border ${
        highlight
          ? "bg-primary text-black border-primary"
          : "bg-bg-2 text-white border-white/10"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <p
          className={`text-sm ${
            highlight ? "text-black/70" : "text-gray-400"
          }`}
        >
          {title}
        </p>

        <div className={highlight ? "text-black" : "text-primary"}>{icon}</div>
      </div>

      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}