"use client";

import { useState } from "react";

type Props = {
  name: string;
  kind: "media" | "document";
  accept: string;
  label: string;
  storageEnabled: boolean;
  defaultValue?: string;
};

export function StorageUploadField({
  name,
  kind,
  accept,
  label,
  storageEnabled,
  defaultValue = "",
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!storageEnabled) {
    return (
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{label}</span>
        <input
          name={name}
          type="url"
          defaultValue={defaultValue}
          placeholder="https://…"
          className="bg-background h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
        />
        <span className="text-muted-foreground text-xs">
          Direct uploads are unavailable because object storage is not configured. A hosted URL
          is used instead.
        </span>
      </label>
    );
  }

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const presign = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      const data = (await presign.json()) as {
        uploadUrl?: string;
        ref?: string;
        error?: string;
      };
      if (!presign.ok || !data.uploadUrl || !data.ref) {
        throw new Error(data.error ?? "Could not prepare the upload.");
      }

      const put = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) {
        throw new Error("Upload failed. Please try again.");
      }

      setValue(data.ref);
      setFileName(file.name);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <input type="hidden" name={name} value={value} />
      <input
        type="file"
        accept={accept}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
        className="bg-background w-full rounded-lg border px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-xs"
      />
      {uploading ? (
        <span className="text-muted-foreground text-xs">Uploading…</span>
      ) : error ? (
        <span className="text-destructive text-xs" role="alert">
          {error}
        </span>
      ) : value ? (
        <span className="text-xs text-emerald-600 dark:text-emerald-400">
          Uploaded: {fileName || "file"}
        </span>
      ) : (
        <span className="text-muted-foreground text-xs">
          Stored privately; accessed through short-lived signed URLs.
        </span>
      )}
    </div>
  );
}
