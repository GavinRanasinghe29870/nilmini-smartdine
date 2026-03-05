"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createStaff } from "../../../app/src/lib/api/staff.api";
import type { StaffRole } from "../../../app/src/types/staff";

export default function AddStaffModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<StaffRole>("STAFF");
  const [phone, setPhone] = useState("");
  const [salary, setSalary] = useState<number>(0);
  const [dob, setDob] = useState("");
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleConfirm() {
    try {
      setSaving(true);
      setError("");

      if (!fullName.trim()) {
        setError("Full Name is required");
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }

      await createStaff({
        fullName,
        email: email || undefined,
        username: username || undefined,
        password,
        role,
        phone: phone || undefined,
        salary: Number(salary || 0),
        dob: dob || undefined,
        shiftStart: shiftStart || undefined,
        shiftEnd: shiftEnd || undefined,
        address: address || undefined,
        additionalDetails: additionalDetails || undefined,
      });

      onCreated();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create staff";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#1a1a1a] z-50 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Add Staff</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#2d2d2d] transition">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        {/* Form */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              placeholder="Enter full name"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              placeholder="Enter email address"
              type="email"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
            >
              <option value="MANAGER">MANAGER</option>
              <option value="CASHIER">CASHIER</option>
              <option value="WAITER">WAITER</option>
              <option value="STAFF">STAFF</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Salary</label>
            <input
              value={String(salary)}
              onChange={(e) => setSalary(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              placeholder="Enter salary"
              type="number"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Date of birth</label>
            <input
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              type="date"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Shift start timing</label>
            <input
              value={shiftStart}
              onChange={(e) => setShiftStart(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              type="time"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Shift end timing</label>
            <input
              value={shiftEnd}
              onChange={(e) => setShiftEnd(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              type="time"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              placeholder="Enter password"
              type="password"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa] resize-none"
              rows={3}
              placeholder="Enter address"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Additional details</label>
            <textarea
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa] resize-none"
              rows={3}
              placeholder="Enter additional details"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-6 py-3 rounded-lg bg-[#a78bfa] text-black font-semibold hover:bg-[#b89afa] transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Confirm"}
          </button>
        </div>
      </div>
    </>
  );
}
