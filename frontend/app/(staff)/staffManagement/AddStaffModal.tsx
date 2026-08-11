"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, X } from "lucide-react";
import { createStaff } from "../../src/lib/api/staff.api";
import type { StaffRole } from "../../src/types/staff";

const OWNER_ROLE_OPTIONS: StaffRole[] = [
  "OWNER",
  "MANAGER",
  "CASHIER",
  "WAITER",
  "STAFF",
];

const MANAGER_ROLE_OPTIONS: StaffRole[] = ["CASHIER", "WAITER", "STAFF"];

export default function AddStaffModal({
  open,
  onClose,
  onCreated,
  currentUserRole = "MANAGER",
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  currentUserRole?: StaffRole;
}) {
  const roleOptions = useMemo(
    () =>
      currentUserRole === "OWNER" ? OWNER_ROLE_OPTIONS : MANAGER_ROLE_OPTIONS,
    [currentUserRole]
  );

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
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setFullName("");
    setEmail("");
    setUsername("");
    setRole(roleOptions[roleOptions.length - 1]);
    setPhone("");
    setSalary(0);
    setDob("");
    setShiftStart("");
    setShiftEnd("");
    setPassword("");
    setAddress("");
    setAdditionalDetails("");
    setImage(null);
    setImagePreview("");
    setError("");
  }, [open, roleOptions]);

  useEffect(() => {
    if (!image) {
      setImagePreview("");
      return;
    }

    const url = URL.createObjectURL(image);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [image]);

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
        image,
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
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#1a1a1a] z-50 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Add Staff</h2>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#2d2d2d] transition"
            type="button"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-xl bg-[#2d2d2d] overflow-hidden flex items-center justify-center border border-white/10">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Staff preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera size={34} className="text-gray-500" />
            )}
          </div>

          <label className="mt-3 text-sm text-[#a78bfa] hover:underline cursor-pointer">
            Add Profile Picture
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setImage(event.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputBox
            label="Full Name"
            value={fullName}
            onChange={setFullName}
            placeholder="Enter full name"
            className="col-span-2"
          />

          <InputBox
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="Enter email address"
            type="email"
            className="col-span-2"
          />

          <InputBox
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder="Enter username"
            className="col-span-2"
          />

          <div>
            <label className="block text-sm text-gray-400 mb-1">Role</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as StaffRole)}
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
            >
              {roleOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <InputBox
            label="Phone number"
            value={phone}
            onChange={setPhone}
            placeholder="Enter phone number"
          />

          <InputBox
            label="Salary"
            value={String(salary)}
            onChange={(value) => setSalary(Number(value))}
            placeholder="Enter salary"
            type="number"
          />

          <InputBox
            label="Date of birth"
            value={dob}
            onChange={setDob}
            type="date"
          />

          <InputBox
            label="Shift start timing"
            value={shiftStart}
            onChange={setShiftStart}
            type="time"
          />

          <InputBox
            label="Shift end timing"
            value={shiftEnd}
            onChange={setShiftEnd}
            type="time"
          />

          <InputBox
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter password"
            type="password"
            className="col-span-2"
          />

          <TextAreaBox
            label="Address"
            value={address}
            onChange={setAddress}
            placeholder="Enter address"
          />

          <TextAreaBox
            label="Additional details"
            value={additionalDetails}
            onChange={setAdditionalDetails}
            placeholder="Enter additional details"
          />
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] transition"
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-6 py-3 rounded-lg bg-[#a78bfa] text-black font-semibold hover:bg-[#b89afa] transition disabled:opacity-50"
            type="button"
          >
            {saving ? "Saving..." : "Confirm"}
          </button>
        </div>
      </div>
    </>
  );
}

function InputBox({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
        placeholder={placeholder}
        type={type}
      />
    </div>
  );
}

function TextAreaBox({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="col-span-2">
      <label className="block text-sm text-gray-400 mb-1">{label}</label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa] resize-none"
        rows={3}
        placeholder={placeholder}
      />
    </div>
  );
}