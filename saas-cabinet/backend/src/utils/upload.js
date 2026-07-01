const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDir);
  },
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext).replace(/\s+/g, "-").toLowerCase();
    callback(null, `${Date.now()}-${safeName}${ext}`);
  },
});

const allowedExt = new Set([".png", ".jpg", ".jpeg", ".pdf", ".doc", ".docx"]);
const allowedLogoExt = new Set([".png", ".jpg", ".jpeg", ".webp"]);

const fileFilter = (_req, file, callback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExt.has(ext)) {
    callback(null, true);
    return;
  }

  callback(new Error("Unsupported file type."), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const logoFileFilter = (_req, file, callback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedLogoExt.has(ext)) {
    callback(null, true);
    return;
  }

  callback(new Error("Only image files are allowed for logos."), false);
};

const uploadLogo = multer({
  storage,
  fileFilter: logoFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

module.exports = {
  upload,
  uploadLogo,
};
