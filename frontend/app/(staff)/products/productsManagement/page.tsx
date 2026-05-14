"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Grid3x3,
  Pizza,
  Hamburger,
  Drumstick,
  Croissant,
  CupSoda,
  Fish,
  LucideIcon,
  Trash2,
  Plus,
  Pencil,
} from "lucide-react";
import DataTable, { Column } from "../../../src/components/DataTable";
import AddProductModal from "../../products/AddProductModal";
import EditProductModal from "../../products/EditProductModal";
import AddCategoryModal from "../../products/AddCategoryModal";
import EditCategoryModal from "../../products/EditCategoryModal";
import {
  deleteProduct,
  getCategories,
  getImageSrc,
  getProducts,
} from "../../../src/lib/api/product.api";
import type { CategoryDto } from "../../../src/types/category";
import type { ProductDto } from "../../../src/types/product";

const iconMap: Record<string, LucideIcon> = {
  Grid3x3,
  Pizza,
  Hamburger,
  Drumstick,
  Croissant,
  CupSoda,
  Fish,
};

export default function ProductsPage() {
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openAddProduct, setOpenAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);

  const [openAddCategory, setOpenAddCategory] = useState(false);
  const [openEditCategory, setOpenEditCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(
    null
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [productData, categoryData] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);

      setProducts(productData);
      setCategories(categoryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const allCategories = useMemo(() => {
    return [
      {
        id: "all",
        name: "All",
        description: "All available products",
        count: products.length,
        icon: "Grid3x3",
        image: "",
      },
      ...categories,
    ];
  }, [categories, products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") return products;

    return products.filter((item) => item.categoryName === selectedCategory);
  }, [products, selectedCategory]);

  const columns: Column<ProductDto>[] = [
    {
      key: "image",
      label: "Product",
      render: (row) => {
        const imageSrc = getImageSrc(row.image, "/images/placeholder.png");

        return (
          <div className="relative w-16 h-16">
            <img
              src={imageSrc}
              alt={row.name}
              className="w-16 h-16 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = "/images/placeholder.png";
              }}
            />
          </div>
        );
      },
    },
    {
      key: "name",
      label: "Product Name",
      render: (row) => (
        <div>
          <p className="font-medium text-text-white">{row.name}</p>
          <p className="text-sm text-gray-400">{row.description}</p>
        </div>
      ),
    },
    { key: "itemId", label: "Item ID", align: "center" },
    { key: "categoryName", label: "Category", align: "center" },
    {
      key: "price",
      label: "Price",
      align: "right",
      render: (row) => `LKR ${Number(row.price || 0).toFixed(2)}`,
    },
    {
      key: "availability",
      label: "Availability",
      align: "center",
      render: (row) => (
        <span
          className={
            row.availability === "In Stock"
              ? "text-primary font-medium"
              : "text-red-400 font-medium"
          }
        >
          {row.availability}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      align: "center",
      render: (row) => (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setEditingProduct(row)}
            className="text-gray-400 hover:text-text-white"
          >
            <Pencil size={16} />
          </button>

          <button
            className="p-1 rounded-md text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
            onClick={async () => {
              const confirmed = window.confirm(
                `Are you sure you want to delete "${row.name}"?`
              );

              if (!confirmed) return;

              try {
                await deleteProduct(row.id);
                await loadData();
              } catch (err) {
                alert(
                  err instanceof Error ? err.message : "Failed to delete product"
                );
              }
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-lg hover:bg-bg-1"
            onClick={() => router.back()}
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </button>

          <h1 className="text-2xl font-semibold">Products</h1>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium">Categories</h2>

        <button
          onClick={() => setOpenAddCategory(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-text-black rounded-lg"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className="flex gap-4 mb-10 overflow-x-auto scrollbar-hide pb-4">
        {allCategories.map((cat) => {
          const Icon = iconMap[cat.icon || "Grid3x3"] || Grid3x3;
          const isSelected = selectedCategory === cat.name;
          const categoryImage = getImageSrc(cat.image);

          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`relative flex flex-col justify-between rounded-2xl min-w-30 h-32 px-4 py-4 cursor-pointer overflow-hidden ${
                isSelected
                  ? "bg-primary text-text-white"
                  : "bg-bg-2 hover:bg-bg-1"
              }`}
            >
              {categoryImage && cat.name !== "All" && (
                <>
                  <img
                    src={categoryImage}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-35"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40" />
                </>
              )}

              {cat.name !== "All" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategory(cat);
                    setOpenEditCategory(true);
                  }}
                  className="absolute top-3 left-3 p-1 rounded-md bg-bg-1 z-10"
                >
                  <Pencil size={14} />
                </button>
              )}

              <Icon
                size={32}
                className={`absolute top-3 right-3 z-10 ${
                  isSelected ? "text-text-white" : "text-primary"
                }`}
              />

              <div className="absolute bottom-3 left-3 text-left z-10">
                <div className="font-medium text-sm">{cat.name}</div>
                <div className="text-xs opacity-70">{cat.count} items</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center mb-3">
        <div>
          {loading && <p className="text-sm text-gray-400">Loading...</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <button
          onClick={() => setOpenAddProduct(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-text-black rounded-lg"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <DataTable columns={columns} data={filteredProducts} />

      <AddProductModal
        open={openAddProduct}
        onClose={() => setOpenAddProduct(false)}
        categories={categories}
        onSaved={loadData}
      />

      <EditProductModal
        open={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        product={editingProduct}
        categories={categories}
        onSaved={loadData}
      />

      <AddCategoryModal
        open={openAddCategory}
        onClose={() => setOpenAddCategory(false)}
        onSaved={loadData}
      />

      <EditCategoryModal
        open={openEditCategory}
        onClose={() => {
          setOpenEditCategory(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSaved={loadData}
      />
    </div>
  );
}