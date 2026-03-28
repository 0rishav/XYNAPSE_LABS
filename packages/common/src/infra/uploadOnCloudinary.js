import cloudinary from "./cloudinaryConfig.js";

export const uploadOnCloudinary = async (filePath) => {
  return await cloudinary.uploader.upload(filePath, {
    folder: "labs/icons",
    resource_type: "image",
  });
};

export const deleteFromCloudinary = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};

export const deleteLocalFiles = (filePath) => {
  import("fs").then((fs) => {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Local file cleanup failed", err);
    });
  });
};

export const deleteMultipleLocalFiles = (fileArray) => {
  if (!Array.isArray(fileArray)) {
    console.warn(
      "Delete Multiple Local Files called with non-array input Ignored !"
    );
    return;
  }

  import("fs").then((fs) => {
    fileArray.forEach((file) => {
      if (file?.path) {
        fs.unlink(file.path, (err) => {
          if (err) {
            console.error(file.path, err);
          } else {
            console.log("Deleted", file.path);
          }
        });
      }
    });
  });
};
