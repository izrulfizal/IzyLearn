
import { Router } from "express";
import path from "path";
import fs from "fs/promises";

import { extractDocument } from "../services/documentExtractor";

const router = Router();

router.get("/:fileId", async (req, res) => {
  try {
    const fileId = String(req.params.fileId);

    if (!/^[a-f0-9-]{36}$/.test(fileId)) {
      res.status(400).json({
        success: false,
        message: "Invalid file ID"
      });
      return;
    }

    const uploadDir = path.resolve(
      process.cwd(),
      "storage/uploads"
    );

    let filePath: string | undefined;

    for (const extension of [".pdf", ".pptx"]) {
      const candidate = path.join(
        uploadDir,
        `${fileId}${extension}`
      );

      try {
        await fs.access(candidate);
        filePath = candidate;
        break;
      } catch {
        // Try the next extension
      }
    }

    if (!filePath) {
      res.status(404).json({
        success: false,
        message: "File not found"
      });
      return;
    }

    const result = await extractDocument(
      filePath,
      path.basename(filePath)
    );

    res.json({
      success: true,
      document: result,
      characterCount: result.text.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Extraction failed"
    });
  }
});

export default router;
