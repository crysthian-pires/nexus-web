import api from "@/lib/api";
import { User, UpdateResponse } from "@/types/user";

export const userService = {
  async getMe(): Promise<User> {
    const { data } = await api.get<User>(`/users/me`);
    return data;
  },

  async updateUser(payload: {
    name?: string;
    email?: string;
  }): Promise<UpdateResponse> {
    const { data } = await api.patch<UpdateResponse>(`/users/me`, payload);
    return data;
  },

  async updateProfile(payload: {
    phone?: string;
    birthDate?: string;
  }): Promise<User> {
    const { data } = await api.patch<User>(`/users/me/profile`, payload);
    return data;
  },
};
