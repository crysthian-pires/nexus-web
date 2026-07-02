export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  active: boolean;
  createdAt: string;
  role: "USER" | "ADMIN";
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UpdateResponse {
  user: User;
  token: string;
}
