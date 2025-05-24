import { apiClient } from './apiClient';
import { API_PATHS } from '../../types';
import type { LoginRequest, LoginResponse, UserProfile, AuthResponse, OrganizationRegisterRequest } from '../../types';

export class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(API_PATHS.AUTH.LOGIN, {
      email,
      password,
    } as LoginRequest);
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post(API_PATHS.AUTH.LOGOUT);
  }

  async getCurrentUser(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>(API_PATHS.USERS.ME);
    return response.data;
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(API_PATHS.AUTH.REFRESH, {
      refreshToken,
    });
    return response.data;
  }

  async lineCallback(code: string, state?: string): Promise<AuthResponse> {
    const response = await apiClient.get<AuthResponse>(API_PATHS.AUTH.LINE_CALLBACK, {
      params: { code, state },
    });
    return response.data;
  }

  async registerOrganization(data: OrganizationRegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(API_PATHS.AUTH.REGISTER_ORGANIZATION, data);
    return response.data;
  }
}