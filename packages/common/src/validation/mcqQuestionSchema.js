import { z } from "zod";

export const createMCQSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
    tags: z.array(z.string()).default([]),
    options: z.array(z.object({
      text: z.string().min(1),
      isCorrect: z.boolean().default(false),
      explanation: z.string().optional()
    })).min(2, "At least 2 options are required"),
    multipleCorrect: z.boolean().default(false),
    marks: z.number().nonnegative().default(1),
    negativeMarks: z.number().nonnegative().default(0),
    chapterId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Chapter ID"),
    paperId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Paper ID").optional(),
    accessLevel: z.enum(["free", "standard", "premium"]).default("free"),
    referenceLinks: z.array(z.string().url()).optional(),
    customFields: z.any().optional(),
  })
});

export const updateMCQSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Question ID"),
  }),
  body: z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    tags: z.array(z.string()).optional(),
    options: z.array(z.object({
      text: z.string().min(1),
      isCorrect: z.boolean().default(false),
      explanation: z.string().optional()
    })).min(2, "At least 2 options are required").optional(),
    multipleCorrect: z.boolean().optional(),
    marks: z.number().nonnegative().optional(),
    negativeMarks: z.number().nonnegative().optional(),
    chapterId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Chapter ID").optional(),
    paperId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Paper ID").optional(),
    accessLevel: z.enum(["free", "standard", "premium"]).optional(),
    referenceLinks: z.array(z.string().url()).optional(),
    customFields: z.any().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }),
  body: z.object({
    status: z.enum(["draft", "published", "archived"]),
  }),
});

export const updateAccessLevelSchema = z.object({
  params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }),
  body: z.object({
    accessLevel: z.enum(["free", "standard", "premium"]),
  }),
});