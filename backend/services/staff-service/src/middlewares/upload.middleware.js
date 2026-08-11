const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadDir =
  process.env.FRONTEND_UPLOAD_DIR ||
  path.resolve(__dirname, "../../../../../frontend/public/uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function sanitizeFileName(fileName = "") {
  const ext = path.extname(fileName).toLowerCase();
  const nameOnly = path.basename(fileName, ext);

  const safeName = nameOnly
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toLowerCase();

  return `${safeName || "staff-image"}${ext}`;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    const safeName = sanitizeFileName(file.originalname);
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;