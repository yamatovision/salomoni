# データ構造分析

## 現在の状況

### UserRole enum
```typescript
export enum UserRole {
  SUPER_ADMIN = 'superadmin',
  OWNER = 'owner',
  ADMIN = 'admin',
  STYLIST = 'stylist',
  USER = 'user',
  CLIENT = 'client',
}
```

### 問題点
1. **クライアント**:
   - 別テーブル（ClientModel）に保存されている
   - UserRoleにはCLIENTが定義されているが、実際のクライアントはUserModelには存在しない

2. **スタイリスト**:
   - UserModelに保存されている
   - roleは`USER`として保存されているが、enumには`STYLIST`が存在
   - コード内では「スタイリストはUSERロール」というコメントがある

3. **不整合**:
   - UserRole.STYLISTが定義されているのに使われていない
   - スタイリスト一覧の取得では`role: UserRole.USER`でフィルタリング
   - 相性計算では`role: 'stylist'`でフィルタリング

## 現在のデータ
- owner@salon.com: role = 'owner'
- admin@salon.com: role = 'admin' 
- stylist1@salon.com: role = 'stylist' (修正後)
- metav2icer@gmail.com: role = 'stylist' (修正後)

## 推奨される解決策

### オプション1: スタイリストは`user`ロールを使用（現在の設計に従う）
- roleを`user`に戻す
- ClientServiceのgetOrganizationStylistsで`role === 'user'`でフィルタ

### オプション2: スタイリストは`stylist`ロールを使用（enumに従う）
- 現在の`stylist`ロールを維持
- UserServiceのコードを修正して`UserRole.STYLIST`を使用
- ClientServiceも`role === 'stylist'`でフィルタ

### オプション3: roleとは別にuserTypeフィールドを追加
- roleは権限レベル（owner, admin, user）
- userTypeは職種（stylist, receptionist, etc）