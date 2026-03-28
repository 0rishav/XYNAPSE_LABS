import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

export const createChapterSchema = z.object({
  body: z.object({
    courseId: objectIdSchema,
    title: z.string({ required_error: "Title is required" }).min(3).max(200),
    slug: z.string().min(3).lowercase().trim().optional(),
    description: z.string().max(1000).optional(),
    order: z
      .number({ required_error: "Order is required" })
      .int()
      .nonnegative(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    isPreview: z.boolean().default(false),
    estimatedDurationMinutes: z.number().nonnegative().optional(),
    totalMcqs: z.number().nonnegative().optional(),
    totalProblems: z.number().nonnegative().optional(),
    createdBy: objectIdSchema.optional(),
  }),
});

export const updateChapterSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    slug: z.string().min(3).lowercase().trim().optional(),
    description: z.string().max(1000).optional(),
    order: z.number().int().nonnegative().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    isPreview: z.boolean().optional(),
    estimatedDurationMinutes: z.number().nonnegative().optional(),
    totalMcqs: z.number().nonnegative().optional(),
    totalProblems: z.number().nonnegative().optional(),
    updatedBy: objectIdSchema.optional(),
  }),
});

export const reorderChaptersSchema = z.object({
  body: z.object({
    courseId: objectIdSchema,
    chapters: z
      .array(
        z.object({
          id: objectIdSchema,
          order: z.number().int().nonnegative(),
        }),
      )
      .min(1, "Chapters array cannot be empty"),
  }),
});
