import type { 
  SupportTicket, 
  SupportTicketMessage, 
  SupportTicketCreateInput,
  SupportTicketReplyInput,
  SupportTicketUpdateInput,
  SupportTicketStats
} from '../../../types';
import { TicketStatus } from '../../../types';
import { 
  mockSupportTickets, 
  ticketMessages, 
  mockSupportTicketStats 
} from '../data/mockSupportTickets';

// モックデータのストレージ（実際の実装ではDBを使用）
let tickets = [...mockSupportTickets];
let messages = { ...ticketMessages };

// チケット一覧取得（フィルター・検索・ページネーション対応）
export const getSupportTickets = async (params?: {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  organizationId?: string;
  userId?: string;
}): Promise<{ tickets: SupportTicket[]; total: number }> => {
  console.warn('🔧 Using MOCK data for support tickets');
  
  let filteredTickets = [...tickets];
  
  // ステータスフィルター
  if (params?.status) {
    filteredTickets = filteredTickets.filter(t => t.status === params.status);
  }
  
  // 優先度フィルター
  if (params?.priority) {
    filteredTickets = filteredTickets.filter(t => t.priority === params.priority);
  }
  
  // カテゴリフィルター
  if (params?.category) {
    filteredTickets = filteredTickets.filter(t => t.category === params.category);
  }
  
  // 組織IDフィルター
  if (params?.organizationId) {
    filteredTickets = filteredTickets.filter(t => t.organizationId === params.organizationId);
  }
  
  // ユーザーIDフィルター
  if (params?.userId) {
    filteredTickets = filteredTickets.filter(t => t.userId === params.userId);
  }
  
  // 検索フィルター
  if (params?.search) {
    const searchLower = params.search.toLowerCase();
    filteredTickets = filteredTickets.filter(t => 
      t.title.toLowerCase().includes(searchLower) ||
      t.description.toLowerCase().includes(searchLower) ||
      t.user?.name?.toLowerCase().includes(searchLower) ||
      t.organization?.name?.toLowerCase().includes(searchLower)
    );
  }
  
  // ソート（最新のものを先に）
  filteredTickets.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // ページネーション
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const start = (page - 1) * limit;
  const end = start + limit;
  
  const paginatedTickets = filteredTickets.slice(start, end);
  
  // 各チケットにメッセージを含める
  const ticketsWithMessages = paginatedTickets.map(ticket => ({
    ...ticket,
    messages: messages[ticket.id] || []
  }));
  
  return {
    tickets: ticketsWithMessages,
    total: filteredTickets.length
  };
};

// チケット詳細取得
export const getSupportTicket = async (ticketId: string): Promise<SupportTicket | null> => {
  console.warn(`🔧 Using MOCK data for support ticket ${ticketId}`);
  
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return null;
  
  // SupportTicketWithMessagesという型を返す、またはmessagesを別途取得する
  return ticket;
};

// チケット作成
export const createSupportTicket = async (
  data: SupportTicketCreateInput
): Promise<SupportTicket> => {
  console.warn('🔧 Creating MOCK support ticket');
  
  const timestamp = Date.now();
  const newTicket: SupportTicket = {
    id: `ticket-${timestamp}`,
    ticketNumber: `TKT-${timestamp.toString().slice(-6)}`,
    title: data.title,
    description: data.description,
    status: TicketStatus.OPEN,
    priority: data.priority || 'medium',
    category: data.category,
    userId: data.userId,
    organizationId: data.organizationId,
    // messagesプロパティはSupportTicket型に存在しないので削除
    createdAt: new Date(),
    updatedAt: new Date(),
    _isMockData: true
  };
  
  // 初期メッセージを作成
  const initialMessage: SupportTicketMessage = {
    id: `msg-${newTicket.id}-1`,
    ticketId: newTicket.id,
    senderId: data.userId,
    senderType: 'user',
    content: data.description,
    message: data.description, // 互換性のため
    isStaff: false,
    createdAt: newTicket.createdAt,
    updatedAt: newTicket.createdAt
  };
  
  tickets.push(newTicket);
  messages[newTicket.id] = [initialMessage];
  
  return {
    ...newTicket,
    messages: [initialMessage]
  };
};

// チケットへの返信
export const replySupportTicket = async (
  ticketId: string,
  data: SupportTicketReplyInput
): Promise<SupportTicketMessage> => {
  console.warn(`🔧 Replying to MOCK support ticket ${ticketId}`);
  
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) {
    throw new Error('Ticket not found');
  }
  
  const newMessage: SupportTicketMessage = {
    id: `msg-${ticketId}-${Date.now()}`,
    ticketId,
    senderId: data.senderId,
    senderType: data.isStaff ? 'admin' : 'user',
    content: data.message,
    message: data.message, // 互換性のため
    isStaff: data.isStaff, // 互換性のため
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // メッセージを追加
  if (!messages[ticketId]) {
    messages[ticketId] = [];
  }
  messages[ticketId].push(newMessage);
  
  // チケットの更新日時を更新
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);
  if (ticketIndex !== -1) {
    tickets[ticketIndex] = {
      ...tickets[ticketIndex],
      updatedAt: new Date(),
      // スタッフが返信した場合、ステータスを更新
      status: data.isStaff && ticket.status === TicketStatus.OPEN ? TicketStatus.IN_PROGRESS : ticket.status
    };
  }
  
  return newMessage;
};

// チケット更新（ステータス、優先度、担当者など）
export const updateSupportTicket = async (
  ticketId: string,
  data: SupportTicketUpdateInput
): Promise<SupportTicket> => {
  console.warn(`🔧 Updating MOCK support ticket ${ticketId}`);
  
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);
  if (ticketIndex === -1) {
    throw new Error('Ticket not found');
  }
  
  // 既存のチケットデータを保持しつつ、更新データを適用
  const currentTicket = tickets[ticketIndex];
  
  // statusが提供された場合のみ更新し、必ずTicketStatus型であることを保証
  let updatedStatus: TicketStatus;
  if (data.status !== undefined) {
    // 文字列リテラルをTicketStatus enumに変換
    if (data.status === 'open') {
      updatedStatus = TicketStatus.OPEN;
    } else if (data.status === 'in_progress') {
      updatedStatus = TicketStatus.IN_PROGRESS;
    } else if (data.status === 'resolved') {
      updatedStatus = TicketStatus.RESOLVED;
    } else {
      updatedStatus = data.status as TicketStatus;
    }
  } else {
    updatedStatus = currentTicket.status;
  }

  const updatedTicket: SupportTicket = {
    ...currentTicket,
    ...data,
    status: updatedStatus,
    updatedAt: new Date(),
    // ステータスが解決済みに変更された場合、解決日時を設定
    resolvedAt: updatedStatus === TicketStatus.RESOLVED && currentTicket.status !== TicketStatus.RESOLVED
      ? new Date()
      : currentTicket.resolvedAt
  };
  
  tickets[ticketIndex] = updatedTicket;
  
  return updatedTicket;
};

// チケット削除
export const deleteSupportTicket = async (ticketId: string): Promise<void> => {
  console.warn(`🔧 Deleting MOCK support ticket ${ticketId}`);
  
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);
  if (ticketIndex === -1) {
    throw new Error('Ticket not found');
  }
  
  tickets.splice(ticketIndex, 1);
  delete messages[ticketId];
};

// 統計情報取得
export const getSupportTicketStats = async (params?: {
  organizationId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<SupportTicketStats> => {
  console.warn('🔧 Using MOCK data for support ticket stats');
  
  let filteredTickets = [...tickets];
  
  // 組織IDフィルター
  if (params?.organizationId) {
    filteredTickets = filteredTickets.filter(t => t.organizationId === params.organizationId);
  }
  
  // 日付範囲フィルター
  if (params?.startDate || params?.endDate) {
    filteredTickets = filteredTickets.filter(t => {
      const ticketDate = new Date(t.createdAt);
      if (params.startDate && ticketDate < new Date(params.startDate)) return false;
      if (params.endDate && ticketDate > new Date(params.endDate)) return false;
      return true;
    });
  }
  
  return {
    total: filteredTickets.length,
    open: filteredTickets.filter(t => t.status === TicketStatus.OPEN || t.status === TicketStatus.PENDING).length,
    inProgress: filteredTickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length,
    resolved: filteredTickets.filter(t => t.status === TicketStatus.RESOLVED).length,
    avgResponseTime: mockSupportTicketStats.avgResponseTime,
    avgResolutionTime: mockSupportTicketStats.avgResolutionTime,
    _isMockData: true
  };
};