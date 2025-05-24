import { apiClient } from './apiClient';
import { API_PATHS } from '../../types';
import type { UserProfile } from '../../types';

export class UserService {
  async getUsers(): Promise<UserProfile[]> {
    const response = await apiClient.get<UserProfile[]>(API_PATHS.USERS.LIST);
    return response.data;
  }

  async getUser(id: string): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>(API_PATHS.USERS.DETAIL(id));
    return response.data;
  }

  async updateUser(id: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.put<UserProfile>(API_PATHS.USERS.UPDATE(id), data);
    return response.data;
  }
}