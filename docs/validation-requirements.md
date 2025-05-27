# APIバリデーション要件一覧

このドキュメントは、バックエンドAPIの各エンドポイントで必要なバリデーション要件をまとめたものです。
フロントエンド開発時に参照してください。

## 認証関連 (auth)

### POST /api/auth/login
```typescript
{
  email: string,        // 必須、メールアドレス形式
  password: string,     // 必須、8文字以上
  method: 'email',      // 必須、固定値
  platform?: 'mobile' | 'web',
  rememberMe?: boolean
}
```

### POST /api/auth/line
```typescript
{
  token: string,        // 必須、LINE認証トークン
  method: 'line',       // 必須、固定値
  platform: 'mobile'    // 必須、固定値
}
```

### POST /api/auth/refresh
```typescript
{
  refreshToken: string  // 必須（またはCookieから取得）
}
```

## ビリング関連 (billing)

### POST /api/billing/charge-tokens
```typescript
{
  tokenPackage: {       // 必須（旧: packageId）
    packageId: string,
    amount: number,
    tokens: number
  }
}
```

### POST /api/billing/subscribe
```typescript
{
  planId: string        // 必須
}
```

## チャット関連 (chat)

### POST /api/chat/conversations
```typescript
{
  aiCharacterId: string,  // 必須
  context?: string        // 必須の場合あり（要確認）
}
```

### POST /api/chat/conversations/:conversationId/messages
```typescript
{
  content: string,        // 必須
  messageType?: 'text' | 'image' | 'voice'
}
```

## 予約関連 (appointments)

### POST /api/appointments
```typescript
{
  clientId: string,       // 必須
  stylistId: string,      // 必須
  scheduledAt: Date,      // 必須、ISO8601形式
  duration: number,       // 必須、分単位
  services: string[],     // 必須、サービスIDの配列
  notes?: string
}
```

### PUT /api/appointments/:id
```typescript
{
  scheduledAt?: Date,     // ISO8601形式
  duration?: number,      // 分単位
  services?: string[],
  notes?: string,
  status?: 'scheduled' | 'confirmed' | 'cancelled' | 'completed'
}
```

## クライアント関連 (clients)

### POST /api/clients
```typescript
{
  name: string,           // 必須、100文字以内
  phoneNumber: string,    // 必須、E.164形式
  email?: string,         // メールアドレス形式
  birthDate?: string,     // ISO8601形式
  notes?: string,         // 500文字以内
  visitCount?: number,    // 0以上の整数
  tags?: string[]         // 各タグ50文字以内
}
```

## サポート関連 (support)

### POST /api/support/tickets
```typescript
{
  title: string,          // 必須、200文字以内
  description: string,    // 必須、2000文字以内
  category?: 'technical' | 'billing' | 'feature_request' | 'other',
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}
```

### POST /api/support/tickets/:ticketId/reply
```typescript
{
  content: string         // 必須、2000文字以内
}
```

## ユーザー関連 (users)

### POST /api/users/invite
```typescript
{
  email: string,          // 必須、メールアドレス形式
  role: 'admin' | 'stylist',  // 必須
  expiresIn?: number      // 有効期限（時間）
}
```

### PUT /api/users/:id
```typescript
{
  name?: string,          // 100文字以内
  email?: string,         // メールアドレス形式
  phone?: string,         // 電話番号形式
  birthDate?: string,     // ISO8601形式
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
}
```

## 組織関連 (organizations)

### POST /api/auth/register-organization
```typescript
{
  organization: {
    name: string,         // 必須、100文字以内
    displayName: string,  // 必須、100文字以内
    email: string,        // 必須、メールアドレス形式
    phone: string,        // 必須、電話番号形式
    address: string       // 必須
  },
  owner: {
    name: string,         // 必須、100文字以内
    email: string,        // 必須、メールアドレス形式
    password: string,     // 必須、8文字以上、大文字・小文字・数字を含む
    phone?: string        // 電話番号形式
  }
}
```

## 注意事項

1. **日付フォーマット**: すべての日付はISO8601形式（例: "2025-05-26T08:00:00Z"）
2. **電話番号**: 日本の電話番号形式またはE.164形式
3. **文字数制限**: 各フィールドの最大文字数を超えないよう注意
4. **enum値**: 指定された値以外は受け付けられません
5. **オプショナルフィールド**: ?マークがついていないフィールドは必須です