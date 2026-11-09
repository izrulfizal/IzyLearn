
import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";

import { extractDocument } from "../services/documentExtractor";
import { runIzzy } from "../agents/izzy";
import {
  createAgentReporter
} from "../services/agentEvents";

const router = Router();

const RequestSchema = z.object({
  fileIds: z.array(z.string().uuid()).min(1).max(5),
  mode: z.enum(["auto", "custom"]),
  jobId: z.string().uuid(),
  instructions: z.string().max(5000).default("")
}).refine(
  data => data.mode !== "custom" || data.instructions.trim().length > 0,
  { message: "Custom instructions are required" }
);

const uploadDir = path.resolve(
  process.cwd(),
  "storage/uploads"
);

router.post("/", async (req, res) => {
  const parsed = RequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Invalid generation request",
      errors: parsed.error.flatten()
    });
    return;
  }

  const { fileIds, mode, instructions } = parsed.data;

  try {
    const extractedTexts: string[] = [];

    for (const fileId of fileIds) {
      let filePath: string | null = null;

      for (const ext of [".pdf", ".pptx"]) {
        const candidate = path.join(
          uploadDir,
          `${fileId}${ext}`
        );

        try {
          await fs.access(candidate);
          filePath = candidate;
          break;
        } catch {
          // Continue searching
        }
      }

      if (!filePath) {
        res.status(404).json({
          success: false,
          message: `Document ${fileId} not found or not yet supported`
        });
        return;
      }

      const document = await extractDocument(
        filePath,
        path.basename(filePath)
      );

      if (!document.text.trim()) {
        res.status(422).json({
          success: false,
          message: `No readable text found in ${fileId}`
        });
        return;
      }

      extractedTexts.push(
        `DOCUMENT ${extractedTexts.length + 1}:\n${document.text}`
      );
    }

    const combinedText = extractedTexts.join("\n\n");
    const jobId = parsed.data.jobId;
const report = createAgentReporter(jobId);
    const result = await runIzzy(
      combinedText,
      mode,
      instructions,
      report
    );

    res.json({
      success: true,
      message: "Learning experience blueprint created!",
      agents: ["Izzy", "Suria", "Saujana"],
      ...result
    });
  } catch (error) {
    console.error("Generation error:", error);

    res.status(500).json({
      success: false,
      message: "AI generation failed. Check backend logs."
    });
  }
});

export default router;
