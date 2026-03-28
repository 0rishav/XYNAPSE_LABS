import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const updateProgressSchema = z.object({
  body: z
    .object({
      type: z.enum(["chapter", "content"], {
        errorMap: () => ({
          message: "Type must be either 'chapter' or 'content'",
        }),
      }),
      chapterId: z
        .string()
        .regex(objectIdRegex, "Invalid Chapter ID")
        .optional()
        .nullable(),
      contentId: z
        .string()
        .regex(objectIdRegex, "Invalid Content ID")
        .optional()
        .nullable(),
      status: z.enum(["read", "in_progress"]).default("read"),
      metadata: z.record(z.any()).optional(),
    })
    .refine(
      (data) => {
        if (data.type === "chapter" && !data.chapterId) return false;
        return true;
      },
      {
        message: "chapterId is required when type is 'chapter'",
        path: ["chapterId"],
      },
    )
    .refine(
      (data) => {
        if (data.type === "content" && !data.contentId) return false;
        return true;
      },
      {
        message: "contentId is required when type is 'content'",
        path: ["contentId"],
      },
    ),
});

export const getCourseProgressSchema = z.object({
  params: z.object({
    courseId: z.string().regex(objectIdRegex, "Invalid Course ID"),
  }),
});

export const getContentStatusSchema = z.object({
  params: z.object({
    contentId: z.string().regex(objectIdRegex, "Invalid Content ID"),
  }),
});
