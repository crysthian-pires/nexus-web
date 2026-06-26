export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  active: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UpdateResponse {
  user: User;
  token: string;
}