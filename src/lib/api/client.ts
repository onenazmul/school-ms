// lib/api/client.ts
// Zero-delay UX: all mutations return optimistic data immediately

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://sms-api.chalanbeel.com/api";
const TENANT_DOMAIN = process.env.NEXT_PUBLIC_TENANT_DOMAIN ?? "school1.com";

type RequestOptions = {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | null | undefined>;
  token?: string;
  signal?: AbortSignal;
};

class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  { method = "GET", body, params, token, signal }: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Tenant-Domain": TENANT_DOMAIN,
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined) qs.set(k, String(v));
    });
    const str = qs.toString();
    if (str) url += (url.includes("?") ? "&" : "?") + str;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      payload.message ?? "Request failed",
      payload.errors
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(
    endpoint: string,
    token?: string,
    params?: Record<string, string | number | boolean | null | undefined>,
    signal?: AbortSignal,
  ) => request<T>(endpoint, { token, params, signal }),

  post: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: "POST", body, token }),

  // POST with query-string params (for APIs that read from $_GET / request()->query())
  postParams: <T>(endpoint: string, params: Record<string, string | number | boolean | null | undefined>, token?: string) =>
    request<T>(endpoint, { method: "POST", params, token }),

  put: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: "PUT", body, token }),

  patch: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: "PATCH", body, token }),

  delete: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, { method: "DELETE", token }),
};

export { ApiError };
