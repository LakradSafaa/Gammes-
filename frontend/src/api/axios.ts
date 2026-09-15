import axios from "axios";

type RefreshResponse = { access: string; refresh?: string };
type RetryConfig = any;

/**
 * Retourne l'URL de base de l'API.
 * - En production Vercel, VITE_API_URL=/api garde frontend et backend sur le même domaine.
 * - En local, le fichier .env conserve http://127.0.0.1:8000/api.
 * Cette fonction centralise l'adresse afin d'éviter qu'un navigateur en production
 * tente d'appeler son propre 127.0.0.1.
 */
function getApiBaseUrl(): string {
  const configuredUrl = String(import.meta.env.VITE_API_URL || "").trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  return import.meta.env.PROD ? "/api" : "http://127.0.0.1:8000/api";
}

/**
 * Supprime les jetons JWT stockés localement.
 * Cette fonction est appelée lorsque le refresh est impossible afin de ne pas
 * conserver une session partiellement valide dans le navigateur.
 */
function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

/**
 * Redirige vers la page de connexion après expiration définitive de la session.
 * La redirection n'est pas répétée lorsque l'utilisateur est déjà sur /login.
 */
function redirectToLogin(): void {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

/**
 * Client Axios unique de l'application.
 * Toutes les pages utilisent ce client pour bénéficier de la même URL API,
 * du même Bearer token et de la même stratégie de renouvellement JWT.
 */
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

/**
 * Ajoute automatiquement l'access token aux requêtes privées.
 * Les endpoints publics comme /token/ acceptent simplement l'absence de token.
 */
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("access_token");
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  /** Laisse Axios remonter une erreur survenue avant l'envoi de la requête. */
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let waitingRequests: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/**
 * Termine les requêtes mises en attente pendant un renouvellement JWT.
 * Si le refresh réussit, chaque requête reçoit le nouveau token ; sinon elles
 * sont toutes rejetées avec la même erreur pour éviter des boucles de refresh.
 */
function processWaitingRequests(error: unknown, token: string | null): void {
  waitingRequests.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  waitingRequests = [];
}

/**
 * Intercepteur de réponse chargé de restaurer automatiquement une session expirée.
 * Il appelle POST /token/refresh/ une seule fois même si plusieurs requêtes
 * reçoivent simultanément HTTP 401. Le refresh token tournant renvoyé par
 * SimpleJWT est sauvegardé avant de rejouer la requête initiale.
 */
api.interceptors.response.use(
  /** Retourne sans modification toute réponse HTTP réussie. */
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
      if (!newAccessToken) {
        throw new Error("Access token absent dans la réponse de refresh.");
      }

      localStorage.setItem("access_token", newAccessToken);
      if (response.data.refresh) {
        localStorage.setItem("refresh_token", response.data.refresh);
      }

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
