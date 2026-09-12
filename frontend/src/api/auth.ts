import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api";

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface CurrentUser {
  id?: number | string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const response = await axios.post<LoginResponse>(
    `${API_URL}/token/`,
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

  return response.data;
}

export function logout(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function isAuthenticated(): boolean {
  return Boolean(
    localStorage.getItem("access_token"),
  );
}