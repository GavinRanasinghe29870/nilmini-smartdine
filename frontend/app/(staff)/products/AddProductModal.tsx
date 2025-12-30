"use client";
import { X, Plus } from "lucide-react";
import { useState } from "react";

export default function AddProductModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [ingredients, setIngredients] = useState<[string, string][]>([
    ["", ""],
  ]);

  const addIngredientRow = () => {
    setIngredients([...ingredients, ["", ""]]);
  };

  const updateIngredient = (index: number, field: "name" | "quantity" | "unit", value: string) => {
    const newIngredients = [...ingredients];
    if (field === "name") {
      newIngredients[index][0] = value;
    } else if (field === "quantity") {
      newIngredients[index][1] = value;
    } else if (field === "unit") {
    }
    setIngredients(newIngredients);
  };

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
          <h2 className="text-lg font-semibold text-text-white">
            Add New Products
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#2a2e2d]"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        {/* Product Image */}
        <div className="flex flex-col items-start mb-6">
          <div className="w-32 h-32 rounded-lg bg-bg-1 flex items-center justify-center mb-2">
            <svg
              className="w-10 h-10 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5h18M3 19h18M5 5l7 7 7-7"
              />
            </svg>
          </div>
          <button className="text-sm text-primary hover:underline">
            Change Icon
          </button>
        </div>
        {/* Product Name */}
        <div className="mb-4">
          <label className="text-sm text-text-white mb-1 block">
            Product Name
          </label>
          <input
            className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white placeholder-gray-500 focus:outline-none"
            placeholder="Enter Product name"
          />
        </div>
        {/* Category */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1 block">
            Category
          </label>
          <select className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white focus:outline-none">
            <option>Select Category</option>
            <option>Beverages</option>
            <option>Bakery</option>
            <option>Main Meals</option>
          </select>
        </div>
        {/* Description */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1 block">
            Description
          </label>
          <textarea
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white placeholder-gray-500 resize-none focus:outline-none"
            placeholder="write your category description here"
          />
        </div>
        {/* Price */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-1 block">
            Price (LKR)
          </label>
          <input
            type="number"
            className="w-full px-4 py-3 rounded-lg bg-bg-2 text-text-white placeholder-gray-500 focus:outline-none"
            placeholder="Enter Price"
          />
        </div>
        {/* Ingredients */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">
              Ingredients
            </label>
            <button
              type="button"
              onClick={addIngredientRow}
              className="p-1 rounded-full bg-bg-1 hover:bg-bg-2"
            >
              <Plus size={16} className="text-text-white" />
            </button>
          </div>

          {/* Ingredient Rows */}
          {ingredients.map((_, index) => (
            <div key={index} className="grid grid-cols-3 gap-2 mb-2">
              <select className="col-span-2 px-3 py-2 rounded-lg bg-bg-1 text-text-white">
                <option>Select</option>
                <option>Flour</option>
                <option>Sugar</option>
                <option>Salt</option>
              </select>
              <div className="flex gap-1">
                <input
                  type="number"
                  className="w-full px-2 py-2 rounded-lg bg-bg-1 text-text-white"
                  placeholder="20"
                />
                <select className="px-2 rounded-lg bg-bg-1 text-text-white">
                  <option>g</option>
                  <option>Kg</option>
                  <option>NA</option>
                </select>
              </div>
            </div>
          ))}
        </div>
        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-bg-1 text-text-white hover:bg-bg-2"
          >
            Cancel
          </button>
          <button className="px-5 py-2 rounded-lg bg-primary text-text-black font-semibold hover:bg-secondary">
            Save
          </button>
        </div>
      </div>
    </>
  );
}