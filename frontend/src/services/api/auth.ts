import { apiClient } from './apiClient';
import { API_PATHS } from '../../types';
import type { LoginRequest, UserProfile, AuthResponse, OrganizationRegisterRequest, ApiResponse } from '../../types';

export class AuthService {
  async login(email: string, password: string): Promise<ApiResponse<Omit<AuthResponse, 'refreshToken'>>> {
    const response = await apiClient.post<ApiResponse<Omit<AuthResponse, 'refreshToken'>>>(API_PATHS.AUTH.LOGIN, {
      email,
      password,
      method: 'email',
    } as LoginRequest);
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post(API_PATHS.AUTH.LOGOUT);
  }

  async getCurrentUser(): Promise<UserProfile> {
    const response = await apiClient.get<ApiResponse<UserProfile>>(API_PATHS.USERS.ME);
    return response.data.data!;
  }

  async refresh(): Promise<ApiResponse<Omit<AuthResponse, 'refreshToken'>>> {
    const response = await apiClient.post<ApiResponse<Omit<AuthResponse, 'refreshToken'>>>(API_PATHS.AUTH.REFRESH, {});
    return response.data;
  }

  async lineCallback(code: string, state?: string): Promise<ApiResponse<Omit<AuthResponse, 'refreshToken'>>> {
    const response = await apiClient.post<ApiResponse<Omit<AuthResponse, 'refreshToken'>>>(API_PATHS.AUTH.LINE_CALLBACK, {
      code,
      state,
    });
    return response.data;
  }

  async registerOrganization(data: OrganizationRegisterRequest): Promise<ApiResponse<Omit<AuthResponse, 'refreshToken'>>> {
    const response = await apiClient.post<ApiResponse<Omit<AuthResponse, 'refreshToken'>>>(API_PATHS.AUTH.REGISTER_ORGANIZATION, data);
    return response.data;
  }
}