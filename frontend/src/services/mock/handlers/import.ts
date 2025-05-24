import type {
  ImportHistory,
  ImportSettings,
  FieldMapping,
  CalendarSyncStatus,
  ApiResponse,
} from '../../../types';
import type { CSVPreviewData, FileUploadInfo } from '../data/mockImportData';
import {
  mockImportHistories,
  mockImportSettings,
  mockFieldMappings,
  mockCalendarSyncStatuses,
  mockCSVPreviewData,
  mockFileUploadInfo,
} from '../data/mockImportData';

// インポート履歴を取得
export const getImportHistory = async (): Promise<ApiResponse<ImportHistory[]>> => {
  console.warn('🔧 Using MOCK data for import history');
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    data: mockImportHistories.map(history => ({
      ...history,
      _isMockData: true,
    })),
  };
};

// インポート設定を取得
export const getImportSettings = async (): Promise<ApiResponse<ImportSettings>> => {
  console.warn('🔧 Using MOCK data for import settings');
  
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    success: true,
    data: mockImportSettings,
  };
};

// インポート設定を更新
export const updateImportSettings = async (
  settings: Partial<ImportSettings>
): Promise<ApiResponse<ImportSettings>> => {
  console.warn('🔧 Using MOCK data for updating import settings');
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    data: {
      ...mockImportSettings,
      ...settings,
    },
  };
};

// フィールドマッピングを取得
export const getFieldMappings = async (): Promise<ApiResponse<FieldMapping[]>> => {
  console.warn('🔧 Using MOCK data for field mappings');
  
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    success: true,
    data: mockFieldMappings,
  };
};

// フィールドマッピングを更新
export const updateFieldMappings = async (
  mappings: FieldMapping[]
): Promise<ApiResponse<FieldMapping[]>> => {
  console.warn('🔧 Using MOCK data for updating field mappings');
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    data: mappings,
  };
};

// カレンダー同期状態を取得
export const getCalendarSyncStatus = async (): Promise<ApiResponse<CalendarSyncStatus[]>> => {
  console.warn('🔧 Using MOCK data for calendar sync status');
  
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    success: true,
    data: mockCalendarSyncStatuses,
  };
};

// カレンダー接続
export const connectCalendar = async (
  provider: 'google' | 'icloud' | 'outlook'
): Promise<ApiResponse<CalendarSyncStatus>> => {
  console.warn('🔧 Using MOCK data for calendar connection');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const updatedStatus: CalendarSyncStatus = {
    provider,
    lastSyncTime: new Date(),
    status: 'connected',
    totalAppointments: 0,
    successfulClientMatches: 0,
    successfulStylistMatches: 0,
    pendingMatches: 0,
  };
  
  return {
    success: true,
    data: updatedStatus,
  };
};

// CSVファイルアップロード
export const uploadCSVFile = async (
  _file: File
): Promise<ApiResponse<{ fileInfo: FileUploadInfo; preview: CSVPreviewData }>> => {
  console.warn('🔧 Using MOCK data for CSV file upload');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    data: {
      fileInfo: mockFileUploadInfo,
      preview: mockCSVPreviewData,
    },
  };
};

// インポート実行
export const executeImport = async (
  _method: string,
  settings: ImportSettings
): Promise<ApiResponse<ImportHistory>> => {
  console.warn('🔧 Using MOCK data for import execution');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const newHistory: ImportHistory = {
    id: `import-${Date.now()}`,
    organizationId: 'org-1',
    method: settings.method,
    totalRecords: mockCSVPreviewData.totalRows,
    successCount: mockCSVPreviewData.validRows - 6,
    failureCount: 6,
    errors: [],
    importedBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  return {
    success: true,
    data: newHistory,
  };
};

// カレンダー同期実行
export const syncCalendar = async (
  provider: 'google' | 'icloud'
): Promise<ApiResponse<CalendarSyncStatus>> => {
  console.warn('🔧 Using MOCK data for calendar sync');
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const syncedStatus: CalendarSyncStatus = {
    provider,
    lastSyncTime: new Date(),
    status: 'connected',
    totalAppointments: 15,
    successfulClientMatches: 12,
    successfulStylistMatches: 3,
    pendingMatches: 0,
  };
  
  return {
    success: true,
    data: syncedStatus,
  };
};