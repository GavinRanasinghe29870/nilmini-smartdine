"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import {
  getImageSrc,
  getInventoryIngredients,
  getInventoryIngredientUnit,
  normalizeImageForDb,
  updateProduct,
  uploadImage,
} from "../../src/lib/api/product.api";
import type { CategoryDto } from "../../src/types/category";
import type {
  ProductDto,
  IngredientInput,
  InventoryIngredient,
} from "../../src/types/product";

type Props = {
  open: boolean;
  onClose: () => void;
  product: ProductDto | null;
  categories: CategoryDto[];
  onSaved: () => void | Promise<void>;
};

type ProductForm = {
  name: string;
  categoryId: string;
  description: string;
  price: string;
  availability: string;
  image: string;
  ingredients: IngredientInput[];
};

const NO_INGREDIENTS_VALUE = "__NO_INGREDIENTS__";

function getInitialForm(): ProductForm {
  return {
    name: "",
    categoryId: "",
    description: "",
    price: "",
    availability: "In Stock",
    image: "",
    ingredients: [{ name: "", quantity: "", unit: "" }],
  };
}

function getNoIngredientsRow(): IngredientInput {
  return {
    name: NO_INGREDIENTS_VALUE,
    quantity: "",
    unit: "",
  };
}

function isNoIngredientName(name?: string) {
  const value = String(name || "")
    .trim()
    .toLowerCase();

  return (
    value === NO_INGREDIENTS_VALUE.toLowerCase() ||
    value === "no ingredients" ||
    value === "no ingredient" ||
    value === "none"
  );
}

function normalizeUnitForForm(unit?: string) {
  const value = String(unit || "")
    .trim()
    .toLowerCase();

  if (["kg", "kilogram", "kilograms", "g", "gram", "grams"].includes(value)) {
    return "g";
  }

  if (
    [
      "l",
      "liter",
      "litre",
      "liters",
      "litres",
      "ml",
      "milliliter",
      "millilitre",
      "milliliters",
      "millilitres",
    ].includes(value)
  ) {
    return "ml";
  }

  if (["piece", "pieces", "pcs", "pc", "unit", "units"].includes(value)) {
    return "Piece";
  }

  return String(unit || "").trim();
}

function isNoIngredientsSelected(ingredients: IngredientInput[]) {
  return ingredients.some((item) => item.name === NO_INGREDIENTS_VALUE);
}

export default function EditProductModal({
  open,
  onClose,
  product,
  categories,
  onSaved,
}: Props) {
  const [form, setForm] = useState<ProductForm>(getInitialForm());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [inventoryIngredients, setInventoryIngredients] = useState<
    InventoryIngredient[]
  >([]);
  const [ingredientLoading, setIngredientLoading] = useState(false);

  useEffect(() => {
    if (open && product) {
      const productIngredients = Array.isArray(product.ingredients)
        ? product.ingredients.filter((item) => !isNoIngredientName(item.name))
        : [];

      setForm({
        name: product.name || "",
        categoryId: product.categoryId || "",
        description: product.description || "",
        price: String(product.price || ""),
        availability: product.availability || "In Stock",
        image: normalizeImageForDb(product.image),
        ingredients:
          productIngredients.length > 0
            ? productIngredients.map((item) => ({
                name: item.name || "",
                quantity: String(item.quantity || ""),
                unit: normalizeUnitForForm(item.unit),
              }))
            : [getNoIngredientsRow()],
      });

      setPreview(getImageSrc(product.image));
      setSelectedFile(null);
      setSaving(false);
      setError("");

      const loadIngredients = async () => {
        try {
          setIngredientLoading(true);
          const data = await getInventoryIngredients();
          setInventoryIngredients(data);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to load ingredients"
          );
        } finally {
          setIngredientLoading(false);
        }
      };

      loadIngredients();
    }
  }, [open, product]);

  const noIngredientsSelected = isNoIngredientsSelected(form.ingredients);

  const addIngredientRow = () => {
    if (noIngredientsSelected) return;

    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: "", quantity: "", unit: "" }],
    }));
  };

  const updateIngredientSelection = (index: number, ingredientName: string) => {
    if (ingredientName === NO_INGREDIENTS_VALUE) {
      setForm((prev) => ({
        ...prev,
        ingredients: [getNoIngredientsRow()],
      }));
      return;
    }

    const selectedIngredient = inventoryIngredients.find(
      (item) => item.name === ingredientName
    );

    const unit = selectedIngredient
      ? getInventoryIngredientUnit(selectedIngredient)
      : "";

    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((item, i) =>
        i === index
          ? {
              ...item,
              name: selectedIngredient?.name || ingredientName,
              unit: unit || item.unit || "",
            }
          : item
      ),
    }));
  };

  const updateIngredientQuantity = (index: number, quantity: string) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((item, i) =>
        i === index ? { ...item, quantity } : item
      ),
    }));
  };

  const removeIngredientRow = (index: number) => {
    setForm((prev) => {
      if (prev.ingredients[index]?.name === NO_INGREDIENTS_VALUE) {
        return {
          ...prev,
          ingredients: [{ name: "", quantity: "", unit: "" }],
        };
      }

      return {
        ...prev,
        ingredients:
          prev.ingredients.length === 1
            ? [{ name: "", quantity: "", unit: "" }]
            : prev.ingredients.filter((_, i) => i !== index),
      };
    });
  };

  const isIngredientAlreadySelected = (
    ingredientName: string,
    currentIndex: number
  ) => {
    return form.ingredients.some(
      (item, index) =>
        index !== currentIndex &&
        item.name !== NO_INGREDIENTS_VALUE &&
        item.name === ingredientName
    );
  };

  const handleSave = async () => {
    if (!product) return;

    try {
      setSaving(true);
      setError("");

      if (!form.name.trim()) {
        throw new Error("Product name is required");
      }

      if (!form.categoryId) {
        throw new Error("Category is required");
      }

      if (!form.price || Number(form.price) < 0) {
        throw new Error("Valid price is required");
      }

      const validIngredients = noIngredientsSelected
        ? []
        : form.ingredients
            .filter(
              (item) =>
                item.name.trim() && item.name.trim() !== NO_INGREDIENTS_VALUE
            )
            .map((item) => ({
              name: item.name.trim(),
              quantity: String(item.quantity || "").trim(),
              unit: String(item.unit || "").trim(),
            }));

      for (const ingredient of validIngredients) {
        if (!ingredient.quantity || Number(ingredient.quantity) <= 0) {
          throw new Error(
            `Please enter a valid quantity for ${ingredient.name}`
          );
        }

        if (!ingredient.unit) {
          throw new Error(`Measure type is missing for ${ingredient.name}`);
        }
      }

      let imagePath = normalizeImageForDb(form.image);

      if (selectedFile) {
        imagePath = await uploadImage(selectedFile);
      }

      await updateProduct(product.id, {
        name: form.name.trim(),
        categoryId: form.categoryId,
        description: form.description.trim(),
        price: Number(form.price),
        availability: form.availability,
        image: imagePath,
        ingredients: validIngredients,
      });

      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !product) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-bg-2 z-50 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-white">
            Edit Product
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#2a2e2d]"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="flex flex-col items-start mb-6">
          <div className="w-32 h-32 rounded-lg bg-bg-1 flex items-center justify-center mb-2 overflow-hidden">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span className="text-gray-500 text-sm">No image</span>
            )}
          </div>

          <label className="text-sm text-primary hover:underline cursor-pointer">
            Change Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setSelectedFile(file);
                setPreview(file ? URL.createObjectURL(file) : getImageSrc(form.image));
              }}
            />
          </label>
        </div>

        <div className="mb-4">
          <label className="text-sm text-text-white mb-1 block">
            Product Name
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white placeholder-gray-500 focus:outline-none"
            placeholder="Enter Product name"
          />
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1 block">Category</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white focus:outline-none"
          >
            <option value="">Select Category</option>

            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1 block">
            Description
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white placeholder-gray-500 resize-none focus:outline-none"
            placeholder="Write your product description here"
          />
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1 block">
            Price (LKR)
          </label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white placeholder-gray-500 focus:outline-none"
            placeholder="Enter Price"
          />
        </div>

        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-1 block">
            Availability
          </label>
          <select
            value={form.availability}
            onChange={(e) => setForm({ ...form, availability: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-bg-1 text-text-white focus:outline-none"
          >
            <option value="In Stock">In Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">Ingredients</label>

            <button
              type="button"
              onClick={addIngredientRow}
              disabled={noIngredientsSelected}
              className="p-1 rounded-full bg-bg-1 hover:bg-bg-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={16} className="text-text-white" />
            </button>
          </div>

          {ingredientLoading && (
            <p className="text-sm text-gray-500 mb-3">
              Loading ingredients...
            </p>
          )}

          {form.ingredients.map((ingredient, index) => {
            const isNoIngredientsRow = ingredient.name === NO_INGREDIENTS_VALUE;
            const isExistingIngredientMissing =
              ingredient.name &&
              !isNoIngredientsRow &&
              !inventoryIngredients.some((item) => item.name === ingredient.name);

            return (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 mb-2 items-center"
              >
                <select
                  value={ingredient.name}
                  onChange={(e) =>
                    updateIngredientSelection(index, e.target.value)
                  }
                  className="col-span-5 px-3 py-2 rounded-lg bg-bg-1 text-text-white"
                >
                  <option value="">Select ingredient</option>
                  <option value={NO_INGREDIENTS_VALUE}>No ingredients</option>

                  {isExistingIngredientMissing && (
                    <option value={ingredient.name}>
                      {ingredient.name} {ingredient.unit ? `(${ingredient.unit})` : ""}
                    </option>
                  )}

                  {inventoryIngredients.map((item) => {
                    const unit = getInventoryIngredientUnit(item);

                    return (
                      <option
                        key={item.id || item._id || item.name}
                        value={item.name}
                        disabled={isIngredientAlreadySelected(item.name, index)}
                      >
                        {item.name} {unit ? `(${unit})` : ""}
                      </option>
                    );
                  })}
                </select>

                <input
                  value={isNoIngredientsRow ? "" : ingredient.quantity}
                  onChange={(e) =>
                    updateIngredientQuantity(index, e.target.value)
                  }
                  type="number"
                  min="0"
                  disabled={isNoIngredientsRow}
                  className="col-span-3 px-3 py-2 rounded-lg bg-bg-1 text-text-white disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="Qty"
                />

                <input
                  value={isNoIngredientsRow ? "" : ingredient.unit}
                  readOnly
                  className="col-span-3 px-3 py-2 rounded-lg bg-bg-1 text-gray-300"
                  placeholder="Unit"
                />

                <button
                  type="button"
                  onClick={() => removeIngredientRow(index)}
                  className="col-span-1 flex justify-center items-center p-2 rounded-lg hover:bg-red-900/30"
                >
                  <Trash2 size={15} className="text-red-400" />
                </button>
              </div>
            );
          })}

          {noIngredientsSelected && (
            <p className="text-xs text-gray-500 mt-2">
              This product will be saved without ingredient cost calculation.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-bg-1 text-text-white hover:bg-bg-2"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-primary text-text-black font-semibold hover:bg-secondary disabled:opacity-60"
          >
            {saving ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </>
  );
}