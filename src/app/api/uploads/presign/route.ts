import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  DOCUMENT_TYPES,
  IMAGE_TYPES,
  MAX_DOCUMENT_BYTES,
  MAX_MEDIA_BYTES,
  buildStorageKey,
  createPresignedUpload,
  isStorageConfigured,
  toStorageRef,
} from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PresignBody = {
  kind?: "media" | "document";
  filename?: string;
  contentType?: string;
  size?: number;
};

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Object storage is not configured on this deployment." },
      { status: 503 },
    );
  }

  let body: PresignBody;
  try {
    body = (await request.json()) as PresignBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const kind = body.kind === "document" ? "document" : "media";
  const contentType = String(body.contentType ?? "");
  const size = Number(body.size ?? 0);
  const allowed =
    kind === "media"
      ? (IMAGE_TYPES as readonly string[])
      : (DOCUMENT_TYPES as readonly string[]);
  const maxBytes = kind === "media" ? MAX_MEDIA_BYTES : MAX_DOCUMENT_BYTES;

  if (!allowed.includes(contentType)) {
    return NextResponse.json(
      {
        error:
          kind === "media"
            ? "Only JPEG, PNG, WebP, GIF or AVIF images are allowed."
            : "Only PDF or Word documents are allowed.",
      },
      { status: 400 },
    );
  }

  if (!Number.isFinite(size) || size <= 0 || size > maxBytes) {
    return NextResponse.json(
      { error: `File must be between 1 byte and ${Math.round(maxBytes / 1024 / 1024)} MB.` },
      { status: 400 },
    );
  }

  const key = buildStorageKey(profile.id, kind, contentType);
  const uploadUrl = await createPresignedUpload({ key, contentType });

  return NextResponse.json({
    uploadUrl,
    key,
    ref: toStorageRef(key),
    maxBytes,
  });
}
