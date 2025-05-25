import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  ImportHistory,
  ImportHistoryFilter,
  ImportOptions,
  ImportPreviewData,
  ImportUploadResponse,
  ImportExecuteRequest,
  ImportExecuteResponse,
  FieldMapping,
  ImportMethod,
  ImportStatus,
  ClientImportPreview,
  Client,
  PaginationParams,
  CalendarConnectionRequest,
  CalendarSyncSettings
} from '../../../types';
import { ImportRepository } from '../repositories/import.repository';
import { ClientRepository } from '../../clients/repositories/client.repository';
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/middleware/errorHandler';

export class ImportService {
  private importRepository: ImportRepository;
  private clientRepository: ClientRepository;
  private uploadDir: string;

  constructor() {
    this.importRepository = new ImportRepository();
    this.clientRepository = new ClientRepository();
    this.uploadDir = path.join(process.cwd(), 'uploads', 'imports');
    
    // アップロードディレクトリの作成
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // ==========================================
  // CSVファイルアップロード処理
  // ==========================================

  async uploadImportFile(
    file: Express.Multer.File,
    organizationId: string,
    userId: string
  ): Promise<ImportUploadResponse> {
    const fileId = uuidv4();
    const filePath = path.join(this.uploadDir, `${fileId}-${file.originalname}`);
    
    try {
      logger.info('[ImportService] CSVファイルをアップロードします', {
        fileName: file.originalname,
        fileSize: file.size,
        organizationId
      });

      // ファイルを保存
      fs.writeFileSync(filePath, file.buffer);

      // CSVをパース
      const csvContent = file.buffer.toString('utf-8');
      
      // 空ファイルチェック
      if (!csvContent || csvContent.trim() === '') {
        throw new AppError(400, 'CSVファイルにデータが含まれていません');
      }
      
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (records.length === 0) {
        throw new AppError(400, 'CSVファイルにデータが含まれていません');
      }

      // ヘッダーを取得
      const headers = Object.keys(records[0]);

      // デフォルトマッピングを取得または生成
      const defaultMapping = await this.getOrCreateDefaultMapping(organizationId, headers);

      // プレビューデータを生成
      const preview = await this.generatePreviewData(records.slice(0, 10), defaultMapping, organizationId);

      // ファイル情報を保存
      await this.importRepository.saveImportFile({
        fileId,
        organizationId,
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        filePath,
        recordCount: records.length,
        headers,
        previewData: records.slice(0, 5), // 最初の5件を保存
      });

      logger.info('[ImportService] CSVファイルをアップロードしました', {
        fileId,
        recordCount: records.length
      });

      return {
        fileId,
        fileName: file.originalname,
        fileSize: file.size,
        recordCount: records.length,
        preview,
        mapping: defaultMapping,
      };
    } catch (error) {
      // エラー時はファイルを削除
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      logger.error('[ImportService] CSVファイルのアップロードに失敗しました', error);
      throw error;
    }
  }

  // ==========================================
  // インポート実行処理
  // ==========================================

  async executeImport(
    request: ImportExecuteRequest,
    organizationId: string,
    userId: string
  ): Promise<ImportExecuteResponse> {
    try {
      logger.info('[ImportService] インポートを実行します', {
        fileId: request.fileId,
        organizationId,
        options: request.options
      });

      // ファイル情報を取得
      const importFile = await this.importRepository.getImportFile(request.fileId);
      if (!importFile || importFile.organizationId !== organizationId) {
        throw new AppError(404, 'インポートファイルが見つかりません');
      }

      // インポート履歴を作成
      const importHistory = await this.importRepository.createImportHistory({
        organizationId,
        method: ImportMethod.CSV,
        totalRecords: importFile.recordCount,
        successCount: 0,
        failureCount: 0,
        importErrors: [],
        importedBy: userId,
        fileName: importFile.fileName,
        status: ImportStatus.PROCESSING,
        startedAt: new Date(),
        mapping: request.mapping,
      });

      try {
        // CSVファイルを読み込み
        const csvContent = fs.readFileSync(importFile.filePath, 'utf-8');
        const records = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });

        // インポート処理
        const result = await this.processImport(
          records,
          request.mapping,
          request.options,
          organizationId,
          importHistory.id
        );

        // インポート履歴を更新
        await this.importRepository.updateImportHistory(importHistory.id, {
          successCount: result.success,
          failureCount: result.failed,
          importErrors: result.errors,
          status: ImportStatus.COMPLETED,
          completedAt: new Date(),
        });

        // ファイル情報を削除（ファイル自体も削除）
        await this.cleanupImportFile(request.fileId);

        logger.info('[ImportService] インポートが完了しました', {
          importId: importHistory.id,
          processed: result.processed,
          success: result.success,
          failed: result.failed
        });

        return {
          importId: importHistory.id,
          processed: result.processed,
          success: result.success,
          failed: result.failed,
          importErrors: result.errors.slice(0, 10), // 最初の10件のエラーのみ返す
        };
      } catch (error) {
        // エラー時はインポート履歴を更新
        await this.importRepository.updateImportHistory(importHistory.id, {
          status: ImportStatus.FAILED,
          completedAt: new Date(),
          importErrors: [error instanceof Error ? error.message : 'インポート処理中にエラーが発生しました'],
        });
        throw error;
      }
    } catch (error) {
      logger.error('[ImportService] インポートの実行に失敗しました', error);
      throw error;
    }
  }

  // ==========================================
  // インポート履歴取得
  // ==========================================

  async getImportHistory(
    organizationId: string,
    filter: ImportHistoryFilter,
    pagination: PaginationParams
  ): Promise<{ imports: ImportHistory[]; total: number }> {
    try {
      logger.info('[ImportService] インポート履歴を取得します', {
        organizationId,
        filter,
        pagination
      });

      return await this.importRepository.getImportHistory(organizationId, filter, pagination);
    } catch (error) {
      logger.error('[ImportService] インポート履歴の取得に失敗しました', error);
      throw error;
    }
  }

  // ==========================================
  // カレンダー連携
  // ==========================================

  async connectCalendar(
    request: CalendarConnectionRequest,
    organizationId: string
  ): Promise<CalendarSyncSettings> {
    try {
      logger.info('[ImportService] カレンダー連携を設定します', {
        provider: request.provider,
        organizationId
      });

      // TODO: 実際のカレンダー連携実装
      // ここでは仮の実装を返す
      const settings: CalendarSyncSettings = {
        provider: request.provider,
        connected: true,
        calendarId: `cal-${uuidv4()}`,
        syncFrequency: request.syncFrequency,
        lastSyncAt: new Date(),
        syncEnabled: true,
        enabled: true,
        syncInterval: '30min',
        autoAssignEnabled: false,
        autoReflectChangesEnabled: false,
        enableMachineLearning: false,
      };

      logger.info('[ImportService] カレンダー連携を設定しました', {
        provider: request.provider,
        calendarId: settings.calendarId
      });

      return settings;
    } catch (error) {
      logger.error('[ImportService] カレンダー連携の設定に失敗しました', error);
      throw error;
    }
  }

  // ==========================================
  // プライベートメソッド
  // ==========================================

  private async getOrCreateDefaultMapping(
    organizationId: string,
    headers: string[]
  ): Promise<FieldMapping[]> {
    // デフォルトマッピングを取得
    const defaultMapping = await this.importRepository.getDefaultMapping(organizationId);
    if (defaultMapping) {
      return defaultMapping.mappings;
    }

    // デフォルトマッピングを生成
    const fieldMap: Record<string, { target: string; priority: 'standard' | 'recommended' | 'optional' }> = {
      '名前': { target: 'name', priority: 'standard' },
      'name': { target: 'name', priority: 'standard' },
      '氏名': { target: 'name', priority: 'standard' },
      'お名前': { target: 'name', priority: 'standard' },
      '生年月日': { target: 'birthDate', priority: 'recommended' },
      'birthdate': { target: 'birthDate', priority: 'recommended' },
      'birth_date': { target: 'birthDate', priority: 'recommended' },
      '誕生日': { target: 'birthDate', priority: 'recommended' },
      '性別': { target: 'gender', priority: 'recommended' },
      'gender': { target: 'gender', priority: 'recommended' },
      'メール': { target: 'email', priority: 'optional' },
      'email': { target: 'email', priority: 'optional' },
      'メールアドレス': { target: 'email', priority: 'optional' },
      '電話番号': { target: 'phoneNumber', priority: 'optional' },
      'phone': { target: 'phoneNumber', priority: 'optional' },
      'phone_number': { target: 'phoneNumber', priority: 'optional' },
      'tel': { target: 'phoneNumber', priority: 'optional' },
      'メモ': { target: 'memo', priority: 'optional' },
      'memo': { target: 'memo', priority: 'optional' },
      '備考': { target: 'memo', priority: 'optional' },
    };

    const mappings: FieldMapping[] = headers.map(header => {
      const mapping = fieldMap[header.toLowerCase()] || fieldMap[header];
      return {
        sourceField: header,
        targetField: mapping?.target || '',
        isEnabled: !!mapping,
        priority: mapping?.priority || 'optional',
      };
    });

    return mappings;
  }

  private async generatePreviewData(
    records: any[],
    mappings: FieldMapping[],
    organizationId: string
  ): Promise<ImportPreviewData> {
    const enabledMappings = mappings.filter(m => m.isEnabled);
    const clients: ClientImportPreview[] = [];
    let newCount = 0;
    let updateCount = 0;
    let errorCount = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const clientData: Partial<Client> = { organizationId };
      let hasError = false;
      const errors: string[] = [];

      // マッピングに基づいてデータを変換
      for (const mapping of enabledMappings) {
        const value = record[mapping.sourceField];
        if (!value) continue;

        switch (mapping.targetField) {
          case 'name':
            clientData.name = value;
            break;
          case 'birthDate':
            try {
              clientData.birthDate = new Date(value);
              if (isNaN(clientData.birthDate.getTime())) {
                errors.push('生年月日の形式が不正です');
                hasError = true;
              }
            } catch {
              errors.push('生年月日の形式が不正です');
              hasError = true;
            }
            break;
          case 'gender':
            const gender = this.normalizeGender(value);
            if (gender) {
              clientData.gender = gender;
            } else {
              errors.push('性別の値が不正です');
              hasError = true;
            }
            break;
          case 'email':
            clientData.email = value;
            break;
          case 'phoneNumber':
            clientData.phoneNumber = this.normalizePhoneNumber(value);
            break;
          case 'memo':
            clientData.memo = value;
            break;
        }
      }

      // 必須項目のチェック
      if (!clientData.name) {
        errors.push('名前は必須です');
        hasError = true;
      }

      // 既存クライアントのチェック
      let status: 'new' | 'update' | 'error' = 'new';
      if (!hasError && clientData.name) {
        const existing = await this.clientRepository.findByNameAndOrganization(
          clientData.name,
          organizationId
        );
        if (existing) {
          status = 'update';
          updateCount++;
        } else {
          newCount++;
        }
      } else {
        status = 'error';
        errorCount++;
      }

      clients.push({
        rowNumber: i + 2, // ヘッダー行を考慮
        data: clientData,
        status,
        importErrors: errors.length > 0 ? errors : undefined,
      });
    }

    return {
      clients,
      summary: {
        total: records.length,
        new: newCount,
        update: updateCount,
        errors: errorCount,
      },
    };
  }

  private async processImport(
    records: any[],
    mappings: FieldMapping[],
    options: ImportOptions,
    organizationId: string,
    importId: string
  ): Promise<{ processed: number; success: number; failed: number; errors: string[] }> {
    const enabledMappings = mappings.filter(m => m.isEnabled);
    let processed = 0;
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      processed++;
      const record = records[i];
      const clientData: Partial<Client> = { organizationId };
      let hasError = false;
      const rowErrors: string[] = [];

      // マッピングに基づいてデータを変換
      for (const mapping of enabledMappings) {
        const value = record[mapping.sourceField];
        if (!value) continue;

        switch (mapping.targetField) {
          case 'name':
            clientData.name = value;
            break;
          case 'birthDate':
            try {
              clientData.birthDate = new Date(value);
              if (isNaN(clientData.birthDate.getTime())) {
                rowErrors.push('生年月日の形式が不正です');
                hasError = true;
              }
            } catch {
              rowErrors.push('生年月日の形式が不正です');
              hasError = true;
            }
            break;
          case 'gender':
            const gender = this.normalizeGender(value);
            if (gender) {
              clientData.gender = gender;
            } else {
              rowErrors.push('性別の値が不正です');
              hasError = true;
            }
            break;
          case 'email':
            clientData.email = value;
            break;
          case 'phoneNumber':
            clientData.phoneNumber = this.normalizePhoneNumber(value);
            break;
          case 'memo':
            clientData.memo = value;
            break;
        }
      }

      // 必須項目のチェック
      if (!clientData.name) {
        rowErrors.push('名前は必須です');
        hasError = true;
      }

      // エラーがある場合の処理
      if (hasError) {
        failed++;
        errors.push(`行${i + 2}: ${rowErrors.join(', ')}`);
        if (!options.skipErrors) {
          continue;
        }
      }

      // ドライランモードの場合はスキップ
      if (options.dryRun) {
        success++;
        continue;
      }

      try {
        // 既存クライアントのチェック
        if (clientData.name) {
          const existing = await this.clientRepository.findByNameAndOrganization(
            clientData.name,
            organizationId
          );

          if (existing) {
            if (options.updateExisting) {
              await this.clientRepository.updateClient(existing.id, organizationId, clientData);
              success++;
            } else {
              failed++;
              errors.push(`行${i + 2}: クライアント「${clientData.name}」は既に存在します`);
            }
          } else {
            if (options.autoCreateClients) {
              await this.clientRepository.createClient(clientData as any);
              success++;
            } else {
              failed++;
              errors.push(`行${i + 2}: 新規クライアントの作成が無効です`);
            }
          }
        }
      } catch (error) {
        failed++;
        errors.push(`行${i + 2}: ${error instanceof Error ? error.message : 'エラーが発生しました'}`);
      }

      // 進捗を定期的に更新（100件ごと）
      if (processed % 100 === 0) {
        await this.importRepository.updateImportHistory(importId, {
          successCount: success,
          failureCount: failed,
        });
      }
    }

    return { processed, success, failed, errors };
  }

  private normalizeGender(value: string): 'male' | 'female' | 'other' | null {
    const normalized = value.toLowerCase().trim();
    
    const maleValues = ['男', '男性', 'male', 'm', '1'];
    const femaleValues = ['女', '女性', 'female', 'f', '2'];
    const otherValues = ['その他', 'other', 'o', '3'];

    if (maleValues.includes(normalized)) return 'male';
    if (femaleValues.includes(normalized)) return 'female';
    if (otherValues.includes(normalized)) return 'other';
    
    return null;
  }

  private normalizePhoneNumber(value: string): string {
    // 数字以外を除去
    return value.replace(/[^\d]/g, '');
  }

  private async cleanupImportFile(fileId: string): Promise<void> {
    try {
      const file = await this.importRepository.getImportFile(fileId);
      if (file && fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }
      await this.importRepository.deleteImportFile(fileId);
    } catch (error) {
      logger.error('[ImportService] ファイルのクリーンアップに失敗しました', error);
    }
  }
}