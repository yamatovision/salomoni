# 機能拡張計画: 収益シミュレーション機能 2025-01-27

## 1. 拡張概要

SuperAdminの収益シミュレーション機能を実装し、組織の成長予測と収益予測を可能にする。現在モックデータで表示されている収益シミュレーション画面に対して、実際のデータベースから取得した基礎データを元にしたリアルタイムシミュレーションを実現する。ハイブリッド型アプローチを採用し、基礎データはバックエンドAPIから取得し、シミュレーション計算はフロントエンドで実行する。

## 2. 詳細仕様

### 2.1 現状と課題

現在のSuperAdminPlansPageには収益シミュレーション機能のUIが実装されているが、すべてモックデータを表示している状態。実際の組織データ、課金データ、プラン分布などの情報に基づいたシミュレーションができない。SuperAdminが事業計画を立てる際に必要な予測機能が欠けている。

### 2.2 拡張内容

#### バックエンドAPI（基礎データ提供）
1. **収益シミュレーション基礎データ取得API**
   - 現在の組織数（総数、アクティブ数）
   - プラン別組織分布（ベーシック、スタンダード、プレミアム）
   - 過去6ヶ月の収益実績（月別）
   - 過去6ヶ月の新規組織数推移
   - 過去6ヶ月の解約率推移
   - 平均トークン購入額（プラン別）
   - 現在のプラン料金設定

2. **プラン管理API**
   - プラン一覧取得（サブスクリプション、トークンパック）
   - プラン作成・更新・削除

#### フロントエンド（シミュレーション実行）
1. **シミュレーション計算ロジック**
   - 基礎データを元にした収益予測計算
   - パラメータ変更時のリアルタイム再計算
   - グラフデータの動的更新

2. **既存UIの実API接続**
   - モックデータから実APIデータへの切り替え
   - エラーハンドリングとローディング状態の実装

## 3. ディレクトリ構造

```
backend/
├── src/
│   ├── features/
│   │   ├── billing/
│   │   │   ├── controllers/
│   │   │   │   └── billing.controller.ts (追加: getSimulationData)
│   │   │   ├── services/
│   │   │   │   ├── billing.service.ts (追加: getSimulationData)
│   │   │   │   └── revenue-simulation.service.ts (新規)
│   │   │   ├── repositories/
│   │   │   │   └── revenue-simulation.repository.ts (新規)
│   │   │   └── routes/
│   │   │       └── billing.routes.ts (追加: /simulation/data)
│   │   └── plans/ (新規ディレクトリ)
│   │       ├── controllers/
│   │       │   └── plan.controller.ts
│   │       ├── models/
│   │       │   └── plan.model.ts
│   │       ├── services/
│   │       │   └── plan.service.ts
│   │       ├── repositories/
│   │       │   └── plan.repository.ts
│   │       ├── routes/
│   │       │   └── plan.routes.ts
│   │       └── validators/
│   │           └── plan.validator.ts
│   └── types/
│       └── index.ts (更新: 型定義追加)

frontend/
├── src/
│   ├── services/
│   │   └── api/
│   │       ├── billing.ts (更新: getSimulationData追加)
│   │       └── plans.ts (新規)
│   ├── pages/
│   │   └── superadmin/
│   │       └── SuperAdminPlansPage.tsx (更新: 実API接続)
│   ├── utils/
│   │   └── revenueSimulation.ts (新規: シミュレーション計算ロジック)
│   └── types/
│       └── index.ts (更新: 型定義追加)
```

## 4. 技術的影響分析

### 4.1 影響範囲

- **フロントエンド**: SuperAdminPlansPage、billing APIサービス
- **バックエンド**: Billingコントローラー/サービス、新規Plansモジュール
- **データモデル**: SimulationData、Plan関連の型定義
- **その他**: なし

### 4.2 変更が必要なファイル

```
- backend/src/types/index.ts: SimulationData、Plan関連の型定義追加
- frontend/src/types/index.ts: 同上（同期）
- backend/src/features/billing/routes/billing.routes.ts: /simulation/dataルート追加
- backend/src/features/billing/controllers/billing.controller.ts: getSimulationDataメソッド追加
- backend/src/features/billing/services/billing.service.ts: getSimulationDataメソッド追加
- frontend/src/services/api/billing.ts: getSimulationDataメソッド追加
- frontend/src/pages/superadmin/SuperAdminPlansPage.tsx: モックから実APIへの切り替え
- backend/src/index.ts: planRoutesの登録
```

## 5. タスクリスト

```
- [ ] **T1**: types/index.tsに型定義とAPIパスを追加（フロントエンド・バックエンド両方）
- [ ] **T2**: revenue-simulation.service.tsとrepository.tsの実装
- [ ] **T3**: billing.controllerとbilling.serviceにgetSimulationDataメソッド追加
- [ ] **T4**: billing.routesに/simulation/dataエンドポイント追加
- [ ] **T5**: Plansモジュールの基本実装（model、controller、service、repository、routes、validator）
- [ ] **T6**: frontend/src/utils/revenueSimulation.tsにシミュレーション計算ロジック実装
- [ ] **T7**: frontend/src/services/api/billing.tsにgetSimulationDataメソッド追加
- [ ] **T8**: frontend/src/services/api/plans.tsの実装
- [ ] **T9**: SuperAdminPlansPageの実API接続とエラーハンドリング実装
- [ ] **T10**: 統合テストの実装
```

## 6. テスト計画

1. **単体テスト**
   - revenue-simulation.serviceのデータ集計ロジック
   - フロントエンドのシミュレーション計算ロジック

2. **統合テスト**
   - シミュレーションデータ取得APIのE2Eテスト
   - プラン管理APIのCRUDテスト

3. **手動テスト**
   - パラメータ変更時のグラフ更新確認
   - 異なるプラン分布でのシミュレーション結果の妥当性確認
   - エラー時の適切なメッセージ表示

## 7. SCOPE_PROGRESSへの統合

SCOPE_PROGRESS.mdに以下のタスクを追加：

```markdown
- [ ] **T-REVENUE-SIM**: 収益シミュレーション機能の実装
  - 目標: 2025-01-31
  - 参照: [/docs/plans/planning/ext-revenue-simulation-2025-01-27.md]
  - 内容: SuperAdmin向け収益シミュレーション機能（ハイブリッド型）の実装
```

## 8. 備考

- 初期実装では過去6ヶ月のデータを基にした線形予測を実装
- 将来的には機械学習による高度な予測モデルへの拡張を検討
- プラン料金変更時の影響シミュレーションは次フェーズで実装予定