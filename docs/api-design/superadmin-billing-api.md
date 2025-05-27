# SuperAdmin請求管理API要件定義書

## 1. 概要

### 1.1 目的
SuperAdminが全組織の請求・支払い状況を一元管理し、収益分析を行うためのAPI群を提供する。

### 1.2 スコープ
- 全組織の請求情報の閲覧・管理
- 収益分析とレポート生成
- 支払い状況のモニタリング
- 請求書の一括管理

### 1.3 対象ユーザー
- SuperAdmin権限を持つシステム管理者のみ

## 2. 機能要件

### 2.1 請求ダッシュボード機能
#### 2.1.1 請求サマリー取得
- **目的**: 全組織の請求状況を集計して表示
- **必要データ**:
  - 総売上（月次・年次）
  - 未払い金額合計
  - 延滞金額合計
  - 支払い成功率
  - 組織別売上ランキング

#### 2.1.2 収益トレンド分析
- **目的**: 収益の推移と成長率を可視化
- **必要データ**:
  - 月次収益推移（過去12ヶ月）
  - サブスクリプション収益 vs トークン収益
  - 組織数の増減
  - 平均単価の推移

### 2.2 請求書管理機能
#### 2.2.1 請求書一覧
- **目的**: 全組織の請求書を一元管理
- **フィルター機能**:
  - 組織名/ID
  - 請求書ステータス（送信済み、支払済み、延滞など）
  - 期間（発行日、支払期限）
  - 金額範囲
  - 請求タイプ（サブスクリプション、トークン購入）

#### 2.2.2 請求書詳細
- **目的**: 個別請求書の詳細確認と操作
- **機能**:
  - 請求書内容の表示
  - 支払い履歴の確認
  - ステータス更新（手動調整）
  - 請求書の再送信
  - メモ・備考の追加

### 2.3 支払い管理機能
#### 2.3.1 支払い方法一覧
- **目的**: 各組織の登録済み支払い方法を管理
- **情報**:
  - 組織別の支払い方法リスト
  - デフォルト支払い方法
  - 有効期限の確認
  - 無効化された支払い方法

#### 2.3.2 支払い履歴
- **目的**: 全支払いトランザクションの追跡
- **情報**:
  - 成功/失敗の履歴
  - 失敗理由の分析
  - リトライ状況
  - 返金処理履歴

### 2.4 アラート・通知機能
#### 2.4.1 支払い遅延アラート
- **目的**: 延滞組織の早期発見と対応
- **トリガー**:
  - 支払期限超過
  - 支払い失敗の繰り返し
  - 高額請求の未払い

#### 2.4.2 収益異常検知
- **目的**: 収益の急激な変動を検知
- **トリガー**:
  - 前月比での大幅な減少
  - 解約率の急上昇
  - 特定プランへの偏り

## 3. API仕様

### 3.1 エンドポイント一覧

```typescript
// 請求サマリー
GET /api/superadmin/billing/summary
GET /api/superadmin/billing/revenue-trends

// 請求書管理
GET /api/superadmin/billing/invoices
GET /api/superadmin/billing/invoices/:invoiceId
PATCH /api/superadmin/billing/invoices/:invoiceId
POST /api/superadmin/billing/invoices/:invoiceId/resend

// 支払い管理
GET /api/superadmin/billing/payment-methods
GET /api/superadmin/billing/payment-history
POST /api/superadmin/billing/refunds

// レポート生成
GET /api/superadmin/billing/reports/monthly
GET /api/superadmin/billing/reports/export
```

### 3.2 データモデル

#### SuperAdminBillingSummary
```typescript
interface SuperAdminBillingSummary {
  // 収益サマリー
  revenue: {
    total: number;
    subscription: number;
    tokenSales: number;
    monthlyGrowth: number;
    yearlyGrowth: number;
  };
  
  // 支払い状況
  paymentStatus: {
    totalOutstanding: number;
    totalOverdue: number;
    successRate: number;
    failureCount: number;
  };
  
  // 組織別ランキング
  topOrganizations: Array<{
    organizationId: string;
    organizationName: string;
    totalRevenue: number;
    lastPaymentDate: Date;
    status: 'good' | 'warning' | 'critical';
  }>;
  
  // 期間
  period: {
    start: Date;
    end: Date;
  };
}
```

#### InvoiceListItem
```typescript
interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  organizationId: string;
  organizationName: string;
  type: 'subscription' | 'token' | 'adjustment';
  status: InvoiceStatus;
  amount: number;
  issueDate: Date;
  dueDate: Date;
  paidAt?: Date;
  overdueDays?: number;
}
```

#### PaymentAnalytics
```typescript
interface PaymentAnalytics {
  organizationId: string;
  paymentMethods: number;
  activeSubscriptions: number;
  totalSpent: number;
  averageMonthlySpend: number;
  paymentHealth: 'excellent' | 'good' | 'fair' | 'poor';
  riskFactors: string[];
}
```

## 4. セキュリティ要件

### 4.1 認証・認可
- SuperAdmin権限の厳格な確認
- JWTトークンによる認証
- IPアドレス制限（オプション）

### 4.2 監査ログ
- 全ての請求関連操作をログ記録
- 誰が、いつ、何を閲覧・操作したか追跡可能

### 4.3 データ保護
- 支払い情報の暗号化
- PCI DSS準拠を考慮
- センシティブ情報のマスキング

## 5. パフォーマンス要件

### 5.1 レスポンスタイム
- 一覧取得: 2秒以内
- 集計処理: 5秒以内
- エクスポート: 10秒以内

### 5.2 スケーラビリティ
- 10,000組織まで対応
- 月間100万件の請求書処理
- 同時アクセス数: 10ユーザー

## 6. 実装優先順位

### Phase 1（必須）
1. 請求サマリーAPI
2. 請求書一覧API
3. 基本的なフィルタリング

### Phase 2（重要）
1. 請求書詳細・更新API
2. 支払い履歴API
3. 収益トレンド分析

### Phase 3（nice-to-have）
1. 自動アラート機能
2. レポート生成・エクスポート
3. 高度な分析機能

## 7. 将来の拡張性

### 7.1 考慮事項
- 多通貨対応
- 税金計算の自動化
- 外部会計システムとの連携
- AIによる収益予測

### 7.2 API設計原則
- RESTful設計の遵守
- ページネーションの実装
- 適切なHTTPステータスコードの使用
- エラーハンドリングの統一

## 8. テスト要件

### 8.1 単体テスト
- 各エンドポイントの正常系・異常系
- 権限チェックのテスト
- データ集計ロジックのテスト

### 8.2 統合テスト
- 実際のデータベースを使用したテスト
- パフォーマンステスト
- 同時実行テスト

### 8.3 受け入れテスト
- UIからの一連の操作フロー
- 実際の請求シナリオでの動作確認
- エッジケースの確認

## 9. ドキュメント要件

### 9.1 API仕様書
- OpenAPI/Swagger形式での定義
- 各エンドポイントの詳細説明
- リクエスト/レスポンスサンプル

### 9.2 実装ガイド
- アーキテクチャ図
- データフロー図
- エラーハンドリングガイド

### 9.3 運用マニュアル
- トラブルシューティングガイド
- パフォーマンスチューニング方法
- バックアップ・リストア手順