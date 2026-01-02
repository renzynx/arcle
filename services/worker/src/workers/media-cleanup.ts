import { readdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { inArray } from "drizzle-orm";
import { db, series } from "../db/index.ts";

const UPLOAD_DIR = Bun.env.UPLOAD_DIR || "./uploads";
const COVERS_DIR = join(UPLOAD_DIR, "covers");
const PAGES_DIR = join(UPLOAD_DIR, "pages");
const TEMP_DIR = join(UPLOAD_DIR, "temp");
const TEMP_FILE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export async function cleanupOrphanedImages(): Promise<{
  orphanedCovers: number;
  orphanedPages: number;
  tempFiles: number;
}> {
  let orphanedCovers = 0;
  let orphanedPages = 0;
  let tempFiles = 0;

  orphanedCovers = await cleanupOrphanedCovers();
  orphanedPages = await cleanupOrphanedPages();
  tempFiles = await cleanupTempFiles();

  return { orphanedCovers, orphanedPages, tempFiles };
}

async function cleanupOrphanedCovers(): Promise<number> {
  let deleted = 0;

  try {
    const files = await readdir(COVERS_DIR);
    if (files.length === 0) return 0;

    const coverUrls = files.map((f) => `%/api/media/images/covers/${f}`);

    const referencedSeries = await db.query.series.findMany({
      columns: { coverImage: true },
      where: inArray(
        series.coverImage,
        coverUrls.map((url) => url.replace("%", "")),
      ),
    });

    const referencedCovers = new Set(
      referencedSeries
        .map((s) => s.coverImage)
        .filter(Boolean)
        .map((url) => url!.split("/").pop()),
    );

    for (const file of files) {
      if (!referencedCovers.has(file)) {
        try {
          await rm(join(COVERS_DIR, file));
          deleted++;
        } catch {
          // File may have been deleted already
        }
      }
    }
  } catch {
    // Directory may not exist
  }

  return deleted;
}

async function cleanupOrphanedPages(): Promise<number> {
  let deleted = 0;

  try {
    const files = await readdir(PAGES_DIR);
    if (files.length === 0) return 0;

    const _pageUrls = files.map((f) => `%${f}`);

    const referencedPages = await db.query.pages.findMany({
      columns: { imageUrl: true },
    });

    const referencedFiles = new Set(
      referencedPages
        .map((p) => p.imageUrl)
        .filter(Boolean)
        .map((url) => url.split("/").pop()),
    );

    for (const file of files) {
      if (!referencedFiles.has(file)) {
        try {
          await rm(join(PAGES_DIR, file));
          deleted++;
        } catch {
          // File may have been deleted already
        }
      }
    }
  } catch {
    // Directory may not exist
  }

  return deleted;
}

async function cleanupTempFiles(): Promise<number> {
  let deleted = 0;
  const now = Date.now();

  try {
    const files = await readdir(TEMP_DIR);

    for (const file of files) {
      const filepath = join(TEMP_DIR, file);
      try {
        const stats = await stat(filepath);
        if (now - stats.mtimeMs > TEMP_FILE_MAX_AGE_MS) {
          await rm(filepath);
          deleted++;
        }
      } catch {
        // File may have been deleted already
      }
    }
  } catch {
    // Directory may not exist
  }

  return deleted;
}
