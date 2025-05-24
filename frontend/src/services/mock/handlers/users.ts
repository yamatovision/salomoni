import type { UserProfile } from '../../../types';
import { UserRole } from '../../../types';
import { mockUsers } from '../data/mockUsers';

export class MockUserService {
  async getUsers(): Promise<UserProfile[]> {
    console.warn('🔧 Using MOCK getUsers');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 現在のユーザーの組織IDを取得（実際の実装では認証情報から取得）
    const mockToken = localStorage.getItem('mockAccessToken');
    if (!mockToken) {
      throw new Error('認証が必要です');
    }
    
    const userId = mockToken.split('-')[2];
    const currentUser = mockUsers.find(u => u.id === userId);
    
    if (!currentUser) {
      throw new Error('ユーザーが見つかりません');
    }
    
    // SuperAdmin以外は同じ組織のユーザーのみ取得可能
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return mockUsers;
    }
    
    return mockUsers.filter(u => u.organizationId === currentUser.organizationId);
  }

  async getUser(id: string): Promise<UserProfile> {
    console.warn('🔧 Using MOCK getUser');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const user = mockUsers.find(u => u.id === id);
    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }
    
    return user;
  }

  async updateUser(id: string, data: Partial<UserProfile>): Promise<UserProfile> {
    console.warn('🔧 Using MOCK updateUser');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('ユーザーが見つかりません');
    }
    
    // モックなので実際には更新しないが、更新されたデータを返す
    const updatedUser = {
      ...mockUsers[userIndex],
      ...data,
      updatedAt: new Date(),
    };
    
    return updatedUser;
  }
}