import { Request, Response, NextFunction } from 'express';
import { AICharacterService } from '../services/ai-character.service';
import { AIMemoryService } from '../services/ai-memory.service';
import { logger } from '../../../common/utils/logger';

export class AICharacterController {
  private aiCharacterService: AICharacterService;
  private aiMemoryService: AIMemoryService;

  constructor() {
    this.aiCharacterService = new AICharacterService();
    this.aiMemoryService = new AIMemoryService();
  }

  // AIキャラクター作成
  createAICharacter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, styleFlags, personalityScore } = req.body;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: '認証が必要です',
        });
      }
      
      const userId = req.user.id;

      const aiCharacter = await this.aiCharacterService.createAICharacter({
        name,
        userId,
        styleFlags,
        personalityScore,
      });

      res.status(201).json({
        success: true,
        data: aiCharacter,
      });
    } catch (error) {
      logger.error('AIキャラクター作成エラー:', error);
      next(error);
    }
  };

  // AIキャラクター取得
  getAICharacter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'IDが必要です',
        });
      }
      
      const aiCharacter = await this.aiCharacterService.getAICharacterById(id);
      
      if (!aiCharacter) {
        return res.status(404).json({
          success: false,
          error: 'AIキャラクターが見つかりません',
        });
      }

      res.json({
        success: true,
        data: aiCharacter,
      });
    } catch (error) {
      logger.error('AIキャラクター取得エラー:', error);
      next(error);
    }
  };

  // 現在のユーザーのAIキャラクター取得
  getMyAICharacter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('getMyAICharacter開始:', { path: req.path, user: req.user?.id });
      
      if (!req.user) {
        logger.error('getMyAICharacter: 認証情報なし');
        return res.status(401).json({
          success: false,
          error: '認証が必要です',
        });
      }
      
      const userId = req.user.id;
      logger.info(`AIキャラクター検索: userId=${userId}`);
      
      const aiCharacter = await this.aiCharacterService.getAICharacterByUserId(userId);
      
      if (!aiCharacter) {
        logger.error(`AIキャラクターが見つかりません: userId=${userId}`);
        return res.status(404).json({
          success: false,
          error: 'AIキャラクターが見つかりません',
        });
      }

      res.json({
        success: true,
        data: aiCharacter,
      });
    } catch (error) {
      logger.error('AIキャラクター取得エラー:', error);
      next(error);
    }
  };

  // AIキャラクター更新
  updateAICharacter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, styleFlags, personalityScore } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'IDが必要です',
        });
      }

      const updated = await this.aiCharacterService.updateAICharacter(id, {
        name,
        styleFlags,
        personalityScore,
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'AIキャラクターが見つかりません',
        });
      }

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      logger.error('AIキャラクター更新エラー:', error);
      next(error);
    }
  };

  // AIメモリ作成・更新
  createOrUpdateMemory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { characterId } = req.params;
      const { memoryType, content, category, extractedFrom, confidence, isActive } = req.body;

      if (!characterId) {
        return res.status(400).json({
          success: false,
          error: 'キャラクターIDが必要です',
        });
      }

      const memory = await this.aiMemoryService.createMemory({
        characterId,
        memoryType,
        content,
        category,
        extractedFrom,
        confidence,
        isActive,
      });

      res.status(201).json({
        success: true,
        data: memory,
      });
    } catch (error) {
      logger.error('AIメモリ作成エラー:', error);
      next(error);
    }
  };

  // AIメモリ取得
  getMemories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { characterId } = req.params;
      const { category, isActive, page = 1, limit = 50 } = req.query;

      if (!characterId) {
        return res.status(400).json({
          success: false,
          error: 'キャラクターIDが必要です',
        });
      }

      const filters: any = {};
      if (category) filters.category = category as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const result = await this.aiMemoryService.getMemoriesByCharacterId(
        characterId,
        filters,
        {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
        }
      );

      res.json({
        success: true,
        data: result.memories,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('AIメモリ取得エラー:', error);
      next(error);
    }
  };

  // AIキャラクター削除
  deleteAICharacter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'IDが必要です',
        });
      }

      const deleted = await this.aiCharacterService.deleteAICharacter(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'AIキャラクターが見つかりません',
        });
      }

      res.json({
        success: true,
        message: 'AIキャラクターを削除しました',
      });
    } catch (error) {
      logger.error('AIキャラクター削除エラー:', error);
      next(error);
    }
  };

  // セットアップ状態確認
  getSetupStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: '認証が必要です',
        });
      }

      const status = await this.aiCharacterService.getSetupStatus(req.user.id);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error('セットアップ状態確認エラー:', error);
      next(error);
    }
  };

  // 自然言語入力処理
  processNaturalInput = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { input, field } = req.body;

      const result = await this.aiCharacterService.processNaturalInput({
        input,
        field,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('自然言語入力処理エラー:', error);
      next(error);
    }
  };

  // AIキャラクターセットアップ
  setupAICharacter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: '認証が必要です',
        });
      }

      const result = await this.aiCharacterService.setupAICharacter(
        req.user.id,
        req.body
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('AIキャラクターセットアップエラー:', error);
      next(error);
    }
  };
}