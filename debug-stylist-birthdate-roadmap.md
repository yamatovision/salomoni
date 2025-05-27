# スタイリスト誕生日保存問題 - デバッグロードマップ

## 問題の概要
- 場所: http://localhost:5173/admin/stylists
- 症状: 新規追加時に誕生日を入力して保存したが、編集時に誕生日が表示されない
- ユーザー: metavicer@gmail.com

## 調査順序（依存関係に基づく）

### ステップ1: フロントエンド保存処理の確認
**対象ファイル:**
- `frontend/src/pages/admin/StylistManagementPage.tsx`
- `frontend/src/services/api/stylists.ts`

**確認ポイント:**
1. フォームデータのbirthDate値の取得
2. API呼び出し時のリクエストボディ
3. 日付フォーマットの変換処理

### ステップ2: バックエンドAPI受信処理の確認
**対象ファイル:**
- `backend/src/features/users/controllers/user.controller.ts`
- `backend/src/features/users/validators/user.validator.ts`
- `backend/src/features/users/services/user.service.ts`

**確認ポイント:**
1. リクエストボディの受信内容
2. バリデーション結果
3. サービス層への値の受け渡し

### ステップ3: データベース保存処理の確認
**対象ファイル:**
- `backend/src/features/users/models/user.model.ts`
- `backend/src/features/users/services/user.service.ts`

**確認ポイント:**
1. MongoDBへの保存時のbirthDate値
2. Date型への変換処理
3. 実際のDB保存結果

### ステップ4: データ取得（FETCH）処理の確認
**対象ファイル:**
- `backend/src/features/users/controllers/user.controller.ts` (getUsers, getUserById)
- `frontend/src/pages/admin/StylistManagementPage.tsx` (fetchStylists)

**確認ポイント:**
1. APIレスポンスのbirthDate値
2. フロントエンドでの受信データ
3. 編集フォームへの値設定

## ログ設置計画
1. フロントエンド: フォーム送信時のデータ
2. バックエンド: API受信時のリクエストボディ
3. バックエンド: DB保存前後のデータ
4. バックエンド: APIレスポンスデータ
5. フロントエンド: 編集時の取得データ

## 推測される問題箇所
1. 日付フォーマットの不一致（文字列 vs Date型）
2. バリデーションエラーで保存されていない
3. レスポンスでbirthDateが含まれていない
4. フロントエンドの編集フォーム初期化の問題

## 特定された問題
1. **根本原因**: `StaffInviteRequest`型にbirthDateフィールドが含まれていなかった
   - 新規作成時: createStylistメソッドがStaffInviteRequest型のみを受け付けるため、birthDateが送信されない
   - 編集時: updateStylistメソッドはPartial<StylistDetail>を受け付けるため、birthDateが送信される

## 実施した修正
1. **型定義の更新**
   - frontend/src/types/index.ts: StaffInviteRequestにbirthDate、phone、positionを追加
   - backend/src/types/index.ts: 同様の更新

2. **フロントエンドの修正**
   - StylistManagementPage.tsx: 新規作成時に全てのフィールドを送信するよう修正
   - デバッグログを追加

3. **バックエンドの修正**
   - InviteTokenModel: birthDate、phone、positionフィールドを追加
   - user.service.ts: inviteUserメソッドで追加フィールドを保存
   - auth.service.ts: completeRegistrationで招待トークンから追加フィールドを反映
   - デバッグログを追加