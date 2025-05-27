# デバッグロードマップ - 組織登録エラー解決

## エラー概要
- **問題**: 組織登録時に「電話番号は必須です」エラー（400 Bad Request）
- **エンドポイント**: `POST /api/organizations`
- **原因**: バリデーション要件の不整合とエンドポイントの混同

## 実装した解決策

### 1. 新しいエンドポイントの作成
- **削除**: `/api/organizations` POSTエンドポイント（ownerIdが必須で使いにくい）
- **新規作成**: `/api/organizations/create-with-owner` - SuperAdmin専用
  - オーナーユーザーとその組織を同時に作成
  - SuperAdminがパスワードを設定可能

### 2. 実装内容
#### バックエンド
- `OrganizationController.createOrganizationWithOwner` メソッド追加
- `OrganizationService.createOrganizationWithOwner` メソッド追加
- `validateCreateOrganizationWithOwner` バリデーター追加
- 電話番号はオプショナルに設定

#### フロントエンド
- `organizationService.createOrganizationWithOwner` メソッド追加
- SuperAdminOrganizationsPageにパスワード入力フィールド追加
- フォームデータ構造にownerPasswordプロパティ追加

### 3. リクエスト形式
```json
{
  "name": "組織名",
  "ownerName": "オーナー名",
  "ownerEmail": "owner@example.com",
  "ownerPassword": "SecurePass123",
  "phone": "03-1234-5678", // オプショナル
  "address": "東京都...", // オプショナル
  "plan": "standard",
  "status": "trial",
  "tokenLimit": 0
}
```

## 解決状況
- [x] エラー発生箇所の特定
- [x] 電話番号バリデーション修正
- [x] オーナー登録フロー確認
- [x] 新しいエンドポイントの実装
- [x] フロントエンドの更新
- [ ] 古いPOST /api/organizationsエンドポイントの削除（任意）

## 動作確認
1. SuperAdmin画面から「新規組織追加」ボタンをクリック
2. 組織情報とオーナー情報（パスワード含む）を入力
3. 作成ボタンで組織とオーナーが同時に作成される