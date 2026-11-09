
import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const router = Router();

interface Publication {
  slug: string;
  websiteId: string;
  createdAt: string;
}

const STORAGE_DIR = path.resolve(
  process.cwd(),
  "storage"
);

const GENERATED_DIR = path.join(
  STORAGE_DIR,
  "generated"
);

const PUBLICATIONS_FILE = path.join(
  STORAGE_DIR,
  "publications.json"
);

async function readPublications(): Promise<Publication[]> {
  try {
    const data = await fs.readFile(
      PUBLICATIONS_FILE,
      "utf8"
    );

    return JSON.parse(data) as Publication[];
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }
}

async function writePublications(
  publications: Publication[]
) {
  await fs.mkdir(STORAGE_DIR, {
    recursive: true
  });

  await fs.writeFile(
    PUBLICATIONS_FILE,
    JSON.stringify(publications, null, 2),
    "utf8"
  );
}

// ========================================
// Publish a generated website
// ========================================

router.post("/", async (req, res) => {
  try {
    const { websiteId } = req.body;

    if (
      typeof websiteId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(websiteId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid website ID"
      });
      return;
    }

    const websitePath = path.join(
      GENERATED_DIR,
      `${websiteId}.html`
    );

    try {
      await fs.access(websitePath);
    } catch {
      res.status(404).json({
        success: false,
        message: "Generated website not found"
      });
      return;
    }

    const publications = await readPublications();

    // Return the existing publication if already published.
    const existing = publications.find(
      item => item.websiteId === websiteId
    );

    const publication: Publication =
      existing ?? {
        slug: crypto.randomBytes(8).toString("hex"),
        websiteId,
        createdAt: new Date().toISOString()
      };

    if (!existing) {
      publications.push(publication);
      await writePublications(publications);
    }

    const baseUrl =
      process.env.PUBLIC_URL ||
      `${req.protocol}://${req.get("host")}`;

    res.json({
      success: true,
      publication,
      url: `${baseUrl}/p/${publication.slug}`
    });
  } catch (error) {
    console.error("Publish error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to publish website"
    });
  }
});

// ========================================
// View published website
// ========================================

router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    if (
      typeof slug !== "string" ||
      !/^[a-f0-9]{16}$/.test(slug)
    ) {
      res.status(404).send("Website not found");
      return;
    }

    const publications = await readPublications();

    const publication = publications.find(
      item => item.slug === slug
    );

    if (!publication) {
      res.status(404).send("Website not found");
      return;
    }

    const websitePath = path.join(
      GENERATED_DIR,
      `${publication.websiteId}.html`
    );

    const html = await fs.readFile(
      websitePath,
      "utf8"
    );

    // The generated website is isolated in its own
    // sandboxed browsing context.
    res.setHeader("Content-Type", "text/html; charset=utf-8");

    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'none'",
        "script-src 'unsafe-inline'",
        "style-src 'unsafe-inline'",
        "img-src data:",
        "font-src 'none'",
        "connect-src 'none'",
        "object-src 'none'",
        "frame-src 'none'",
        "form-action 'none'",
        "base-uri 'none'",
        "sandbox allow-scripts"
      ].join("; ")
    );

    res.setHeader(
      "X-Content-Type-Options",
      "nosniff"
    );

    res.send(html);
  } catch (error) {
    console.error("Publication view error:", error);

    res.status(500).send(
      "Unable to load published website"
    );
  }
});

export default router;
