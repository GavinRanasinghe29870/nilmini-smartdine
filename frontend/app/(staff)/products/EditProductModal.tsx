"use client";
import { X, Plus } from "lucide-react";
import { useState, useEffect } from "react";

type Ingredient = {
  name: string;
  quantity: string;
  unit: string;
};

type Product = {
  name: string;
  category: string;
  description: string;
  price: number;
  image?: string;
  ingredients: Ingredient[];
};

export default function EditProductModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}) {
  const getInitialForm = (): Product => {
    if (!product) {
      return {
        name: "",
        category: "",
        description: "",
        price: 0,
        ingredients: [{ name: "", quantity: "", unit: "g" }],
      };
    }

    return {
      ...product,
      ingredients:
        product.ingredients.length > 0
          ? product.ingredients
          : [{ name: "", quantity: "", unit: "g" }],
    };
  };

  const [form, setForm] = useState<Product>(getInitialForm());

  // Reset form only when modal opens or product changes
  useEffect(() => {
    if (open) {
      setForm(getInitialForm());
    }
  }, [open, product]);
  // return if modal is closed
  if (!open) return null;

  const addIngredientRow = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: "", quantity: "", unit: "g" }],
    }));
  };

  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      ),
    }));
  };

  const removeIngredientRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#1c1f1e] z-50 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            {product ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#2a2e2d]"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Name */}
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full mb-3 px-3 py-2 rounded-lg bg-bg-1 text-text-white"
          placeholder="Product Name"
        />

        {/* Category */}
        <input
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full mb-3 px-3 py-2 rounded-lg bg-bg-1 text-text-white"
          placeholder="Category"
        />

        {/* Description */}
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full mb-3 px-3 py-2 rounded-lg bg-bg-1 text-text-white resize-none h-24"
          placeholder="Description"
        />

        {/* Price */}
        <input
          type="number"
          value={form.price}
          onChange={(e) =>
            setForm({ ...form, price: Number(e.target.value) || 0 })
          }
          className="w-full mb-6 px-3 py-2 rounded-lg bg-bg-1 text-text-white"
          placeholder="Price"
        />

        {/* Ingredients */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-gray-400">Ingredients</label>
            <button
              onClick={addIngredientRow}
              className="p-1 rounded-full bg-bg-1 hover:bg-bg-2"
            >
              <Plus size={16} className="text-text-white" />
            </button>
          </div>

          {form.ingredients.map((ingredient, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 mb-2 items-center"
            >
              {/* Ingredient name */}
              <input
                value={ingredient.name}
                onChange={(e) =>
                  updateIngredient(index, "name", e.target.value)
                }
                className="col-span-6 px-3 py-2 rounded-lg bg-bg-1 text-text-white"
                placeholder="Ingredient name"
              />

              {/* Quantity */}
              <input
                value={ingredient.quantity}
                onChange={(e) =>
                  updateIngredient(index, "quantity", e.target.value)
                }
                className="col-span-3 px-3 py-2 rounded-lg bg-bg-1 text-text-white"
                placeholder="Qty"
              />

              {/* Unit */}
              <select
                value={ingredient.unit}
                onChange={(e) =>
                  updateIngredient(index, "unit", e.target.value)
                }
                className="col-span-2 px-2 py-2 rounded-lg bg-bg-1 text-text-white"
              >
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="L">L</option>
                <option value="NA">NA</option>
              </select>

              {/* Remove button */}
              <button
                onClick={() => removeIngredientRow(index)}
                disabled={form.ingredients.length === 1}
                className="col-span-1 flex justify-center items-center p-2 rounded-lg hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>
          ))}
        </div>

        {/* Save / Cancel buttons*/}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg bg-bg-1 text-text-white hover:bg-bg-2"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              //save logic
              console.log("Saved product:", form);
              onClose();
            }}
            className="flex-1 py-3 rounded-lg bg-primary text-text-white hover:bg-secondary"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}