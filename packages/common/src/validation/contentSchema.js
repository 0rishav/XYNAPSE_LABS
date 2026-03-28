import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");

const contentBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("heading"),
    data: z.object({ text: z.string(), level: z.number().min(1).max(6) }),
    order: z.number(),
  }),
  z.object({
    type: z.literal("paragraph"),
    data: z.object({ text: z.string() }),
    order: z.number(),
  }),
  z.object({
    type: z.literal("code"),
    data: z.object({ code: z.string(), language: z.string() }),
    order: z.number(),
  }),
  z.object({
    type: z.literal("video"),
    data: z.object({
      url: z.string().url(),
      provider: z.string(),
      duration: z.number().optional(),
    }),
    order: z.number(),
  }),
  z.object({
    type: z.literal("image"),
    data: z.object({ url: z.string().url(), caption: z.string().optional() }),
    order: z.number(),
  }),
  z.object({ type: z.literal("divider"), data: z.any(), order: z.number() }),
  z.object({
    type: z.literal("bullet_list"),
    data: z.object({ items: z.array(z.string()) }),
    order: z.number(),
  }),
  z.object({
    type: z.literal("numbered_list"),
    data: z.object({ items: z.array(z.string()) }),
    order: z.number(),
  }),
  z.object({
    type: z.literal("quote"),
    data: z.object({ text: z.string(), author: z.string().optional() }),
    order: z.number(),
  }),
]);

export const createContentSchema = z.object({
  body: z.object({
    courseId: objectIdSchema,
    chapterId: objectIdSchema,
    title: z.string().min(2).max(255),
    blocks: z
      .array(contentBlockSchema)
      .min(1, "At least one content block is required"),
    accessType: z.enum(["free", "paid"]).default("free"),
    isPreviewFree: z.boolean().default(false),
    seo: z
      .object({
        metaTitle: z.string().max(60).optional(),
        metaDescription: z.string().max(160).optional(),
        keywords: z.array(z.string()).optional(),
        canonicalUrl: z.string().url().optional().or(z.literal("")),
        ogImage: z.string().url().optional().or(z.literal("")),
        noIndex: z.boolean().default(false),
      })
      .optional(),
    isPublished: z.boolean().default(false),
  }),
});

export const updateContentSchema = z.object({
  body: z
    .object({
      courseId: objectIdSchema.optional(),
      chapterId: objectIdSchema.optional(),
      title: z.string().min(2).max(255).optional(),

      blocks: z
        .array(contentBlockSchema)
        .min(1, "At least one content block is required")
        .optional(),

      accessType: z.enum(["free", "paid"]).optional(),
      isPreviewFree: z.boolean().optional(),

      seo: z
        .object({
          metaTitle: z.string().max(60).optional(),
          metaDescription: z.string().max(160).optional(),
          keywords: z.array(z.string()).optional(),
          canonicalUrl: z.string().url().optional().or(z.literal("")),
          ogImage: z.string().url().optional().or(z.literal("")),
          noIndex: z.boolean().optional(),
        })
        .optional(),

      isPublished: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),
});
