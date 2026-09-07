import { env } from "@/lib/env";
import { tokenStorage } from "@/lib/auth/token-storage";
import type { TokenPair } from "@/lib/auth/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown; skipAuth?: boolean };

// De-dupes concurrent refresh attempts — if several requests 401 at once,
// only one /api/auth/refresh call goes out; the rest await the same promise.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${env.apiBaseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) {
          tokenStorage.clear();
          return null;
        }
        const pair = (await response.json()) as TokenPair;
        tokenStorage.setTokens(pair.access_token, pair.refresh_token);
        return pair.access_token;
      })
      .catch(() => {
        tokenStorage.clear();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

/**
 * Thin fetch wrapper for the FastAPI backend. Handles JSON encoding/decoding,
 * attaches the stored access token, transparently refreshes once on a 401
 * (then retries the original request), and normalizes error responses into
 * `ApiError`. Pass `skipAuth: true` for endpoints that must never carry a
 * token (login, register, refresh itself).
 */
async function request<TResponse>(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<TResponse> {
  const { body, headers, skipAuth, ...rest } = options;
  const accessToken = skipAuth ? null : tokenStorage.getAccessToken();

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !skipAuth && !isRetry && tokenStorage.getRefreshToken()) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      return request<TResponse>(path, options, true);
    }
  }

  // FastAPI sets `content-type: application/json` even on a body-less 204,
  // so the content-type check alone isn't enough — response.json() throws
  // a SyntaxError on an empty body. status 204/205 and an empty
  // Content-Length are the reliable signals that there's nothing to parse.
  const contentType = response.headers.get("content-type") ?? "";
  const hasNoBody =
    response.status === 204 || response.status === 205 || response.headers.get("content-length") === "0";
  const payload =
    !hasNoBody && contentType.includes("application/json") ? await response.json() : undefined;

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "error" in payload
        ? (payload as { error?: { message?: string } }).error?.message
        : undefined) ?? response.statusText;
    throw new ApiError(message ?? "Request failed", response.status, payload);
  }

  return payload as TResponse;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
