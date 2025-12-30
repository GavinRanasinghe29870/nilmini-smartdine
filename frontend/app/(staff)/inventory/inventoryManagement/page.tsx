"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import DataTable, { Column } from "../../../src/components/DataTable";
import Image from "next/image";
import AddItemModal from "../AddItemModal";
import EditItemModal from "../EditItemModal";

type InventoryItem = {
  id: number;
  name: string;
  itemId: string;
  quantity: number;
  cost: number;
  availability: "In Stock" | "Out of Stock";
  image: string;
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(
    Array.from({ length: 6 }).map((_, i) => ({
      id: i + 1,
      name: "Flour",
      itemId: "#22314644",
      quantity: 200,
      cost: 55,
      availability: "In Stock",
      image: "/images/flour.png",
    }))
  );

  /* 🔹 Quantity modal */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [newQuantity, setNewQuantity] = useState("");
  const [unit, setUnit] = useState("Kg");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  /* 🔹 Add Item modal */
  const [isAddItemOpen, setIsAddItemOpen] = useState(false); 

  const openModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setNewQuantity("");
    setUnit("Kg");
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditItem(item);
    setIsEditOpen(true);
  };


  const saveQuantity = () => {
    if (!selectedItem || !newQuantity) return;

    setInventory((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? { ...item, quantity: item.quantity + Number(newQuantity) }
          : item
      )
    );

    setIsModalOpen(false);
  };

  const saveEditedItem = (updatedItem: InventoryItem) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
  };


  const inventoryColumns: Column<InventoryItem>[] = [
    {
      key: "image",
      label: "Item",
      render: (item) => (
        <Image
          src={item.image}
          alt={item.name}
          width={40}
          height={40}
          className="rounded-lg"
        />
      ),
    },
    { key: "name", label: "Item Name" },
    { key: "itemId", label: "Item ID" },
    {
      key: "quantity",
      label: "Available Quantity",
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.quantity}Kg
          <button
            onClick={() => openModal(item)}
            className="p-1 bg-bg-1 rounded-full text-primary hover:bg-bg-2"
          >
            <Plus size={14} />
          </button>
        </div>
      ),
    },
    {
      key: "cost",
      label: "Cost",
      render: (item) => `$${item.cost.toFixed(2)}`,
    },
    { key: "availability", label: "Availability" },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (item) => (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => openEditModal(item)}
            className="text-gray-400 hover:text-text-white"
          >
            <Pencil size={16} />
          </button>
          <button className="text-red-500">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    }
  ];

  return (
    <main className="flex-1 p-8 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-h4 font-semibold">Inventory</h1>

        {/* ADD ITEM MODAL */}
        <button
          onClick={() => setIsAddItemOpen(true)}
          className="px-4 py-2 bg-primary text-text-black rounded-lg flex items-center gap-2"
        >
          <Plus size={16} />
          Add New Item
        </button>
      </div>

      {/* Table */}
      <DataTable columns={inventoryColumns} data={inventory} />

      {/* 🔹 Quantity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-bg-1 flex items-center justify-center z-50">
          <div className="bg-bg-2 rounded-xl w-[420px] p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-red-500"
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-semibold mb-4">Quantity</h2>

            <input
              type="number"
              placeholder="Enter quantity"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              className="w-full bg-bg-2 rounded-lg px-4 py-2 mb-4 outline-none"
            />

            <h3 className="text-sm mb-2">Unit type</h3>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full bg-bg-2 rounded-lg px-4 py-2 mb-6"
            >
              <option>Kg</option>
              <option>g</option>
              <option>L</option>
              <option>pcs</option>
            </select>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveQuantity}
                className="bg-primary text-text-black px-6 py-2 rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM MODAL */}
      <AddItemModal
        open={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
      />
      <EditItemModal
        open={isEditOpen}
        item={editItem}
        onClose={() => setIsEditOpen(false)}
        onSave={saveEditedItem}
      />

    </main>
  );
}