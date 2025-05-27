# 収益シミュレーションAPI設計書

## 1. 概要

SuperAdmin向けの収益シミュレーション機能を提供するAPIです。このAPIは、組織の成長予測、プラン分布、収益予測などのビジネスインテリジェンスを提供します。

## 2. エンドポイント設計

### 2.1 収益シミュレーション計算

**エンドポイント**: `POST /api/superadmin/billing/simulation`

**説明**: 指定されたパラメータに基づいて収益シミュレーションを計算します。

**認証**: 必要（SUPER_ADMINロールのみ）

**リクエストボディ**:
```typescript
interface RevenueSimulationRequest {
  // シミュレーション期間
  simulationPeriod: 'monthly' | 'quarterly' | 'yearly';
  
  // シミュレーション対象期間（月数）
  periodMonths: number; // デフォルト: 6ヶ月
  
  // 前提条件
  assumptions: {
    // 月間新規組織数
    newOrganizationsPerMonth: number;
    
    // 解約率（%）
    churnRate: number;
    
    // 平均トークン購入額（円/組織）
    averageTokenPurchase: number;
    
    // プラン分布の調整（%）
    planDistribution?: {
      STANDARD: number;
      PROFESSIONAL: number;
      ENTERPRISE: number;
    };
  };
}
```

**レスポンス**:
```typescript
interface RevenueSimulationResponse {
  // 予測収益
  projectedRevenue: {
    total: number;           // 合計収益
    subscription: number;    // サブスクリプション収益
    tokenSales: number;      // トークン売上
  };
  
  // 成長予測
  projectedGrowth: {
    growthRate: number;      // 成長率（%）
    organizations: number;   // アクティブ組織数
    newOrganizations: number; // 新規組織数
    churnedOrganizations: number; // 解約組織数
  };
  
  // 月次/四半期/年次の詳細データ
  breakdown: Array<{
    period: string;          // 期間（例: "2024年1月", "Q1 2024", "2024年"）
    subscriptionRevenue: number;
    tokenRevenue: number;
    totalRevenue: number;
    activeOrganizations: number;
    newOrganizations: number;
    churnedOrganizations: number;
  }>;
  
  // 実際のデータに基づく統計
  actualData: {
    currentActiveOrganizations: number;
    currentMonthlyRevenue: number;
    averageRevenuePerOrganization: number;
    actualChurnRate: number;
    actualPlanDistribution: {
      STANDARD: number;
      PROFESSIONAL: number;
      ENTERPRISE: number;
    };
  };
  
  // シミュレーション時の前提条件（確認用）
  assumptions: {
    newOrganizationsPerMonth: number;
    churnRate: number;
    averageTokenPurchase: number;
    planDistribution: {
      STANDARD: number;
      PROFESSIONAL: number;
      ENTERPRISE: number;
    };
  };
}
```

### 2.2 現在の収益統計取得

**エンドポイント**: `GET /api/superadmin/billing/statistics`

**説明**: 現在の収益状況と統計情報を取得します。

**認証**: 必要（SUPER_ADMINロールのみ）

**クエリパラメータ**:
- `period`: 'daily' | 'weekly' | 'monthly' | 'yearly' (デフォルト: 'monthly')
- `startDate`: ISO日付文字列 (オプション)
- `endDate`: ISO日付文字列 (オプション)

**レスポンス**:
```typescript
interface RevenueStatisticsResponse {
  // 現在の収益サマリー
  currentRevenue: {
    totalRevenue: number;
    subscriptionRevenue: number;
    tokenRevenue: number;
    period: string;
  };
  
  // 組織統計
  organizationStats: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
    cancelled: number;
    planBreakdown: {
      STANDARD: number;
      PROFESSIONAL: number;
      ENTERPRISE: number;
    };
  };
  
  // トレンドデータ
  trends: {
    revenueGrowthRate: number;      // 前期比収益成長率
    organizationGrowthRate: number; // 前期比組織成長率
    averageRevenuePerOrg: number;   // 組織あたり平均収益
    tokenUsageGrowthRate: number;   // トークン使用量成長率
  };
  
  // 上位組織（収益ベース）
  topOrganizations: Array<{
    organizationId: string;
    organizationName: string;
    revenue: number;
    plan: string;
    tokenUsage: number;
  }>;
}
```

### 2.3 プラン別収益分析

**エンドポイント**: `GET /api/superadmin/billing/analysis/by-plan`

**説明**: プラン別の詳細な収益分析を取得します。

**認証**: 必要（SUPER_ADMINロールのみ）

**レスポンス**:
```typescript
interface PlanAnalysisResponse {
  plans: Array<{
    planType: 'STANDARD' | 'PROFESSIONAL' | 'ENTERPRISE';
    statistics: {
      organizationCount: number;
      totalRevenue: number;
      averageRevenue: number;
      retentionRate: number;
      averageTokenUsage: number;
      churnRate: number;
    };
    trends: {
      monthlyGrowthRate: number;
      tokenUsageGrowthRate: number;
    };
  }>;
  
  recommendations: Array<{
    type: 'pricing' | 'feature' | 'retention';
    plan: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}
```

## 3. 実装詳細

### 3.1 ファイル構造

```
backend/src/features/billing/
├── controllers/
│   └── revenue-simulation.controller.ts  # 新規作成
├── services/
│   └── revenue-simulation.service.ts     # 新規作成
├── routes/
│   └── billing.routes.ts                 # 既存ファイルに追加
└── validators/
    └── revenue-simulation.validator.ts    # 新規作成
```

### 3.2 計算ロジック

#### 3.2.1 収益予測計算

```typescript
// 月次収益計算
monthlyRevenue = (activeOrganizations * averageSubscriptionRevenue) + 
                 (activeOrganizations * averageTokenPurchase * tokenPurchaseRate)

// 組織数の成長計算
nextMonthOrganizations = currentOrganizations + newOrganizations - (currentOrganizations * churnRate / 100)

// プラン別収益計算
planRevenue = organizationCount * planPrice * (1 - discountRate)
```

#### 3.2.2 統計データの集計

- MongoDBのaggregationパイプラインを使用して効率的にデータを集計
- 実際のデータと予測データを組み合わせて精度の高いシミュレーションを提供

### 3.3 バリデーション

```typescript
// revenue-simulation.validator.ts
export const simulationSchema = Joi.object({
  simulationPeriod: Joi.string().valid('monthly', 'quarterly', 'yearly').required(),
  periodMonths: Joi.number().min(1).max(60).default(6),
  assumptions: Joi.object({
    newOrganizationsPerMonth: Joi.number().min(0).max(1000).required(),
    churnRate: Joi.number().min(0).max(100).required(),
    averageTokenPurchase: Joi.number().min(0).required(),
    planDistribution: Joi.object({
      STANDARD: Joi.number().min(0).max(100),
      PROFESSIONAL: Joi.number().min(0).max(100),
      ENTERPRISE: Joi.number().min(0).max(100),
    }).custom((value, helpers) => {
      const total = value.STANDARD + value.PROFESSIONAL + value.ENTERPRISE;
      if (Math.abs(total - 100) > 0.01) {
        return helpers.error('any.invalid', { message: 'プラン分布の合計は100%である必要があります' });
      }
      return value;
    }).optional(),
  }).required(),
});
```

### 3.4 キャッシング戦略

- 統計データは5分間キャッシュ
- シミュレーション結果は同じパラメータであれば1分間キャッシュ
- Redisを使用した分散キャッシュ実装

### 3.5 エラーハンドリング

```typescript
// エラーコード定義
export enum SimulationErrorCode {
  INVALID_PARAMETERS = 'SIMULATION_001',
  INSUFFICIENT_DATA = 'SIMULATION_002',
  CALCULATION_ERROR = 'SIMULATION_003',
  UNAUTHORIZED = 'SIMULATION_004',
}
```

## 4. セキュリティ考慮事項

1. **認証・認可**
   - SUPER_ADMINロールのみアクセス可能
   - JWTトークンによる認証

2. **レート制限**
   - シミュレーション: 1分間に10回まで
   - 統計取得: 1分間に30回まで

3. **データセキュリティ**
   - 組織の詳細情報は最小限に留める
   - 個人情報は含めない

## 5. パフォーマンス最適化

1. **データベースクエリ最適化**
   - 適切なインデックスの設定
   - aggregationパイプラインの最適化

2. **非同期処理**
   - 重い計算処理は非同期で実行
   - 必要に応じてワーカープロセスを使用

3. **ページネーション**
   - 大量データの取得時はページネーションを実装

## 6. フロントエンド統合

### 6.1 API呼び出し例

```typescript
// frontend/src/services/api/billing.ts に追加
export const billingService = {
  // 既存のメソッド...
  
  // 収益シミュレーション実行
  async runRevenueSimulation(params: RevenueSimulationRequest): Promise<RevenueSimulationResponse> {
    const response = await apiClient.post(API_PATHS.superadmin.billing.simulation, params);
    return response.data;
  },
  
  // 収益統計取得
  async getRevenueStatistics(period?: string): Promise<RevenueStatisticsResponse> {
    const response = await apiClient.get(API_PATHS.superadmin.billing.statistics, {
      params: { period }
    });
    return response.data;
  },
  
  // プラン別分析取得
  async getPlanAnalysis(): Promise<PlanAnalysisResponse> {
    const response = await apiClient.get(API_PATHS.superadmin.billing.analysisByPlan);
    return response.data;
  }
};
```

### 6.2 状態管理

```typescript
// SuperAdminPlansPage.tsx での使用例
const [simulation, setSimulation] = useState<RevenueSimulationResponse | null>(null);
const [loading, setLoading] = useState(false);

const handleSimulationRecalc = async () => {
  setLoading(true);
  try {
    const result = await billingService.runRevenueSimulation({
      simulationPeriod: simulationPeriod,
      periodMonths: 6,
      assumptions: {
        newOrganizationsPerMonth: parseInt(newOrgsPerMonth),
        churnRate: parseFloat(churnRate),
        averageTokenPurchase: parseInt(avgTokenPurchase),
      }
    });
    setSimulation(result);
  } catch (error) {
    console.error('シミュレーションエラー:', error);
    alert('シミュレーションの実行に失敗しました');
  } finally {
    setLoading(false);
  }
};
```

## 7. テスト計画

### 7.1 単体テスト
- 計算ロジックの正確性
- バリデーションの動作確認
- エラーハンドリング

### 7.2 統合テスト
- エンドツーエンドのAPI動作確認
- 認証・認可の確認
- レート制限の動作確認

### 7.3 パフォーマンステスト
- 大量データでの応答速度
- 同時アクセス時の安定性

## 8. 今後の拡張案

1. **AI予測モデルの導入**
   - 機械学習を使用した高精度な予測
   - 季節性やトレンドの自動検出

2. **What-ifシナリオ分析**
   - 複数のシナリオを同時に比較
   - 最適な価格戦略の提案

3. **自動レポート生成**
   - 定期的な収益レポートの自動生成
   - PDFエクスポート機能

4. **アラート機能**
   - 異常な解約率の検知
   - 収益目標達成率のモニタリング