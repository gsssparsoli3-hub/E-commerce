// Tiny typed fetch wrapper for all client -> API calls.
// NEXT_PUBLIC_BASE_PATH is "/admin" when the portal runs behind the storefront
// proxy (local/sandbox) and "" when it runs on its own domain (Vercel).

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError((data as { error?: string }).error || "Request failed", res.status);
  }
  return data as T;
}

/** Upload a file to /api/upload and return its public URL. */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: form, credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error || "Upload failed", res.status);
  return (data as { url: string }).url;
}
