
import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const router = Router();

const uploadDir = path.resolve(
  process.cwd(),
  "storage/uploads"
);

fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "image/jpeg": ".jpg",
  "image/png": ".png"
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = allowedTypes[file.mimetype] || "";
    cb(null, `${crypto.randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 5
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedTypes[file.mimetype]) {
      cb(new Error("Unsupported file type."));
      return;
    }
    cb(null, true);
  }
});

router.post(
  "/",
  (req, res, next) => {
    const mode = req.headers["x-generation-mode"];
    const instructions = req.headers["x-custom-instructions"];

    if (mode !== "auto" && mode !== "custom") {
      res.status(400).json({
        success: false,
        message: "Invalid generation mode."
      });
      return;
    }

    if (mode === "custom" &&
        (typeof instructions !== "string" || !instructions.trim())) {
      res.status(400).json({
        success: false,
        message: "Custom instructions are required."
      });
      return;
    }

    next();
  },
  upload.array("files", 5),
  (req, res) => {
    const files = req.files as Express.Multer.File[];

    if (!files?.length) {
      res.status(400).json({
        success: false,
        message: "Please select at least one file."
      });
      return;
    }

    res.json({
      success: true,
      message: "Materials uploaded successfully!",
      mode: req.headers["x-generation-mode"],
      files: files.map((file) => ({
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        id: path.parse(file.filename).name
      }))
    });
  }
);

export default router;
