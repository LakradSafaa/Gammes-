import api from "./axios";

type LoginResponse = {
  access: string;
  refresh: string;
};

export async function login(
  username: string,
  password: string,
): Promise<void> {
  const response =
    await api.post<LoginResponse>(
      "/token/",
      {
        username,
        password,
      },
    );

  localStorage.setItem(
    "access_token",
    response.data.access,
  );

  localStorage.setItem(
    "refresh_token",
    response.data.refresh,
  );
}


export function logout(): void {
  localStorage.removeItem(
    "access_token",
  );

  localStorage.removeItem(
    "refresh_token",
  );
}


export function getAccessToken():
  | string
  | null {
  return localStorage.getItem(
    "access_token",
  );
}


export function getRefreshToken():
  | string
  | null {
  return localStorage.getItem(
    "refresh_token",
  );
}


export function isAuthenticated():
  boolean {
  const accessToken =
    getAccessToken();

  return Boolean(accessToken);
}