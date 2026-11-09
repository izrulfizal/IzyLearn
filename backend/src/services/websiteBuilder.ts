
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

import type {
  GeneratedWebsite
} from "../agents/schemas";

function escapeHTML(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildWebsite(
  website: GeneratedWebsite
): string {
  // Prevent generated content from closing these tags.
  const css = website.css.replace(/<\/style/gi, "<\\/style");
  const javascript = website.javascript.replace(
    /<\/script/gi,
    "<\\/script"
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport"
        content="width=device-width, initial-scale=1.0">

  <title>${escapeHTML(website.title)}</title>

  <style>
    ${css}
  </style>
</head>
<body>
  ${website.html}

  <script>
    ${javascript}
  </script>
</body>
</html>`;
}

export async function saveWebsite(
  website: GeneratedWebsite
) {
  const websiteId = crypto.randomUUID();

  const outputDir = path.resolve(
    process.cwd(),
    "storage/generated"
  );

  await fs.mkdir(outputDir, {
    recursive: true
  });

  const html = buildWebsite(website);

  const filePath = path.join(
    outputDir,
    `${websiteId}.html`
  );

  await fs.writeFile(filePath, html, "utf8");

  return {
    websiteId,
    filePath,
    html
  };
}
