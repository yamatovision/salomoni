# モックモード認証手順

## 現在の問題
実際のバックエンドのJWTトークンが残っているため、モックモードが正しく機能していません。

## 解決方法

### 方法1: ブラウザでトークンをクリア
1. ブラウザの開発者ツール（F12）を開く
2. Applicationタブ → Local Storage → http://localhost:5173
3. `accessToken`と`refreshToken`を削除
4. ページをリロード

### 方法2: コンソールでクリア
ブラウザのコンソールで以下を実行：
```javascript
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
location.reload();
```

## モックログイン情報

クリア後、以下のいずれかでログイン：

| ロール | メールアドレス | パスワード |
|--------|---------------|-----------|
| SuperAdmin | superadmin@salomoni.jp | superadmin123 |
| オーナー | owner@salon.com | owner123 |
| 管理者 | admin@salon.com | admin123 |
| スタイリスト | stylist1@salon.com | stylist123 |

## 注意事項
- モックモードでは`mock-token-`で始まるトークンのみが有効
- 実際のJWTトークンは自動的にクリアされます（次回のページロード時）