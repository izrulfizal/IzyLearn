
import fs from "fs/promises";
import path from "path";
import JSZip from "jszip";
import { PDFParse } from "pdf-parse";

export interface ExtractedDocument {
  filename: string;
  type: string;
  text: string;
}

async function extractPDF(
  filePath: string
): Promise<string> {
  const buffer = await fs.readFile(filePath);

  const parser = new PDFParse({
    data: buffer
  });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function extractPPTX(
  filePath: string
): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(buffer);

  const slideFiles = Object.keys(zip.files)
    .filter(name =>
      /^ppt\/slides\/slide\d+\.xml$/.test(name)
    )
    .sort((a, b) => {
      const getNumber = (name: string) =>
        Number(name.match(/slide(\d+)\.xml$/)?.[1] || 0);

      return getNumber(a) - getNumber(b);
    });

  const slides: string[] = [];

  for (const filename of slideFiles) {
    const xml = await zip.files[filename].async("string");

    const text = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
      .map(match => match[1])
      .join(" ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");

    slides.push(text);
  }

  return slides.join("\n\n");
}

export async function extractDocument(
  filePath: string,
  originalName: string
): Promise<ExtractedDocument> {
  const extension = path.extname(filePath).toLowerCase();

  let text = "";

  if (extension === ".pdf") {
    text = await extractPDF(filePath);
  } else if (extension === ".pptx") {
    text = await extractPPTX(filePath);
  } else {
    throw new Error(
      `Unsupported extraction format: ${extension}`
    );
  }

  return {
    filename: originalName,
    type: extension,
    text: text.trim()
  };
}
