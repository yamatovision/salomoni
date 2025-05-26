import type { 
  Appointment, 
  TimeSlot,
  CalendarSyncStatus,
  AppointmentAssignmentRecommendation
} from '../../../types';
import { AppointmentStatus } from '../../../types';
import { mockUsers } from './mockUsers';
import { mockClients } from './mockClients';

// タイムスロットデータ
export const mockTimeSlots: TimeSlot[] = [
  {
    id: 'slot-10-11',
    startTime: '10:00',
    endTime: '11:00',
    appointments: [],
    capacity: 3,
  },
  {
    id: 'slot-11-12',
    startTime: '11:00',
    endTime: '12:00',
    appointments: [],
    capacity: 3,
  },
  {
    id: 'slot-12-13',
    startTime: '12:00',
    endTime: '13:00',
    appointments: [],
    capacity: 3,
  },
  {
    id: 'slot-13-14',
    startTime: '13:00',
    endTime: '14:00',
    appointments: [],
    capacity: 3,
  },
  {
    id: 'slot-14-15',
    startTime: '14:00',
    endTime: '15:00',
    appointments: [],
    capacity: 3,
  },
  {
    id: 'slot-15-16',
    startTime: '15:00',
    endTime: '16:00',
    appointments: [],
    capacity: 3,
  },
  {
    id: 'slot-16-17',
    startTime: '16:00',
    endTime: '17:00',
    appointments: [],
    capacity: 3,
  },
  {
    id: 'slot-17-18',
    startTime: '17:00',
    endTime: '18:00',
    appointments: [],
    capacity: 3,
  },
];

// 予約データ
export const mockAppointments: Appointment[] = [
  {
    id: 'apt-001',
    organizationId: 'org-001',
    clientId: 'client-001',
    stylistId: undefined, // 未担当
    scheduledAt: new Date('2025-04-26T10:00:00'),
    duration: 60,
    services: ['カット', 'カラー'],
    status: AppointmentStatus.SCHEDULED,
    createdAt: new Date('2025-04-20T09:00:00'),
    updatedAt: new Date('2025-04-20T09:00:00'),
  },
  {
    id: 'apt-002',
    organizationId: 'org-001',
    clientId: 'client-002',
    stylistId: 'user-003', // 山本 健太
    scheduledAt: new Date('2025-04-26T10:00:00'),
    duration: 90,
    services: ['カット', 'パーマ'],
    status: AppointmentStatus.SCHEDULED,
    createdAt: new Date('2025-04-19T14:00:00'),
    updatedAt: new Date('2025-04-19T14:00:00'),
  },
  {
    id: 'apt-003',
    organizationId: 'org-001',
    clientId: 'client-005',
    stylistId: undefined, // 未担当
    scheduledAt: new Date('2025-04-26T12:00:00'),
    duration: 45,
    services: ['カット'],
    status: AppointmentStatus.SCHEDULED,
    createdAt: new Date('2025-04-21T11:00:00'),
    updatedAt: new Date('2025-04-21T11:00:00'),
  },
  {
    id: 'apt-004',
    organizationId: 'org-001',
    clientId: 'client-003',
    stylistId: 'user-004', // 中村 美香
    scheduledAt: new Date('2025-04-26T13:00:00'),
    duration: 90,
    services: ['カラー', 'トリートメント'],
    status: AppointmentStatus.SCHEDULED,
    createdAt: new Date('2025-04-18T10:00:00'),
    updatedAt: new Date('2025-04-18T10:00:00'),
  },
  {
    id: 'apt-005',
    organizationId: 'org-001',
    clientId: 'client-004',
    stylistId: 'user-005', // 佐々木 翔太
    scheduledAt: new Date('2025-04-26T13:00:00'),
    duration: 60,
    services: ['カット', 'ヘッドスパ'],
    status: AppointmentStatus.SCHEDULED,
    createdAt: new Date('2025-04-20T15:00:00'),
    updatedAt: new Date('2025-04-20T15:00:00'),
  },
  {
    id: 'apt-006',
    organizationId: 'org-001',
    clientId: 'client-006',
    stylistId: undefined, // 未担当
    scheduledAt: new Date('2025-04-26T14:00:00'),
    duration: 60,
    services: ['カット', 'ヘッドスパ'],
    status: AppointmentStatus.SCHEDULED,
    createdAt: new Date('2025-04-22T09:00:00'),
    updatedAt: new Date('2025-04-22T09:00:00'),
  },
];

// カレンダー同期状態
export const mockCalendarSyncStatus: CalendarSyncStatus = {
  provider: 'google',
  connected: true,
  lastSyncAt: new Date('2025-04-26T09:15:00'),
  pendingMatches: 9,
};

// スタイリスト割り当て推奨
export const mockAssignmentRecommendations: AppointmentAssignmentRecommendation[] = [
  {
    appointmentId: 'apt-001',
    recommendedStylists: [
      {
        stylistId: 'user-004',
        compatibilityScore: 95,
        reason: '女性のカット・カラーの施術に最適なスタイリストです',
        isAvailable: true,
      },
      {
        stylistId: 'user-003',
        compatibilityScore: 85,
        reason: 'カット・カラーの経験が豊富です',
        isAvailable: true,
      },
    ],
  },
  {
    appointmentId: 'apt-003',
    recommendedStylists: [
      {
        stylistId: 'user-004',
        compatibilityScore: 90,
        reason: '女性のカットが得意なスタイリストです',
        isAvailable: true,
      },
      {
        stylistId: 'user-005',
        compatibilityScore: 80,
        reason: 'この時間帯に空きがあります',
        isAvailable: true,
      },
    ],
  },
  {
    appointmentId: 'apt-006',
    recommendedStylists: [
      {
        stylistId: 'user-003',
        compatibilityScore: 88,
        reason: 'メンズカット・ヘッドスパが得意です',
        isAvailable: true,
      },
      {
        stylistId: 'user-005',
        compatibilityScore: 82,
        reason: 'メンズカットの経験が豊富です',
        isAvailable: true,
      },
    ],
  },
];

// 日別サマリー情報
export interface DaySummary {
  date: Date;
  totalAppointments: number;
  unassignedCount: number;
  unassignedAppointments?: number;
  attendedClients?: number;
  cancelledAppointments?: number;
  completedCount: number;
  isSynced: boolean;
}

export const mockDaySummary: DaySummary = {
  date: new Date('2025-04-26'),
  totalAppointments: 12,
  unassignedCount: 3,
  unassignedAppointments: 3,
  attendedClients: 8,
  cancelledAppointments: 1,
  completedCount: 0,
  isSynced: true,
};

// サービスメニュー
export const serviceMenus = [
  { id: 'cut', name: 'カット', duration: 45 },
  { id: 'color', name: 'カラー', duration: 60 },
  { id: 'perm', name: 'パーマ', duration: 90 },
  { id: 'straight', name: '縮毛矯正', duration: 120 },
  { id: 'cut-color', name: 'カット + カラー', duration: 90 },
  { id: 'cut-perm', name: 'カット + パーマ', duration: 120 },
  { id: 'cut-treatment', name: 'カット + トリートメント', duration: 60 },
  { id: 'headspa', name: 'ヘッドスパ', duration: 30 },
];

// 時間枠に予約を割り当てる関数
export const getAppointmentsByTimeSlot = (timeSlot: TimeSlot): Appointment[] => {
  const slotStart = new Date(`2025-04-26T${timeSlot.startTime}:00`);
  const slotEnd = new Date(`2025-04-26T${timeSlot.endTime}:00`);
  
  return mockAppointments.filter(apt => {
    const aptStart = new Date(apt.scheduledAt);
    
    return aptStart >= slotStart && aptStart < slotEnd;
  });
};

// クライアント情報を含む予約データを取得
export const getAppointmentWithDetails = (appointment: Appointment) => {
  const client = mockClients.find(c => c.id === appointment.clientId);
  const stylist = appointment.stylistId ? 
    mockUsers.find(u => u.id === appointment.stylistId) : null;
  
  return {
    ...appointment,
    client,
    stylist,
  };
};