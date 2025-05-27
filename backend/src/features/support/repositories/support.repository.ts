import { SupportTicketModel, SupportMessageModel } from '../models/support-ticket.model';
import { 
  SupportTicket, 
  SupportMessage, 
  TicketStatus, 
  PaginationParams, 
  PaginationInfo
} from '../../../types';
import { logger } from '../../../common/utils/logger';

export class SupportRepository {
  /**
   * 新しいサポートチケットを作成
   */
  async createTicket(ticketData: {
    organizationId: string;
    userId: string;
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: string;
  }): Promise<SupportTicket> {
    try {
      logger.info('サポートチケット作成開始', { 
        organizationId: ticketData.organizationId,
        userId: ticketData.userId 
      });

      // チケット番号の生成（組織IDの下6桁 + タイムスタンプ）
      const ticketNumber = `TKT-${ticketData.organizationId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

      const ticket = new SupportTicketModel({
        ...ticketData,
        ticketNumber,
        status: TicketStatus.OPEN
      });

      const savedTicket = await ticket.save();
      await savedTicket.populate(['userId', 'organizationId']);

      logger.info('サポートチケット作成成功', { 
        ticketId: savedTicket.id,
        ticketNumber: savedTicket.ticketNumber 
      });

      return savedTicket.toJSON() as unknown as SupportTicket;
    } catch (error) {
      logger.error('サポートチケット作成エラー', { error, ticketData });
      throw error;
    }
  }

  /**
   * サポートチケット一覧を取得
   */
  async findTickets(filter: {
    organizationId?: string;
    userId?: string;
    status?: TicketStatus;
    priority?: string;
    category?: string;
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }, pagination: PaginationParams = {}): Promise<{
    tickets: SupportTicket[];
    pagination: PaginationInfo;
  }> {
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      // クエリ構築
      const query: any = {};
      
      if (filter.organizationId) {
        query.organizationId = filter.organizationId;
      }
      
      if (filter.userId) {
        query.userId = filter.userId;
      }
      
      if (filter.status) {
        query.status = filter.status;
      }
      
      if (filter.priority) {
        query.priority = filter.priority;
      }
      
      if (filter.category) {
        query.category = filter.category;
      }
      
      if (filter.searchTerm) {
        query.$or = [
          { title: { $regex: filter.searchTerm, $options: 'i' } },
          { description: { $regex: filter.searchTerm, $options: 'i' } },
          { ticketNumber: { $regex: filter.searchTerm, $options: 'i' } }
        ];
      }

      logger.info('サポートチケット検索開始', { filter, pagination });

      // 総数を取得
      const totalItems = await SupportTicketModel.countDocuments(query);

      // ソート設定
      const sortBy = filter.sortBy || 'createdAt';
      const sortOrder = filter.sortOrder === 'asc' ? 1 : -1;
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder;

      // チケットを取得
      const tickets = await SupportTicketModel
        .find(query)
        .populate('userId', 'name email')
        .populate('organizationId', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

      // メッセージ数を取得（仮想プロパティが効かない場合の対策）
      const ticketsWithMessageCount = await Promise.all(
        tickets.map(async (ticket) => {
          const messageCount = await SupportMessageModel.countDocuments({ 
            ticketId: ticket._id 
          });
          const ticketObj = ticket.toJSON() as any;
          ticketObj.messageCount = messageCount;
          return ticketObj as SupportTicket;
        })
      );

      const totalPages = Math.ceil(totalItems / limit);

      logger.info('サポートチケット検索完了', { 
        totalItems,
        returnedItems: tickets.length 
      });

      return {
        tickets: ticketsWithMessageCount,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('サポートチケット検索エラー', { error, filter });
      throw error;
    }
  }

  /**
   * チケット詳細を取得
   */
  async findTicketById(ticketId: string): Promise<SupportTicket | null> {
    try {
      logger.info('サポートチケット詳細取得開始', { ticketId });

      const ticket = await SupportTicketModel
        .findById(ticketId)
        .populate('userId', 'name email profileImage')
        .populate('organizationId', 'name')
        .populate('assignedTo', 'name email');

      if (!ticket) {
        logger.warn('サポートチケットが見つかりません', { ticketId });
        return null;
      }

      // メッセージを取得
      const messages = await SupportMessageModel
        .find({ ticketId: ticket._id })
        .populate('senderId', 'name email profileImage')
        .sort({ createdAt: 1 });

      const ticketObj = ticket.toJSON() as any;
      ticketObj.messages = messages.map(m => m.toJSON());

      logger.info('サポートチケット詳細取得成功', { ticketId });

      return ticketObj as SupportTicket;
    } catch (error) {
      logger.error('サポートチケット詳細取得エラー', { error, ticketId });
      throw error;
    }
  }

  /**
   * チケットを更新
   */
  async updateTicket(
    ticketId: string,
    updateData: {
      title?: string;
      description?: string;
      status?: TicketStatus;
      priority?: string;
      category?: string;
      assignedTo?: string;
    }
  ): Promise<SupportTicket | null> {
    try {
      logger.info('サポートチケット更新開始', { ticketId, updateData });

      const ticket = await SupportTicketModel
        .findByIdAndUpdate(
          ticketId,
          updateData,
          { new: true, runValidators: true }
        )
        .populate('userId', 'name email')
        .populate('organizationId', 'name')
        .populate('assignedTo', 'name email');

      if (!ticket) {
        logger.warn('更新対象のサポートチケットが見つかりません', { ticketId });
        return null;
      }

      logger.info('サポートチケット更新成功', { ticketId });

      return ticket.toJSON() as unknown as SupportTicket;
    } catch (error) {
      logger.error('サポートチケット更新エラー', { error, ticketId, updateData });
      throw error;
    }
  }

  /**
   * チケットに返信を追加
   */
  async addReply(
    ticketId: string,
    replyData: {
      senderId: string;
      senderType: 'user' | 'admin' | 'system';
      content: string;
      attachments?: string[];
    }
  ): Promise<SupportMessage> {
    try {
      logger.info('サポートチケット返信追加開始', { ticketId, senderId: replyData.senderId });

      // チケットの存在確認
      const ticket = await SupportTicketModel.findById(ticketId);
      if (!ticket) {
        throw new Error('チケットが見つかりません');
      }

      // メッセージを作成
      const message = new SupportMessageModel({
        ticketId,
        ...replyData
      });

      const savedMessage = await message.save();
      await savedMessage.populate('senderId', 'name email profileImage');

      // チケットの最終返信日時を更新
      await SupportTicketModel.findByIdAndUpdate(
        ticketId,
        { 
          lastResponseAt: new Date(),
          // ユーザーからの返信の場合、ステータスをPENDINGに戻す
          ...(replyData.senderType === 'user' && ticket.status === TicketStatus.ANSWERED 
            ? { status: TicketStatus.PENDING } 
            : {}),
          // 管理者からの返信の場合、ステータスをANSWEREDに
          ...(replyData.senderType === 'admin' && ticket.status === TicketStatus.PENDING 
            ? { status: TicketStatus.ANSWERED } 
            : {})
        }
      );

      logger.info('サポートチケット返信追加成功', { 
        ticketId,
        messageId: savedMessage.id 
      });

      return savedMessage.toJSON() as unknown as SupportMessage;
    } catch (error) {
      logger.error('サポートチケット返信追加エラー', { error, ticketId, replyData });
      throw error;
    }
  }

  /**
   * チケットのメッセージ一覧を取得
   */
  async findTicketMessages(ticketId: string): Promise<SupportMessage[]> {
    try {
      logger.info('サポートチケットメッセージ取得開始', { ticketId });

      const messages = await SupportMessageModel
        .find({ ticketId })
        .populate('senderId', 'name email profileImage')
        .sort({ createdAt: 1 });

      logger.info('サポートチケットメッセージ取得成功', { 
        ticketId,
        messageCount: messages.length 
      });

      return messages.map(m => m.toJSON() as unknown as SupportMessage);
    } catch (error) {
      logger.error('サポートチケットメッセージ取得エラー', { error, ticketId });
      throw error;
    }
  }

  /**
   * チケット統計情報を取得
   */
  async getTicketStats(organizationId?: string): Promise<any> {
    try {
      logger.info('サポートチケット統計取得開始', { organizationId });

      // organizationIdをObjectIdに変換
      const mongoose = require('mongoose');
      const query = organizationId 
        ? { organizationId: new mongoose.Types.ObjectId(organizationId) } 
        : {};

      // ステータスごとの件数を集計
      const stats: Array<{ _id: string; count: number }> = await SupportTicketModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // レスポンス時間と解決時間の平均を計算
      const timeStats: Array<{ _id: null; avgResponseTime: number; avgResolutionTime: number }> = await SupportTicketModel.aggregate([
        { 
          $match: {
            ...query,
            lastResponseAt: { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            avgResponseTime: {
              $avg: {
                $subtract: ['$lastResponseAt', '$createdAt']
              }
            },
            avgResolutionTime: {
              $avg: {
                $cond: [
                  { $eq: ['$status', TicketStatus.RESOLVED] },
                  { $subtract: ['$resolvedAt', '$createdAt'] },
                  null
                ]
              }
            }
          }
        }
      ]);

      const statusCounts = stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {} as Record<string, number>);

      // 優先度ごとの件数を集計
      const priorityStats: Array<{ _id: string; count: number }> = await SupportTicketModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]);

      const priorityCounts = priorityStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {} as Record<string, number>);

      // カテゴリーごとの件数を集計
      const categoryStats: Array<{ _id: string; count: number }> = await SupportTicketModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);

      const categoryCounts = categoryStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {} as Record<string, number>);

      const result = {
        totalTickets: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
        byStatus: {
          open: statusCounts[TicketStatus.OPEN] || 0,
          pending: statusCounts[TicketStatus.PENDING] || 0,
          in_progress: statusCounts[TicketStatus.IN_PROGRESS] || 0,
          answered: statusCounts[TicketStatus.ANSWERED] || 0,
          resolved: statusCounts[TicketStatus.RESOLVED] || 0,
          closed: statusCounts[TicketStatus.CLOSED] || 0
        },
        byPriority: {
          low: priorityCounts.low || 0,
          medium: priorityCounts.medium || 0,
          high: priorityCounts.high || 0,
          urgent: priorityCounts.urgent || 0
        },
        byCategory: categoryCounts,
        avgResponseTime: timeStats[0]?.avgResponseTime || 0,
        avgResolutionTime: timeStats[0]?.avgResolutionTime || 0
      };

      logger.info('サポートチケット統計取得成功', { organizationId, result });

      return result;
    } catch (error) {
      logger.error('サポートチケット統計取得エラー', { error, organizationId });
      throw error;
    }
  }

  /**
   * チケットを削除（テスト用）
   */
  async deleteTicket(ticketId: string): Promise<boolean> {
    try {
      logger.info('サポートチケット削除開始', { ticketId });

      // 関連メッセージを削除
      await SupportMessageModel.deleteMany({ ticketId });

      // チケットを削除
      const result = await SupportTicketModel.findByIdAndDelete(ticketId);

      if (!result) {
        logger.warn('削除対象のサポートチケットが見つかりません', { ticketId });
        return false;
      }

      logger.info('サポートチケット削除成功', { ticketId });

      return true;
    } catch (error) {
      logger.error('サポートチケット削除エラー', { error, ticketId });
      throw error;
    }
  }
}