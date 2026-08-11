"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { createStaffExpense } from "../../src/lib/api/staff.api";
import type { Staff, StaffExpensePayload } from "../../src/types/staff";

const EXPENSE_TYPES: StaffExpensePayload["expenseType"][] = [
  "Salary Advance",
  "Medical",
  "Emergency",
  "Transport",
  "Food",
  "Other",
];

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function staffIdOf(staff: Staff | null) {
  return staff?._id || staff?.id || "";
}

export default function AddStaffExpenseModal({
  open,
  staff,
  onClose,
  onCreated,
}: {
  open: boolean;
  staff: Staff | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const staffId = useMemo(() => staffIdOf(staff), [staff]);

  const [amount, setAmount] = useState("0");
  const [expenseType, setExpenseType] =
    useState<StaffExpensePayload["expenseType"]>("Salary Advance");
  const [deductFromSalary, setDeductFromSalary] = useState(true);
  const [paymentMonth, setPaymentMonth] = useState(getCurrentMonth());
  const [paidAt, setPaidAt] = useState(getTodayDate());
  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setAmount("0");
    setExpenseType("Salary Advance");
    setDeductFromSalary(true);
    setPaymentMonth(getCurrentMonth());
    setPaidAt(getTodayDate());
    setNote("");
    setError("");
  }, [open]);

  useEffect(() => {
    setDeductFromSalary(expenseType === "Salary Advance");
  }, [expenseType]);

  if (!open || !staff) return null;

  async function handleSave() {
    try {
      setSaving(true);
      setError("");

      const numericAmount = Number(amount);

      if (!staffId) {
        setError("Staff ID is missing");
        return;
      }

      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      await createStaffExpense(staffId, {
        amount: numericAmount,
        expenseType,
        deductFromSalary,
        paymentMonth,
        paidAt,
        note,
      });

      onCreated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record staff expense"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#1a1a1a] z-50 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Add Staff Expense
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              {staff.fullName} · {staff.role}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#2d2d2d] transition"
            type="button"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Amount (LKR)
            </label>

            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              type="number"
              min={1}
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Expense Type
            </label>

            <select
              value={expenseType}
              onChange={(event) =>
                setExpenseType(
                  event.target.value as StaffExpensePayload["expenseType"]
                )
              }
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
            >
              {EXPENSE_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Payment Month
            </label>

            <input
              value={paymentMonth}
              onChange={(event) => setPaymentMonth(event.target.value)}
              type="month"
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Paid Date
            </label>

            <input
              value={paidAt}
              onChange={(event) => setPaidAt(event.target.value)}
              type="date"
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
            />
          </div>

          <label className="flex items-center gap-3 rounded-lg bg-[#2d2d2d] px-4 py-3 cursor-pointer">
            <input
              checked={deductFromSalary}
              onChange={(event) => setDeductFromSalary(event.target.checked)}
              type="checkbox"
              className="w-4 h-4"
            />

            <span className="text-sm text-gray-300">
              Deduct this amount from salary later
            </span>
          </label>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Note</label>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              placeholder="Example: medicine support, emergency advance, transport..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            type="button"
            className="px-6 py-3 rounded-lg bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            type="button"
            className="px-6 py-3 rounded-lg bg-[#a78bfa] text-black font-semibold hover:bg-[#b89afa] transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Expense"}
          </button>
        </div>
      </div>
    </>
  );
}