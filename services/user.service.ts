import api from "@/lib/api";
import { User, UpdateResponse } from "@/types/user";

export const userService = {
  async getMe(id: number): Promise<User> {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },

  async updateUser(
    id: number,
    payload: { name?: string; email?: string },
  ): Promise<UpdateResponse> {
    const { data } = await api.patch<UpdateResponse>(`/users/${id}`, payload);
    return data;
  },

  async updateProfile(
    id: number,
    payload: { phone?: string; birthDate?: string },
  ): Promise<User> {
    const { data } = await api.patch<User>(`/users/${id}/profile`, payload);
    return data;
  },
};
