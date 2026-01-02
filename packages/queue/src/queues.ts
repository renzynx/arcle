import { Queue } from "bullmq";
import { getConnectionOptions } from "./connection.ts";
import type { ImageJobData, ViewJobData, ViewSyncJobData } from "./jobs.ts";

export const QUEUE_NAMES = {
  VIEWS: "views",
  VIEW_SYNC: "view-sync",
  IMAGES: "images",
} as const;

let viewsQueue: Queue<ViewJobData> | null = null;
let viewSyncQueue: Queue<ViewSyncJobData> | null = null;
let imagesQueue: Queue<ImageJobData> | null = null;

export function getViewsQueue(): Queue<ViewJobData> {
  if (!viewsQueue) {
    viewsQueue = new Queue<ViewJobData>(QUEUE_NAMES.VIEWS, {
      connection: getConnectionOptions(),
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 1000,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    });
  }
  return viewsQueue;
}

export function getViewSyncQueue(): Queue<ViewSyncJobData> {
  if (!viewSyncQueue) {
    viewSyncQueue = new Queue<ViewSyncJobData>(QUEUE_NAMES.VIEW_SYNC, {
      connection: getConnectionOptions(),
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100,
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    });
  }
  return viewSyncQueue;
}

export function getImagesQueue(): Queue<ImageJobData> {
  if (!imagesQueue) {
    imagesQueue = new Queue<ImageJobData>(QUEUE_NAMES.IMAGES, {
      connection: getConnectionOptions(),
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    });
  }
  return imagesQueue;
}

export async function closeAllQueues(): Promise<void> {
  await Promise.all([
    viewsQueue?.close(),
    viewSyncQueue?.close(),
    imagesQueue?.close(),
  ]);
  viewsQueue = null;
  viewSyncQueue = null;
  imagesQueue = null;
}
