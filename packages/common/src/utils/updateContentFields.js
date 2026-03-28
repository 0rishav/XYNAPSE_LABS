import mongoose from "mongoose";

export const applyUpdatesToContent = (existingContent, updates) => {
  const objectIdFields = ["author", "chapterId", "labId", "labsectionId"];

  const fieldsToUpdate = [
    "title",
    "description",
    "slug",
    "body",
    "chapterId",
    "labId",
    "labsectionId",
    "tags",
    "category",
    "keywords",
    "status",
    "visibility",
    "rolesAllowed",
    "checklist",
    "isPremium",
  ];

  fieldsToUpdate.forEach((field) => {
    let value = updates[field];

    // Skip if field is not provided
    if (value === undefined) return;

    // Convert string "null" or empty string to actual null
    if (value === "null" || value === "") {
      value = null;
    }

    // Validate ObjectId fields
    if (
      objectIdFields.includes(field) &&
      value !== null &&
      !mongoose.Types.ObjectId.isValid(value)
    ) {
      throw new Error(`Invalid ObjectId for field "${field}": ${value}`);
    }

    existingContent[field] = value;
  });
};

export const updateThumbnail = (existingContent, thumbnail) => {
  if (thumbnail?.public_id && thumbnail?.secure_url) {
    existingContent.thumbnail = {
      public_id: thumbnail.public_id,
      secure_url: thumbnail.secure_url,
    };
  }
};

export const updateAttachments = (existingContent, attachments) => {
  if (Array.isArray(attachments)) {
    existingContent.attachments = attachments.map((att) => ({
      public_id: att.public_id,
      secure_url: att.secure_url,
    }));
  }
};
