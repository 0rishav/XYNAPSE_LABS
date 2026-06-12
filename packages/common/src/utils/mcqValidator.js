import ErrorHandler from "../errors/ErrorHandler.js";

export const validateMCQPayload = (body) => {
  const {
    title,
    description,
    difficulty,
    accessLevel,
    explanation,
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

  // 1. Basic Field Validations
  if (!title || title.trim().length < 3) {
    throw new ErrorHandler("Title is required (min 3 chars)", 400);
  }

  // 2. Options Logic
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

  // 3. Logic & Type Validations
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

  // 4. Enum Validations
  if (!["easy", "medium", "hard"].includes(difficulty?.toLowerCase())) {
    throw new ErrorHandler("Difficulty must be easy, medium, or hard", 400);
  }

  if (!["free", "standard", "premium"].includes(accessLevel?.toLowerCase())) {
    throw new ErrorHandler("Access level must be free, standard, or premium", 400);
  }

  // 5. Relations & Metadata
  if (!labId) {
    throw new ErrorHandler("labId is required", 400);
  }

  if (!labSectionId) {
    throw new ErrorHandler("labSectionId is required", 400);
  }

  if (referenceLinks && !Array.isArray(referenceLinks)) {
    throw new ErrorHandler("referenceLinks must be an array", 400);
  }

  // Ab sanitizedBody return karne ki jagah seedha structured body return kar rahe hain
  return {
    title,
    description,
    difficulty,
    accessLevel,
    explanation,
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