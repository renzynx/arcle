import { createHmac, randomBytes } from "node:crypto";
import ms from "ms";

const ONE_HOUR_MS = 3600000;

export type SignedUrlParams = {
  ex: string;
  is: string;
  hm: string;
};

export function generateSecret(): string {
  return randomBytes(32).toString("hex");
}

export function getBucketExpiry(expiry: string): {
  expires: number;
  issued: number;
} {
  const now = Math.floor(Date.now() / 1000);
  const expiryMs = ms(expiry as ms.StringValue) || ONE_HOUR_MS;
  const bucketSize = Math.floor(expiryMs / 1000);
  const bucketStart = Math.floor(now / bucketSize) * bucketSize;
  const issued = bucketStart;
  const expires = bucketStart + bucketSize;

  return { expires, issued };
}

export function toHex(num: number): string {
  return num.toString(16);
}

export function fromHex(hex: string): number {
  return Number.parseInt(hex, 16);
}

export function createSignature(
  secret: string,
  path: string,
  expires: number,
  issued: number,
): string {
  const data = `${path}:${expires}:${issued}`;
  return createHmac("sha256", secret).update(data).digest("hex");
}

export function signUrl(
  secret: string,
  path: string,
  expiry: string,
): SignedUrlParams {
  const { expires, issued } = getBucketExpiry(expiry);
  const signature = createSignature(secret, path, expires, issued);

  return {
    ex: toHex(expires),
    is: toHex(issued),
    hm: signature,
  };
}

export function buildSignedUrl(
  baseUrl: string,
  path: string,
  params: SignedUrlParams,
): string {
  const url = new URL(path, baseUrl);
  url.searchParams.set("ex", params.ex);
  url.searchParams.set("is", params.is);
  url.searchParams.set("hm", params.hm);
  return url.toString();
}

export type VerifyResult =
  | { valid: true }
  | {
      valid: false;
      reason: "missing_params" | "expired" | "invalid_signature";
    };

export function verifySignature(
  secret: string,
  path: string,
  params: { ex?: string; is?: string; hm?: string },
): VerifyResult {
  const { ex, is, hm } = params;

  if (!ex || !is || !hm) {
    return { valid: false, reason: "missing_params" };
  }

  const expires = fromHex(ex);
  const issued = fromHex(is);
  const now = Math.floor(Date.now() / 1000);

  if (now > expires) {
    return { valid: false, reason: "expired" };
  }

  const expectedSignature = createSignature(secret, path, expires, issued);

  if (hm !== expectedSignature) {
    return { valid: false, reason: "invalid_signature" };
  }

  return { valid: true };
}
