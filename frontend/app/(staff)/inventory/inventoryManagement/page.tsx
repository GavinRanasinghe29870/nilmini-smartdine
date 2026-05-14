"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, ArrowLeft } from "lucide-react";
import DataTable, { Column } from "../../../src/components/DataTable";
import AddItemModal from "../AddItemModal";
import EditItemModal from "../EditItemModal";
import { useRouter } from "next/navigation";

import type { InventoryItem } from "../../../src/types/inventory";
import {
  addInventoryQuantity,
  createInventoryItem,
  deleteInventoryItem,
  getAllInventory,
  getInventoryImageSrc,
  updateInventoryItem,
} from "../../../src/lib/api/inventory.api";

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

export default function InventoryPage() {
  const router = useRouter();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [newQuantity, setNewQuantity] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const items = await getAllInventory();
      setInventory(items);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, "Failed to load inventory"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInventory();
  }, []);

  const openQuantityModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setNewQuantity("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditItem(item);
    setIsEditOpen(true);
  };

  const saveQuantity = async () => {
    if (!selectedItem || !newQuantity || Number(newQuantity) <= 0) return;

    try {
      await addInventoryQuantity(selectedItem.id, Number(newQuantity));
      setIsModalOpen(false);
      setSelectedItem(null);
      setNewQuantity("");
      await loadInventory();
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, "Failed to update quantity"));
    }
  };

  const saveNewItem = async (formData: FormData) => {
    await createInventoryItem(formData);
    await loadInventory();
  };

  const saveEditedItem = async (id: string, formData: FormData) => {
    await updateInventoryItem(id, formData);
    await loadInventory();
  };

  const handleDelete = async (item: InventoryItem) => {
    const confirmed = window.confirm(`Delete ${item.name}?`);
    if (!confirmed) return;

    try {
      await deleteInventoryItem(item.id);
      await loadInventory();
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, "Failed to delete item"));
    }
  };

  const inventoryColumns: Column<InventoryItem>[] = [
    {
      key: "image",
      label: "Item",
      render: (item) => {
        const imageSrc = getInventoryImageSrc(
          item.image,
          "/images/placeholder.png"
        );

        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-bg-1 flex items-center justify-center">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={item.name}
                className="h-16 w-16 rounded-lg object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/images/placeholder.png";
                }}
              />
            ) : (
              <span className="text-xs text-gray-500">No Img</span>
            )}
          </div>
        );
      },
    },
    { key: "name", label: "Item Name" },
    { key: "itemId", label: "Item ID" },
    {
      key: "quantity",
      label: "Available Quantity",
      render: (item) => (
        <div className="flex items-center gap-2">
          <span>
            {item.quantity} {item.unit}
          </span>

          <button
            onClick={() => openQuantityModal(item)}
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
      render: (item) => `LKR ${Number(item.cost || 0).toFixed(2)}`,
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

          <button
            onClick={() => handleDelete(item)}
            className="text-red-500 hover:text-red-400"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <main className="flex-1 p-8 relative">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-bg-2 hover:bg-bg-1"
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="text-h4 font-semibold">Inventory</h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-h5 font-medium">
          Inventory Items{" "}
          <span className="text-gray-400">({inventory.length})</span>
        </h2>

        <button
          onClick={() => setIsAddItemOpen(true)}
          className="px-4 py-2 bg-primary text-text-black rounded-lg flex items-center gap-2"
        >
          <Plus size={16} />
          Add New Item
        </button>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {errorMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="text-gray-400">Loading inventory...</div>
      ) : (
        <DataTable columns={inventoryColumns} data={inventory} />
      )}

      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-2 rounded-xl w-[420px] p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-red-500"
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-semibold mb-4">Add Quantity</h2>

            <div className="mb-3 text-sm text-gray-400">
              {selectedItem.name} ({selectedItem.unit})
            </div>

            <input
              type="number"
              min="1"
              placeholder="Enter quantity"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              className="w-full bg-bg-1 rounded-lg px-4 py-2 mb-6 outline-none text-text-white"
            />

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

      <AddItemModal
        open={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onSave={saveNewItem}
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