"use client";

import { useState } from "react";
import Image from "next/image";
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

/* TYPES */
type LocalProduct = {
  id: string;
  productName: string;
  description: string;
  itemId: string;
  category: string;
  price: number;
  availability: string;
  image?: string;
};

type EditProduct = {
  name: string;
  category: string;
  description: string;
  price: number;
  image?: string;
  ingredients: {
    name: string;
    quantity: string;
    unit: string;
  }[];
};


type Category = {
  name: string;
  description: string;
  count: number;
  icon: LucideIcon;
  image?: string;
};

/* MOCK DATA */
const mockProducts: LocalProduct[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `p-${i + 1}`,
  productName: "Chicken Parmesan",
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing.",
  itemId: "#22314644",
  category: "Chicken",
  price: 55,
  availability: "In Stock",
  image: "/images/chicken-parmesan.png",
}));

/* COMPONENT */
export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openAddProduct, setOpenAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EditProduct | null>(null);
  const [openAddCategory, setOpenAddCategory] = useState(false);
  const [openEditCategory, setOpenEditCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  /* COLUMNS */
  const columns: Column<LocalProduct>[] = [
    {
      key: "image",
      label: "Product",
      render: (row) => (
        <div className="relative w-16 h-16">
          <Image
            src={row.image || "/images/placeholder.png"}
            alt={row.productName}
            fill
            sizes="64px"
            className="rounded-lg object-cover"
          />
        </div>
      ),
    },
    {
      key: "productName",
      label: "Product Name",
      render: (row) => (
        <div>
          <p className="font-medium text-text-white">{row.productName}</p>
          <p className="text-sm text-gray-400">{row.description}</p>
        </div>
      ),
    },
    { key: "itemId", label: "Item ID", align: "center" },
    { key: "category", label: "Category", align: "center" },
    {
      key: "price",
      label: "Price",
      align: "right",
      render: (row) => `$${row.price.toFixed(2)}`,
    },
    {
      key: "availability",
      label: "Availability",
      align: "center",
      render: () => (
        <span className="text-primary font-medium">In Stock</span>
      ),
    },
    {
      key: "actions",
      label: "",
      align: "center",
      render: (row) => (
        <div className="flex items-center justify-center gap-3">
          {/* EDIT PRODUCT */}
          <button
            onClick={() => setEditingProduct(mapLocalToEditProduct(row))}
            className="text-gray-400 hover:text-text-white"
          >
            <Pencil size={16} />
          </button>

          {/* DELETE PRODUCT */}
          <button
            className="p-1 rounded-md text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
            onClick={() => console.log("Delete product:", row.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const categories: Category[] = [
    { name: "All", description: "All available products", count: 116, icon: Grid3x3 },
    { name: "Pizza", description: "Pizza items", count: 20, icon: Pizza },
    { name: "Burger", description: "Burger items", count: 15, icon: Hamburger },
    { name: "Chicken", description: "Chicken-based dishes", count: 10, icon: Drumstick },
    { name: "Bakery", description: "Bakery products", count: 18, icon: Croissant },
    { name: "Beverage", description: "Drinks and beverages", count: 12, icon: CupSoda },
    { name: "Seafood", description: "Seafood items", count: 18, icon: Fish },
  ];

  const mapLocalToEditProduct = (p: LocalProduct) => ({
    name: p.productName,
    category: p.category,
    description: p.description,
    price: p.price,
    image: p.image,
    ingredients: [{ name: "", quantity: "", unit: "g" }],
  });


  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-bg-1">
            <ArrowLeft size={20} className="text-gray-400" />
          </button>
          <h1 className="text-2xl font-semibold">Products</h1>
        </div>
      </div>

      {/* Categories */}
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

      {/* Categories Slider */}
      <div className="flex gap-4 mb-10 overflow-x-auto scrollbar-hide pb-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.name;

          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`relative flex flex-col justify-between rounded-2xl min-w-30 h-32 px-4 py-4 ${isSelected
                ? "bg-primary text-text-white"
                : "bg-bg-2 hover:bg-bg-1"
                }`}
            >
              {cat.name !== "All" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategory(cat);
                    setOpenEditCategory(true);
                  }}
                  className="absolute top-3 left-3 p-1 rounded-md bg-bg-1"
                >
                  <Pencil size={14} />
                </button>
              )}

              <Icon size={32} className="absolute top-3 right-3 text-primary" />

              <div className="absolute bottom-3 left-3">
                <div className="font-medium text-sm">{cat.name}</div>
                <div className="text-xs opacity-70">{cat.count} items</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Add Product */}
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setOpenAddProduct(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-text-black rounded-lg"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* DataTable */}
      <DataTable columns={columns} data={mockProducts} />

      {/* MODALS */}
      <AddProductModal
        open={openAddProduct}
        onClose={() => setOpenAddProduct(false)}
      />

      <EditProductModal
        open={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
      />

      <AddCategoryModal
        open={openAddCategory}
        onClose={() => setOpenAddCategory(false)}
      />

      {editingCategory && (
        <EditCategoryModal
          open={openEditCategory}
          category={editingCategory}
          onClose={() => setOpenEditCategory(false)}
        />
      )}
    </div>
  );
}
