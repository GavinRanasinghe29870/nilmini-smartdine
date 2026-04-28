"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  getImageSrc,
  normalizeImageForDb,
  updateCategory,
  uploadImage,
} from "../../src/lib/api/product.api";
import type { CategoryDto } from "../../src/types/category";

export default function EditCategoryModal({
  open,
  onClose,
  category,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  category: CategoryDto | null;
  onSaved: () => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && category) {
      setName(category.name || "");
      setDescription(category.description || "");
      setPreview(getImageSrc(category.image));
      setSelectedFile(null);
      setSaving(false);
      setError("");
    }
  }, [open, category]);

  if (!open || !category) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      if (!name.trim()) {
        throw new Error("Category name is required");
      }

      let imagePath = normalizeImageForDb(category.image);

      if (selectedFile) {
        imagePath = await uploadImage(selectedFile);
      }

      await updateCategory(category.id, {
        name: name.trim(),
        description: description.trim(),
        image: imagePath,
      });

      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-bg-2 z-50 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-white">
            Edit Category
          </h2>

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
                alt="Category"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/AddImage.png";
                }}
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
                setPreview(
                  file ? URL.createObjectURL(file) : getImageSrc(category.image)
                );
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
            {saving ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </>
  );
}