import { SupportRepository } from '../repositories/support.repository';
import { UserModel } from '../../users/models/user.model';
import { OrganizationModel } from '../../organizations/models/organization.model';
import { 
  SupportTicket, 
  SupportMessage, 
  TicketStatus, 
  PaginationParams,
  UserRole
} from '../../../types';
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/errors';

export class SupportService {
  private supportRepository: SupportRepository;

  constructor() {
    this.supportRepository = new SupportRepository();
  }

  /**
   * 新しいサポートチケットを作成
   */
  async createTicket(
    userId: string,
    organizationId: string,
    ticketData: {
      title: string;
      description: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      category?: string;
    }
  ): Promise<SupportTicket> {
    try {
      logger.info('サポートチケット作成処理開始', { userId, organizationId });

      // ユーザーの存在確認
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new AppError('ユーザーが見つかりません', 404);
      }

      // 組織の存在確認
      const organization = await OrganizationModel.findById(organizationId);
      if (!organization) {
        throw new AppError('組織が見つかりません', 404);
      }

      // ユーザーが組織に所属しているか確認
      if (user.organizationId?.toString() !== organizationId) {
        throw new AppError('この組織のチケットを作成する権限がありません', 403);
      }

      // チケットを作成
      const ticket = await this.supportRepository.createTicket({
        organizationId,
        userId,
        ...ticketData
      });

      logger.info('サポートチケット作成成功', { 
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber 
      });

      return ticket;
    } catch (error) {
      logger.error('サポートチケット作成エラー', { error, userId, organizationId });
      throw error;
    }
  }

  /**
   * サポートチケット一覧を取得
   */
  async getTickets(
    requesterId: string,
    requesterRole: UserRole,
    filter: {
      organizationId?: string;
      userId?: string;
      status?: TicketStatus;
      priority?: string;
      category?: string;
      searchTerm?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
    pagination?: PaginationParams
  ): Promise<{
    tickets: SupportTicket[];
    pagination: any;
  }> {
    try {
      logger.info('サポートチケット一覧取得開始', { 
        requesterId,
        requesterRole,
        requesterRoleType: typeof requesterRole,
        filter 
      });

      // 権限に応じてフィルターを調整
      const adjustedFilter = { ...filter };

      if (requesterRole === UserRole.SUPER_ADMIN) {
        // SuperAdminは全組織のチケットを見られる
        // organizationIdが指定されていなければ全組織が対象
      } else if ([UserRole.OWNER, UserRole.ADMIN].includes(requesterRole)) {
        // Owner/Adminは自組織のチケットのみ
        const requester = await UserModel.findById(requesterId);
        if (!requester || !requester.organizationId) {
          throw new AppError('組織情報が見つかりません', 400);
        }
        adjustedFilter.organizationId = requester.organizationId.toString();
        // 管理者の場合、userIdフィルターを外す
        delete adjustedFilter.userId;
      } else if (requesterRole === UserRole.USER || requesterRole === UserRole.STYLIST) {
        // 一般ユーザー・スタイリストは自分のチケットのみ
        adjustedFilter.userId = requesterId;
        
        // 組織IDも確認
        const requester = await UserModel.findById(requesterId);
        if (requester?.organizationId) {
          adjustedFilter.organizationId = requester.organizationId.toString();
        }
      } else {
        throw new AppError('チケット一覧を取得する権限がありません', 403);
      }

      const result = await this.supportRepository.findTickets(
        adjustedFilter,
        pagination
      );

      logger.info('サポートチケット一覧取得成功', { 
        totalItems: result.pagination.totalItems 
      });

      return result;
    } catch (error) {
      logger.error('サポートチケット一覧取得エラー', { error, requesterId });
      throw error;
    }
  }

  /**
   * チケット詳細を取得
   */
  async getTicketDetail(
    requesterId: string,
    requesterRole: UserRole,
    ticketId: string
  ): Promise<SupportTicket> {
    try {
      logger.info('サポートチケット詳細取得開始', { 
        requesterId,
        ticketId 
      });

      const ticket = await this.supportRepository.findTicketById(ticketId);
      if (!ticket) {
        throw new AppError('チケットが見つかりません', 404);
      }

      // アクセス権限チェック
      await this.checkTicketAccess(requesterId, requesterRole, ticket);

      logger.info('サポートチケット詳細取得成功', { ticketId });

      return ticket;
    } catch (error) {
      logger.error('サポートチケット詳細取得エラー', { error, requesterId, ticketId });
      throw error;
    }
  }

  /**
   * チケットに返信
   */
  async replyToTicket(
    senderId: string,
    senderRole: UserRole,
    ticketId: string,
    replyData: {
      content: string;
      attachments?: string[];
    }
  ): Promise<SupportMessage> {
    try {
      logger.info('サポートチケット返信開始', { 
        senderId,
        ticketId 
      });

      // チケットの存在確認
      const ticket = await this.supportRepository.findTicketById(ticketId);
      if (!ticket) {
        throw new AppError('チケットが見つかりません', 404);
      }

      // アクセス権限チェック
      await this.checkTicketAccess(senderId, senderRole, ticket);

      // 送信者タイプを決定
      const senderType = [UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN].includes(senderRole) 
        ? 'admin' 
        : 'user';

      // 返信を追加
      const message = await this.supportRepository.addReply(
        ticketId,
        {
          senderId,
          senderType,
          ...replyData
        }
      );

      logger.info('サポートチケット返信成功', { 
        ticketId,
        messageId: message.id 
      });

      return message;
    } catch (error) {
      logger.error('サポートチケット返信エラー', { error, senderId, ticketId });
      throw error;
    }
  }

  /**
   * チケットステータスを更新
   */
  async updateTicketStatus(
    requesterId: string,
    requesterRole: UserRole,
    ticketId: string,
    newStatus: TicketStatus
  ): Promise<SupportTicket> {
    try {
      logger.info('サポートチケットステータス更新開始', { 
        requesterId,
        ticketId,
        newStatus 
      });

      // 管理者権限チェック
      if (![UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN].includes(requesterRole)) {
        throw new AppError('チケットステータスを更新する権限がありません', 403);
      }

      // チケットの存在確認
      const ticket = await this.supportRepository.findTicketById(ticketId);
      if (!ticket) {
        throw new AppError('チケットが見つかりません', 404);
      }

      // アクセス権限チェック
      await this.checkTicketAccess(requesterId, requesterRole, ticket);

      // ステータスを更新
      const updatedTicket = await this.supportRepository.updateTicket(
        ticketId,
        { status: newStatus }
      );

      if (!updatedTicket) {
        throw new AppError('チケットの更新に失敗しました', 500);
      }

      logger.info('サポートチケットステータス更新成功', { 
        ticketId,
        newStatus 
      });

      return updatedTicket;
    } catch (error) {
      logger.error('サポートチケットステータス更新エラー', { 
        error,
        requesterId,
        ticketId 
      });
      throw error;
    }
  }

  /**
   * チケット統計情報を取得
   */
  async getTicketStats(
    requesterId: string,
    requesterRole: UserRole,
    organizationId?: string
  ): Promise<any> {
    try {
      logger.info('サポートチケット統計取得開始', { 
        requesterId,
        organizationId 
      });

      // SuperAdmin以外は組織IDが必須
      if (requesterRole !== UserRole.SUPER_ADMIN) {
        const requester = await UserModel.findById(requesterId);
        if (!requester || !requester.organizationId) {
          throw new AppError('組織情報が見つかりません', 400);
        }
        organizationId = requester.organizationId.toString();
      }

      const stats = await this.supportRepository.getTicketStats(organizationId);

      logger.info('サポートチケット統計取得成功', { organizationId });

      return stats;
    } catch (error) {
      logger.error('サポートチケット統計取得エラー', { 
        error,
        requesterId,
        organizationId 
      });
      throw error;
    }
  }

  /**
   * チケットへのアクセス権限をチェック
   */
  private async checkTicketAccess(
    userId: string,
    userRole: UserRole,
    ticket: SupportTicket
  ): Promise<void> {
    logger.info('チケットアクセス権限チェック開始', {
      userId,
      userRole,
      ticketId: ticket.id,
      ticketUserId: ticket.userId,
      ticketOrganizationId: ticket.organizationId
    });

    // SuperAdminは全てアクセス可能
    if (userRole === UserRole.SUPER_ADMIN) {
      logger.info('SuperAdmin権限でアクセス許可');
      return;
    }

    // ユーザー情報を取得
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('ユーザーが見つかりません', 404);
    }

    logger.info('ユーザー情報取得', {
      userId: user.id,
      userOrganizationId: user.organizationId,
      userRole: user.role
    });

    // Owner/Adminは自組織のチケットのみ
    if ([UserRole.OWNER, UserRole.ADMIN].includes(userRole)) {
      // organizationIdがpopulateされている場合とされていない場合の両方に対応
      const ticketOrgId = typeof ticket.organizationId === 'object' && ticket.organizationId !== null
        ? (ticket.organizationId as any).id || (ticket.organizationId as any)._id
        : ticket.organizationId;
      
      const ticketOrgIdStr = ticketOrgId?.toString() || '';
      const userOrgIdStr = user.organizationId?.toString() || '';
      
      if (userOrgIdStr !== ticketOrgIdStr) {
        logger.warn('組織が一致しません', {
          userOrganizationId: userOrgIdStr,
          ticketOrganizationId: ticketOrgIdStr
        });
        throw new AppError('このチケットにアクセスする権限がありません', 403);
      }
      logger.info('管理者権限でアクセス許可');
      return;
    }

    // 一般ユーザー・スタイリストは自分のチケットのみ
    if (userRole === UserRole.USER || userRole === UserRole.STYLIST) {
      // userIdがpopulateされている場合とされていない場合の両方に対応
      const ticketUserId = typeof ticket.userId === 'object' && ticket.userId !== null
        ? (ticket.userId as any).id || (ticket.userId as any)._id
        : ticket.userId;
      
      const ticketUserIdStr = ticketUserId?.toString() || '';
      
      logger.info('ユーザー権限チェック', {
        ticketUserIdStr,
        userIdStr: userId,
        isMatch: ticketUserIdStr === userId
      });
      
      if (ticketUserIdStr !== userId) {
        logger.warn('チケット所有者と一致しません', {
          ticketUserId: ticketUserIdStr,
          requestUserId: userId
        });
        throw new AppError('このチケットにアクセスする権限がありません', 403);
      }
      logger.info('チケット所有者としてアクセス許可');
      return;
    }

    logger.warn('未定義のロールでアクセス拒否', { userRole });
    throw new AppError('このチケットにアクセスする権限がありません', 403);
  }
}