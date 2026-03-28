import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = "uploads/";
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".pdf",
  ".doc",
  ".docx",
  ".zip",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; 

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${Date.now()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.has(ext)) {
    return cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        `Invalid file type. Allowed: ${Array.from(allowedExtensions).join(
          ", "
        )}`
      ),
      false
    );
  }
  cb(null, true);
}

const multerOptions = {
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
};

export const createUploadMiddleware = (fieldsConfig) => {
  const upload = multer(multerOptions).fields(fieldsConfig);

  return (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        let message;
        switch (err.code) {
          case "LIMIT_FILE_SIZE":
            message = "File too large. Max size is 10MB.";
            break;
          case "LIMIT_UNEXPECTED_FILE":
            message =
              "File are not supported. Only these file are supported (jpg, jpeg, png,pdf, docx ,zip, doc )";
            console.log(err.message, "err");

            break;
          default:
            message = `Multer error: ${err.message}`;
        }
        return res.status(400).json({ error: message });
      } else if (err) {
        return res.status(500).json({ error: "Server error: " + err.message });
      }
      next();
    });
  };
};

export const uploadDocumentsMiddleware = createUploadMiddleware([
 
  { name: "thumbnail", maxCount: 1 }, 
  { name: "attachments", maxCount: 2 }, 
]);

export const upload = multer(multerOptions);
