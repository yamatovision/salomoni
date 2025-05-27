# リファクタリング計画: displayName削除 2025-01-26

## 1. 現状分析

### 1.1 対象概要
displayNameフィールドは、組織名の表示用として一部のテストコードで使用されているが、実際のデータモデルには存在しない。また、LINE認証でLINEプロフィールの表示名を取得する際にも使用されているが、これは組織とは無関係な個人情報である。

### 1.2 問題点と課題
- 組織（Organization）モデルにはnameフィールドが既に存在するのに、テストでdisplayNameを使用している（不整合）
- LINE認証のdisplayNameは個人のプロフィール名だが、組織関連のコンテキストで混同されやすい
- 型定義には存在しないが、テストコードで使用されているため、混乱を招く
- フロントエンドのSuperAdminPlansPageでプランのdisplayNameが使用されているが、これは組織とは別の概念

### 1.3 関連ファイル一覧
**バックエンド**
- `/backend/src/features/auth/services/auth.service.ts`
- `/backend/tests/integration/organizations/organization.flow.test.ts`
- `/backend/tests/integration/auth/auth.flow.test.ts`
- `/backend/tests/integration/support/support.flow.test.ts`
- `/backend/tests/integration/dashboard/dashboard.flow.test.ts`
- `/backend/tests/integration/setup/seed-test-data.ts`
- `/backend/tests/utils/test-auth-helper.ts`
- `/backend/scripts/seed-mock-users.ts`

**フロントエンド**
- `/frontend/src/pages/superadmin/SuperAdminPlansPage.tsx`

**その他**
- `/reference/enhanced-compatibility.service.ts`（参照用コード）

### 1.4 依存関係図
```
組織関連:
- Organization.name ← 正式な組織名フィールド
- テストコードのdisplayName → Organization.nameに統一すべき

LINE認証関連:
- LINE API → displayName（個人のプロフィール名）
- auth.service.ts内でのみ使用（組織とは無関係）

プラン関連:
- Plan.displayName（別概念、今回は対象外）
```

## 2. リファクタリングの目標

### 2.1 期待される成果
- 組織関連のコードからdisplayNameを完全に削除し、nameフィールドに統一
- LINE認証のdisplayNameは個人情報として明確に区別
- コードの一貫性向上と混乱の解消
- テストコードと実装の整合性確保

### 2.2 維持すべき機能
- 組織名の表示機能（nameフィールドを使用）
- LINE認証でのプロフィール情報取得（内部的な処理として維持）
- 既存のテストケースの動作

## 3. 理想的な実装

### 3.1 全体アーキテクチャ
- 組織（Organization）：nameフィールドのみを使用
- LINE認証：内部的にdisplayNameを取得するが、外部には露出しない
- テストコード：実装と同じくnameフィールドを使用

### 3.2 核心的な改善ポイント
- テストデータ生成時にdisplayNameではなくnameを使用
- 組織関連のすべてのコンテキストでnameフィールドに統一
- LINE認証のdisplayNameは内部変数名として保持（LINEのAPIレスポンスに合わせる）

### 3.3 新しいディレクトリ構造
変更なし

## 4. 実装計画

### フェーズ1: テストコードの修正
- **目標**: すべてのテストコードでdisplayNameをnameに置換
- **影響範囲**: テストファイル群
- **タスク**:
  1. **T1.1**: organization.flow.test.tsの修正
     - 対象: 111行目、154行目、170行目、178行目
     - 実装: displayNameをnameに置換
  2. **T1.2**: auth.flow.test.tsの修正
     - 対象: 36行目、68行目、85行目
     - 実装: displayNameをnameに置換
  3. **T1.3**: support.flow.test.tsの修正
     - 対象: 37行目、49行目
     - 実装: displayNameをnameに置換
  4. **T1.4**: dashboard.flow.test.tsの修正
     - 対象: 59行目
     - 実装: displayNameをnameに置換
  5. **T1.5**: seed-test-data.tsの修正
     - 対象: 41行目、133行目
     - 実装: displayNameをnameに置換
  6. **T1.6**: test-auth-helper.tsの修正
     - 対象: 40行目
     - 実装: displayNameをnameに置換
  7. **T1.7**: seed-mock-users.tsの修正
     - 対象: 152行目
     - 実装: displayNameをnameに置換
- **検証ポイント**:
  - すべてのテストが正常に実行される
  - 組織作成・更新のテストが期待通り動作する

### フェーズ2: LINE認証のリファクタリング
- **目標**: LINE認証のdisplayNameを内部的な処理に限定
- **影響範囲**: auth.service.ts
- **タスク**:
  1. **T2.1**: verifyLineTokenメソッドのコメント追加
     - 対象: auth.service.ts 221-253行目
     - 実装: displayNameがLINEプロフィール名であることを明記
  2. **T2.2**: 返り値の型名を明確化（オプション）
     - 対象: verifyLineTokenの戻り値型
     - 実装: 型名をLineProfileなどに変更して意図を明確化
- **検証ポイント**:
  - LINE認証が正常に動作する
  - LINEプロフィール情報が正しく取得される

### フェーズ3: フロントエンドの確認
- **目標**: SuperAdminPlansPageのdisplayNameが組織と無関係であることを確認
- **影響範囲**: SuperAdminPlansPage.tsx
- **タスク**:
  1. **T3.1**: プランのdisplayName使用箇所の確認
     - 対象: 647、755、928、1002行目
     - 実装: これはPlanのdisplayNameで組織とは無関係なので変更不要
- **検証ポイント**:
  - プラン管理画面が正常に動作する

## 5. 期待される効果

### 5.1 コード削減
- 予想削減行数：約20行（重複概念の削除）
- 削減率：約5%（該当ファイル内）

### 5.2 保守性向上
- 組織名の表現が一元化される
- 新規開発者の混乱を防げる
- テストと実装の整合性が保たれる

### 5.3 拡張性改善
- 将来的な組織情報の拡張時に、フィールド名の混乱がない
- LINE認証と組織管理の責務が明確に分離される

## 6. リスクと対策

### 6.1 潜在的リスク
- テスト修正時の誤った変更による不具合
- 既存データベースのマイグレーション（実際には不要）

### 6.2 対策
- 各フェーズごとにテストを実行して検証
- 変更は段階的に実施し、問題があれば即座にロールバック
- gitでのチェックポイント作成

## 7. 備考
- 実際のデータベーススキーマにはdisplayNameは存在しないため、マイグレーションは不要
- フロントエンドのPlanのdisplayNameは組織とは別概念のため、今回のリファクタリング対象外
- referenceフォルダ内のコードは参照用のため変更不要