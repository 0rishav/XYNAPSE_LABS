import { z } from "zod";

const courseBody = z.object({
  title: z
    .string({ required_error: "Course title is required" })
    .trim()
    .min(5)
    .max(100),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID"),
  type: z.enum(["theory", "practical"], {
    required_error: "Course type is required",
  }),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  shortDescription: z.string().max(500).optional(),
  tags: z.array(z.string()).optional().default([]),
  badges: z
    .array(z.enum(["hot", "popular", "trending", "new"]))
    .optional()
    .default([]),
  parentCourse: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Parent Course ID")
    .optional()
    .nullable(),
});

export const createCourseSchema = z.object({
  body: courseBody,
});

export const updateCourseSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Course ID"),
  }),
  body: courseBody.partial().extend({
    isPublished: z.boolean().optional(),
    badges: z.array(z.enum(["hot", "popular", "trending", "new"])).optional(),
  }),
});
