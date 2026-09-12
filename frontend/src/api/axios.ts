import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000/api",

  headers: {
    "Content-Type":
      "application/json",
  },
});


/* ============================================================
   AJOUT AUTOMATIQUE DU JWT
   ============================================================ */

api.interceptors.request.use(
  (config) => {
    const accessToken =
      localStorage.getItem(
        "access_token",
      );

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },

  (error) =>
    Promise.reject(error),
);


/* ============================================================
   RAFRAÎCHISSEMENT AUTOMATIQUE DU TOKEN
   ============================================================ */

let isRefreshing = false;

let waitingRequests: Array<{
  resolve: (
    token: string,
  ) => void;
  reject: (
    error: unknown,
  ) => void;
}> = [];


function processWaitingRequests(
  error: unknown,
  token: string | null,
) {
  waitingRequests.forEach(
    ({
      resolve,
      reject,
    }) => {
      if (error) {
        reject(error);
      } else if (token) {
        resolve(token);
      }
    },
  );

  waitingRequests = [];
}


api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest =
      error.config;

    if (
      error.response?.status !==
        401 ||
      originalRequest?._retry
    ) {
      return Promise.reject(
        error,
      );
    }


    const refreshToken =
      localStorage.getItem(
        "refresh_token",
      );


    if (!refreshToken) {
      localStorage.removeItem(
        "access_token",
      );

      localStorage.removeItem(
        "refresh_token",
      );

      return Promise.reject(
        error,
      );
    }


    /* --------------------------------------------------------
       SI UN REFRESH EST DÉJÀ EN COURS
       -------------------------------------------------------- */

    if (isRefreshing) {
      return new Promise(
        (
          resolve,
          reject,
        ) => {
          waitingRequests.push({
            resolve:
              (
                token:
                  string,
              ) => {
                originalRequest
                  .headers
                  .Authorization =
                  `Bearer ${token}`;

                resolve(
                  api(
                    originalRequest,
                  ),
                );
              },

            reject,
          });
        },
      );
    }


    originalRequest._retry =
      true;

    isRefreshing = true;


    try {
      const response =
        await axios.post<{
          access: string;
        }>(
          `${
            import.meta.env
              .VITE_API_URL ||
            "http://127.0.0.1:8000/api"
          }/token/refresh/`,
          {
            refresh:
              refreshToken,
          },
        );


      const newAccessToken =
        response.data.access;


      localStorage.setItem(
        "access_token",
        newAccessToken,
      );


      processWaitingRequests(
        null,
        newAccessToken,
      );


      originalRequest
        .headers
        .Authorization =
        `Bearer ${newAccessToken}`;


      return api(
        originalRequest,
      );
    } catch (
      refreshError
    ) {
      processWaitingRequests(
        refreshError,
        null,
      );


      localStorage.removeItem(
        "access_token",
      );

      localStorage.removeItem(
        "refresh_token",
      );


      return Promise.reject(
        refreshError,
      );
    } finally {
      isRefreshing = false;
    }
  },
);


export default api;