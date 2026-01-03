import { getAccessToken } from "@arcle/auth-client";
import { toast } from "sonner";

interface UploadResult {
  filename: string;
  url: string;
}

export async function uploadCoverImage(
  file: File,
  gatewayUrl: string,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const token = await getAccessToken();
  const res = await fetch(`${gatewayUrl}/api/media/images/covers`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  return res.json();
}

export async function deleteCoverImage(
  filename: string,
  gatewayUrl: string,
): Promise<void> {
  const token = await getAccessToken();
  await fetch(`${gatewayUrl}/api/media/images/covers/${filename}`, {
    method: "DELETE",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

interface ProcessCoverImageOptions {
  coverImage: string | File | null;
  gatewayUrl: string;
  onUploadError?: () => void;
}

interface ProcessCoverImageResult {
  coverImageUrl: string | undefined;
  uploadedFilename: string | null;
}

export async function processCoverImage({
  coverImage,
  gatewayUrl,
  onUploadError,
}: ProcessCoverImageOptions): Promise<ProcessCoverImageResult | null> {
  let uploadedFilename: string | null = null;
  let coverImageUrl: string | undefined;

  if (typeof coverImage === "string" && coverImage) {
    coverImageUrl = coverImage;
  }

  if (coverImage instanceof File) {
    try {
      const result = await uploadCoverImage(coverImage, gatewayUrl);
      coverImageUrl = result.filename;
      uploadedFilename = result.filename;
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload cover image");
      onUploadError?.();
      return null;
    }
  }

  return { coverImageUrl, uploadedFilename };
}

export async function cleanupOrphanedCover(
  filename: string,
  gatewayUrl: string,
): Promise<void> {
  try {
    await deleteCoverImage(filename, gatewayUrl);
  } catch (error) {
    console.error("Failed to cleanup orphaned cover:", error);
  }
}
