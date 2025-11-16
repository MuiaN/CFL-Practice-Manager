import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "senior_associate" | "associate";
  practiceAreas: string[] | null;
  isActive: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function setToken(token: string): void {
  localStorage.setItem("auth_token", token);
}

export function removeToken(): void {
  localStorage.removeItem("auth_token");
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>("POST", "/api/auth/login", {
    email,
    password,
  });
  setToken(response.token);
  return response;
}

export async function getCurrentUser(): Promise<AuthUser> {
  return await apiRequest<AuthUser>("GET", "/api/auth/me");
}

export function logout(): void {
  removeToken();
  window.location.href = "/";
}
