import type { 
  StylistDetail, 
  FourPillarsData,
  ElementBalance,
  TurnoverRiskAnalysis,
  StylistReport
} from '../../../types';
import {
  TurnoverRiskLevel,
  FiveElements,
  UserRole,
  UserStatus,
  AuthMethod
} from '../../../types';

// スタイリストモックデータ
export const mockStylists: StylistDetail[] = [
  {
    // UserProfile基本情報
    id: 'stylist-1',
    email: 'sato.m@example.com',
    name: '佐藤 美香',
    role: UserRole.ADMIN,
    organizationId: 'org-1',
    status: UserStatus.ACTIVE,
    birthDate: new Date('1991-03-15'),
    gender: 'female',
    phone: '090-1234-5671',
    profileImage: undefined,
    lastLoginAt: new Date('2025-05-24T09:30:00'),
    authMethods: [AuthMethod.EMAIL],
    employeeNumber: 'EMP003',
    department: '美容部',
    hireDate: new Date('2022-04-01'),
    createdAt: new Date('2022-04-01'),
    updatedAt: new Date('2025-05-24'),
    _isMockData: true,
    
    // StylistDetail拡張情報
    yearsOfService: 3,
    position: 'シニアスタイリスト',
    specialties: ['カット', 'カラーリング', 'パーマ'],
    turnoverRiskLevel: TurnoverRiskLevel.HIGH,
    monthlyAppointments: 12,
    performanceScore: 85
  },
  {
    id: 'stylist-2',
    email: 'tanaka.a@example.com',
    name: '田中 愛子',
    role: UserRole.USER,
    organizationId: 'org-1',
    status: UserStatus.ACTIVE,
    birthDate: new Date('1993-07-22'),
    gender: 'female',
    phone: '090-1234-5672',
    profileImage: undefined,
    lastLoginAt: new Date('2025-05-24T08:45:00'),
    authMethods: [AuthMethod.EMAIL, AuthMethod.LINE],
    employeeNumber: 'EMP005',
    department: '美容部',
    hireDate: new Date('2023-04-01'),
    createdAt: new Date('2023-04-01'),
    updatedAt: new Date('2025-05-24'),
    _isMockData: true,
    
    yearsOfService: 2,
    position: 'スタイリスト',
    specialties: ['カット', 'ヘアセット'],
    turnoverRiskLevel: TurnoverRiskLevel.MEDIUM,
    monthlyAppointments: 18,
    performanceScore: 78
  },
  {
    id: 'stylist-3',
    email: 'suzuki.e@example.com',
    name: '鈴木 恵美',
    role: UserRole.ADMIN,
    organizationId: 'org-1',
    status: UserStatus.ACTIVE,
    birthDate: new Date('1988-11-10'),
    gender: 'female',
    phone: '090-1234-5673',
    profileImage: undefined,
    lastLoginAt: new Date('2025-05-24T07:00:00'),
    authMethods: [AuthMethod.EMAIL],
    employeeNumber: 'EMP001',
    department: '美容部',
    hireDate: new Date('2020-06-01'),
    createdAt: new Date('2020-06-01'),
    updatedAt: new Date('2025-05-24'),
    _isMockData: true,
    
    yearsOfService: 5,
    position: 'マネージャー',
    specialties: ['カット', 'カラーリング', 'トリートメント', '経営管理'],
    turnoverRiskLevel: TurnoverRiskLevel.LOW,
    monthlyAppointments: 15,
    performanceScore: 92
  },
  {
    id: 'stylist-4',
    email: 'takahashi.y@example.com',
    name: '高橋 由美',
    role: UserRole.USER,
    organizationId: 'org-1',
    status: UserStatus.ACTIVE,
    birthDate: new Date('1996-02-28'),
    gender: 'female',
    phone: '090-1234-5674',
    profileImage: undefined,
    lastLoginAt: new Date('2025-05-23T18:30:00'),
    authMethods: [AuthMethod.EMAIL],
    employeeNumber: 'EMP008',
    department: '美容部',
    hireDate: new Date('2024-04-01'),
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2025-05-24'),
    _isMockData: true,
    
    yearsOfService: 1,
    position: 'スタイリスト',
    specialties: ['カット', 'ヘアケア'],
    turnoverRiskLevel: TurnoverRiskLevel.LOW,
    monthlyAppointments: 8,
    performanceScore: 70
  },
  {
    id: 'stylist-5',
    email: 'yamada.k@example.com',
    name: '山田 京子',
    role: UserRole.USER,
    organizationId: 'org-1',
    status: UserStatus.ACTIVE,
    birthDate: new Date('1990-09-05'),
    gender: 'female',
    phone: '090-1234-5675',
    profileImage: undefined,
    lastLoginAt: new Date('2025-05-24T10:00:00'),
    authMethods: [AuthMethod.EMAIL, AuthMethod.LINE],
    employeeNumber: 'EMP004',
    department: '美容部',
    hireDate: new Date('2022-09-01'),
    createdAt: new Date('2022-09-01'),
    updatedAt: new Date('2025-05-24'),
    _isMockData: true,
    
    yearsOfService: 3,
    position: 'シニアスタイリスト',
    specialties: ['カラーリング', 'パーマ', 'トリートメント'],
    turnoverRiskLevel: TurnoverRiskLevel.MEDIUM,
    monthlyAppointments: 20,
    performanceScore: 88
  },
  {
    id: 'stylist-6',
    email: 'ito.m@example.com',
    name: '伊藤 真理',
    role: UserRole.USER,
    organizationId: 'org-1',
    status: UserStatus.ACTIVE,
    birthDate: new Date('1994-12-18'),
    gender: 'female',
    phone: '090-1234-5676',
    profileImage: undefined,
    lastLoginAt: new Date('2025-05-24T11:15:00'),
    authMethods: [AuthMethod.EMAIL],
    employeeNumber: 'EMP007',
    department: '美容部',
    hireDate: new Date('2023-10-01'),
    createdAt: new Date('2023-10-01'),
    updatedAt: new Date('2025-05-24'),
    _isMockData: true,
    
    yearsOfService: 2,
    position: 'スタイリスト',
    specialties: ['カット', 'ヘアセット', 'メイク'],
    turnoverRiskLevel: TurnoverRiskLevel.LOW,
    monthlyAppointments: 16,
    performanceScore: 82
  },
  {
    id: 'stylist-7',
    email: 'watanabe.s@example.com',
    name: '渡辺 さくら',
    role: UserRole.USER,
    organizationId: 'org-1',
    status: UserStatus.INACTIVE,
    birthDate: new Date('1992-04-10'),
    gender: 'female',
    phone: '090-1234-5677',
    profileImage: undefined,
    lastLoginAt: new Date('2025-04-30T15:00:00'),
    authMethods: [AuthMethod.EMAIL],
    employeeNumber: 'EMP006',
    department: '美容部',
    hireDate: new Date('2023-01-15'),
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2025-05-01'),
    _isMockData: true,
    
    yearsOfService: 2,
    position: 'スタイリスト',
    specialties: ['カット', 'カラーリング'],
    turnoverRiskLevel: TurnoverRiskLevel.CRITICAL,
    monthlyAppointments: 0,
    performanceScore: 65
  },
  {
    id: 'stylist-8',
    email: 'nakamura.h@example.com',
    name: '中村 春香',
    role: UserRole.USER,
    organizationId: 'org-1',
    status: UserStatus.PENDING,
    birthDate: new Date('1998-06-25'),
    gender: 'female',
    phone: '090-1234-5678',
    profileImage: undefined,
    lastLoginAt: undefined,
    authMethods: [AuthMethod.EMAIL],
    employeeNumber: 'EMP009',
    department: '美容部',
    hireDate: new Date('2025-05-01'),
    createdAt: new Date('2025-05-01'),
    updatedAt: new Date('2025-05-01'),
    _isMockData: true,
    
    yearsOfService: 0,
    position: '研修生',
    specialties: [],
    turnoverRiskLevel: TurnoverRiskLevel.LOW,
    monthlyAppointments: 0,
    performanceScore: undefined
  }
];

// スタイリストの四柱推命データ
export const mockStylistFourPillars: Record<string, FourPillarsData> = {
  'stylist-1': {
    _id: 'fp-stylist-1',
    userId: 'stylist-1',
    birthDate: '1991-03-15',
    birthTime: '10:30',
    location: {
      name: '東京',
      longitude: 139.6917,
      latitude: 35.6895
    },
    timezone: 'Asia/Tokyo',
    elementBalance: {
      wood: 5,
      fire: 40,
      earth: 30,
      metal: 15,
      water: 10,
      mainElement: FiveElements.FIRE,
      isBalanced: false
    },
    tenGods: {
      year: '比肩',
      month: '食神',
      day: '正官',
      hour: '偏財'
    },
    yearPillar: {
      heavenlyStem: '辛',
      earthlyBranch: '未',
      element: '金',
      yinYang: '陰'
    },
    monthPillar: {
      heavenlyStem: '庚',
      earthlyBranch: '辰',
      element: '金',
      yinYang: '陽'
    },
    dayPillar: {
      heavenlyStem: '丙',
      earthlyBranch: '午',
      element: '火',
      yinYang: '陽'
    },
    hourPillar: {
      heavenlyStem: '戊',
      earthlyBranch: '戌',
      element: '土',
      yinYang: '陽'
    },
    calculatedAt: new Date('2025-05-01')
  },
  'stylist-2': {
    _id: 'fp-stylist-2',
    userId: 'stylist-2',
    birthDate: '1993-07-22',
    birthTime: '14:00',
    location: {
      name: '東京',
      longitude: 139.6917,
      latitude: 35.6895
    },
    timezone: 'Asia/Tokyo',
    elementBalance: {
      wood: 35,
      fire: 10,
      earth: 20,
      metal: 15,
      water: 20,
      mainElement: FiveElements.WOOD,
      isBalanced: true
    },
    tenGods: {
      year: '傷官',
      month: '正財',
      day: '偏官',
      hour: '印綬'
    },
    yearPillar: {
      heavenlyStem: '癸',
      earthlyBranch: '酉',
      element: '水',
      yinYang: '陰'
    },
    monthPillar: {
      heavenlyStem: '己',
      earthlyBranch: '未',
      element: '土',
      yinYang: '陰'
    },
    dayPillar: {
      heavenlyStem: '甲',
      earthlyBranch: '寅',
      element: '木',
      yinYang: '陽'
    },
    hourPillar: {
      heavenlyStem: '乙',
      earthlyBranch: '卯',
      element: '木',
      yinYang: '陰'
    },
    calculatedAt: new Date('2025-05-01')
  },
  'stylist-3': {
    _id: 'fp-stylist-3',
    userId: 'stylist-3',
    birthDate: '1988-11-10',
    birthTime: '09:00',
    location: {
      name: '東京',
      longitude: 139.6917,
      latitude: 35.6895
    },
    timezone: 'Asia/Tokyo',
    elementBalance: {
      wood: 10,
      fire: 15,
      earth: 25,
      metal: 30,
      water: 20,
      mainElement: FiveElements.METAL,
      isBalanced: true
    },
    tenGods: {
      year: '正官',
      month: '偏印',
      day: '劫財',
      hour: '食神'
    },
    yearPillar: {
      heavenlyStem: '戊',
      earthlyBranch: '辰',
      element: '土',
      yinYang: '陽'
    },
    monthPillar: {
      heavenlyStem: '癸',
      earthlyBranch: '亥',
      element: '水',
      yinYang: '陰'
    },
    dayPillar: {
      heavenlyStem: '庚',
      earthlyBranch: '申',
      element: '金',
      yinYang: '陽'
    },
    hourPillar: {
      heavenlyStem: '丁',
      earthlyBranch: '巳',
      element: '火',
      yinYang: '陰'
    },
    calculatedAt: new Date('2025-05-01')
  },
  'stylist-4': {
    _id: 'fp-stylist-4',
    userId: 'stylist-4',
    birthDate: '1996-02-28',
    birthTime: '11:00',
    location: {
      name: '東京',
      longitude: 139.6917,
      latitude: 35.6895
    },
    timezone: 'Asia/Tokyo',
    elementBalance: {
      wood: 20,
      fire: 25,
      earth: 15,
      metal: 20,
      water: 20,
      mainElement: FiveElements.FIRE,
      isBalanced: true
    },
    tenGods: {
      year: '正印',
      month: '偏財',
      day: '比肩',
      hour: '傷官'
    },
    yearPillar: {
      heavenlyStem: '丙',
      earthlyBranch: '子',
      element: '火',
      yinYang: '陽'
    },
    monthPillar: {
      heavenlyStem: '庚',
      earthlyBranch: '寅',
      element: '金',
      yinYang: '陽'
    },
    dayPillar: {
      heavenlyStem: '乙',
      earthlyBranch: '巳',
      element: '木',
      yinYang: '陰'
    },
    hourPillar: {
      heavenlyStem: '壬',
      earthlyBranch: '午',
      element: '水',
      yinYang: '陽'
    },
    calculatedAt: new Date('2025-05-01')
  },
  'stylist-5': {
    _id: 'fp-stylist-5',
    userId: 'stylist-5',
    birthDate: '1990-09-05',
    birthTime: '08:30',
    location: {
      name: '東京',
      longitude: 139.6917,
      latitude: 35.6895
    },
    timezone: 'Asia/Tokyo',
    elementBalance: {
      wood: 15,
      fire: 20,
      earth: 20,
      metal: 25,
      water: 20,
      mainElement: FiveElements.METAL,
      isBalanced: true
    },
    tenGods: {
      year: '正官',
      month: '食神',
      day: '比肩',
      hour: '偏財'
    },
    yearPillar: {
      heavenlyStem: '庚',
      earthlyBranch: '午',
      element: '金',
      yinYang: '陽'
    },
    monthPillar: {
      heavenlyStem: '乙',
      earthlyBranch: '酉',
      element: '木',
      yinYang: '陰'
    },
    dayPillar: {
      heavenlyStem: '癸',
      earthlyBranch: '亥',
      element: '水',
      yinYang: '陰'
    },
    hourPillar: {
      heavenlyStem: '丙',
      earthlyBranch: '辰',
      element: '火',
      yinYang: '陽'
    },
    calculatedAt: new Date('2025-05-01')
  },
  'stylist-6': {
    _id: 'fp-stylist-6',
    userId: 'stylist-6',
    birthDate: '1994-12-18',
    birthTime: '17:30',
    location: {
      name: '東京',
      longitude: 139.6917,
      latitude: 35.6895
    },
    timezone: 'Asia/Tokyo',
    elementBalance: {
      wood: 20,
      fire: 20,
      earth: 25,
      metal: 15,
      water: 20,
      mainElement: FiveElements.EARTH,
      isBalanced: true
    },
    tenGods: {
      year: '正財',
      month: '偏印',
      day: '比肩',
      hour: '正財'
    },
    yearPillar: {
      heavenlyStem: '甲',
      earthlyBranch: '戌',
      element: '木',
      yinYang: '陽'
    },
    monthPillar: {
      heavenlyStem: '丙',
      earthlyBranch: '子',
      element: '火',
      yinYang: '陽'
    },
    dayPillar: {
      heavenlyStem: '己',
      earthlyBranch: '丑',
      element: '土',
      yinYang: '陰'
    },
    hourPillar: {
      heavenlyStem: '癸',
      earthlyBranch: '酉',
      element: '水',
      yinYang: '陰'
    },
    calculatedAt: new Date('2025-05-01')
  },
  'stylist-7': {
    _id: 'fp-stylist-7',
    userId: 'stylist-7',
    birthDate: '1992-04-10',
    birthTime: '13:15',
    location: {
      name: '東京',
      longitude: 139.6917,
      latitude: 35.6895
    },
    timezone: 'Asia/Tokyo',
    elementBalance: {
      wood: 20,
      fire: 35,
      earth: 20,
      metal: 10,
      water: 15,
      mainElement: FiveElements.FIRE,
      isBalanced: false
    },
    tenGods: {
      year: '偏財',
      month: '正印',
      day: '比肩',
      hour: '比肩'
    },
    yearPillar: {
      heavenlyStem: '壬',
      earthlyBranch: '申',
      element: '水',
      yinYang: '陽'
    },
    monthPillar: {
      heavenlyStem: '甲',
      earthlyBranch: '辰',
      element: '木',
      yinYang: '陽'
    },
    dayPillar: {
      heavenlyStem: '丁',
      earthlyBranch: '未',
      element: '火',
      yinYang: '陰'
    },
    hourPillar: {
      heavenlyStem: '丁',
      earthlyBranch: '未',
      element: '火',
      yinYang: '陰'
    },
    calculatedAt: new Date('2025-05-01')
  },
  'stylist-8': {
    _id: 'fp-stylist-8',
    userId: 'stylist-8',
    birthDate: '1998-06-25',
    birthTime: '07:00',
    location: {
      name: '東京',
      longitude: 139.6917,
      latitude: 35.6895
    },
    timezone: 'Asia/Tokyo',
    elementBalance: {
      wood: 10,
      fire: 15,
      earth: 35,
      metal: 25,
      water: 15,
      mainElement: FiveElements.EARTH,
      isBalanced: false
    },
    tenGods: {
      year: '正印',
      month: '正印',
      day: '比肩',
      hour: '偏財'
    },
    yearPillar: {
      heavenlyStem: '戊',
      earthlyBranch: '寅',
      element: '土',
      yinYang: '陽'
    },
    monthPillar: {
      heavenlyStem: '戊',
      earthlyBranch: '午',
      element: '土',
      yinYang: '陽'
    },
    dayPillar: {
      heavenlyStem: '辛',
      earthlyBranch: '酉',
      element: '金',
      yinYang: '陰'
    },
    hourPillar: {
      heavenlyStem: '壬',
      earthlyBranch: '辰',
      element: '水',
      yinYang: '陽'
    },
    calculatedAt: new Date('2025-05-01')
  }
};

// 五行バランスデータ
export const mockElementBalance: Record<string, ElementBalance> = {
  'stylist-1': {
    wood: 5,
    fire: 40,
    earth: 30,
    metal: 15,
    water: 10,
    mainElement: FiveElements.FIRE,
    isBalanced: false
  },
  'stylist-2': {
    wood: 35,
    fire: 10,
    earth: 20,
    metal: 15,
    water: 20,
    mainElement: FiveElements.WOOD,
    isBalanced: true
  },
  'stylist-3': {
    wood: 10,
    fire: 15,
    earth: 25,
    metal: 30,
    water: 20,
    mainElement: FiveElements.METAL,
    isBalanced: true
  }
};

// 離職リスク分析データ
export const mockTurnoverRiskAnalysis: Record<string, TurnoverRiskAnalysis> = {
  'stylist-1': {
    stylistId: 'stylist-1',
    riskLevel: TurnoverRiskLevel.HIGH,
    factors: [
      '最近の指名率が30%低下',
      '残業時間が月60時間を超過',
      '同僚との相性スコアが低下傾向',
      '有給休暇の未消化が10日以上'
    ],
    recommendedActions: [
      '至急1on1面談の実施を推奨',
      '業務負荷の見直しと再配分',
      'メンタルヘルスケアの提供',
      '有給休暇取得の促進'
    ],
    lastEvaluationDate: new Date('2025-05-20')
  },
  'stylist-2': {
    stylistId: 'stylist-2',
    riskLevel: TurnoverRiskLevel.MEDIUM,
    factors: [
      '新規指名が伸び悩んでいる',
      'スキルアップ研修への参加が少ない',
      '売上目標達成率が70%台'
    ],
    recommendedActions: [
      'キャリア開発面談の実施',
      'スキルアップ研修への参加促進',
      '新規顧客獲得のサポート強化'
    ],
    lastEvaluationDate: new Date('2025-05-20')
  },
  'stylist-7': {
    stylistId: 'stylist-7',
    riskLevel: TurnoverRiskLevel.CRITICAL,
    factors: [
      '1ヶ月以上のログインなし',
      '最終勤務から30日経過',
      '退職の意向を示唆する発言あり'
    ],
    recommendedActions: [
      '緊急の連絡と状況確認',
      '退職手続きの準備',
      '引き継ぎ業務の開始'
    ],
    lastEvaluationDate: new Date('2025-05-20')
  }
};

// スタイリストレポートのモックデータ
export const mockStylistReports: Record<string, StylistReport> = {
  'stylist-1': {
    stylistId: 'stylist-1',
    reportPeriod: {
      start: new Date('2025-05-01'),
      end: new Date('2025-05-31')
    },
    totalAppointments: 12,
    clientSatisfactionScore: 4.2,
    revenueGenerated: 156000,
    fourPillarsAnalysis: mockStylistFourPillars['stylist-1']
  },
  'stylist-2': {
    stylistId: 'stylist-2',
    reportPeriod: {
      start: new Date('2025-05-01'),
      end: new Date('2025-05-31')
    },
    totalAppointments: 18,
    clientSatisfactionScore: 4.5,
    revenueGenerated: 234000,
    fourPillarsAnalysis: mockStylistFourPillars['stylist-2']
  },
  'stylist-3': {
    stylistId: 'stylist-3',
    reportPeriod: {
      start: new Date('2025-05-01'),
      end: new Date('2025-05-31')
    },
    totalAppointments: 15,
    clientSatisfactionScore: 4.8,
    revenueGenerated: 285000,
    fourPillarsAnalysis: mockStylistFourPillars['stylist-3']
  }
};

// 役職リスト
export const positionOptions = [
  { value: 'trainee', label: '研修生' },
  { value: 'junior', label: 'ジュニアスタイリスト' },
  { value: 'stylist', label: 'スタイリスト' },
  { value: 'senior', label: 'シニアスタイリスト' },
  { value: 'manager', label: 'マネージャー' }
];

// 権限レベルリスト
export const permissionOptions = [
  { value: UserRole.USER, label: '基本権限（顧客管理・チャット）' },
  { value: UserRole.ADMIN, label: '管理者権限（全機能）' }
];