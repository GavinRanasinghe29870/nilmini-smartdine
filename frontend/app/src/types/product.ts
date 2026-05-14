export type IngredientInput = {
  name: string;
  quantity: string;
  unit: string;
};

export type InventoryIngredient = {
  id?: string;
  _id?: string;
  name: string;
  unit?: string;
  measureType?: string;
  measuringType?: string;
  measurementType?: string;
  quantity?: number;
  availability?: string;
};

export type ProductType =
  | "prepared_food"
  | "beverage"
  | "retail_stock"
  | "non_menu_item";

export type ProductDto = {
  id: string;
  name: string;
  description: string;
  itemId: string;
  categoryId: string;
  categoryName: string;
  price: number;
  availability: string;
  image?: string;
  ingredients: IngredientInput[];
  productType?: ProductType;
  includeInAiMenu?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateProductPayload = {
  name: string;
  categoryId: string;
  description: string;
  price: number;
  availability: string;
  image?: string;
  ingredients: IngredientInput[];
  productType?: ProductType;
  includeInAiMenu?: boolean;
};

export type UpdateProductPayload = {
  name: string;
  categoryId: string;
  description: string;
  price: number;
  availability: string;
  image?: string;
  ingredients: IngredientInput[];
  productType?: ProductType;
  includeInAiMenu?: boolean;
};