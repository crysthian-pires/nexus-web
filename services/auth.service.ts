import api from "@/lib/api";
import Cookies from "js-cookie";
import { AuthResponse, User } from "@/types/user";

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    Cookies.set("accessToken", data.accessToken);
    Cookies.set("refreshToken", data.refreshToken);
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = Cookies.get("refreshToken");
    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken });
    }
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
  },

  async register(
    name: string,
    email: string,
    password: string
  ): Promise<User> {
    const { data } = await api.post<User>("/users", { name, email, password });
    return data;
  },

  isAuthenticated(): boolean {
    return !!Cookies.get("accessToken");
  },
};