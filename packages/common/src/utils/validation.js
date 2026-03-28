import ErrorHandler from "../errors/ErrorHandler.js";

export const validateCreateChapter = (data) => {
  const errors = [];

  if (!data.title || data.title.trim() === "") {
    errors.push("Title is required");
  }
  if (!data.labId) {
    errors.push("Lab ID is required");
  }
  if (!data.labsectionId) {
    errors.push("Lab Section ID is required");
  }

  const validLevels = ["beginner", "intermediate", "advanced"];
  if (data.level && !validLevels.includes(data.level)) {
    errors.push("Invalid level. Allowed: beginner, intermediate, advanced");
  }

  const validVisibility = ["public", "private", "restricted"];
  if (data.visibility && !validVisibility.includes(data.visibility)) {
    errors.push("Invalid visibility. Allowed: public, private, restricted");
  }

  const validStatus = ["draft", "published", "archived"];
  if (data.status && !validStatus.includes(data.status)) {
    errors.push("Invalid status. Allowed: draft, published, archived");
  }

  if (data.resources && Array.isArray(data.resources)) {
    data.resources.forEach((resource, index) => {
      if (!resource.title || resource.title.trim() === "") {
        errors.push(`Resource ${index + 1}: title is required`);
      }
      if (!resource.url || resource.url.trim() === "") {
        errors.push(`Resource ${index + 1}: url is required`);
      }
      const validTypes = ["pdf", "video", "link"];
      if (resource.type && !validTypes.includes(resource.type)) {
        errors.push(`Resource ${index + 1}: invalid type`);
      }
    });
  }

  if (errors.length > 0) {
    throw new ErrorHandler(errors.join(", "), 400);
  }
  return data;
};

export const validateFAQInput = ({ lab, labSection, question, answer }) => {
  const errors = {};

  if (!lab) errors.lab = "Lab ID is required";
  if (!labSection) errors.labSection = "Lab Section ID is required";
  if (!question || typeof question !== "string" || question.trim() === "")
    errors.question = "Question is required and must be a non-empty string";
  else if (question.trim().length > 500)
    errors.question = "Question must be under 500 characters";

  if (!answer || typeof answer !== "string" || answer.trim() === "")
    errors.answer = "Answer is required and must be a non-empty string";
  else if (answer.trim().length > 5000)
    errors.answer = "Answer must be under 5000 characters";

  return errors;
};

export const validateFAQUpdate = ({ question, answer, isActive }) => {
  const errors = {};

  if (question !== undefined) {
    if (typeof question !== "string" || question.trim() === "")
      errors.question = "Question must be a non-empty string";
    else if (question.trim().length > 500)
      errors.question = "Question must be under 500 characters";
  }

  if (answer !== undefined) {
    if (typeof answer !== "string" || answer.trim() === "")
      errors.answer = "Answer must be a non-empty string";
    else if (answer.trim().length > 5000)
      errors.answer = "Answer must be under 5000 characters";
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    errors.isActive = "isActive must be a boolean";
  }

  return errors;
};
