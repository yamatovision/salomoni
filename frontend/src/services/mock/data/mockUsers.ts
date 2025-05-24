import { UserRole, UserStatus } from '../../../types';
import type { UserProfile } from '../../../types';

// モックユーザーデータ
export const mockUsers: UserProfile[] = [
  {
    id: 'mock-superadmin-001',
    email: 'superadmin@salomoni.jp',
    name: 'スーパー管理者',
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    _isMockData: true,
  },
  {
    id: 'mock-owner-001',
    email: 'owner@salon.com',
    name: '山田 太郎',
    role: UserRole.OWNER,
    status: UserStatus.ACTIVE,
    organizationId: 'mock-org-001',
    createdAt: new Date('2024-01-15T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
    _isMockData: true,
  },
  {
    id: 'mock-admin-001',
    email: 'admin@salon.com',
    name: '佐藤 花子',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    organizationId: 'mock-org-001',
    createdAt: new Date('2024-02-01T00:00:00Z'),
    updatedAt: new Date('2024-02-01T00:00:00Z'),
    _isMockData: true,
  },
  {
    id: 'mock-user-001',
    email: 'stylist1@salon.com',
    name: '鈴木 美咲',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    organizationId: 'mock-org-001',
    createdAt: new Date('2024-03-01T00:00:00Z'),
    updatedAt: new Date('2024-03-01T00:00:00Z'),
    _isMockData: true,
  },
];

// パスワードマップ（開発用）
export const mockPasswords: Record<string, string> = {
  'superadmin@salomoni.jp': 'superadmin123',
  'owner@salon.com': 'owner123',
  'admin@salon.com': 'admin123',
  'stylist1@salon.com': 'stylist123',
};