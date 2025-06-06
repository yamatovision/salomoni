import dotenv from 'dotenv';
import axios from 'axios';
import { logger } from '../src/common/utils/logger';

dotenv.config();

async function testClientAPI() {
  try {
    // 1. ログインしてトークンを取得
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'owner@salon.com',
      password: 'password123'
    });

    const token = loginResponse.data.data.token;
    logger.info('Login successful', { token: token.substring(0, 20) + '...' });

    // 2. /api/admin/clients エンドポイントをテスト
    const clientsResponse = await axios.get('http://localhost:5001/api/admin/clients', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('Clients API Response', {
      status: clientsResponse.status,
      dataKeys: Object.keys(clientsResponse.data),
      data: {
        success: clientsResponse.data.success,
        dataKeys: clientsResponse.data.data ? Object.keys(clientsResponse.data.data) : [],
        firstClient: clientsResponse.data.data?.clients?.[0] ? {
          ...clientsResponse.data.data.clients[0],
          hasRole: 'role' in clientsResponse.data.data.clients[0],
          hasBirthDate: 'birthDate' in clientsResponse.data.data.clients[0],
          hasPreferences: 'preferences' in clientsResponse.data.data.clients[0],
        } : null,
        clientCount: clientsResponse.data.data?.clients?.length || 0,
      }
    });

    // 3. /api/users エンドポイントと比較
    const usersResponse = await axios.get('http://localhost:5001/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    logger.info('Users API Response for comparison', {
      status: usersResponse.status,
      firstUser: usersResponse.data.data?.[0] ? {
        ...usersResponse.data.data[0],
        hasRole: 'role' in usersResponse.data.data[0],
        hasBirthDate: 'birthDate' in usersResponse.data.data[0],
        hasPreferences: 'preferences' in usersResponse.data.data[0],
      } : null,
      userCount: usersResponse.data.data?.length || 0,
    });

  } catch (error: any) {
    logger.error('API Test Error', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

testClientAPI();