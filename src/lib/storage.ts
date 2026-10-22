import "server-only";
import { randomUUID } from "crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION ?? "auto";
const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const extensionFor: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

let client: S3Client | null = null;

export function isStorageConfigured(): boolean {
  return Boolean(endpoint && bucket && accessKeyId && secretAccessKey);
}

function getClient(): S3Client {
  if (!isStorageConfigured()) {
    throw new Error("Object storage is not configured");
  }
  if (!client) {
    client = new S3Client({
      region,
      endpoint,
      forcePathStyle,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });
  }
  return client;
}

export function buildStorageKey(
  userId: string,
  kind: "media" | "document",
  contentType: string,
): string {
  const prefix = kind === "media" ? "media" : "documents";
  const extension = extensionFor[contentType] ?? "bin";
  return `${prefix}/${userId}/${randomUUID()}.${extension}`;
}

export function toStorageRef(key: string): string {
  return `s3://${bucket}/${key}`;
}

export function isStorageRef(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith("s3://"));
}

export function storageKeyFromRef(ref: string): string | null {
  if (!isStorageRef(ref)) return null;
  const rest = ref.slice("s3://".length);
  const slash = rest.indexOf("/");
  if (slash === -1) return null;
  const refBucket = rest.slice(0, slash);
  if (refBucket !== bucket) return null;
  return rest.slice(slash + 1);
}

export async function createPresignedUpload({
  key,
  contentType,
}: {
  key: string;
  contentType: string;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getClient(), command, { expiresIn: 300 });
}

/**
 * Private bucket: resolve a stored `s3://bucket/key` reference to a short-lived
 * signed URL. External http(s) URLs are returned unchanged.
 */
export async function resolveStorageUrl(
  value: string | null | undefined,
): Promise<string | null> {
  if (!value) return null;
  if (!isStorageRef(value)) return value;
  if (!isStorageConfigured()) return null;

  const key = storageKeyFromRef(value);
  if (!key) return null;

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(getClient(), command, { expiresIn: 3600 });
}

export async function deleteStorageObject(ref: string | null | undefined) {
  if (!ref || !isStorageRef(ref) || !isStorageConfigured()) return;
  const key = storageKeyFromRef(ref);
  if (!key) return;
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
