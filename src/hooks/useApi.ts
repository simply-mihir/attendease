"use client";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`/api/v1${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
      return;
    }
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}
