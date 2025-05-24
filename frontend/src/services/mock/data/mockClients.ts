import type { Client, DailyClientDisplay } from '../../../types';
import { AppointmentStatus } from '../../../types';

export const mockClients: Client[] = [
  {
    id: 'mock-client-001',
    organizationId: 'mock-org-001',
    name: '佐藤 花子',
    birthDate: new Date('1985-06-15'),
    gender: 'female',
    email: 'satohanako@example.com',
    phoneNumber: '090-1234-5678',
    memo: '髪質：細め、カラー頻度：2ヶ月に1回、パーマ経験あり',
    lastVisitDate: new Date('2024-04-20'),
    visitCount: 12,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-04-20'),
  },
  {
    id: 'mock-client-002',
    organizationId: 'mock-org-001',
    name: '田中 美咲',
    birthDate: new Date('1990-03-22'),
    gender: 'female',
    email: 'tanakamisaki@example.com',
    phoneNumber: '080-9876-5432',
    memo: '明るめカラー好み、トレンド重視、インスタグラムをよく見る',
    lastVisitDate: new Date('2024-05-10'),
    visitCount: 8,
    createdAt: new Date('2023-06-20'),
    updatedAt: new Date('2024-05-10'),
  },
  {
    id: 'mock-client-003',
    organizationId: 'mock-org-001',
    name: '鈴木 優子',
    birthDate: new Date('1988-08-10'),
    gender: 'female',
    email: 'suzukiyuko@example.com',
    phoneNumber: '070-1111-2222',
    memo: '技術重視、質問多め、慎重派、仕上がりをしっかり確認',
    lastVisitDate: new Date('2024-03-15'),
    visitCount: 15,
    createdAt: new Date('2022-11-10'),
    updatedAt: new Date('2024-03-15'),
  },
  {
    id: 'mock-client-004',
    organizationId: 'mock-org-001',
    name: '小林 愛',
    birthDate: new Date('1992-11-05'),
    gender: 'female',
    email: 'kobayashiai@example.com',
    phoneNumber: '090-3333-4444',
    memo: 'ショートヘア希望、メンテナンスしやすいスタイル重視',
    lastVisitDate: new Date('2024-05-01'),
    visitCount: 6,
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2024-05-01'),
  },
  {
    id: 'mock-client-005',
    organizationId: 'mock-org-001',
    name: '山田 里奈',
    birthDate: new Date('1995-02-18'),
    gender: 'female',
    email: 'yamadarina@example.com',
    phoneNumber: '080-5555-6666',
    memo: '初回来店、友人の紹介、ナチュラルメイク',
    lastVisitDate: new Date('2024-05-15'),
    visitCount: 1,
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-05-15'),
  },
  {
    id: 'mock-client-006',
    organizationId: 'mock-org-001',
    name: '伊藤 真理',
    birthDate: new Date('1987-07-30'),
    gender: 'female',
    email: 'itomari@example.com',
    phoneNumber: '070-7777-8888',
    memo: 'アレルギー：ジアミン系カラー剤注意、天然成分希望',
    lastVisitDate: new Date('2024-04-10'),
    visitCount: 20,
    createdAt: new Date('2022-05-20'),
    updatedAt: new Date('2024-04-10'),
  },
  {
    id: 'mock-client-007',
    organizationId: 'mock-org-001',
    name: '中島 健太',
    gender: 'male',
    phoneNumber: '080-1212-3434',
    memo: '誕生日未設定のため四柱推命診断不可',
    lastVisitDate: new Date('2024-05-05'),
    visitCount: 3,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-05-05'),
  },
  {
    id: 'mock-client-008',
    organizationId: 'mock-org-001',
    name: '高橋 さくら',
    birthDate: new Date('1993-04-01'),
    gender: 'female',
    email: 'takahashisakura@example.com',
    phoneNumber: '090-4567-8901',
    memo: 'VIP顧客、月1回来店、トリートメント重視',
    lastVisitDate: new Date('2024-05-18'),
    visitCount: 36,
    createdAt: new Date('2021-05-01'),
    updatedAt: new Date('2024-05-18'),
  },
  {
    id: 'mock-client-009',
    organizationId: 'mock-org-001',
    name: '渡辺 由美',
    birthDate: new Date('1983-12-25'),
    gender: 'female',
    email: 'watanabeyumi@example.com',
    phoneNumber: '080-2345-6789',
    memo: '白髪染め、2週間に1回来店、根元のみ',
    lastVisitDate: new Date('2024-05-20'),
    visitCount: 48,
    createdAt: new Date('2020-01-15'),
    updatedAt: new Date('2024-05-20'),
  },
  {
    id: 'mock-client-010',
    organizationId: 'mock-org-001',
    name: '斎藤 あかり',
    birthDate: new Date('1997-09-08'),
    gender: 'female',
    phoneNumber: '070-3456-7890',
    memo: '学生、就活中、黒髪キープ必須',
    lastVisitDate: new Date('2024-04-25'),
    visitCount: 5,
    createdAt: new Date('2023-10-10'),
    updatedAt: new Date('2024-04-25'),
  },
];

// クライアント検索関数
export const searchClients = (
  clients: Client[],
  searchTerm: string,
  filters: {
    birthDateMissing?: boolean;
    visitedThisMonth?: boolean;
    isFavorite?: boolean;
  }
): Client[] => {
  let filteredClients = [...clients];

  // 検索語句でフィルタリング
  if (searchTerm) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    filteredClients = filteredClients.filter(client =>
      client.name.toLowerCase().includes(lowerSearchTerm) ||
      client.phoneNumber?.includes(searchTerm) ||
      client.email?.toLowerCase().includes(lowerSearchTerm)
    );
  }

  // 誕生日未設定フィルター
  if (filters.birthDateMissing) {
    filteredClients = filteredClients.filter(client => !client.birthDate);
  }

  // 今月来店フィルター
  if (filters.visitedThisMonth) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    filteredClients = filteredClients.filter(client => {
      if (!client.lastVisitDate) return false;
      const visitDate = new Date(client.lastVisitDate);
      return visitDate.getMonth() === currentMonth && visitDate.getFullYear() === currentYear;
    });
  }

  // お気に入りフィルター（モックなので訪問回数で判定）
  if (filters.isFavorite) {
    filteredClients = filteredClients.filter(client => client.visitCount >= 10);
  }

  return filteredClients;
};

// 本日のクライアント表示用モックデータ
export const mockDailyClientDisplays: DailyClientDisplay[] = [
  {
    appointment: {
      id: 'apt-001',
      organizationId: 'mock-org-001',
      clientId: 'mock-client-001',
      stylistId: 'mock-user-001',
      services: ['カラー', 'カット'],
      scheduledAt: new Date('2025-05-24T10:00:00'),
      duration: 120,
      status: AppointmentStatus.CONFIRMED,
      createdAt: new Date('2025-05-20'),
      updatedAt: new Date('2025-05-20'),
    },
    client: mockClients[0], // 佐藤 花子
    compatibility: {
      score: 92,
      level: 'excellent',
      advice: '水の要素が強いお客様です。今日は落ち着いた雰囲気で接客すると良いでしょう。',
    },
    isFirstVisit: false,
  },
  {
    appointment: {
      id: 'apt-002',
      organizationId: 'mock-org-001',
      clientId: 'mock-client-002',
      stylistId: 'mock-user-001',
      services: ['カット'],
      scheduledAt: new Date('2025-05-24T11:30:00'),
      duration: 60,
      status: AppointmentStatus.CONFIRMED,
      createdAt: new Date('2025-05-20'),
      updatedAt: new Date('2025-05-20'),
    },
    client: mockClients[1], // 田中 美咲
    compatibility: {
      score: 85,
      level: 'good',
      advice: '火の要素を持つ活発なお客様。明るくエネルギッシュな対応が効果的です。',
    },
    isFirstVisit: false,
  },
  {
    appointment: {
      id: 'apt-003',
      organizationId: 'mock-org-001',
      clientId: 'mock-client-003',
      stylistId: 'mock-user-001',
      services: ['パーマ', 'カット'],
      scheduledAt: new Date('2025-05-24T14:00:00'),
      duration: 150,
      status: AppointmentStatus.CONFIRMED,
      createdAt: new Date('2025-05-20'),
      updatedAt: new Date('2025-05-20'),
    },
    client: mockClients[2], // 鈴木 優子
    compatibility: {
      score: 78,
      level: 'average',
      advice: '土の要素が強い慎重なお客様。技術的な説明を丁寧に行うと安心されます。',
    },
    isFirstVisit: false,
  },
  {
    appointment: {
      id: 'apt-004',
      organizationId: 'mock-org-001',
      clientId: 'mock-client-004',
      stylistId: 'mock-user-001',
      services: ['トリートメント'],
      scheduledAt: new Date('2025-05-24T15:30:00'),
      duration: 60,
      status: AppointmentStatus.CONFIRMED,
      createdAt: new Date('2025-05-20'),
      updatedAt: new Date('2025-05-20'),
    },
    client: mockClients[3], // 小林 愛
    compatibility: {
      score: 88,
      level: 'good',
      advice: '金の要素を持つお客様。上質なサービスと丁寧な接客を心がけてください。',
    },
    isFirstVisit: false,
  },
];