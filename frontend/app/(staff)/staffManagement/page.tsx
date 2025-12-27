"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

type StaffStatus = "Active" | "Inactive";

type Staff = {
  id: number;
  name: string;
  role: string;
  status: StaffStatus;
};

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([
    { id: 1, name: "John Doe", role: "Manager", status: "Active" },
    { id: 2, name: "Jane Smith", role: "Cashier", status: "Inactive" },
  ]);

  return (
    <section className="text-white">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Staff Management</h1>

        <button
          type="button"
          className="flex items-center gap-2 bg-purple-600 px-4 py-2 rounded-lg
                     hover:bg-purple-700 focus:outline-none focus:ring-2
                     focus:ring-purple-500"
        >
          <Plus size={18} />
          <span>Add Staff</span>
        </button>
      </header>

      {/* Table */}
      <div className="bg-[#111315] rounded-xl overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead className="bg-[#1a1c1f] text-gray-400 text-sm uppercase">
            <tr>
              <th scope="col" className="px-6 py-4">Name</th>
              <th scope="col" className="px-6 py-4">Role</th>
              <th scope="col" className="px-6 py-4">Status</th>
              <th scope="col" className="px-6 py-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {staffList.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  No staff members found.
                </td>
              </tr>
            ) : (
              staffList.map((staff) => (
                <tr
                  key={staff.id}
                  className="border-t border-gray-800 hover:bg-[#1a1c1f] transition"
                >
                  <td className="px-6 py-4">{staff.name}</td>
                  <td className="px-6 py-4">{staff.role}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                        ${
                          staff.status === "Active"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                    >
                      {staff.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      className="text-purple-400 hover:text-purple-300"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
