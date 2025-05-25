import type {
  ImportHistory,
  ImportSettings,
  FieldMapping,
  CalendarSyncStatus,
} from '../../../types';
import { ImportMethod, ImportStatus } from '../../../types';

// インポート履歴データ
export const mockImportHistories: ImportHistory[] = [
  {
    id: 'import-1',
    organizationId: 'org-1',
    method: ImportMethod.GOOGLE_CALENDAR,
    totalRecords: 5,
    successCount: 3,
    failureCount: 2,
    importErrors: [],
    importedBy: 'user-1',
    status: ImportStatus.COMPLETED,
    createdAt: new Date('2025-04-26T14:30:00'),
    updatedAt: new Date('2025-04-26T14:30:00'),
  },
  {
    id: 'import-2',
    organizationId: 'org-1',
    method: ImportMethod.CSV,
    totalRecords: 15,
    successCount: 12,
    failureCount: 3,
    importErrors: [],
    importedBy: 'user-1',
    status: ImportStatus.COMPLETED,
    createdAt: new Date('2025-04-26T09:15:00'),
    updatedAt: new Date('2025-04-26T09:15:00'),
  },
  {
    id: 'import-3',
    organizationId: 'org-1',
    method: ImportMethod.GOOGLE_CALENDAR,
    totalRecords: 6,
    successCount: 2,
    failureCount: 4,
    importErrors: [],
    importedBy: 'user-1',
    status: ImportStatus.COMPLETED,
    createdAt: new Date('2025-04-25T14:30:00'),
    updatedAt: new Date('2025-04-25T14:30:00'),
  },
  {
    id: 'import-4',
    organizationId: 'org-1',
    method: ImportMethod.CSV,
    totalRecords: 25,
    successCount: 25,
    failureCount: 0,
    importErrors: [],
    importedBy: 'user-1',
    status: ImportStatus.COMPLETED,
    createdAt: new Date('2025-04-23T14:22:00'),
    updatedAt: new Date('2025-04-23T14:22:00'),
  },
  {
    id: 'import-5',
    organizationId: 'org-1',
    method: ImportMethod.GOOGLE_CALENDAR,
    totalRecords: 5,
    successCount: 0,
    failureCount: 5,
    importErrors: ['一部のデータが不正です'],
    importedBy: 'user-1',
    status: ImportStatus.FAILED,
    createdAt: new Date('2025-04-22T11:45:00'),
    updatedAt: new Date('2025-04-22T11:45:00'),
  },
  {
    id: 'import-6',
    organizationId: 'org-1',
    method: ImportMethod.CSV,
    totalRecords: 0,
    successCount: 0,
    failureCount: 0,
    importErrors: ['ファイルフォーマットが不正です'],
    importedBy: 'user-1',
    status: ImportStatus.FAILED,
    createdAt: new Date('2025-04-20T09:30:00'),
    updatedAt: new Date('2025-04-20T09:30:00'),
  },
];

// デフォルトのインポート設定
export const mockImportSettings: ImportSettings = {
  method: ImportMethod.CSV,
  autoCreateClients: true,
  matchingRules: {
    byName: true,
    byPhone: true,
    byEmail: true,
  },
};

// フィールドマッピング設定
export const mockFieldMappings: FieldMapping[] = [
  {
    sourceField: 'クライアント名',
    targetField: 'name',
    isEnabled: true,
    priority: 'standard',
  },
  {
    sourceField: '生年月日',
    targetField: 'birthDate',
    isEnabled: true,
    priority: 'recommended',
  },
  {
    sourceField: '生まれ時間',
    targetField: 'birthTime',
    isEnabled: true,
    priority: 'optional',
  },
  {
    sourceField: '性別',
    targetField: 'gender',
    isEnabled: true,
    priority: 'recommended',
  },
  {
    sourceField: '電話番号',
    targetField: 'phoneNumber',
    isEnabled: true,
    priority: 'optional',
  },
  {
    sourceField: 'メールアドレス',
    targetField: 'email',
    isEnabled: true,
    priority: 'optional',
  },
  {
    sourceField: 'メモ',
    targetField: 'memo',
    isEnabled: false,
    priority: 'optional',
  },
];

// カレンダー同期状態
export const mockCalendarSyncStatuses: CalendarSyncStatus[] = [
  {
    provider: 'google',
    lastSyncTime: new Date('2025-04-26T14:30:00'),
    status: 'disconnected',
    totalAppointments: 0,
    successfulClientMatches: 0,
    successfulStylistMatches: 0,
    pendingMatches: 0,
  },
  {
    provider: 'icloud',
    lastSyncTime: new Date('2025-04-26T14:30:00'),
    status: 'disconnected',
    totalAppointments: 0,
    successfulClientMatches: 0,
    successfulStylistMatches: 0,
    pendingMatches: 0,
  },
];

// CSVプレビューデータ
export interface CSVPreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export const mockCSVPreviewData: CSVPreviewData = {
  headers: ['氏名', '性別', '生年月日', '生まれ時間', '電話番号', 'メールアドレス'],
  rows: [
    ['山田 花子', '女性', '1988-05-15', '08:30', '090-1234-5678', 'hanako@example.com'],
    ['鈴木 一郎', '男性', '1975-10-22', '12:15', '080-8765-4321', 'ichiro@example.com'],
    ['佐藤 めぐみ', '女性', '1992-03-08', '--:--', '070-2345-6789', 'megumi@example.com'],
    ['高橋 健太', '男性', '1980-08-12', '18:45', '090-5678-1234', 'kenta@example.com'],
    ['田中 美咲', '女性', '1995-12-05', '07:20', '080-4321-8765', 'misaki@example.com'],
  ],
  totalRows: 38,
  validRows: 38,
  invalidRows: 0,
};

// ファイルアップロード情報
export interface FileUploadInfo {
  fileName: string;
  fileSize: string;
  recordCount: number;
  lastModified: Date;
}

export const mockFileUploadInfo: FileUploadInfo = {
  fileName: 'clients.csv',
  fileSize: '3.2 MB',
  recordCount: 38,
  lastModified: new Date('2025-04-26'),
};