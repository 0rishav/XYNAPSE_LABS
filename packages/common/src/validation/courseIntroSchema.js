import { z } from "zod";

const introBlockSchema = z.object({
  type: z.enum(
    [
      "heading",
      "paragraph",
      "bullet_list",
      "numbered_list",
      "code",
      "image",
      "video",
      "quote",
      "divider",
    ],
    { required_error: "Block type is required" },
  ),

  data: z
    .record(z.any(), { required_error: "Block data is required" })
    .refine((val) => Object.keys(val).length > 0, "Data cannot be empty"),

  order: z.number({ required_error: "Order is required" }).int().min(0),
});

export const courseIntroValidationSchema = {
  create: z.object({
    body: z.object({
      courseId: z
        .string({ required_error: "Course ID is required" })
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId"),
      title: z.string().trim().min(3).max(100).optional(),
      blocks: z
        .array(introBlockSchema)
        .min(1, "At least one content block is required"),
      isPublished: z.boolean().optional(),
    }),
  }),

  update: z.object({
    params: z.object({
      courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Course ID"),
    }),
    body: z
      .object({
        title: z.string().trim().min(3).max(100).optional(),
        blocks: z.array(introBlockSchema).optional(),
        isPublished: z.boolean().optional(),
      })
      .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update",
      }),
  }),

  updateStatus: z.object({
    body: z.object({
      isPublished: z.boolean({
        required_error: "isPublished status is required",
      }),
    }),
  }),

  reorder: z.object({
    body: z.object({
      blocks: z
        .array(
          z.object({
            type: z.string(),
            data: z.any(),
            order: z.number().int(),
          }),
        )
        .min(1, "Blocks array cannot be empty"),
    }),
  }),
};
