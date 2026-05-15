"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { payStaffSalary } from "../../src/lib/api/staff.api";

type PaySalaryStaff = {
  id: string;
  name: string;
  role: string;
  salary: number;
};

function currentMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function PaySalaryModal({
  open,
  staff,
  onClose,
  onPaid,
}: {
  open: boolean;
  staff: PaySalaryStaff | null;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [amount, setAmount] = useState<number>(0);
  const [paymentMonth, setPaymentMonth] = useState(currentMonthString());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && staff) {
      setAmount(Number(staff.salary || 0));
      setPaymentMonth(currentMonthString());
      setNote("");
      setError("");
    }
  }, [open, staff]);

  if (!open || !staff) return null;

  const selectedStaff = staff;

  async function handlePaySalary() {
    try {
      setSaving(true);
      setError("");

      if (!amount || amount <= 0) {
        setError("Salary amount must be greater than 0");
        return;
      }

      await payStaffSalary(selectedStaff.id, {
        amount: Number(amount),
        paymentMonth,
        note: note.trim() || undefined,
      });

      onPaid();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to pay salary";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-white">Pay Salary</h2>
              <p className="text-sm text-gray-400 mt-1">
                {selectedStaff.name} • {selectedStaff.role}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#2d2d2d] transition"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="mb-4 rounded-xl bg-bg-2 p-4">
            <p className="text-xs text-gray-400">Registered monthly salary</p>
            <p className="text-lg font-semibold text-primary mt-1">
              {formatLkr(selectedStaff.salary)}
            </p>
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Salary Amount
              </label>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
                placeholder="Enter amount in LKR"
              />
              <p className="text-xs text-gray-500 mt-1">{formatLkr(amount)}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Salary Month
              </label>
              <input
                type="month"
                value={paymentMonth}
                onChange={(e) => setPaymentMonth(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Note optional
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa] resize-none"
                placeholder="Example: Paid monthly salary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-lg bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] transition"
            >
              Cancel
            </button>

            <button
              onClick={handlePaySalary}
              disabled={saving}
              className="px-5 py-3 rounded-lg bg-primary text-black font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? "Paying..." : "Pay Salary"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}