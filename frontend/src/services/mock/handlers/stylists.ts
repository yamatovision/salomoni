import type { 
  StylistDetail,
  StylistSearchFilter,
  TurnoverRiskAnalysis,
  StylistReport,
  ApiResponse
} from '../../../types';
import { 
  UserRole,
  UserStatus,
  AuthMethod,
  TurnoverRiskLevel
} from '../../../types';
import { 
  mockStylists, 
  mockTurnoverRiskAnalysis,
  mockStylistReports,
  mockStylistFourPillars,
  mockElementBalance
} from '../data/mockStylists';

// 検索・フィルター処理
const filterStylists = (stylists: StylistDetail[], filter: StylistSearchFilter): StylistDetail[] => {
  let filtered = [...stylists];

  // 検索キーワード
  if (filter.searchTerm) {
    const term = filter.searchTerm.toLowerCase();
    filtered = filtered.filter(stylist => 
      stylist.name.toLowerCase().includes(term) ||
      stylist.email.toLowerCase().includes(term) ||
      stylist.position.toLowerCase().includes(term)
    );
  }

  // ロールフィルター
  if (filter.role) {
    filtered = filtered.filter(stylist => stylist.role === filter.role);
  }

  // 離職リスクレベルフィルター
  if (filter.riskLevel) {
    filtered = filtered.filter(stylist => stylist.turnoverRiskLevel === filter.riskLevel);
  }

  // アクティブステータスフィルター
  if (filter.isActive !== undefined) {
    filtered = filtered.filter(stylist => 
      filter.isActive ? stylist.status === UserStatus.ACTIVE : stylist.status !== UserStatus.ACTIVE
    );
  }

  return filtered;
};

// スタイリスト一覧取得
export const getStylistsHandler = (filter?: StylistSearchFilter): ApiResponse<StylistDetail[]> => {
  let stylists = mockStylists;
  
  if (filter) {
    stylists = filterStylists(stylists, filter);
  }

  return {
    success: true,
    data: stylists,
    meta: {
      total: stylists.length,
      _isMockData: true
    }
  };
};

// スタイリスト詳細取得
export const getStylistByIdHandler = (stylistId: string): ApiResponse<StylistDetail | null> => {
  const stylist = mockStylists.find(s => s.id === stylistId);
  
  if (!stylist) {
    return {
      success: false,
      error: 'スタイリストが見つかりません'
    };
  }

  return {
    success: true,
    data: stylist
  };
};

// 離職リスク分析取得
export const getTurnoverRiskAnalysisHandler = (stylistId: string): ApiResponse<TurnoverRiskAnalysis | null> => {
  const analysis = mockTurnoverRiskAnalysis[stylistId];
  
  if (!analysis) {
    return {
      success: false,
      error: '離職リスク分析データが見つかりません'
    };
  }

  return {
    success: true,
    data: analysis
  };
};

// スタイリストレポート取得
export const getStylistReportHandler = (stylistId: string): ApiResponse<StylistReport | null> => {
  const report = mockStylistReports[stylistId];
  
  if (!report) {
    return {
      success: false,
      error: 'レポートデータが見つかりません'
    };
  }

  return {
    success: true,
    data: report
  };
};

// スタイリスト新規作成
export const createStylistHandler = (data: Partial<StylistDetail>): ApiResponse<StylistDetail> => {
  const newStylist: StylistDetail = {
    id: `stylist-${Date.now()}`,
    email: data.email || '',
    name: data.name || '',
    role: data.role || UserRole.USER,
    organizationId: 'org-1',
    status: UserStatus.PENDING,
    birthDate: data.birthDate,
    gender: data.gender,
    phone: data.phone,
    profileImage: undefined,
    lastLoginAt: undefined,
    authMethods: [AuthMethod.EMAIL],
    employeeNumber: `EMP${String(Date.now()).slice(-4)}`,
    department: '美容部',
    hireDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    _isMockData: true,
    
    yearsOfService: 0,
    position: data.position || '研修生',
    specialties: data.specialties || [],
    turnoverRiskLevel: TurnoverRiskLevel.LOW,
    monthlyAppointments: 0,
    performanceScore: undefined
  };

  // 実際のAPIでは、ここでデータベースに保存
  mockStylists.push(newStylist);

  return {
    success: true,
    data: newStylist,
    meta: {
      message: '新規スタイリストが正常に登録されました。四柱推命の分析結果は数分後に反映されます。'
    }
  };
};

// スタイリスト更新
export const updateStylistHandler = (stylistId: string, data: Partial<StylistDetail>): ApiResponse<StylistDetail> => {
  const index = mockStylists.findIndex(s => s.id === stylistId);
  
  if (index === -1) {
    return {
      success: false,
      error: 'スタイリストが見つかりません'
    };
  }

  const updatedStylist = {
    ...mockStylists[index],
    ...data,
    updatedAt: new Date()
  };

  mockStylists[index] = updatedStylist;

  return {
    success: true,
    data: updatedStylist,
    meta: {
      message: 'スタイリスト情報を更新しました'
    }
  };
};

// スタイリスト削除
export const deleteStylistHandler = (stylistId: string): ApiResponse<void> => {
  const index = mockStylists.findIndex(s => s.id === stylistId);
  
  if (index === -1) {
    return {
      success: false,
      error: 'スタイリストが見つかりません'
    };
  }

  const stylist = mockStylists[index];
  
  // 実際のAPIでは、ここで論理削除または物理削除を実行
  mockStylists.splice(index, 1);

  return {
    success: true,
    meta: {
      message: `${stylist.name}を削除しました`
    }
  };
};

// 四柱推命プロフィール取得
export const getStylistFourPillarsHandler = (stylistId: string): ApiResponse<any> => {
  const fourPillars = mockStylistFourPillars[stylistId];
  const elementBalance = mockElementBalance[stylistId];
  
  if (!fourPillars) {
    return {
      success: false,
      error: '四柱推命データが見つかりません'
    };
  }

  return {
    success: true,
    data: {
      fourPillars,
      elementBalance,
      analysis: {
        characteristics: '明るく情熱的な性格です。リーダーシップと行動力に優れ、計画的で堅実な一面もあります。',
        advice: 'お客様との相性は「水」「木」のエネルギーを持つ方と特に良い関係が築けます。',
        stylingAdvice: 'あまり直線的で硬い印象のスタイルは避け、柔らかさや流れのあるデザインを取り入れると良いでしょう。'
      }
    }
  };
};

// 離職リスクサマリー取得
export const getTurnoverRiskSummaryHandler = (): ApiResponse<any> => {
  const summary = {
    high: mockStylists.filter(s => s.turnoverRiskLevel === TurnoverRiskLevel.HIGH).length,
    critical: mockStylists.filter(s => s.turnoverRiskLevel === TurnoverRiskLevel.CRITICAL).length,
    totalActive: mockStylists.filter(s => s.status === UserStatus.ACTIVE).length,
    alerts: Object.values(mockTurnoverRiskAnalysis).filter(a => 
      a.riskLevel === TurnoverRiskLevel.HIGH || a.riskLevel === TurnoverRiskLevel.CRITICAL
    )
  };

  return {
    success: true,
    data: summary
  };
};