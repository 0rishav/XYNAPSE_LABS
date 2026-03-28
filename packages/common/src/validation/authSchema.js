import { z } from "zod";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

const emailField = z
  .string({ required_error: "Email is required" })
  .trim()
  .regex(emailRegex, { message: "Please provide a valid email address" });

const strongPasswordField = z
  .string({ required_error: "Password is required" })
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(passwordRegex, {
    message:
      "Password must include uppercase, lowercase, number and special character (@$!%*?&)",
  });

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required" })
      .min(2, { message: "Name must be at least 2 characters" })
      .trim(),
    email: emailField,
    password: strongPasswordField,
    confirmPassword: z.string({
      required_error: "Confirm password is required",
    }),
    image: z.any().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Session token is required"),
    newPassword: z.string().regex(passwordRegex, {
      message:
        "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters",
    }),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().regex(passwordRegex, {
      message:
        "New password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters",
    }),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password cannot be the same as current password",
    path: ["newPassword"],
  });
