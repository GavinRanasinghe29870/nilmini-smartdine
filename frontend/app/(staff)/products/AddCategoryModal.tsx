"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createCategory, uploadImage } from "../../src/lib/api/product.api";

export default function AddCategoryModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setSelectedFile(null);
      setPreview("");
      setSaving(false);
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      if (!name.trim()) {
        throw new Error("Category name is required");
      }

      let imagePath = "";

      if (selectedFile) {
        imagePath = await uploadImage(selectedFile);
      }

      await createCategory({
        name: name.trim(),
        description: description.trim(),
        image: imagePath,
      });

      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-bg-2 z-50 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-white">Add Category</h2>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-bg-1 transition"
          >
            <X size={20} className="text-red-400" />
          </button>
        </div>

        <div className="flex flex-col items-start mb-8">
          <div className="w-32 h-32 rounded-lg bg-bg-1 flex items-center justify-center mb-3 overflow-hidden">
            {preview ? (
              <img
                src={preview}
                alt="Category preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src="/AddImage.png"
                alt="Add Image"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          <label className="text-sm text-primary hover:underline cursor-pointer">
            Change Category Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setSelectedFile(file);
                setPreview(file ? URL.createObjectURL(file) : "");
              }}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-text-white mb-1">
              Category Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white placeholder-[#ADADAD] focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter Category name"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-text-white mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white placeholder-[#ADADAD] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              placeholder="Write your category description here"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400 mt-4">{error}</p>}

        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-bg-1 text-text-white hover:bg-bg-2 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-lg bg-primary text-text-white font-semibold hover:bg-secondary hover:text-text-black transition disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}