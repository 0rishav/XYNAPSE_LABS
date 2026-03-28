import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Category name is required" }).trim().min(2).max(50),
    description: z.string().trim().max(500).optional(),
    icon: z.string().url("Invalid icon URL").optional(),
    sortOrder: z.number().int().nonnegative().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID"),
  }),
  body: z.object({
    name: z.string().trim().min(2).max(50).optional(),
    description: z.string().trim().max(500).optional(),
    icon: z.string().url().optional(),
    isActive: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  }),
});