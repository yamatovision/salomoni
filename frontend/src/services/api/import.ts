import { apiClient } from './apiClient';
import { API_PATHS } from '../../types';
import type {
  ImportFile,
  ImportHistory,
  ImportMapping,
  ImportResult,
  ImportPreviewData,
  CalendarIntegration,
} from '../../types';

export const importService = {
  /**
   * CSVファイルをアップロードする
   */
  async uploadFile(file: File): Promise<ImportFile> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(API_PATHS.ADMIN.IMPORT_UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * インポートを実行する
   */
  async executeImport(
    fileId: string,
    mapping: ImportMapping,
    options?: {
      updateExisting?: boolean;
      dryRun?: boolean;
    }
  ): Promise<ImportResult> {
    const response = await apiClient.post(API_PATHS.ADMIN.IMPORT_EXECUTE, {
      fileId,
      mapping,
      updateExisting: options?.updateExisting ?? false,
      dryRun: options?.dryRun ?? false,
    });
    return response.data;
  },

  /**
   * インポート履歴を取得する
   */
  async getHistory(params?: {
    page?: number;
    limit?: number;
    fileType?: 'csv' | 'calendar';
    status?: string;
  }): Promise<{ history: ImportHistory[]; total: number }> {
    const response = await apiClient.get(API_PATHS.ADMIN.IMPORT_HISTORY, {
      params,
    });
    return response.data;
  },

  /**
   * カレンダー連携を設定する
   */
  async connectCalendar(integration: CalendarIntegration): Promise<void> {
    await apiClient.post(API_PATHS.ADMIN.CALENDAR_CONNECT, integration);
  },

  /**
   * インポートプレビューを取得する（モックを一時的に維持）
   * TODO: バックエンドにプレビューAPIが実装されたら更新
   */
  async getPreview(_fileId: string, _mapping: ImportMapping): Promise<ImportPreviewData> {
    // バックエンドにプレビューAPIが実装されるまでの仮実装
    const mockPreview: ImportPreviewData = {
      clients: [
        {
          rowNumber: 1,
          data: {
            name: '山田花子',
            birthDate: new Date('1990-01-15'),
            email: 'hanako@example.com',
            phoneNumber: '090-1234-5678'
          },
          status: 'new'
        }
      ],
      summary: {
        total: 5,
        new: 4,
        update: 0,
        errors: 1
      }
    };
    return mockPreview;
  }
};