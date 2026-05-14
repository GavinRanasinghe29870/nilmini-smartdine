export type UnitType = "Kg" | "Litre" | "Piece";

export type InventoryItem = {
  id: string;
  name: string;
  itemId: string;
  quantity: number;
  cost: number;
  unit: UnitType;
  availability: "In Stock" | "Out of Stock";
  image: string;
  createdAt?: string;
  updatedAt?: string;
};

export type InventoryApiItem = {
  _id: string;
  name: string;
  itemId: string;
  quantity: number;
  cost: number;
  unit: UnitType;
  availability: "In Stock" | "Out of Stock";
  image: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export const mapInventoryItem = (item: InventoryApiItem): InventoryItem => ({
  id: item._id,
  name: item.name,
  itemId: item.itemId,
  quantity: item.quantity,
  cost: item.cost,
  unit: item.unit,
  availability: item.availability,
  image: item.image,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});