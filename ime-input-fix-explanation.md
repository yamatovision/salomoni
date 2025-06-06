# チャット画面の日本語入力（IME）問題の修正

## 問題の概要
日本語入力時に、変換確定のEnterキーがメッセージ送信として処理されてしまう問題がありました。

### 具体的な症状
1. 「あいう」と入力して変換候補が出ている状態でEnterを押す
2. 変換確定と同時にメッセージが送信される
3. 入力欄に「あいう」が残り、再度Enterを押すと重複送信される

## 原因
IME（Input Method Editor）の動作を考慮していなかったため、以下の2つのEnterキーを区別できていませんでした：
- **変換確定のEnter**: 日本語変換を確定するため
- **送信のEnter**: メッセージを送信するため

## 修正内容

### 1. Composition イベントの活用
```typescript
// 新しい状態を追加
const [isComposing, setIsComposing] = useState(false);

// TextFieldに以下のイベントハンドラを追加
onCompositionStart={() => setIsComposing(true)}
onCompositionEnd={() => setIsComposing(false)}
```

### 2. Enter キーハンドリングの改善
```typescript
onKeyDown={(e) => {
  // 日本語入力中（IME変換中）はEnterキーで送信しない
  if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
    e.preventDefault();
    handleSendMessage();
  }
}}
```

## 技術的な詳細

### Composition イベントとは
- `compositionstart`: IMEによる文字入力が開始された時に発火
- `compositionend`: IMEによる文字入力が終了（確定）した時に発火
- `compositionupdate`: IMEによる文字入力中に発火

### 動作フロー
1. ユーザーが日本語を入力開始 → `compositionstart`イベント発火 → `isComposing = true`
2. 変換候補選択中にEnterキー → `isComposing = true`のため送信されない
3. 変換確定 → `compositionend`イベント発火 → `isComposing = false`
4. 次のEnterキー → `isComposing = false`のため送信される

## メリット
1. **自然な日本語入力体験**: 変換確定と送信が明確に区別される
2. **重複送信の防止**: 入力欄の内容が意図せず送信されない
3. **他の言語への対応**: 中国語、韓国語など他のIMEを使用する言語でも同様に動作

## 注意点
- Shift+Enterでの改行は引き続き機能する
- 英語など直接入力の場合は従来通りEnterで即座に送信される