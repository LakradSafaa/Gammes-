import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken =
      localStorage.getItem("access_token");

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

interface RetryConfig
  extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as RetryConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken =
        localStorage.getItem("refresh_token");

      if (!refreshToken) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        window.location.href = "/login";

        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${API_URL}/token/refresh/`,
          {
            refresh: refreshToken,
          }
        );

        const newAccessToken =
          response.data.access;

        localStorage.setItem(
          "access_token",
          newAccessToken
        );

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;