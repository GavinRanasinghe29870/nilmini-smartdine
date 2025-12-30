"use client";
import { X } from "lucide-react";
import Image from "next/image";

export default function AddCategoryModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-bg-2 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-bg-2 z-50 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-white">Add Category</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-bg-1 transition"
          >
            <X size={20} className="text-red-400" />
          </button>
        </div>

        {/* Profile Image Section */}
        <div className="flex flex-col items-start mb-8">
          <div className="w-32 h-32 rounded-lg bg-bg-1 flex items-center justify-center mb-3">
            <Image
              src="/AddImage.png"
              alt="Add Image"
              width={274}
              height={274}
            />
          </div>
          <button className="text-sm text-primary hover:underline">
            Change Profile Picture
          </button>
        </div>

        {/* Form*/}
        <div className="grid grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="col-span-2">
            <label className="block text-sm text-text-white mb-1">Category Name</label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white placeholder-[#ADADAD] focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter Category name"
            />
          </div>

          {/* Address */}
          <div className="col-span-2">
            <label className="block text-sm text-text-white mb-1">Description</label>
            <textarea
              className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white placeholder-[#ADADAD]focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              placeholder="write your category description here"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-bg-2 text-text-white hover:bg-bg-2 transition"
          >
            Cancel
          </button>
          <button className="px-6 py-3 rounded-lg bg-primary text-text-white font-semibold hover:bg-secondary hover:text-text-black transition">
            Save
          </button>
        </div>
      </div>
    </>
  );
}