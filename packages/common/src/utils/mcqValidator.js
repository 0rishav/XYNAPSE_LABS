import ErrorHandler from "./ErrorHandler.js";
import { sanitizeObject } from "./sanitizeInput.js";

export const validateMCQPayload = (body) => {
  const schema = {
    title: "string",
    description: "string",
    difficulty: "string",
    accessLevel: "string",
    explanation: "string",
  };

  const sanitizedBody = sanitizeObject(body, schema);

  const {
    tags,
    options,
    multipleCorrect,
    marks,
    negativeMarks,
    labId,
    labSectionId,
    referenceLinks,
    customFields,
  } = body;

  // validations
  if (!sanitizedBody.title || sanitizedBody.title.length < 3) {
    throw new ErrorHandler("Title is required (min 3 chars)", 400);
  }

  if (!Array.isArray(options) || options.length < 2) {
    throw new ErrorHandler("MCQ must have at least 2 options", 400);
  }

  if (
    !options.every(
      (opt) => opt && typeof opt.text === "string" && opt.text.trim() !== "",
    )
  ) {
    throw new ErrorHandler("Each option must have non-empty text", 400);
  }

  const hasCorrect = options.some((opt) => opt.isCorrect === true);
  if (!hasCorrect) {
    throw new ErrorHandler("At least one option must be correct", 400);
  }

  if (typeof multipleCorrect !== "boolean") {
    throw new ErrorHandler("multipleCorrect must be true or false", 400);
  }

  if (marks === undefined || isNaN(marks) || Number(marks) <= 0) {
    throw new ErrorHandler("Marks must be a positive number", 400);
  }

  if (
    negativeMarks !== undefined &&
    (isNaN(negativeMarks) || Number(negativeMarks) < 0)
  ) {
    throw new ErrorHandler("negativeMarks must be a non-negative number", 400);
  }

  if (
    !["easy", "medium", "hard"].includes(
      sanitizedBody.difficulty?.toLowerCase(),
    )
  ) {
    throw new ErrorHandler("Difficulty must be easy, medium, or hard", 400);
  }

  if (
    !["free", "standard", "premium"].includes(
      sanitizedBody.accessLevel?.toLowerCase(),
    )
  ) {
    throw new ErrorHandler(
      "Access level must be free, standard, or premium",
      400,
    );
  }

  if (!labId) {
    throw new ErrorHandler("labId is required", 400);
  }

  if (!labSectionId) {
    throw new ErrorHandler("labSectionId is required", 400);
  }

  if (referenceLinks && !Array.isArray(referenceLinks)) {
    throw new ErrorHandler("referenceLinks must be an array", 400);
  }

  return {
    sanitizedBody,
    tags,
    options,
    multipleCorrect,
    marks,
    negativeMarks,
    labId,
    labSectionId,
    referenceLinks,
    customFields,
  };
};
