"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, X } from "lucide-react";
import { getStaffImageSrc, updateStaff } from "../../src/lib/api/staff.api";
import type { Staff, StaffRole } from "../../src/types/staff";

const OWNER_ROLE_OPTIONS: StaffRole[] = [
  "OWNER",
  "MANAGER",
  "CASHIER",
  "WAITER",
  "STAFF",
];

const MANAGER_ROLE_OPTIONS: StaffRole[] = ["CASHIER", "WAITER", "STAFF"];

export default function EditStaffModal({
  open,
  onClose,
  staff,
  onUpdated,
  currentUserRole,
}: {
  open: boolean;
  onClose: () => void;
  staff: Staff | null;
  onUpdated: () => void;
  currentUserRole: StaffRole;
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

  const staffId = staff?._id || staff?.id || "";

  useEffect(() => {
    if (!open || !staff) return;

    setFullName(staff.fullName || "");
    setEmail(staff.email || "");
    setUsername(staff.username || "");
    setRole(staff.role || "STAFF");
    setPhone(staff.phone || "");
    setSalary(Number(staff.salary || 0));
    setDob(staff.dob || "");
    setShiftStart(staff.shiftStart || "");
    setShiftEnd(staff.shiftEnd || "");
    setPassword("");
    setAddress(staff.address || "");
    setAdditionalDetails(staff.additionalDetails || "");
    setImage(null);
    setImagePreview(staff.image ? getStaffImageSrc(staff.image) : "");
    setError("");
  }, [open, staff]);

  useEffect(() => {
    if (!image) return;

    const url = URL.createObjectURL(image);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [image]);

  if (!open || !staff) return null;

  async function handleConfirm() {
    try {
      setSaving(true);
      setError("");

      if (!staffId) {
        setError("Staff ID is missing");
        return;
      }

      if (!fullName.trim()) {
        setError("Full Name is required");
        return;
      }

      await updateStaff(staffId, {
        fullName,
        email: email || undefined,
        username: username || undefined,
        password: password || undefined,
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

      onUpdated();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to update staff";
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
          <h2 className="text-xl font-semibold text-white">Edit Staff</h2>

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
            Change Profile Picture
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
            className="col-span-2"
          />

          <InputBox
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            className="col-span-2"
          />

          <InputBox
            label="Username"
            value={username}
            onChange={setUsername}
            className="col-span-2"
          />

          <div>
            <label className="block text-sm text-gray-400 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
            >
              {roleOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <InputBox label="Phone number" value={phone} onChange={setPhone} />

          <InputBox
            label="Salary"
            value={String(salary)}
            onChange={(value) => setSalary(Number(value))}
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
            label="New Password"
            value={password}
            onChange={setPassword}
            placeholder="Leave empty to keep current password"
            type="password"
            className="col-span-2"
          />

          <TextAreaBox label="Address" value={address} onChange={setAddress} />

          <TextAreaBox
            label="Additional details"
            value={additionalDetails}
            onChange={setAdditionalDetails}
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
            {saving ? "Saving..." : "Update"}
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
        onChange={(e) => onChange(e.target.value)}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="col-span-2">
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa] resize-none"
        rows={3}
      />
    </div>
  );
}