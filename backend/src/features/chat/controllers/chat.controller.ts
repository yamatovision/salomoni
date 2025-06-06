import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service';
import { logger } from '../../../common/utils/logger';

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  // 新規会話セッション作成
  createConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { aiCharacterId, context, clientId } = req.body;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: '認証が必要です',
        });
      }
      
      // personalコンテキストの場合は必ずuserIdを使用し、clientIdは無視する
      const conversationData: any = {
        aiCharacterId,
        context,
      };

      if (context === 'personal') {
        conversationData.userId = req.user.id;
      } else if (context === 'client_direct') {
        conversationData.clientId = clientId;
      } else {
        // stylist_consultationの場合は、状況に応じてuserIdまたはclientIdを設定
        if (clientId) {
          conversationData.clientId = clientId;
        } else {
          conversationData.userId = req.user.id;
        }
      }

      const conversation = await this.chatService.createConversation(conversationData);

      res.status(201).json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      logger.error('会話作成エラー:', error);
      next(error);
    }
  };

  // 会話セッション一覧取得
  getConversations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { context, aiCharacterId, page = 1, limit = 20 } = req.query;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: '認証が必要です',
        });
      }
      
      const userId = req.user.id;
      const clientId = req.query.clientId as string;

      logger.info(`[DEBUG] getConversations呼び出し: userId=${userId}, clientId=${clientId}, context=${context}`);

      const filters: any = {};
      if (context) filters.context = context as string;
      if (aiCharacterId) filters.aiCharacterId = aiCharacterId as string;

      // **重要**: userIdとclientIdの排他的な処理が必要
      // client_directコンテキストの場合はclientIdのみ、それ以外はuserIdのみを使用
      let finalUserId: string | undefined = undefined;
      let finalClientId: string | undefined = undefined;
      
      if (context === 'client_direct' && clientId) {
        finalClientId = clientId;
        logger.info(`[DEBUG] client_directコンテキストのためclientIdを使用: ${finalClientId}`);
      } else {
        finalUserId = userId;
        logger.info(`[DEBUG] 通常コンテキストのためuserIdを使用: ${finalUserId}`);
      }

      const result = await this.chatService.getConversations(
        finalUserId,
        finalClientId,
        filters,
        {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
        }
      );

      res.json({
        success: true,
        data: result.conversations,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('会話一覧取得エラー:', error);
      next(error);
    }
  };

  // メッセージ送信
  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { conversationId } = req.params;
      const { content, metadata } = req.body;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          error: '会話IDが必要です',
        });
      }

      const result = await this.chatService.sendMessage(
        conversationId,
        content,
        metadata
      );

      res.json({
        success: true,
        data: {
          userMessage: result.userMessage,
          aiMessage: result.aiMessage,
        },
      });
    } catch (error) {
      logger.error('メッセージ送信エラー:', error);
      next(error);
    }
  };

  // 会話履歴取得
  getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { conversationId } = req.params;
      const { page = 1, limit = 50, order = 'asc' } = req.query;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          error: '会話IDが必要です',
        });
      }

      const result = await this.chatService.getMessages(
        conversationId,
        {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
        },
        order as 'asc' | 'desc'
      );

      res.json({
        success: true,
        data: result.messages,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('メッセージ取得エラー:', error);
      next(error);
    }
  };

  // 会話終了
  endConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          error: '会話IDが必要です',
        });
      }

      const conversation = await this.chatService.endConversation(conversationId);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: '会話が見つかりません',
        });
      }

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      logger.error('会話終了エラー:', error);
      next(error);
    }
  };

  // 自動会話開始（既存または新規）
  startChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: '認証が必要です',
        });
      }
      
      const user = req.user;
      const { context = 'personal', clientId } = req.body;

      let client = undefined;
      if (clientId) {
        // クライアント情報を取得
        const { ClientModel } = await import('../../clients/models/client.model');
        const clientData = await ClientModel.findById(clientId);
        if (clientData) {
          client = {
            id: clientData.id,
            organizationId: clientData.organizationId,
            name: clientData.name,
          } as any;
        }
      }

      // JWTPayloadから必要な情報を抽出してUserProfileライクなオブジェクトを作成
      const userProfile = context === 'client_direct' ? undefined : {
        id: user.id,
        email: user.email,
        roles: user.roles,
        organizationId: user.organizationId,
      } as any;

      const conversation = await this.chatService.getOrCreateConversation(
        userProfile,
        client,
        context
      );

      // AIキャラクター情報を取得
      const aiCharacterService = new (await import('../../ai-characters/services/ai-character.service')).AICharacterService();
      const aiCharacter = await aiCharacterService.getAICharacterById(conversation.aiCharacterId);

      res.json({
        success: true,
        data: {
          conversation,
          aiCharacter,
          isNew: !conversation.messageCount || conversation.messageCount === 0,
        },
      });
    } catch (error) {
      logger.error('チャット開始エラー:', error);
      next(error);
    }
  };
}