import request from 'supertest';
import app from '../../src/index';
import { jwtService } from '../../src/common/utils/jwt';
import type { UserRole, Organization, UserProfile } from '../../src/types';
import type { JWTPayload } from '../../src/common/middleware/auth';
import { OrganizationModel } from '../../src/features/organizations/models/organization.model';
import { UserModel } from '../../src/features/users/models/user.model';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

/**
 * テスト用認証ヘルパー
 */
export class TestAuthHelper {
  /**
   * テスト用アクセストークンを生成
   */
  static generateTestToken(payload: Partial<JWTPayload>): string {
    const defaultPayload: JWTPayload = {
      userId: payload.userId || uuidv4(),
      email: payload.email || 'test@example.com',
      roles: payload.roles || ['user' as UserRole],
      currentRole: payload.currentRole || ('user' as UserRole),
      organizationId: payload.organizationId || uuidv4(),
      sessionId: payload.sessionId || uuidv4(),
      platform: payload.platform || 'web',
    };

    return jwtService.generateAccessToken(defaultPayload);
  }

  /**
   * テスト用組織を作成
   */
  static async createTestOrganization(data: Partial<Organization> = {}): Promise<Organization> {
    const organization = new OrganizationModel({
      name: data.name || 'Test Organization',
      displayName: data.displayName || 'テスト組織',
      email: data.email || `test-org-${Date.now()}-${uuidv4().substring(0, 8)}@example.com`,
      phone: data.phone || '03-1234-5678',
      address: data.address || '東京都渋谷区テスト1-2-3',
      status: data.status || 'active',
      ownerId: data.ownerId || new mongoose.Types.ObjectId(),
      plan: data.plan || 'standard',
      ...data,
    });

    const saved = await organization.save();
    return saved.toJSON() as Organization;
  }

  /**
   * テスト用ユーザーを作成
   */
  static async createTestUser(data: Partial<UserProfile> = {}): Promise<UserProfile & { password?: string }> {
    const password = 'TestPassword123!';
    const userData: any = {
      email: data.email || `test-user-${Date.now()}-${uuidv4().substring(0, 8)}@example.com`,
      password,
      name: data.name || 'Test User',
      role: data.role || ('user' as UserRole),
      status: data.status || 'active',
      authMethods: data.authMethods || ['email'],
    };

    // SuperAdmin以外の場合のみorganizationIdを設定
    if (data.role !== 'superadmin' && data.organizationId !== undefined) {
      userData.organizationId = data.organizationId;
    }

    // undefinedのプロパティを除外してからspread
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    const user = new UserModel({
      ...userData,
      ...cleanData,
    });

    const saved = await user.save();
    const result = saved.toJSON() as UserProfile;
    return { ...result, password };
  }

  /**
   * テスト用にログインしてトークンを取得
   */
  static async loginTestUser(email: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
  }> {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        method: 'email',
        email,
        password,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    return {
      accessToken: response.body.data.accessToken,
      refreshToken: response.headers['set-cookie']?.[0] || '',
      user: response.body.data.user,
    };
  }

  /**
   * 認証付きリクエストを送信するヘルパー
   */
  static authenticatedRequest(token: string) {
    return {
      get: (url: string) => request(app).get(url).set('Authorization', `Bearer ${token}`),
      post: (url: string) => request(app).post(url).set('Authorization', `Bearer ${token}`),
      put: (url: string) => request(app).put(url).set('Authorization', `Bearer ${token}`),
      patch: (url: string) => request(app).patch(url).set('Authorization', `Bearer ${token}`),
      delete: (url: string) => request(app).delete(url).set('Authorization', `Bearer ${token}`),
    };
  }

  /**
   * テスト用の完全なセットアップ（組織とオーナーを作成）
   */
  static async setupTestOrganizationWithOwner(): Promise<{
    organization: Organization;
    owner: UserProfile;
    ownerToken: string;
  }> {
    // オーナーユーザーを作成
    const ownerData = {
      email: `owner-${Date.now()}@example.com`,
      name: 'Test Owner',
      role: 'owner' as UserRole,
    };
    const owner = await this.createTestUser(ownerData);

    // 組織を作成
    const organization = await this.createTestOrganization({
      ownerId: owner.id,
    });

    // オーナーに組織IDを設定
    await UserModel.findByIdAndUpdate(owner.id, {
      organizationId: organization.id,
    });

    // オーナー用のトークンを生成
    const ownerToken = this.generateTestToken({
      userId: owner.id,
      email: owner.email,
      roles: [owner.role],
      currentRole: 'owner' as UserRole,
      organizationId: organization.id,
    });

    return {
      organization,
      owner: { ...owner, organizationId: organization.id },
      ownerToken,
    };
  }

  /**
   * 各ロールのテストユーザーセットを作成
   */
  static async createTestUserSet(organizationId: string): Promise<{
    superAdmin: { user: UserProfile; token: string };
    owner: { user: UserProfile; token: string };
    admin: { user: UserProfile; token: string };
    stylist: { user: UserProfile; token: string };
    client: { user: UserProfile; token: string };
  }> {
    // SuperAdmin（組織に属さない）
    const superAdmin = await this.createTestUser({
      email: 'superadmin@example.com',
      name: 'Super Admin',
      role: 'superadmin' as UserRole,
    });
    const superAdminToken = this.generateTestToken({
      userId: superAdmin.id,
      email: superAdmin.email,
      roles: [superAdmin.role],
      currentRole: 'superadmin' as UserRole,
    });

    // Owner
    const owner = await this.createTestUser({
      email: 'owner@example.com',
      name: 'Owner User',
      role: 'owner' as UserRole,
      organizationId,
    });
    const ownerToken = this.generateTestToken({
      userId: owner.id,
      email: owner.email,
      roles: [owner.role],
      currentRole: 'owner' as UserRole,
      organizationId,
    });

    // Admin
    const admin = await this.createTestUser({
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin' as UserRole,
      organizationId,
    });
    const adminToken = this.generateTestToken({
      userId: admin.id,
      email: admin.email,
      roles: [admin.role],
      currentRole: 'admin' as UserRole,
      organizationId,
    });

    // Stylist (User)
    const stylist = await this.createTestUser({
      email: 'stylist@example.com',
      name: 'Stylist User',
      role: 'user' as UserRole,
      organizationId,
    });
    const stylistToken = this.generateTestToken({
      userId: stylist.id,
      email: stylist.email,
      roles: [stylist.role],
      currentRole: 'user' as UserRole,
      organizationId,
    });

    // Client
    const client = await this.createTestUser({
      email: 'client@example.com',
      name: 'Client User',
      role: 'client' as UserRole,
      organizationId,
    });
    const clientToken = this.generateTestToken({
      userId: client.id,
      email: client.email,
      roles: [client.role],
      currentRole: 'client' as UserRole,
      organizationId,
    });

    return {
      superAdmin: { user: superAdmin, token: superAdminToken },
      owner: { user: owner, token: ownerToken },
      admin: { user: admin, token: adminToken },
      stylist: { user: stylist, token: stylistToken },
      client: { user: client, token: clientToken },
    };
  }
}