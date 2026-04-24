// lib/documents/download-helpers.ts
// Client-side blob download utility. Import in page components.

/**
 * Triggers a browser file download from a Blob.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Fetches a URL, gets the blob, and triggers a download.
 * Method defaults to GET; pass body for POST.
 */
export async function fetchAndDownload(
  url: string,
  filename: string,
  options?: { method?: string; body?: object },
): Promise<void> {
  const res = await fetch(url, {
    method: options?.method ?? "GET",
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Download failed" }));
    throw new Error((err as any).error ?? "Download failed");
  }
  const blob = await res.blob();
  triggerBlobDownload(blob, filename);
}

/**
 * Fetches a PDF URL and returns an object URL for <iframe> preview.
 * Caller is responsible for calling URL.revokeObjectURL() on cleanup.
 */
export async function fetchPreviewUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Preview unavailable");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
