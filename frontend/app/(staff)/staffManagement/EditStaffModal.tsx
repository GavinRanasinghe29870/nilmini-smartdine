"use client";
import { X } from "lucide-react";

export default function EditStaffModal({
  open,
  onClose,
  staff,
}: {
  open: boolean;
  onClose: () => void;
  staff: {
    name: string;
    email: string;
    role: string;
    phone: string;
    salary: number;
    dob: string;
    startTime: string;
    endTime: string;
    address: string;
    additional: string;
    image?: string;
  } | null;
}) {
  if (!open || !staff) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#1a1a1a] z-50 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Edit Staff</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#2d2d2d] transition"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        {/* Profile Image Section */}
        <div className="flex flex-col items-center mb-8">
          {staff.image ? (
            <img
              src={staff.image}
              alt="Profile"
              className="w-32 h-32 rounded-lg object-cover mb-3"
            />
          ) : (
            <div className="w-32 h-32 rounded-lg bg-[#2d2d2d] flex items-center justify-center mb-3">
              <svg
                className="w-12 h-12 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
          )}
          <button className="text-sm text-[#a78bfa] hover:underline">
            Change Profile Picture
          </button>
        </div>
        {/* Form */}
        <div className="grid grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Full Name</label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              placeholder="Enter full name"
              defaultValue={staff.name}
            />
          </div>
          {/* Email */}
          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              placeholder="Enter email address"
              type="email"
              defaultValue={staff.email}
            />
          </div>
          {/* Role */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Role</label>
            <select
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              defaultValue={staff.role}
            >
              <option className="text-gray-500">Select role</option>
              <option>Manager</option>
              <option>Cashier</option>
              <option>Waiter</option>
            </select>
          </div>
          {/* Phone Number */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Phone number
            </label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              placeholder="Enter phone number"
              defaultValue={staff.phone}
            />
          </div>
          {/* Salary */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Salary</label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              placeholder="Enter salary"
              defaultValue={staff.salary}
            />
          </div>
          {/* Date of birth */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Date of birth
            </label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              type="date"
              defaultValue={staff.dob}
            />
          </div>
          {/* Shift start time */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Shift start timing
            </label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              placeholder="Enter start timing"
              type="time"
              defaultValue={staff.startTime}
            />
          </div>
          {/* Shift end time */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Shift end timing
            </label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              placeholder="Enter end timing"
              type="time"
              defaultValue={staff.endTime}
            />
          </div>
          {/* Address */}
          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Address</label>
            <textarea
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa] resize-none"
              rows={3}
              placeholder="Enter address"
              defaultValue={staff.address}
            />
          </div>
          {/* Additional details */}
          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">
              Additional details
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-lg bg-[#2d2d2d] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a78bfa] resize-none"
              rows={3}
              placeholder="Enter additional details"
              defaultValue={staff.additional}
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
          <button className="px-6 py-3 rounded-lg bg-[#a78bfa] text-black font-semibold hover:bg-[#b89afa] transition">
            Confirm
          </button>
        </div>
      </div>
    </>
  );
}