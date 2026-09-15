import axios from "axios";

type RefreshResponse = { access: string; refresh?: string };
type RetryConfig = any;

/** Retourne l'URL API utilisée en local ou en production. */
function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
}

/** Nettoie les deux jetons pour éviter un état de connexion partiel. */
function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

/** Redirige vers /login uniquement quand la session ne peut plus être restaurée. */
function redirectToLogin(): void {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

/** Client HTTP unique utilisé par toute l'application. */
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

/** Ajoute automatiquement le Bearer token à chaque requête privée. */
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("access_token");
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  /** Laisse remonter les erreurs de préparation de requête. */
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let waitingRequests: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

/** Débloque toutes les requêtes mises en attente pendant le refresh JWT. */
function processWaitingRequests(error: unknown, token: string | null): void {
  waitingRequests.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  waitingRequests = [];
}

/**
 * Gère automatiquement les HTTP 401 : un seul refresh est exécuté,
 * les requêtes parallèles attendent, puis le nouveau token est réutilisé.
 * Le refresh token tournant de SimpleJWT est également sauvegardé.
 */
api.interceptors.response.use(
  /** Retourne les réponses valides sans transformation. */
  (response) => response,
  async (error) => {
    const originalRequest: RetryConfig = error.config;
    const url = String(originalRequest?.url || "");
    const authEndpoint = url.includes("/token/") || url.includes("/token/refresh/");

    if (error.response?.status !== 401 || originalRequest?._retry || authEndpoint) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      clearTokens();
      redirectToLogin();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitingRequests.push({
          resolve: (token) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post<RefreshResponse>(
        `${getApiBaseUrl()}/token/refresh/`,
        { refresh: refreshToken },
        { headers: { "Content-Type": "application/json" } },
      );

      const newAccessToken = response.data.access;
      if (!newAccessToken) throw new Error("Access token absent dans la réponse de refresh.");

      localStorage.setItem("access_token", newAccessToken);
      if (response.data.refresh) localStorage.setItem("refresh_token", response.data.refresh);

      processWaitingRequests(null, newAccessToken);
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processWaitingRequests(refreshError, null);
      clearTokens();
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
