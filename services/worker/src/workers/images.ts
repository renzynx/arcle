import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createLogger } from "@arcle/logger";
import {
  getConnectionOptions,
  type ImageJobData,
  QUEUE_NAMES,
} from "@arcle/queue";
import { Worker } from "bullmq";
import sharp from "sharp";

const log = createLogger({ name: "worker:images" });

export function createImageWorker(): Worker<ImageJobData> {
  const worker = new Worker<ImageJobData>(
    QUEUE_NAMES.IMAGES,
    async (job) => {
      const { sourcePath, outputPath, filename, quality } = job.data;

      await mkdir(dirname(outputPath), { recursive: true });

      const sourceFile = Bun.file(sourcePath);
      if (!(await sourceFile.exists())) {
        throw new Error(`Source file not found: ${sourcePath}`);
      }

      const webReadable = sourceFile.stream();
      const nodeReadable = Readable.fromWeb(
        webReadable as Parameters<typeof Readable.fromWeb>[0],
      );
      const transformer = sharp().webp({ quality });
      const writable = createWriteStream(outputPath);

      await pipeline(nodeReadable, transformer, writable);

      try {
        await unlink(sourcePath);
      } catch {
        log.warn(`Failed to delete temp file: ${sourcePath}`);
      }

      return { success: true, filename, outputPath };
    },
    {
      connection: getConnectionOptions(),
      concurrency: 3,
    },
  );

  worker.on("failed", (job, err) => {
    log.error(`Image job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}
