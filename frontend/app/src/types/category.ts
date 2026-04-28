export type CategoryDto = {
  id: string;
  name: string;
  description: string;
  count: number;
  icon?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateCategoryPayload = {
  name: string;
  description: string;
  image?: string;
  icon?: string;
};

export type UpdateCategoryPayload = {
  name: string;
  description: string;
  image?: string;
  icon?: string;
};