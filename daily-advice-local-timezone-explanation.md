# 「今日のアドバイス」ローカルタイムゾーン対応

## 実装内容

### 1. フロントエンドの変更
`frontend/src/services/api/fortune.ts`
```typescript
async getDailyAdvice(userId: string): Promise<DailyAdviceData> {
  // ユーザーのローカルタイムゾーンを取得
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const response = await apiClient.get<{ success: boolean; data: DailyAdviceData }>(
    API_PATHS.FORTUNE.DAILY_ADVICE(userId),
    { params: { timezone } }
  );
  return response.data.data;
}
```

### 2. バックエンドの変更

#### コントローラー
`backend/src/features/fortune/controllers/fortune.controller.ts`
- クエリパラメータから`timezone`を受け取る
- サービスに`timezone`を渡す

#### サービス
`backend/src/features/fortune/services/fortune.service.ts`
- `getDailyAdvice`メソッドに`timezone`パラメータを追加
- リポジトリに`timezone`を渡す

#### リポジトリ
`backend/src/features/fortune/repositories/fortune.repository.ts`
- `getLocalDateRange`メソッドを追加
- タイムゾーンが指定された場合は、そのタイムゾーンでの日付範囲を計算
- 指定されない場合は、従来通りJST（日本時間）を使用

### 3. 動作の流れ

1. **ユーザーがアクセス**
   - ブラウザが自動的にローカルタイムゾーンを検出
   - 例: 'America/New_York', 'Europe/London', 'Asia/Tokyo' など

2. **APIリクエスト**
   - タイムゾーン情報をクエリパラメータとして送信
   - `/api/fortune/users/{userId}/daily-advice?timezone=America/New_York`

3. **サーバー側処理**
   - 受け取ったタイムゾーンでその日の0:00:00〜23:59:59を計算
   - データベースから該当する日付範囲のデータを検索

4. **結果**
   - ユーザーのローカル時間での「今日」のアドバイスが表示される

## メリット

1. **グローバル対応**
   - 世界中のユーザーが自分の現地時間で「今日」のアドバイスを受け取れる

2. **柔軟性**
   - タイムゾーンが指定されない場合はJSTにフォールバック
   - 既存の日本ユーザーへの影響なし

3. **エラー処理**
   - 無効なタイムゾーンが指定された場合は自動的にJSTを使用

## 注意点

1. **データ保存**
   - データベースにはUTC時刻で保存される（MongoDBの標準）
   - クエリ時にタイムゾーンを考慮して範囲を計算

2. **パフォーマンス**
   - タイムゾーン計算は軽量な処理
   - キャッシュ機能により同じ日のアクセスは高速

3. **互換性**
   - 既存データとの完全な互換性を維持
   - タイムゾーンパラメータはオプショナル