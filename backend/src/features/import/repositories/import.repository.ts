import { FilterQuery } from 'mongoose';
import { ImportHistoryModel, ImportHistoryDocument } from '../models/import-history.model';
import { ImportMappingModel, ImportMappingDocument } from '../models/import-mapping.model';
import { ImportFileModel, ImportFileDocument } from '../models/import-file.model';
import { 
  ImportHistory, 
  ImportHistoryFilter, 
  PaginationParams,
  FieldMapping
} from '../../../types';
import { logger } from '../../../common/utils/logger';

export class ImportRepository {
  // ==========================================
  // インポート履歴関連
  // ==========================================

  async createImportHistory(data: Partial<ImportHistory>): Promise<ImportHistory> {
    try {
      logger.info('[ImportRepository] インポート履歴を作成します', { organizationId: data.organizationId });
      
      const importHistory = new ImportHistoryModel(data);
      const saved = await importHistory.save();
      
      logger.info('[ImportRepository] インポート履歴を作成しました', { 
        importId: saved.id,
        method: saved.method 
      });
      
      return {
        ...saved.toJSON(),
        createdAt: (saved as any).createdAt,
        updatedAt: (saved as any).updatedAt
      } as ImportHistory;
    } catch (error) {
      logger.error('[ImportRepository] インポート履歴の作成に失敗しました', error);
      throw error;
    }
  }

  async updateImportHistory(
    importId: string,
    updates: Partial<ImportHistory>
  ): Promise<ImportHistory | null> {
    try {
      logger.info('[ImportRepository] インポート履歴を更新します', { importId });
      
      const updated = await ImportHistoryModel.findByIdAndUpdate(
        importId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!updated) {
        logger.warn('[ImportRepository] インポート履歴が見つかりません', { importId });
        return null;
      }

      logger.info('[ImportRepository] インポート履歴を更新しました', { 
        importId: updated.id,
        status: updated.status 
      });
      
      return {
        ...updated.toJSON(),
        createdAt: (updated as any).createdAt,
        updatedAt: (updated as any).updatedAt
      } as ImportHistory;
    } catch (error) {
      logger.error('[ImportRepository] インポート履歴の更新に失敗しました', error);
      throw error;
    }
  }

  async getImportHistory(
    organizationId: string,
    filter: ImportHistoryFilter = {},
    pagination: PaginationParams = {}
  ): Promise<{ imports: ImportHistory[]; total: number }> {
    try {
      logger.info('[ImportRepository] インポート履歴を取得します', { 
        organizationId,
        filter,
        pagination 
      });

      const query: FilterQuery<ImportHistoryDocument> = { organizationId };

      if (filter.method) {
        query.method = filter.method;
      }

      if (filter.status) {
        query.status = filter.status;
      }

      if (filter.dateFrom || filter.dateTo) {
        query.startedAt = {};
        if (filter.dateFrom) {
          query.startedAt.$gte = filter.dateFrom;
        }
        if (filter.dateTo) {
          query.startedAt.$lte = filter.dateTo;
        }
      }

      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const skip = (page - 1) * limit;

      const [imports, total] = await Promise.all([
        ImportHistoryModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ImportHistoryModel.countDocuments(query)
      ]);

      logger.info('[ImportRepository] インポート履歴を取得しました', { 
        count: imports.length,
        total 
      });

      return {
        imports: imports.map(imp => ({
          ...imp,
          id: imp._id.toString(),
          createdAt: (imp as any).createdAt || new Date(),
          updatedAt: (imp as any).updatedAt || new Date()
        } as ImportHistory)),
        total
      };
    } catch (error) {
      logger.error('[ImportRepository] インポート履歴の取得に失敗しました', error);
      throw error;
    }
  }

  async getImportHistoryById(importId: string): Promise<ImportHistory | null> {
    try {
      logger.info('[ImportRepository] インポート履歴を取得します', { importId });
      
      const importHistory = await ImportHistoryModel.findById(importId);
      
      if (!importHistory) {
        logger.warn('[ImportRepository] インポート履歴が見つかりません', { importId });
        return null;
      }

      return {
        ...importHistory.toJSON(),
        createdAt: (importHistory as any).createdAt,
        updatedAt: (importHistory as any).updatedAt
      } as ImportHistory;
    } catch (error) {
      logger.error('[ImportRepository] インポート履歴の取得に失敗しました', error);
      throw error;
    }
  }

  // ==========================================
  // インポートマッピング関連
  // ==========================================

  async saveImportMapping(
    organizationId: string,
    mappingName: string,
    mappings: FieldMapping[],
    isDefault: boolean = false
  ): Promise<ImportMappingDocument> {
    try {
      logger.info('[ImportRepository] インポートマッピングを保存します', { 
        organizationId,
        mappingName,
        isDefault 
      });

      // デフォルトに設定する場合、既存のデフォルトを解除
      if (isDefault) {
        await ImportMappingModel.updateMany(
          { organizationId, isDefault: true },
          { $set: { isDefault: false } }
        );
      }

      const mapping = await ImportMappingModel.findOneAndUpdate(
        { organizationId, mappingName },
        {
          $set: {
            mappings,
            isDefault,
            updatedAt: new Date()
          }
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );

      logger.info('[ImportRepository] インポートマッピングを保存しました', { 
        mappingId: mapping.id 
      });

      return mapping;
    } catch (error) {
      logger.error('[ImportRepository] インポートマッピングの保存に失敗しました', error);
      throw error;
    }
  }

  async getImportMappings(organizationId: string): Promise<ImportMappingDocument[]> {
    try {
      logger.info('[ImportRepository] インポートマッピングを取得します', { organizationId });
      
      const mappings = await ImportMappingModel
        .find({ organizationId })
        .sort({ isDefault: -1, mappingName: 1 });

      logger.info('[ImportRepository] インポートマッピングを取得しました', { 
        count: mappings.length 
      });

      return mappings;
    } catch (error) {
      logger.error('[ImportRepository] インポートマッピングの取得に失敗しました', error);
      throw error;
    }
  }

  async getDefaultMapping(organizationId: string): Promise<ImportMappingDocument | null> {
    try {
      logger.info('[ImportRepository] デフォルトマッピングを取得します', { organizationId });
      
      const mapping = await ImportMappingModel.findOne({ 
        organizationId, 
        isDefault: true 
      });

      if (!mapping) {
        logger.info('[ImportRepository] デフォルトマッピングが見つかりません', { organizationId });
      }

      return mapping;
    } catch (error) {
      logger.error('[ImportRepository] デフォルトマッピングの取得に失敗しました', error);
      throw error;
    }
  }

  // ==========================================
  // インポートファイル関連
  // ==========================================

  async saveImportFile(fileData: Partial<ImportFileDocument>): Promise<ImportFileDocument> {
    try {
      logger.info('[ImportRepository] インポートファイル情報を保存します', { 
        fileName: fileData.fileName,
        fileSize: fileData.fileSize 
      });
      
      const importFile = new ImportFileModel(fileData);
      const saved = await importFile.save();
      
      logger.info('[ImportRepository] インポートファイル情報を保存しました', { 
        fileId: saved.fileId 
      });
      
      return saved;
    } catch (error) {
      logger.error('[ImportRepository] インポートファイル情報の保存に失敗しました', error);
      throw error;
    }
  }

  async getImportFile(fileId: string): Promise<ImportFileDocument | null> {
    try {
      logger.info('[ImportRepository] インポートファイル情報を取得します', { fileId });
      
      const file = await ImportFileModel.findOne({ fileId });
      
      if (!file) {
        logger.warn('[ImportRepository] インポートファイルが見つかりません', { fileId });
        return null;
      }

      return file;
    } catch (error) {
      logger.error('[ImportRepository] インポートファイル情報の取得に失敗しました', error);
      throw error;
    }
  }

  async deleteImportFile(fileId: string): Promise<boolean> {
    try {
      logger.info('[ImportRepository] インポートファイル情報を削除します', { fileId });
      
      const result = await ImportFileModel.deleteOne({ fileId });
      
      if (result.deletedCount === 0) {
        logger.warn('[ImportRepository] 削除対象のインポートファイルが見つかりません', { fileId });
        return false;
      }

      logger.info('[ImportRepository] インポートファイル情報を削除しました', { fileId });
      return true;
    } catch (error) {
      logger.error('[ImportRepository] インポートファイル情報の削除に失敗しました', error);
      throw error;
    }
  }

  // 有効期限切れファイルのクリーンアップ（バッチ処理用）
  async cleanupExpiredFiles(): Promise<number> {
    try {
      logger.info('[ImportRepository] 有効期限切れファイルをクリーンアップします');
      
      const result = await ImportFileModel.deleteMany({
        expiresAt: { $lte: new Date() }
      });

      logger.info('[ImportRepository] 有効期限切れファイルをクリーンアップしました', { 
        deletedCount: result.deletedCount 
      });

      return result.deletedCount;
    } catch (error) {
      logger.error('[ImportRepository] 有効期限切れファイルのクリーンアップに失敗しました', error);
      throw error;
    }
  }
}