export type UnitType = "g" | "ml" | "Piece";
export type LegacyUnitType = UnitType | "Kg" | "Litre" | string;

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
  unit: LegacyUnitType;
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

export function normalizeInventoryUnit(unit?: LegacyUnitType): UnitType {
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

  return "Piece";
}

export const mapInventoryItem = (item: InventoryApiItem): InventoryItem => ({
  id: item._id,
  name: item.name,
  itemId: item.itemId,
  quantity: item.quantity,
  cost: item.cost,
  unit: normalizeInventoryUnit(item.unit),
  availability: item.availability,
  image: item.image,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});