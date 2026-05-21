export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
  return match?.[2] ?? null;
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Se o token expirou ou é inválido, manda para o login
    if (typeof window !== "undefined") {
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
  }

  return response;
}
