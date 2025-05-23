# Salomoni（サロモニ） × Iroha 統合要件定義書

**バージョン**: 3.2.0  
**最終更新日**: 2025-05-23  
**ステータス**: ドラフト  

## 1. プロジェクト概要

### 1.1 目的と背景

本プロジェクトは、美容業界に従事するスタイリストとサロンオーナーの双方を支援する統合アプリケーションです。個人向けメンタルサポートアプリ「Salomoni」と、四柱推命を活用した業務支援システム「Iroha」の機能を統合し、AIと東洋思想をベースにしたスタイリスト体験と業務効率化を提供します。

**スタイリストには**、AIとの感情的なつながりを育む「AIパートナー」と、顧客ごとの最適提案サポートを提供

**サロンオーナーには**、業務・スタッフ・顧客・予約・占術データを統合管理するダッシュボードを提供

四柱推命の占い要素を持ちながらも、専門用語を一切使わず日常言語に変換することで、App Storeの審査基準に適合したプロフェッショナル向けモチベーション管理ツールとして構築されています。

### 1.2 ターゲットユーザー

| ロール | 主なユーザー像 | 使用目的 |
|--------|---------------|----------|
| **SuperAdmin** | サービス提供会社スタッフ | 組織・課金・利用状況監視 |
| **Owner（オーナー）** | サロンオーナー・経営者 | 組織管理、契約、スタッフ分析 |
| **Admin（管理者）** | 店長・マネージャー | スタイリスト・予約・顧客管理 |
| **User（スタイリスト）** | 現役美容師（個人経営含む） | AI相談、顧客準備、提案強化、モチベーション維持 |
| **Client（顧客）** | 美容室の来店客 | 美容体験の向上（AIによる提案や雑談） |

**導入決定者**: サロンオーナー（個人経営含む）  
**実際の利用者**: スタイリスト  
**年齢層**: 20-30代中心、女性が多数  
**キャリア段階**: 業界経験3-5年程度でモチベーション低下や将来への不安を感じる層  

### 1.3 核となる機能と価値

以下は、プロジェクトの本質的価値を提供するために「絶対に必要」な機能です。

- **ラポール構築型AIチャット**: ユーザーとの初回会話でAIキャラクターの名前を一緒に決め、会話を通じてユーザーの好みに応じてAIの口調・性格が自然に変化する。占い要素と感情的サポートを統合した「パートナー」のような存在を実現。*この機能がないとユーザーとの深い関係性構築が不可能になる*

- **四柱推命ベース日次アドバイス**: 生年月日から算出した四柱推命を、専門用語を一切使わずスタイリスト向けの日常語に変換。「今日のアドバイス」「仕事運」「相性スタイリスト」「ラッキースタイリング」などを提供。*この機能がないとユーザーの日常に変化や気づきを与えるきっかけが不足する*

- **クライアント専用AIキャラクター**: 各クライアントに専用のAIキャラクターを作成し、来店時の対話体験を提供。クライアントの四柱推命に基づいたパーソナライズされた会話で再来店動機を向上。*この機能がないと差別化された顧客体験を提供できない*

- **組織レベルでの統合管理**: スタイリスト・クライアント・予約・四柱推命データを統合管理し、相性マッチング・離職予兆検知・業務最適化を実現。*この機能がないとサロン全体での価値創造ができない*

## 2. アプリ構成

### 2.1 モバイルアプリ（スタイリスト向け）
- AIパートナーとの感情的ラポール
- 自身の日運の表示
- クライアント情報の管理と占術提案
- クライアント別AIチャットによる提案支援

### 2.2 管理サイト（Owner/Admin向け）
- スタイリスト・顧客・予約・データ連携管理
- クライアントとの相性・履歴・スタイル提案ログ閲覧
- 離職予兆のアラート通知

### 2.3 SuperAdminサイト
- 組織の登録・管理
- 課金・トークン使用量の分析
- サポート対応管理

## 3. 主要機能一覧

### 3.1 スタイリスト（User）向け
- **AIパートナー名決定・性格調整**
- **四柱推命ベースの「今日のアドバイス」表示**
- **来店予定顧客の誕生日入力と命式取得**
- **顧客別チャットAI**（例：お客様にセクシー口調のAIが占い提案）
- **会話履歴管理**（顧客ごと）
- **四柱推命データの活用による相談機能**

### 3.2 サロン管理者（Owner/Admin）向け
- **組織・スタイリスト登録/編集/削除**
- **クライアント管理**（命式・五行・履歴）
- **クライアントとスタイリストの相性マッチング**
- **スケジュール＆予約管理**（Google/iCloud連携）
- **離職予兆アラート**（AI分析）
- **スタイリストのAI会話ログのレポート生成機能**
  - 面談時や任意のタイミングで、選択期間内の会話履歴をAIが要約・抽出し、プライバシーに配慮したレポート形式（例：キーワード傾向・感情推移グラフ・ネガティブ表現の頻度など）で自動生成
  - 管理画面には常時「📝 レポートを作成」ボタンを表示し、どのタイミングでも任意にレポート作成が可能
  - AIにより「この人はレポートを作成した方がよい状態」と判断された場合には、管理者に通知とレポート作成の推奨アラートが表示される
  - 個人を直接特定できるような詳細な内容は伏せた状態で提示され、必要に応じて段階的に掘り下げ可能（開示レベル管理）
  - スタイリストには事後共有され、対話的なフィードバックに活用される
- **危機検知アラート**（プライバシー配慮型）
  - ネガティブ傾向が継続した場合に自動アラート
  - アラート発報は事前に明示されたプライバシーポリシーに基づき、管理者に通知
  - 通知内容は「注意信号」レベルにとどめ、具体的な会話内容はレポート化時まで表示されない（段階的開示）

### 3.3 SuperAdmin向け
- **組織（サロン）の新規登録・ステータス管理**
- **プラン・課金・APIトークン上限設定**
- **サポートチケット対応**
- **トークン使用量と収益シミュレーション**

### 3.4 クライアント（Client）向け
- **顧客専用のAIチャット**（名前付きキャラ）で施術中に対話体験を提供
- **四柱推命に基づいた本日の美容アドバイス**（例：「今日は発信力が高まる日。明るめカラーが◎」）
- **提案履歴と会話ログを活用した継続的な接客体験**
- **顧客による再来意欲向上**（「あのAIと話すためにまた来たい」）
- **将来的には顧客マイページ**（カルテ参照・会話履歴閲覧）の導入検討
- **顧客専用AIの性格スタイル**は、四柱推命上の傾向（五行の偏り・日柱の性質）およびオンボーディングで取得する好み・反応から推論され、自動的にスタイルが初期設定される
  - 例：木旺の自由人タイプ × 柔らかい好み → `SOFT`
  - 火旺の発信好きタイプ × 明るい口調好み → `CHEERFUL`
- **スタイリストや顧客の操作によって、AIの話し方を手動カスタマイズすることも可能**（「もう少しやさしい感じにして」など）

## 4. 四柱推命データの取得とAI相談活用

クライアントや同僚スタイリストに関するAI相談を実現するため、以下の方法で四柱推命データを活用：

### 4.1 データ取得
- **クライアント**: 来店時や予約時に生年月日・性別を簡易入力（モバイルアプリまたはiPad）
- **スタイリスト**: アカウント作成時に生年月日・性別を登録
- これらの情報をもとに命式・五行データを自動生成（バックエンドAPIで即時計算）

### 4.2 AIチャットへの適用
- **チャット起動時、コンテキスト選択（自分／他者）UIは廃止し、チャット入力の文脈から自動抽出**
- **AIがチャット内容を解析**し、「Bさんって最近どうなんだろう？」のような文から自動的に該当人物の命式を取得
- **該当人物の命式・相性・五行データ**は、チャット中に都度バックエンドAPIから取得され、必要に応じて短期キャッシュに保持される設計とし、AIのコンテキストサイズの制約やスケーラビリティ問題に対応
- **該当人物が複数いる場合**は、AIが候補を提示し「スタイリストB（1988年5月）ですか？それともクライアントB（1995年2月）ですか？」のように選択を促す
- **表示方法**はAIの返答の中に自然な形で含める（例：「Bさんは水多めの命式なので、冷静さが目立ちますね」）
- **明示的な命式情報を見たい場合**：「Bさんの命式を表示して」と入力すればサイドパネルやポップアップ形式で表示

### 4.3 UIの動線設計
- **チャット画面上部に「相談対象切替」セレクターを常時表示**
  - プルダウン形式で「自分／クライアント一覧／スタイリスト一覧」から選択可能
  - 選択すると、その人物の命式・五行データがAIのシステムプロンプトに自動的に反映
- **対象変更時**にはチャット冒頭に「○○さんに関する相談モードに切り替えました」と表示
- **命式情報**はチャット横の「プロフィールパネル」などで確認可能
  - 日柱、五行バランス、キーワードなどをアイコンや色で視覚的に表示
- **将来的に**：「頻繁に相談する人物」タグや、お気に入り登録機能を追加検討

### 4.4 活用パターン例
- 「明日、木旺のクライアントCさんが来る予定。発信力が強すぎると疲れるのでどう接するべき？」
- 「水金タイプのBスタイリストと最近ぶつかる。私との五行相性を見て改善策を教えて」

## 4.5 高度な四柱推命相性診断機能

### 4.5.1 相性診断の評価要素

本システムでは、五行相生相克だけでなく、以下の要素を複合的に評価する高度な相性診断を提供：

#### 陰陽バランス評価（20%）
- **陽の気の天干**: 甲、丙、戊、庚、壬
- **陰の気の天干**: 乙、丁、己、辛、癸
- 陰陽が異なる場合：100点（最高の相補関係）
- 陰陽が同じ場合：50点（中間的な関係）

#### 身強弱バランス評価（20%）
- **身強**: 命式に自らの五行が多く、エネルギーが外向きの人
- **身弱**: 命式に自らの五行が少なく、エネルギーが内向きの人
- 身強弱が異なる場合：100点（理想的な補完関係）
- 身強弱が同じ場合：70点（穏やかだが刺激に欠ける関係）

#### 日支関係評価（25%）
- **三合会局**（100点）: 最も強い結びつき。火局（寅午戌）、木局（亥卯未）、水局（申子辰）、金局（巳酉丑）
- **支合**（85点）: 安定した調和関係。子丑、寅亥、卯戌、辰酉、巳申、午未の組み合わせ
- **支沖**（60点）: 刺激的だが緊張感のある関係。子午、丑未、寅申、卯酉、辰戌、巳亥の対立
- **通常**（50点）: 特別な関係性なし

#### 用神・喜神評価（20%）
- **用神**: 自分の日干から生まれる五行（相手が持つと良い要素）
- **喜神**: 自分の日干を克する五行（相手が持つと成長を促す要素）
- 相手の四柱に含まれる用神・喜神の数に基づいてスコア計算

#### 日干干合評価（15%）
- **干合あり**（100点）: 甲乙、丙丁、戊己、庚辛、壬癸の組み合わせによる強い結びつき
- **干合なし**（50点）: 通常の関係

### 4.5.2 総合相性スコアと関係性タイプ

上記5要素の重み付け計算により0-100点の総合スコアを算出し、以下の関係性タイプに分類：

#### 理想的パートナー（90点以上）
- 日干干合あり、三合会局、陰陽バランス良好
- ビジネスでも私生活でも最高の相性

#### 良好な協力関係（80-89点）
- 用神・喜神が豊富、身強弱バランス良好
- お互いの成長を促進する建設的な関係

#### 安定した関係（70-79点）
- 支合あり、陰陽バランス良好
- 衝突が少なく長期的に安定した関係

#### 刺激的な関係（60-69点）
- 支沖あり、用神・喜神がある程度存在
- 時に衝突するが、それが成長の糧となる関係

#### 要注意の関係（60点未満）
- 陰陽・身強弱・用神すべてのバランスが悪い
- 意識的な努力と相互理解が必要な関係

### 4.5.3 相性診断の活用場面

#### スタイリスト-クライアント間
- 担当割り当ての最適化
- 接客アプローチの個別化
- 長期的な信頼関係構築のサポート

#### スタイリスト間（チーム内）
- ペア作業の最適化
- メンター・メンティー関係の推奨
- チーム編成の参考データ

#### 管理者向け分析
- 離職リスクの早期発見（相性の悪い上司部下関係）
- チーム全体の相性バランス可視化
- 新規採用時の配属先検討

## 5. 画面一覧

このアプリケーションは複数のアプリケーションと多数のページで構成され、各ページには複数の画面要素が含まれます。

### 5.1 画面要素一覧

| 画面要素名 | 目的 | 実現する核心的価値 |
|----------|------|-----------------|
| スプラッシュ要素 | アプリロゴ表示（約1.5秒） | ブランド認知・世界観構築 |
| オンボーディング要素 | 3画面スライドでのアプリ説明 | ユーザー理解促進・期待値設定 |
| ログイン要素 | AppleID/LINE/メール認証 | セキュリティ確保・アクセス管理 |
| 初回設定要素 | 生年月日・性別・ニックネーム登録 | パーソナライゼーション基盤構築 |
| AIチャット要素 | メッセージ送受信・AIキャラ設定 | 日常的コミュニケーション・関係性構築 |
| 今日のアドバイス要素 | 占いアドバイス表示 | モチベーション向上・新たな視点提供 |
| 相性スタイリスト要素 | チームメンバー相性表示 | チーム内コミュニケーション促進 |
| クライアント管理要素 | 顧客情報・命式データ管理 | 業務効率化・提案精度向上 |
| 予約管理要素 | スケジュール・担当者管理 | 業務最適化・相性マッチング |
| 組織管理要素 | サロン・スタッフ管理 | 組織運営・権限管理 |
| 離職予兆要素 | AI分析・アラート表示 | スタッフ定着・早期対応 |
| プロフィール管理要素 | ユーザー情報確認・編集 | アカウント管理・設定調整 |
| 履歴管理要素 | 過去の会話・アドバイス閲覧 | 振り返り・お気に入り管理 |
| 通知設定要素 | 通知ON/OFF・時間設定 | ユーザー体験個別化 |
| テーマ設定要素 | 色・フォント設定 | UI個別化・視覚的快適性 |

### 5.2 ページ構成計画

#### 5.2.1 モバイルアプリ（スタイリスト向け）

**共通ページ**

| ID | ページ名 | 主な目的 | 含まれる画面要素 | 優先度 | モックアップ | 実装状況 |
|----|---------|---------|----------------|-------|------------|----------|
| P-001 | スプラッシュページ | アプリ起動時のブランド表示 | スプラッシュ要素 | 高 | splash-page.html | 完了 |
| P-002 | オンボーディングページ | アプリ説明・世界観紹介 | オンボーディング要素 | 高 | onboarding.html | 完了 |
| P-003 | ログインページ | ユーザー認証 | ログイン要素 | 高 | login.html | 完了 |
| P-004 | 初回設定ページ | ユーザー基本情報登録 | 初回設定要素 | 高 | initial-setup.html | 完了 |

**メイン機能ページ**

| ID | ページ名 | 主な目的 | 含まれる画面要素 | 優先度 | モックアップ | 実装状況 |
|----|---------|---------|----------------|-------|------------|----------|
| M-001 | AIチャット相談ページ | AIとの対話・相談・キャラ構築 | AIチャット要素 | 高 | chat-interface.html | 完了 |
| M-002 | 今日のアドバイスページ | デイリー占い・アドバイス表示 | 今日のアドバイス要素、相性スタイリスト要素 | 高 | fortune-display.html | 完了 |
| M-003 | 管理画面ページ | プロフィール・設定・履歴管理 | プロフィール管理要素、履歴管理要素、通知設定要素、テーマ設定要素 | 中 | admin-dashboard.html | 完了 |
| M-004 | 本日の施術クライアント一覧 | その日担当する予定のクライアント一覧 | クライアント一覧、相性表示、詳細展開 | 高 | beauty-daily-clients.html | 完了 |
| M-005 | クライアント直接入力・結果表示 | 当日来店したクライアント向け入力・結果表示 | 生年月日入力、命式計算、提案表示 | 高 | beauty-client-input.html | 完了 |
| M-006 | クライアント専用チャット | 特定クライアントの四柱推命情報に基づいたチャット | クライアント専用AIチャット要素 | 高 | chat-interface.html | 完了 |

#### 5.2.2 管理サイト（Owner/Admin向け）

| ID | ページ名 | 主な目的 | 含まれる画面要素 | 優先度 | モックアップ | 実装状況 |
|----|---------|---------|----------------|-------|------------|----------|
| A-001 | 管理者ダッシュボード | サロン全体の概要表示 | 統計表示、未担当予約、トークン使用状況 | 高 | beauty-admin-dashboard.html | 完了 |
| A-002 | クライアント管理 | クライアント情報の一括管理 | 顧客一覧、命式情報、相性診断 | 高 | beauty-client-management.html | 完了 |
| A-003 | スタイリスト管理 | スタイリスト情報の管理 | スタッフ一覧、権限設定、離職予兆アラート | 高 | beauty-stylist-management.html | 完了 |
| A-004 | 予約・担当管理 | クライアントベースの予約と担当管理 | 日別予約一覧、相性マッチング、ドラッグ&ドロップ | 高 | beauty-appointment-management.html | 完了 |
| A-005 | データインポート | 外部データの取り込み | カレンダー連携、CSVインポート | 中 | beauty-data-import.html | 完了 |
| A-006 | サポート管理 | サポートチケットの作成・管理 | チケット一覧、新規作成、会話履歴 | 中 | beauty-admin-support.html | 完了 |
| A-007 | 請求・支払い管理 | 組織の請求書確認・プラン管理（Owner専用） | プラン表示、トークン使用状況、チャージ購入 | 中 | beauty-admin-billing.html | 完了 |

#### 5.2.3 SuperAdminサイト

| ID | ページ名 | 主な目的 | 含まれる画面要素 | 優先度 | モックアップ | 実装状況 |
|----|---------|---------|----------------|-------|------------|----------|
| S-001 | 組織管理画面 | 組織（サロン）の管理 | 組織一覧、統計情報、新規登録、編集モーダル | 高 | beauty-superadmin-organizations.html | 完了 |
| S-002 | 課金・プラン管理画面 | プラン設定・収益シミュレーション | 収益分析、プラン設定、請求管理 | 高 | beauty-superadmin-plans.html | 完了 |
| S-003 | サポートチケット管理画面 | サポート依頼の管理 | チケット一覧、返信機能、統計 | 中 | beauty-superadmin-support-simple.html | 完了 |

### 5.3 画面フロー

#### 5.3.1 初回起動フロー（モバイルアプリ）
```
[スプラッシュページ] → [オンボーディングページ(3枚)] → [ログインページ] → [初回設定ページ] → [AIチャット相談ページ（初回限定会話フロー）]
```

#### 5.3.2 日常利用フロー（モバイルアプリ）
```
[ログインページ] → [AIチャット相談ページ] ⇄ [今日のアドバイスページ] ⇄ [本日の施術クライアント一覧] ⇄ [管理画面ページ]
```

#### 5.3.3 ボトムナビゲーション（モバイルアプリ）
```
チャット相談 ⇄ 今日のアドバイス ⇄ 今日のお客様 ⇄ 管理画面
```

#### 5.3.4 管理サイトナビゲーション
```
ダッシュボード ⇄ クライアント管理 ⇄ スタイリスト管理 ⇄ 予約管理 ⇄ データ連携 ⇄ サポート ⇄ 請求・プラン
```

## 6. 技術的補足：AIキャラクター管理・会話履歴・メモリ更新機能の設計

### 6.1 AIキャラクターの構造設計
- **AIキャラクターの性格はテンプレート形式で管理**（例：SOFT / COOL / CHEERFUL / MYSTERIOUS などの性格タグ）
- **クライアントやスタイリストの命式や好みに応じて、初期テンプレートを割り当て**
- **名前や性格のカスタマイズは変数置換によってプロンプトに反映**されるため、キャラクターの数自体はスケーラブルに保持可能
- **実体としてのAIキャラクターは都度プロンプトで動的に生成**し、保存が必要な情報は「名前」「性格タグ」「初期化プロンプトID」の3点のみ

### 6.2 会話履歴とメモリ更新機能の扱い
- **クライアントごとのチャット履歴は全保存。ただし、AIチャット生成時に使用する履歴は直近15往復のみに限定**（コンテキスト制限対応）
- **会話履歴の全文表示・検索は管理画面またはマイページで提供**し、ユーザーは過去の会話をいつでも参照可能
- **会話からの知見**（例：「よく使われるキーワード」「気分の変動傾向」）はメタ情報として別テーブルに保持し、AIの応答精度向上に活用
- **スタイリストやクライアントが「この内容をAIに覚えておいて」と明示的に指示した場合**、その内容は長期メモリに要約形式で保存され、次回以降のプロンプトに反映
- **メモリ更新が行われた場合は「🧠 メモリを更新しました：○○のことを覚えました」などの通知をチャット内に表示**し、透明性と信頼性を確保
- **長期メモリの表示・削除・編集機能をマイページで提供予定**（ユーザー主権型の記憶管理）

### 6.3 自動メモリ最適化と個別応答の強化
- **スタイリストやクライアントとの会話履歴から、AIが重要と思われる情報を自動抽出し、要約された形で長期メモリに保存**
- **ユーザーからの明示的な「覚えておいて」操作がなくても、AIが会話内容を継続的に学習し、次回以降の応答に反映**
- **例**: 「私はスタッフ育成に課題がある」と話した後、次回「スタッフ関連の悩みですね」と自動的に応答文に盛り込まれる
- **メモリは定期的にAIによって整理・最適化**され、口調、話題の出し方、表現方法にも反映される（例：「この方は柔らかめな口調を好む」など）
- **ユーザーに通知される例**: 「🧠 メモリが更新されました：あなたはスタッフ育成に関心があると記録しました」
- **メモリ内容はマイページから確認・修正・削除が可能**（ユーザー主権型）

## 7. ビジネスモデルと課金設計

### 7.1 サブスクリプションプラン（組織単位）

**スタンダードプラン**：月額 9,800円（税込）
- スタイリスト数：最大3名
- クライアント数：300名まで
- APIトークン：月間2,000回（200万トークン）
- カレンダー連携：基本機能のみ
- データエクスポート：週1回

**プロフェッショナルプラン**：月額 18,000円（税込）
- スタイリスト数：最大10名
- クライアント数：無制限
- APIトークン：月間5,000回（500万トークン）
- カレンダー連携：利用可能
- データエクスポート：毎日

**エンタープライズプラン**：月額 36,000円（税込）
- スタイリスト数：無制限
- クライアント数：無制限
- APIトークン：無制限
- カレンダー連携：高度な機能
- データエクスポート：リアルタイム
- 優先サポート
- カスタマイズ機能

**年間プラン割引**：年間一括払いで16%割引適用

### 7.2 トークン追加チャージ
上限超過時はチャージ制で柔軟対応：
- **1,000,000トークン**：980円（税込）
- **10,000,000トークン**：8,000円（税込）
- 購入トークンは当月内のみ有効（繰越不可）

### 7.3 原価・収益設計（概略）
**GPT-4o利用前提**：
- 原価想定：$5/100万トークン（為替によって変動）
- 1顧客あたり想定使用量：1万〜3万トークン/月

**収益モデル**：
- 利用上限を定めつつ、上位プランで利益確保
- チャージ制によってAPI原価変動にも対応可能

### 7.4 ユニバペイ決済システム統合

#### 7.4.1 決済機能概要

本システムでは、ユニバペイ（Univapay）決済サービスを統合し、以下の決済機能を提供：

- **サブスクリプション管理**: 月額・年額プランの自動課金
- **トークンチャージ決済**: ワンタイム決済でのトークン購入
- **3Dセキュア対応**: セキュアな決済環境の提供
- **複数カード管理**: 組織ごとの支払い方法管理

#### 7.4.2 トランザクショントークン管理

**カード情報の安全な処理**:
- カード情報は直接保存せず、ユニバペイのトークン化を使用
- PCI DSS準拠のセキュアな決済環境
- トークンの有効期限管理と自動更新

**トークンタイプ**:
- `one_time`: 単発のトークンチャージ用
- `subscription`: 月額プラン自動課金用
- `recurring`: 将来の追加課金用（保存カード）

#### 7.4.3 サブスクリプション課金フロー

1. **初回登録時**:
   - カード情報入力 → トランザクショントークン生成
   - サブスクリプション作成（初回課金含む）
   - 次回課金日の自動設定

2. **月次自動課金**:
   - 毎月1日に自動課金実行
   - 課金失敗時の自動リトライ（3回まで）
   - 失敗通知とサービス一時停止処理

3. **プラン変更時**:
   - 日割り計算による差額調整
   - 即時適用または次回課金時適用の選択
   - アップグレード時は即時課金、ダウングレード時は次回適用

#### 7.4.4 支払い状態管理

**課金ステータス**:
- `pending`: 課金処理中
- `authorized`: 承認済み（キャプチャ前）
- `completed`: 課金完了
- `failed`: 課金失敗
- `canceled`: キャンセル済み
- `refunded`: 返金済み
- `partially_refunded`: 部分返金済み

**自動処理**:
- 課金失敗時の段階的なサービス制限
- 支払い催促通知の自動送信
- 長期未払い時のアカウント凍結

#### 7.4.5 返金・キャンセルポリシー

**返金対応**:
- プラン変更時の日割り返金
- サービス不具合による返金
- 初回7日間の返金保証（条件付き）

**キャンセル処理**:
- 即時キャンセル（残期間のサービス提供）
- 期間満了時キャンセル
- データ保持期間：キャンセル後30日間

#### 7.4.6 Webhook連携

**リアルタイム通知**:
- 課金成功・失敗の即時通知
- サブスクリプション状態変更通知
- 返金・キャンセル処理通知

**セキュリティ**:
- Webhook署名検証による改ざん防止
- IPアドレス制限
- リトライ機能（最大5回）

#### 7.4.7 テスト環境

**テストカード番号**:
- `4000020000000000`: 正常処理
- `4111111111111111`: 課金失敗
- `4242424242424242`: 課金成功、返金失敗
- `4012888888881881`: 課金成功、取り消し失敗

**テストモード切り替え**:
- 環境変数による本番/テスト切り替え
- テスト決済の自動識別とログ記録

## 8. ROI（投資対効果）の検証と効果測定

高度なAI活用による運用コストに対して、導入効果を定量的に可視化し、継続的な改善と収益性の確保を目指す。

### 8.1 測定指標
- **スタイリスト離職率の変化**: 導入前後での在籍期間平均比較、離職率の推移グラフ
- **顧客リピート率の変化**: 顧客ごとの来店頻度、AI接客導入前後での比較
- **提案単価の上昇**: AI提案を通じた高単価メニューの導入増加傾向
- **顧客満足度（CS）スコア**: AI提案や占術体験に対するアンケート/レビュー収集

### 8.2 可視化とレポート化
- **管理者ダッシュボードにて、各KPIの推移をグラフ形式で可視化**
- **月次レポートや四半期単位での「AI導入効果サマリ」を自動生成**（PDF/CSV出力）
- **定性的な声**（顧客・スタッフの感想）も管理画面上で収集し、数値以外の定性評価にも反映

### 8.3 導入初期のベンチマーク設計
- **初期導入時に「現状ベースラインデータ」を記録**し、半年後の差分をモニタリング
- **AI提案数／AIとの会話回数など、利用率そのものもKPIとして記録**

## 9. 今後の構想（フェーズ分け）

### フェーズ1（MVP）
**モバイルアプリ（Salomoni機能）**
- AIパートナー・日運・感情サポート

**組織・スタイリスト管理（Iroha構造）**
- 基本的な組織管理とスタイリスト登録

### フェーズ2
- **クライアント管理・施術予定表示**
- **クライアント別AI提案機能**
- **離職予兆通知・予約管理・チャット履歴連携**

### フェーズ3
- **クライアント向けパーソナルAI**（来店中に対話）
- **顧客による再来動機づけとしてのAI活用**（ファン化）
- **クライアントマイページでのAI履歴参照機能**

## 10. ブランドカラーとUIガイドライン

### 10.1 ブランドカラー定義

| カラー名 | HEXコード | 用途例 |
|---------|----------|--------|
| **メインピンク** | `#F26A8D` | ロゴ・アクセントカラー・ボタン背景 |
| **ソフトグリーン** | `#D1EAE2` | 補助背景・カード・安心感演出 |
| **ラベンダーグレー** | `#C4C3D5` | UIの背景・余白・ニュートラルゾーン |
| **ブラック** | `#222222` | タイトルテキスト・ロゴ・強調見出し |

### 10.2 UI設計原則
- **親しみやすいデザイン**: 柔らかい色調と親しみやすいビジュアル要素
- **シンプルさ**: 機能が豊富でも見た目はシンプルに保つ
- **レスポンシブ**: iOS最適化設計（モバイルアプリ）、デスクトップ最適化（管理サイト）
- **アクセシビリティ**: フォントサイズ変更・色覚対応

### 10.3 統合思想と運用方針
- **UI/UXはSalomoniベース**（ピンクトーン・親しみやすいキャラデザイン）
- **感情と占いを扱うパートはやさしく、ビジネス系画面は明快で統制的**
- **データベース構造（概要）**: 組織 → スタイリスト → クライアント → チャット履歴・命式データ
- **個人のAIパートナーと、顧客ごとの提案チャット履歴は完全分離**

## 11. AIキャラクター仕様

### 11.1 スタイルタグ定義

| タグ名 | 会話特徴 | トーン調整例 |
|--------|----------|-------------|
| `FLIRTY`（甘え・恋愛系） | ハート、語尾伸ばし、軽いタッチ | 「今日もかわいいね」「ねぇ」 |
| `COOL`（冷静・大人系） | 短文、論理的、句点多用 | 「理解した」「なるほど、了解です」 |
| `CHEERFUL`（明るい・フレンドリー） | 絵文字多用、テンション高 | 「やった〜！」「いいじゃん♡」 |
| `SOFT`（やさしい・癒し系） | 丁寧表現、感謝多用 | 「大丈夫だよ」「そばにいるね」 |
| `CARING`（甘えさせ系） | 心配・共感・やさしい呼びかけ | 「疲れた？」「ぎゅーしてあげたい」 |
| `ONEESAN`（姉御・甘えられ系） | 年上好き示唆、ちょい色気 | 「こっちおいで♡」 |
| `MYSTERIOUS`（謎めいた系） | セクシー口調、占い的表現 | 「運命が見えるわ」「あなたの深層を感じるの」 |

### 11.2 性格変化ロジック
- ユーザーの文体・絵文字・反応パターンを解析
- 複数タグを同時保持し、会話に応じて重み調整
- 連続スコア一定値超過時にのみ反映（自然な変化）

## 12. 共通コンポーネント

| ID | コンポーネント名 | 用途 | 使用ページ | 参照 |
|----|----------------|------|-----------|------|
| C-001 | AIメッセージバブル | AI発言表示 | M-001, M-006 | メインピンクベース |
| C-002 | ユーザーメッセージバブル | ユーザー発言表示 | M-001, M-006 | 白ベース |
| C-003 | アドバイスカード | 運勢情報表示 | M-002 | ソフトグリーン背景 |
| C-004 | 設定カード | 管理画面各種設定 | M-003 | ラベンダーグレー背景 |
| C-005 | ボトムナビゲーション | ページ間遷移 | 全メインページ | メインピンクアクセント |
| C-006 | クライアントカード | 顧客情報表示 | M-004, A-002 | 命式情報統合表示 |
| C-007 | 相性インジケーター | 相性スコア表示 | M-004, A-004 | 五行カラー対応 |
| C-008 | 組織管理カード | サロン情報表示 | S-001 | ビジネス系デザイン |

## 13. データモデル概要

### 13.1 主要エンティティ

| エンティティ | 主な属性 | 関連エンティティ | 備考 |
|------------|----------|-----------------|------|
| Organization | id, name, plan, status, billing | Owner, Admin, User | 組織（サロン）基本情報 |
| User | id, nickname, birthdate, gender, role, orgId | AICharacter, Messages, FortuneData | ユーザー基本情報（4階層ロール） |
| Client | id, name, birthdate, gender, orgId, fortuneData | Messages, Appointments, ClientAICharacter | クライアント基本情報 |
| AICharacter | userId/clientId, name, styleFlags, personalityScore | User, Client, Messages | AI個性設定 |
| Messages | id, userId/clientId, content, type, timestamp, aiResponse | User, Client, AICharacter | チャット履歴 |
| FortuneData | userId/clientId, date, overallLuck, workLuck, luckyItems | User, Client | 日次運勢データ |
| Appointments | id, clientId, userId, datetime, status, orgId | Client, User | 予約情報 |
| TokenUsage | orgId, userId, tokens, endpoint, timestamp, cost | Organization, User | API使用量管理 |
| ClientAICharacter | id, clientId, aiName, styleFlags, personalityScore, createdAt | Client, ClientChatHistory | クライアント専用AI設定 |
| ClientAIMemory | id, clientId, memoryType, content, category, confidence | Client, ClientAICharacter | AI記憶データ |
| ClientChatHistory | id, clientId, sessionId, messages, context, memoryUpdates | Client, ClientAICharacter | クライアント専用チャット履歴 |
| ClientOnboardingStatus | clientId, hasCompletedOnboarding, preferredStyle | Client | オンボーディング完了状態 |
| Compatibility | id, user1Id, user2Id, totalScore, relationshipType, details | User, Client | 相性診断結果 |
| BillingAccount | id, orgId, stripeCustomerId, univerpayCustomerId, defaultPaymentMethod | Organization | 課金アカウント管理 |
| Subscription | id, orgId, planId, status, currentPeriodEnd, univerpaySubscriptionId | Organization, BillingAccount | サブスクリプション情報 |
| PaymentMethod | id, orgId, type, last4, expiryDate, isDefault, univerpayTokenId | Organization, BillingAccount | 支払い方法 |
| Invoice | id, orgId, amount, status, dueDate, univerpayChargeId | Organization, Subscription | 請求書情報 |
| TokenPurchase | id, orgId, amount, tokens, status, univerpayChargeId | Organization | トークン追加購入履歴 |

### 13.2 四柱推命データモデル

#### 13.2.1 基本エンティティ

| エンティティ | 主な属性 | 関連エンティティ | 備考 |
|------------|----------|-----------------|------|
| FourPillars | id, userId/clientId, yearPillar, monthPillar, dayPillar, hourPillar, calculatedAt | User, Client, Pillar | 四柱情報（年月日時の4つの柱） |
| Pillar | id, stem, branch, fullStemBranch, fortune, spiritKiller | FourPillars, HiddenStems | 個別の柱情報 |
| HiddenStems | pillarId, stems[], tenGods[], weights[] | Pillar | 蔵干（地支に内包される天干）情報 |
| TenGodRelations | userId/clientId, yearTenGod, monthTenGod, dayTenGod, hourTenGod | User, Client | 十神関係データ |
| ElementProfile | userId/clientId, wood, fire, earth, metal, water, mainElement, yinYang | User, Client | 五行バランスプロファイル |
| Kakukyoku | userId/clientId, type, category, strength, description, details[] | User, Client | 格局（気質タイプ）情報 |
| Yojin | userId/clientId, tenGod, element, description, supportElements[] | User, Client | 用神（必要な要素）情報 |

### 13.3 クライアント専用チャット関連データモデル詳細

#### 13.3.1 ClientAICharacter（クライアント専用AI）
```typescript
{
  id: string,                    // 一意識別子
  clientId: string,              // 関連するクライアントID
  aiName: string,                // AIキャラクターの名前
  styleFlags: string[],          // 性格タグ配列（例: ['SOFT', 'CHEERFUL']）
  personalityScore: {            // 性格スコア
    softness: number,            // 0-100: やさしさ度
    energy: number,              // 0-100: エネルギー度
    formality: number            // 0-100: フォーマル度
  },
  createdAt: Date,               // 作成日時
  lastInteraction: Date          // 最終対話日時
}
```

#### 13.3.2 ClientAIMemory（AIメモリ）
```typescript
{
  id: string,                    // 一意識別子
  clientId: string,              // 関連するクライアントID
  memoryType: 'explicit'|'auto', // 明示的記憶 or 自動抽出
  content: string,               // メモリ内容
  category: string,              // カテゴリ（例: '好み', '性格', '要望'）
  extractedFrom?: string,        // 抽出元（会話IDまたは要約）
  confidence: number,            // 確信度（0-100、自動抽出時）
  createdAt: Date,               // 作成日時
  updatedAt: Date,               // 更新日時
  isActive: boolean              // 有効フラグ
}
```

#### 13.3.3 ClientChatHistory（クライアント専用チャット履歴）
```typescript
{
  id: string,                    // 一意識別子
  clientId: string,              // 関連するクライアントID
  sessionId: string,             // セッションID
  messages: Message[],           // メッセージ配列
  context: 'stylist_consultation'|'client_direct', // コンテキスト
  startedAt: Date,               // セッション開始時刻
  endedAt?: Date,                // セッション終了時刻
  memoryUpdates: string[]        // 更新されたメモリID配列
}
```

#### 13.3.4 ClientOnboardingStatus（オンボーディング状態）
```typescript
{
  clientId: string,              // 関連するクライアントID
  hasCompletedOnboarding: boolean, // 完了フラグ
  onboardingCompletedAt?: Date,  // 完了日時
  preferredStyle?: string,        // 好みのスタイル
  initialResponses?: {            // 初期質問への回答
    favoriteStyle?: string,
    communicationPreference?: string,
    interests?: string[]
  }
}
```

### 13.4 クライアント専用チャットの分岐ロジック

#### 13.4.1 チャット起動パターン

**1. スタイリスト相談チャット**（context: 'stylist_consultation'）
- **起動場所**: beauty-daily-clients.htmlの「スタイリスト相談」ボタン
- **対象ユーザー**: スタイリスト
- **初期コンテキスト**: 選択されたクライアントの四柱推命データ、過去の施術履歴、AIメモリをプロンプトに含める
- **主な用途**: 接客方法の相談、提案内容の検討、クライアントの特性理解

**2. クライアント専用チャット**（context: 'client_direct'）
- **起動場所**: beauty-daily-clients.htmlの「お客様専用チャット」ボタン
- **対象ユーザー**: クライアント（スタイリスト経由でアクセス）
- **分岐条件**:
  - `ClientOnboardingStatus.hasCompletedOnboarding === false` の場合 → オンボーディングフローへ
  - `ClientOnboardingStatus.hasCompletedOnboarding === true` の場合 → 直接チャット画面へ

#### 13.4.2 オンボーディングフロー詳細

**ステップ1: ようこそ画面**
- サロン名とSalomoniロゴの表示
- 「あなただけの美容アドバイザーを作成します」メッセージ
- 所要時間の案内（約3分）

**ステップ2: パーソナライゼーション説明**
- 四柱推命による個性分析の説明（専門用語を使わない）
- 「あなたの生まれ持った魅力を最大限に引き出すアドバイスを提供」
- プライバシーポリシーへのリンク

**ステップ3: 好みの確認**
- AIキャラクターの話し方の好み選択:
  - やさしく寄り添う感じ（SOFT）
  - 元気で明るい感じ（CHEERFUL）
  - クールで大人っぽい感じ（COOL）
  - おまかせ（四柱推命から自動選択）

**ステップ4: AIキャラクター名の決定**
- デフォルト名の提示（サロン名から生成）
- カスタム名の入力オプション
- 「○○があなたの美容パートナーになりました！」確認画面

#### 13.4.3 チャット画面の動作分岐

**初回利用時の挨拶**
```
はじめまして！私は[AI名]です。
今日は[クライアント名]さんの魅力をさらに引き出すお手伝いをさせていただきますね。
[四柱推命に基づく簡単な性格分析]なあなたには、[提案内容]がおすすめです。
```

**2回目以降の挨拶**
```
[クライアント名]さん、お久しぶりです！[AI名]です。
前回から[経過日数]ぶりですね。
[前回のメモリから抽出した内容]はいかがでしたか？
今日も素敵な時間にしましょう！
```

#### 13.4.4 メモリ更新のトリガー

**自動更新される情報**:
- 好みのスタイル言及（例：「ショートヘアが好き」）
- 嫌いなもの・避けたいもの（例：「パーマは苦手」）
- ライフスタイル情報（例：「最近転職した」）
- 美容に関する悩み（例：「髪が傷みやすい」）

**明示的更新のキーワード**:
- 「覚えておいて」
- 「次回も〜してほしい」
- 「いつも〜」
- 「私の好みは〜」

#### 13.2.2 マスターデータ

| エンティティ | 主な属性 | 関連エンティティ | 備考 |
|------------|----------|-----------------|------|
| StemMaster | stem, element, yinYang, order | - | 天干マスター（甲乙丙丁戊己庚辛壬癸） |
| BranchMaster | branch, element, season, order, hiddenStems[] | - | 地支マスター（子丑寅卯辰巳午未申酉戌亥） |
| StemBranchMaster | stemBranch, stem, branch, order | - | 60干支マスター |
| TenGodMaster | tenGod, groupType, description | - | 十神マスター（比肩・劫財など） |
| ElementMaster | element, color, direction, season, organ | - | 五行マスター（木火土金水） |
| FortuneMaster | fortune, description, strength | - | 十二運星マスター |
| SpiritKillerMaster | spiritKiller, description, effect | - | 十二神殺マスター |

#### 13.2.3 計算関連データ

| エンティティ | 主な属性 | 関連エンティティ | 備考 |
|------------|----------|-----------------|------|
| CalculationRequest | id, birthDateTime, location, options, requestedAt | User, Client | 四柱推命計算リクエスト |
| CalculationResult | requestId, fourPillarsId, lunarDate, processedDateTime, timezoneInfo | CalculationRequest, FourPillars | 計算結果 |
| LocationData | id, name, country, longitude, latitude, timezone | CalculationRequest | 出生地情報 |
| LunarDate | year, month, day, isLeapMonth | CalculationResult | 旧暦日付 |
| SpecialCases | userId/clientId, caseType, description, appliedAt | User, Client | 特殊ケース処理履歴 |

### 13.3 四柱推命API仕様

#### 13.3.1 計算系API

- `POST /api/saju/calculate` → 四柱推命計算実行
  - リクエスト: { birthDateTime: string, location?: LocationData, options?: SajuOptions }
  - レスポンス: { fourPillars: FourPillars, elementProfile: ElementProfile, tenGods: TenGodRelations, kakukyoku: Kakukyoku, yojin: Yojin }
  - エラー: 400 Bad Request - 入力データ不正

- `POST /api/saju/analyze` → 既存データから追加分析
  - リクエスト: { userId?: string, clientId?: string, analysisType: string[] }
  - レスポンス: { kakukyoku?: Kakukyoku, yojin?: Yojin, compatibility?: CompatibilityData }
  - エラー: 404 Not Found - ユーザー/クライアントの四柱データ不存在

#### 13.3.2 データ取得API

- `GET /api/saju/masters` → マスターデータ取得
  - リクエスト: { type: 'stems'|'branches'|'tenGods'|'elements'|'all' }
  - レスポンス: { stems?: StemMaster[], branches?: BranchMaster[], tenGods?: TenGodMaster[], elements?: ElementMaster[] }
  - エラー: 403 Forbidden - アクセス権限なし

- `GET /api/saju/user/:id` → ユーザーの四柱推命データ取得
  - リクエスト: パスパラメータ userId
  - レスポンス: { fourPillars: FourPillars, elementProfile: ElementProfile, kakukyoku: Kakukyoku, yojin: Yojin }
  - エラー: 404 Not Found - ユーザーデータ不存在

#### 13.3.3 相性診断API

- `POST /api/saju/compatibility` → 相性診断実行
  - リクエスト: { userId1: string, userId2: string, type: 'business'|'personal' }
  - レスポンス: { score: number, analysis: string, recommendations: string[] }
  - エラー: 400 Bad Request - 両者のデータ不完全

- `GET /api/saju/compatibility/enhanced/:userId1/:userId2` → 高度な相性診断詳細取得
  - リクエスト: パスパラメータ userId1, userId2
  - レスポンス: { 
      totalScore: number,
      details: {
        yinYangBalance: number,
        strengthBalance: number, 
        dayBranchRelationship: { score: number, relationship: string },
        usefulGods: number,
        dayGanCombination: { score: number, isGangou: boolean }
      },
      relationshipType: string,
      detailDescription: string
    }
  - エラー: 404 Not Found - ユーザーデータ不存在

- `GET /api/saju/compatibility/team/:teamId` → チーム全体の相性診断
  - リクエスト: パスパラメータ teamId
  - レスポンス: { compatibilities: CompatibilityInfo[], teamInsight: string }
  - エラー: 403 Forbidden - チームアクセス権限なし

#### 13.3.4 決済関連API（ユニバペイ統合）

- `POST /api/billing/token` → トランザクショントークン作成
  - リクエスト: { 
      cardNumber: string, 
      expMonth: string, 
      expYear: string, 
      cvv: string,
      cardholder: string,
      type: 'one_time'|'subscription'|'recurring'
    }
  - レスポンス: { tokenId: string, expiresAt: Date }
  - エラー: 400 Bad Request - カード情報不正

- `POST /api/billing/subscription` → サブスクリプション作成・更新
  - リクエスト: {
      tokenId: string,
      planId: string,
      organizationId: string
    }
  - レスポンス: { subscriptionId: string, status: string, nextBillingDate: Date }
  - エラー: 402 Payment Required - 決済失敗

- `POST /api/billing/charge-tokens` → トークンチャージ購入
  - リクエスト: {
      tokenId: string,
      package: 'standard'|'premium',
      organizationId: string
    }
  - レスポンス: { chargeId: string, tokensAdded: number, newBalance: number }
  - エラー: 402 Payment Required - 決済失敗

- `PUT /api/billing/subscription/:subscriptionId/cancel` → サブスクリプションキャンセル
  - リクエスト: { cancelType: 'immediate'|'end_of_period' }
  - レスポンス: { status: string, effectiveDate: Date }
  - エラー: 404 Not Found - サブスクリプション不存在

- `POST /api/billing/refund/:chargeId` → 返金処理
  - リクエスト: { amount?: number, reason: string }
  - レスポンス: { refundId: string, status: string, refundedAmount: number }
  - エラー: 400 Bad Request - 返金不可

- `GET /api/billing/payment-history` → 支払い履歴取得
  - リクエスト: { organizationId: string, fromDate?: string, toDate?: string, page: number }
  - レスポンス: { payments: PaymentInfo[], total: number, pagination: PaginationInfo }
  - エラー: 403 Forbidden - アクセス権限なし

- `POST /api/billing/webhook` → ユニバペイWebhook受信
  - リクエスト: ユニバペイからのWebhookペイロード
  - レスポンス: { received: boolean }
  - エラー: 401 Unauthorized - 署名検証失敗

### 13.4 データ永続化仕様

#### 13.4.1 保存ポリシー

- **四柱推命基本データ**: 初回計算時に永続保存、再計算時は更新
- **日運データ**: 30日間保持後、自動アーカイブ
- **相性診断結果**: 90日間キャッシュ後、再計算
- **マスターデータ**: アプリケーション起動時にメモリロード

#### 13.4.2 セキュリティ考慮事項

- 生年月日時データは暗号化して保存
- 位置情報は必要最小限の精度で保持
- 個人を特定可能な四柱推命データへのアクセスは権限制御
- 計算ログは匿名化して分析用途のみ使用

## 14. 特記すべき非機能要件

以下は標準的な実装方針から特に注意すべき点です：

- **占い要素の表現規制対応**: 四柱推命の専門用語を一切使用せず、日常語への完全変換
- **リアルタイム性**: AIとの会話における自然な応答速度の確保
- **データプライバシー**: 生年月日等の機微情報の厳格な管理、スタッフ監視への配慮
- **iOS App Store審査対応**: 占いアプリではなくモチベーション管理ツールとしての位置づけ
- **スケーラビリティ**: 複数AIキャラクター・大量会話履歴の効率的管理
- **マルチテナント対応**: 組織間のデータ分離・セキュリティ確保

## 14. プロジェクトディレクトリ構造

### 14.1 機能中心の設計思想

本プロジェクトでは、技術的な層（controllers, services）ではなく、ビジネス機能（auth, users, clients）で分割した機能中心のディレクトリ構造を採用します。これにより、非技術者でも理解しやすく、機能単位での開発・保守が容易になります。

### 14.2 バックエンド構造

```
backend/
├── src/
│   ├── common/                # 全機能で共有する共通コード
│   │   ├── config/           # アプリケーション設定
│   │   ├── database/         # データベース接続・マイグレーション
│   │   ├── middlewares/      # 共通ミドルウェア
│   │   ├── utils/            # ユーティリティ関数
│   │   └── validators/       # 共通バリデーター
│   │
│   ├── features/             # 機能ごとにグループ化
│   │   ├── auth/            # 認証機能
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── organizations/   # 組織管理機能
│   │   │   ├── organizations.controller.ts
│   │   │   ├── organizations.service.ts
│   │   │   ├── organizations.routes.ts
│   │   │   └── organizations.types.ts
│   │   │
│   │   ├── users/           # ユーザー管理機能
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.routes.ts
│   │   │   └── users.types.ts
│   │   │
│   │   ├── clients/         # クライアント管理機能
│   │   │   ├── clients.controller.ts
│   │   │   ├── clients.service.ts
│   │   │   ├── clients.routes.ts
│   │   │   └── clients.types.ts
│   │   │
│   │   ├── chat/            # AIチャット機能
│   │   │   ├── chat.controller.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── chat.routes.ts
│   │   │   ├── ai-characters.service.ts
│   │   │   ├── memory.service.ts
│   │   │   └── chat.types.ts
│   │   │
│   │   ├── saju/            # 四柱推命機能
│   │   │   ├── saju.controller.ts
│   │   │   ├── saju.service.ts
│   │   │   ├── saju.routes.ts
│   │   │   ├── compatibility.service.ts
│   │   │   ├── fortune.service.ts
│   │   │   └── saju.types.ts
│   │   │
│   │   ├── appointments/    # 予約管理機能
│   │   │   ├── appointments.controller.ts
│   │   │   ├── appointments.service.ts
│   │   │   ├── appointments.routes.ts
│   │   │   ├── calendar-sync.service.ts
│   │   │   └── appointments.types.ts
│   │   │
│   │   ├── billing/         # 課金・決済機能
│   │   │   ├── billing.controller.ts
│   │   │   ├── billing.service.ts
│   │   │   ├── billing.routes.ts
│   │   │   ├── univapay.service.ts
│   │   │   └── billing.types.ts
│   │   │
│   │   ├── admin/           # 管理者機能
│   │   │   ├── dashboard/
│   │   │   ├── import/
│   │   │   └── reports/
│   │   │
│   │   └── superadmin/      # SuperAdmin機能
│   │       ├── organizations/
│   │       ├── plans/
│   │       └── support/
│   │
│   ├── types/               # フロントエンドと同期する型定義
│   │   └── index.ts        # バックエンド用型定義とAPIパス
│   │
│   └── app.ts              # アプリケーションエントリーポイント
│
├── tests/                   # テストファイル
├── scripts/                 # ユーティリティスクリプト
└── package.json
```

### 14.3 フロントエンド構造

```
frontend/
├── src/
│   ├── common/              # 共通コンポーネント・ユーティリティ
│   │   ├── components/      # 汎用UIコンポーネント
│   │   ├── hooks/          # 共通Reactフック
│   │   ├── utils/          # ユーティリティ関数
│   │   └── styles/         # 共通スタイル・テーマ
│   │
│   ├── features/            # 機能ごとにグループ化
│   │   ├── auth/           # 認証機能
│   │   │   ├── components/ # 認証関連コンポーネント
│   │   │   ├── hooks/      # 認証関連フック
│   │   │   ├── pages/      # ログイン・初回設定画面
│   │   │   └── api.ts      # 認証API連携
│   │   │
│   │   ├── chat/           # チャット機能
│   │   │   ├── components/ # チャットコンポーネント
│   │   │   ├── hooks/      # チャット関連フック
│   │   │   ├── pages/      # チャット画面
│   │   │   └── api.ts      # チャットAPI連携
│   │   │
│   │   ├── fortune/        # 占い・運勢機能
│   │   │   ├── components/ # 運勢表示コンポーネント
│   │   │   ├── hooks/      # 運勢関連フック
│   │   │   ├── pages/      # 今日のアドバイス画面
│   │   │   └── api.ts      # 占いAPI連携
│   │   │
│   │   ├── clients/        # クライアント管理機能
│   │   │   ├── components/ # クライアント関連コンポーネント
│   │   │   ├── hooks/      # クライアント関連フック
│   │   │   ├── pages/      # クライアント管理画面
│   │   │   └── api.ts      # クライアントAPI連携
│   │   │
│   │   ├── appointments/   # 予約管理機能
│   │   │   ├── components/ # 予約関連コンポーネント
│   │   │   ├── hooks/      # 予約関連フック
│   │   │   ├── pages/      # 予約管理画面
│   │   │   └── api.ts      # 予約API連携
│   │   │
│   │   ├── admin/          # 管理者機能
│   │   │   ├── dashboard/  # ダッシュボード
│   │   │   ├── stylists/   # スタイリスト管理
│   │   │   ├── import/     # データインポート
│   │   │   └── support/    # サポート管理
│   │   │
│   │   └── owner/          # オーナー機能
│   │       └── billing/    # 請求・支払い管理
│   │
│   ├── types/              # バックエンドと同期する型定義
│   │   └── index.ts        # フロントエンド用型定義とAPIパス
│   │
│   ├── app/                # アプリケーションのコア
│   │   ├── routes.tsx      # ルーティング設定
│   │   ├── providers.tsx   # コンテキストプロバイダー
│   │   └── store.ts        # 状態管理（Redux/Zustand）
│   │
│   └── index.tsx           # エントリーポイント
│
├── public/                 # 静的ファイル
├── tests/                  # テストファイル
└── package.json
```

### 14.4 SuperAdminサイト構造

```
superadmin/
├── src/
│   ├── common/             # 共通コンポーネント
│   │   ├── components/     # UIコンポーネント
│   │   ├── hooks/         # 共通フック
│   │   └── utils/         # ユーティリティ
│   │
│   ├── features/           # 機能別モジュール
│   │   ├── organizations/ # 組織管理
│   │   ├── plans/         # プラン・課金管理
│   │   └── support/       # サポートチケット管理
│   │
│   ├── types/             # 型定義（共有型をインポート）
│   └── app/               # アプリケーションコア
│
└── package.json
```

### 14.5 共有パッケージ構造

```
packages/
├── saju-engine/           # 四柱推命計算エンジン（既存）
│   ├── src/
│   └── package.json
│
├── shared-types/          # 共有型定義パッケージ（オプション）
│   ├── src/
│   └── package.json
│
└── ui-components/         # 共有UIコンポーネント（オプション）
    ├── src/
    └── package.json
```

### 14.6 ディレクトリ構造の利点

1. **機能単位の開発**: 各機能が独立したディレクトリとして管理され、チーム開発が容易
2. **非技術者にも理解しやすい**: ビジネス機能名でディレクトリが構成されている
3. **スケーラブル**: 新機能追加時は features/ に新しいディレクトリを追加するだけ
4. **テスタビリティ**: 機能ごとにテストを配置でき、単体テストが書きやすい
5. **再利用性**: 共通コードは common/ に集約され、重複を防げる

## 15. 開発計画とマイルストーン

| フェーズ | 内容 | 期間 | ステータス |
|---------|------|------|----------|
| **フェーズ1** | 基本機能開発（モバイルアプリ・組織管理基盤） | 2025年6月末まで | 計画中 |
| **フェーズ2** | クライアント管理・相性機能・予約管理開発 | 2025年7月 | 未着手 |
| **フェーズ3** | 離職予兆・AIレポート・高度化機能 | 2025年8月 | 未着手 |
| **フェーズ4** | クライアント向けAI・顧客体験向上 | 2025年9月 | 未着手 |
| **フェーズ5** | iOS対応・App Store申請準備 | 2025年10月 | 未着手 |
| **フェーズ6** | フィードバック収集・機能拡張 | 2025年11月以降 | 未着手 |

## 16. ページ詳細

### 16.1 M-005: クライアント直接入力・結果表示 (P-005)
**モックアップ**: [beauty-client-input.html](/mockups/beauty-client-input.html)

**ページ概要**: 来店したクライアントが自分で操作し、簡単な情報入力で美容アドバイスを受け取るクライアント向けオンボーディング体験

**含まれる要素**:
- ウェルカムスライド: サロンでの特別な体験への導入
- パーソナライズ説明: 誕生日からの美容運分析の説明  
- プロセス説明: 簡単3ステップでの提案生成の案内
- プログレスドット: 現在位置の視覚的表示
- スワイプ操作: 直感的なスライド遷移
- 自動進行機能: 3秒後の自動スライド進行

**状態と動作**:
- 初期表示: 1枚目スライドが表示され、スワイプヒントが表示
- スライド遷移: 左右スワイプまたはボタンクリックで画面遷移
- 自動進行: ユーザー操作がない場合4秒間隔で自動進行
- スキップ機能: いつでもオンボーディングをスキップ可能
- 完了時遷移: 3枚目完了後にinitial-setup.htmlへ遷移

**データとAPI**:
- クライアント基本情報: { name: string, birthDate: Date, gender: 'male'|'female' }
- 美容アドバイス: { fortune: string, style: string, color: string, point: string }
- `GET /api/fortune/daily` → 誕生日ベースの美容運取得
  - リクエスト: { birthDate: string, gender: string }
  - 成功: { fortune: string, styling: string, luckyColor: string, todayPoint: string }
  - エラー: 400 Bad Request - 入力データ不正

## 17. ページ詳細

### 17.1 M-004: 本日の施術クライアント一覧 (P-004)
**モックアップ**: [beauty-daily-clients.html](/mockups/beauty-daily-clients.html)

**ページ概要**: スタイリストが当日担当する予定のクライアント一覧を効率的に確認し、各クライアントとの最適な接客準備を行うための画面

**含まれる要素**:
- 日付表示: 当日の日付とヘッダー表示
- 統計サマリー: 予約数、相性◎件数、初来店件数の概要
- クライアントカード: 基本情報と相性の一覧表示
- 詳細展開: タップで追加情報を表示
- AIメモリ表示: 過去の会話から蓄積された実用的な顧客情報
- チャット相談: AIとの相談機能への直接アクセス

**状態と動作**:
- 初期表示: 当日予約されたクライアント一覧がカード形式で表示
- カード展開: クライアントカードタップで詳細情報の展開・折りたたみ
- 相性表示: 視覚的な相性インジケーター（◎○△）で瞬時判断
- メモリ情報: AIが蓄積した顧客の特徴や好みを簡潔に表示
- チャット遷移: 「チャット相談」ボタンでAIチャット画面へ遷移

**データとAPI**:
- クライアント基本情報: { name: string, age: number, visits: number, appointmentTime: string }
- 相性データ: { compatibility: 'excellent'|'good'|'average', score: number }
- AIメモリ: { memory: string, lastUpdated: Date }
- `GET /api/clients/daily` → 当日の担当クライアント一覧取得
  - リクエスト: { date: string, stylistId: string }
  - 成功: { clients: ClientInfo[], stats: { total: number, excellentCount: number, newClientCount: number } }
  - エラー: 404 Not Found - 予約データなし

## 19. ページ詳細

### 19.1 A-001: 管理者ダッシュボード (P-001)
**モックアップ**: [beauty-admin-dashboard.html](/mockups/beauty-admin-dashboard.html)

**ページ概要**: サロン管理者（Admin/Owner）がサロン全体の運営状況を一目で把握し、緊急対応や日常業務の効率的な管理を行うための中央管理画面

**含まれる要素**:
- ヘッダー: Salomoniロゴ、管理者名表示、サロン名表示
- サイドバーナビゲーション: 各管理機能への遷移メニュー（Owner専用項目含む）
- 日付表示: 現在日時の明確な表示
- KPIカード: 本日予約数、全クライアント数、スタイリスト数、今週施術完了数
- GPT-4oトークン使用状況チャート: 日別使用量の棒グラフと目安ライン
- 月間使用量サマリー: プログレスバー、残量表示、プランアップグレードボタン
- 未担当予約リスト: 緊急対応が必要な予約の一覧と担当者割当機能
- 五行要素表示: 各クライアントの命式要素を色分けで視覚化

**状態と動作**:
- 初期表示: 当日のKPI数値とリアルタイムデータを表示
- チャート更新: 期間選択（今月/先月/過去3ヶ月）でグラフデータ切り替え
- 担当割当: 未担当予約のチェックボックス選択で担当者自動割当
- ナビゲーション: サイドバーから各管理画面への即座遷移
- レスポンシブ表示: デスクトップ最適化、タブレット・スマホ対応

**データとAPI**:
- ダッシュボード統計: { todayReservations: number, totalClients: number, stylists: number, weeklyCompleted: number }
- トークン使用量: { dailyUsage: number[], monthlyTotal: number, monthlyLimit: number, remainingDays: number }
- 未担当予約: { clientName: string, appointmentTime: string, services: string[], element: 'fire'|'water'|'wood'|'earth'|'metal' }
- `GET /api/admin/dashboard` → ダッシュボード全体データ取得
  - リクエスト: { date: string, organizationId: string }
  - 成功: { stats: DashboardStats, tokenUsage: TokenData, unassignedReservations: Reservation[] }
  - エラー: 403 Forbidden - 管理者権限なし
- `POST /api/admin/assign-stylist` → 担当者割当
  - リクエスト: { reservationId: string, stylistId: string }
  - 成功: { success: true, assignedStylist: string }
  - エラー: 400 Bad Request - 割当不可

## 21. ページ詳細

### 21.1 A-002: クライアント管理 (P-002)
**モックアップ**: [beauty-client-management.html](/mockups/beauty-client-management.html)

**ページ概要**: 管理者（Admin/Owner）がサロンの全クライアント情報を効率的に管理し、四柱推命に基づく相性診断や顧客分析を行うための統合管理画面

**含まれる要素**:
- サイドバーナビゲーション: 各管理機能へのアクセス（Salomoniブランド表示）
- 検索ボックス: 自然言語対応検索（「来月誕生日」「相性の良い方」など）
- フィルターチップ: 相性度別、五行別、来店頻度別の絞り込み
- クライアントカードグリッド: 基本情報、相性バッジ、五行表示の一覧
- 新規登録モーダル: 最小限3項目（名前・生年月日・性別）での簡単登録
- データインポートモーダル: 外部システム連携機能
- クライアント詳細モーダル: 編集・履歴・AIメモリ管理
- AIメモリ機能: 会話から自動学習した顧客情報の表示・編集

**状態と動作**:
- 初期表示: 全クライアントがカード形式でグリッド表示、相性順ソート
- 検索・フィルター: リアルタイム絞り込み、自然言語クエリ対応
- カード展開: クライアントカードクリックで詳細モーダル表示
- 新規登録: 3項目入力後、四柱推命データ自動生成と相性診断実行
- インポート機能: ホットペッパー・サロンアンサー・Googleカレンダー・CSV対応
- AIメモリ更新: 会話履歴からの自動抽出、手動編集可能
- 相性表示: 視覚的バッジ（相性抜群・良好・標準）と五行色分け

**データとAPI**:
- クライアント基本情報: { id: string, name: string, age: number, birthDate: Date, gender: 'male'|'female' }
- 四柱推命データ: { element: 'fire'|'water'|'wood'|'earth'|'metal', elementScore: number, personality: string[] }
- 相性データ: { compatibility: 'excellent'|'good'|'average', score: number, stylistId: string }
- AIメモリ: { memory: string, extractedFrom: string, lastUpdated: Date, isVisible: boolean }
- `GET /api/admin/clients` → クライアント一覧取得
  - リクエスト: { organizationId: string, search?: string, filter?: string, page: number }
  - 成功: { clients: ClientInfo[], total: number, filters: FilterOptions }
  - エラー: 403 Forbidden - 管理者権限なし
- `POST /api/admin/clients` → 新規クライアント登録
  - リクエスト: { name: string, birthDate: string, gender: string, memo?: string }
  - 成功: { client: ClientInfo, fortuneData: FortuneData, compatibility: CompatibilityData }
  - エラー: 400 Bad Request - 入力データ不正
- `PUT /api/admin/clients/:id` → クライアント情報更新
  - リクエスト: { name?: string, memo?: string, aiMemory?: string }
  - 成功: { client: ClientInfo, updated: boolean }
  - エラー: 404 Not Found - クライアント不存在
- `POST /api/admin/import` → 外部データインポート
  - リクエスト: { source: 'hotpepper'|'salonanswer'|'google'|'csv', data: any }
  - 成功: { imported: number, failed: number, errors: string[] }
  - エラー: 422 Unprocessable Entity - データ形式エラー

## 23. ページ詳細

### 23.1 A-004: 予約・担当管理 (P-004)
**モックアップ**: [beauty-appointment-management.html](/mockups/beauty-appointment-management.html)

**ページ概要**: 管理者（Admin/Owner）が日別の予約状況を視覚的に管理し、スタイリストの担当割り当てや予約の編集・追加を効率的に行うための統合管理画面

**含まれる要素**:
- サイドバーナビゲーション: Salomoniブランド表示、各管理機能へのアクセス
- 日付ナビゲーター: 前後日移動、日付選択、当日サマリー（予約数・未担当数・同期状況）
- タイムスロット管理: 時間帯別の予約枠とスタイリスト担当状況
- 予約カードシステム: クライアント情報、施術内容、担当状況の視覚的表示
- ドラッグ&ドロップ機能: 予約の時間変更や担当者変更の直感的操作
- スタイリスト割り当てモーダル: AIによるおすすめ提案と手動選択
- 新規予約登録モーダル: クライアント情報入力と担当者割り当て
- カレンダー同期機能: Googleカレンダーとの双方向同期と設定管理

**状態と動作**:
- 初期表示: 当日の時間帯別予約状況をタイムラインビューで表示
- 日付切り替え: 日付ナビゲーターで任意の日付の予約状況に切り替え
- 担当割り当て: 未担当カードクリックでスタイリスト選択モーダル表示
- AIおすすめ表示: クライアントの性別・施術内容に基づくスタイリスト提案
- 予約編集: 既存予約カードから情報編集モーダル呼び出し
- ドラッグ操作: 予約カードを他の時間枠にドラッグして移動
- 新規追加: 空き枠クリックまたは「枠追加」ボタンで新規予約作成
- 同期管理: カレンダー同期状況の確認と手動同期実行

**データとAPI**:
- 予約基本情報: { id: string, clientName: string, appointmentTime: string, duration: number, services: string[] }
- スタイリスト情報: { id: string, name: string, gender: 'male'|'female', specialties: string[], isAvailable: boolean }
- 担当状況: { isAssigned: boolean, stylistId?: string, stylistName?: string, compatibility?: 'excellent'|'good'|'average' }
- 同期情報: { lastSyncTime: Date, syncStatus: 'connected'|'error', unlinkedCount: number }
- `GET /api/admin/appointments` → 指定日の予約一覧取得
  - リクエスト: { date: string, organizationId: string }
  - 成功: { appointments: AppointmentInfo[], summary: { total: number, unassigned: number, synced: boolean } }
  - エラー: 403 Forbidden - 管理者権限なし
- `POST /api/admin/appointments/assign` → スタイリスト割り当て
  - リクエスト: { appointmentId: string, stylistId: string }
  - 成功: { appointment: AppointmentInfo, compatibility: CompatibilityData }
  - エラー: 400 Bad Request - 割り当て不可（時間重複等）
- `POST /api/admin/appointments` → 新規予約作成
  - リクエスト: { clientName: string, birthDate?: string, timeSlot: string, services: string[], stylistId?: string }
  - 成功: { appointment: AppointmentInfo, client: ClientInfo }
  - エラー: 409 Conflict - 時間枠重複
- `PUT /api/admin/appointments/:id/move` → 予約時間変更
  - リクエスト: { newTimeSlot: string }
  - 成功: { appointment: AppointmentInfo, updated: boolean }
  - エラー: 400 Bad Request - 移動先時間枠不可
- `POST /api/admin/calendar/sync` → カレンダー同期実行
  - リクエスト: { syncType: 'manual'|'auto', calendarId: string }
  - 成功: { syncResult: { imported: number, updated: number, failed: number }, lastSync: Date }
  - エラー: 500 Internal Server Error - 同期処理エラー

## 22. ページ詳細

### 22.1 A-003: スタイリスト管理 (P-003)
**モックアップ**: [beauty-stylist-management.html](/mockups/beauty-stylist-management.html)

**ページ概要**: サロン管理者（Admin/Owner）がスタイリスト（スタッフ）の基本情報管理、権限設定、離職予兆の監視を統合的に行うための管理画面

**含まれる要素**:
- 検索・フィルター機能: スタイリスト名での検索とフィルタリング
- 新規追加ボタン: 新しいスタイリストの登録機能
- 離職予兆アラートサマリー: 要注意スタッフ、緊急対応、総スタッフ数の統計表示
- スタイリストカード一覧: 各スタイリストの基本情報と今月担当数を表示
- 離職リスクインジケーター: 視覚的なリスクレベル表示（高・中・低）
- アクションボタン: 四柱推命表示、編集、レポートダウンロード機能
- 編集・削除モーダル: スタイリスト情報の編集と削除機能
- 四柱推命プロフィールモーダル: 詳細な四柱推命情報表示

**状態と動作**:
- 初期表示: 全スタイリストがカード形式で表示、リスクレベル順ソート
- 検索機能: リアルタイムでスタイリスト名による絞り込み
- 新規追加: 氏名、生年月日、役職、メールアドレス、権限レベルの入力
- 編集機能: 既存スタイリスト情報の修正、編集モーダル内で削除ボタン表示
- 削除機能: 確認ダイアログ付きの削除処理、アニメーション効果
- 四柱推命表示: 生年月日、四柱、五行比率、命式の特徴の詳細表示
- レポートダウンロード: 基本情報、四柱推命分析、今月実績、離職リスク分析を含むレポート生成

**データとAPI**:
- スタイリスト基本情報: { id: string, name: string, role: string, email: string, permission: 'user'|'advanced'|'admin' }
- 勤務統計: { appointments: number, riskLevel: 'safe'|'warning'|'danger' }
- 四柱推命データ: { birthDate: Date, elements: ElementData[], pillars: PillarData[], characteristics: string }
- 離職予兆データ: { alertLevel: 'safe'|'warning'|'danger', recommendedAction: string }
- `GET /api/admin/stylists` → スタイリスト一覧取得
  - リクエスト: { organizationId: string, search?: string }
  - 成功: { stylists: StylistInfo[], riskSummary: RiskSummary }
  - エラー: 403 Forbidden - 管理者権限なし
- `POST /api/admin/stylists` → 新規スタイリスト登録
  - リクエスト: { name: string, birthDate: string, role: string, email: string, permission: string }
  - 成功: { stylist: StylistInfo, fortuneData: FortuneData }
  - エラー: 400 Bad Request - 入力データ不正
- `PUT /api/admin/stylists/:id` → スタイリスト情報更新
  - リクエスト: { name?: string, role?: string, email?: string, permission?: string }
  - 成功: { stylist: StylistInfo, updated: boolean }
  - エラー: 404 Not Found - スタイリスト不存在
- `DELETE /api/admin/stylists/:id` → スタイリスト削除
  - リクエスト: { id: string }
  - 成功: { deleted: boolean, message: string }
  - エラー: 409 Conflict - 削除不可（予約関連データ存在）
- `GET /api/admin/stylists/:id/report` → レポートダウンロード
  - リクエスト: { id: string, format: 'pdf'|'csv' }
  - 成功: { reportUrl: string, expiresAt: Date }
  - エラー: 404 Not Found - スタイリスト不存在

## 24. ページ詳細

### 24.1 A-005: データインポート (P-005)
**モックアップ**: [beauty-data-import.html](/mockups/beauty-data-import.html)

**ページ概要**: 管理者（Admin/Owner）が外部システムからクライアント情報を効率的にインポートし、カレンダー連携や一括データ取り込みを管理するための統合画面

**含まれる要素**:
- サイドバーナビゲーション: Salomoniブランド表示、各管理機能へのアクセス
- タブ切り替え機能: 新規インポート、インポート履歴、カレンダー連携設定の3タブ
- 4ステップウィザード: データソース選択→フィールドマッピング→データプレビュー→インポート実行
- CSVアップロード機能: ドラッグ&ドロップ対応、テンプレートダウンロード
- フィールドマッピング: CSVカラムとSalomoniフィールドの対応設定
- データ品質インジケーター: 高・中・低の3段階品質表示
- プレビューテーブル: インポート前の最終確認画面
- カレンダー連携設定: Google・iCloudカレンダーとの同期設定
- インポート履歴: 過去のインポート実行記録とフィルタリング機能

**状態と動作**:
- 初期表示: フィールドマッピング画面（ステップ2）から開始
- ステップ進行: 線形的な4ステップ進行、前後移動可能
- フィールドマッピング: トグルスイッチによるフィールドON/OFF切り替え
- データプレビュー: 最初の5件データ表示、統計サマリー表示
- カレンダー連携: OAuth認証フロー、同期頻度設定（5分〜1時間）
- インポート実行: 成功メッセージ表示後、履歴タブへ自動遷移
- 履歴管理: フィルタリング機能（データソース、状態、期間）、ページネーション

**データとAPI**:
- インポートファイル情報: { fileName: string, fileSize: string, recordCount: number, lastModified: Date }
- フィールドマッピング: { sourceField: string, targetField: string, isEnabled: boolean, priority: 'standard'|'recommended'|'optional' }
- データ品質: { quality: 'high'|'medium'|'low', completeness: number, accuracy: number }
- プレビューデータ: { clients: ClientPreview[], summary: { total: number, new: number, update: number, errors: number } }
- `POST /api/admin/import/upload` → CSVファイルアップロード
  - リクエスト: FormData with file
  - 成功: { fileId: string, preview: PreviewData, mapping: FieldMapping[] }
  - エラー: 400 Bad Request - ファイル形式エラー
- `POST /api/admin/import/execute` → インポート実行
  - リクエスト: { fileId: string, mapping: FieldMapping[], options: ImportOptions }
  - 成功: { importId: string, processed: number, success: number, failed: number }
  - エラー: 500 Internal Server Error - インポート処理エラー
- `GET /api/admin/import/history` → インポート履歴取得
  - リクエスト: { organizationId: string, filters?: FilterOptions, page: number }
  - 成功: { imports: ImportHistory[], total: number, pagination: PaginationInfo }
  - エラー: 403 Forbidden - 管理者権限なし
- `POST /api/admin/calendar/connect` → カレンダー連携設定
  - リクエスト: { provider: 'google'|'icloud', authCode: string, syncFrequency: number }
  - 成功: { connected: boolean, calendarId: string, syncSettings: SyncSettings }
  - エラー: 401 Unauthorized - 認証失敗

## 26. ページ詳細

### 26.1 A-006: サポート管理 (P-006)
**モックアップ**: [beauty-admin-support.html](/mockups/beauty-admin-support.html)

**ページ概要**: 管理者（Admin/Owner）がSalomoniサポートへの問い合わせを一元管理し、質問・不具合報告・機能要望などの迅速な解決をサポートするための双方向コミュニケーション画面

**含まれる要素**:
- サイドバーナビゲーション: Salomoniブランド表示、各管理機能へのアクセス
- 新規チケット作成ボタン: 新しいサポート依頼の作成機能
- タブ切り替え: すべて、未回答、回答済みのチケット分類
- チケット一覧: チケット番号、タイトル、作成日、最終更新日、ステータス表示
- チケット詳細表示: 選択したチケットの会話履歴と返信機能
- 新規チケット作成モーダル: タイトルと詳細内容の入力フォーム
- メッセージスレッド表示: 送信者、日時、内容を時系列で表示
- 返信フォーム: サポートへの返信メッセージ入力と送信

**状態と動作**:
- 初期表示: すべてのチケットがリスト形式で表示、作成日の新しい順
- タブ切り替え: タブクリックで未回答/回答済みのフィルタリング
- チケット選択: チケットアイテムクリックで詳細画面への切り替え
- 新規作成: モーダルダイアログでタイトルと詳細を入力
- 返信送信: テキストエリアに入力後、送信ボタンで返信追加
- ステータス更新: 返信送信時に自動的にステータスを更新
- リアルタイム更新: 新着回答があった場合の通知表示

**データとAPI**:
- チケット基本情報: { id: string, title: string, description: string, status: 'pending'|'answered'|'closed' }
- メッセージ情報: { sender: string, role: 'admin'|'support', content: string, timestamp: Date }
- チケットメタデータ: { createdAt: Date, updatedAt: Date, organizationId: string, userId: string }
- `GET /api/admin/support/tickets` → チケット一覧取得
  - リクエスト: { organizationId: string, status?: string, page: number }
  - 成功: { tickets: TicketInfo[], total: number, unreadCount: number }
  - エラー: 403 Forbidden - 管理者権限なし
- `GET /api/admin/support/tickets/:id` → チケット詳細取得
  - リクエスト: { ticketId: string }
  - 成功: { ticket: TicketDetail, messages: Message[] }
  - エラー: 404 Not Found - チケット不存在
- `POST /api/admin/support/tickets` → 新規チケット作成
  - リクエスト: { title: string, description: string, category?: string }
  - 成功: { ticket: TicketInfo, ticketId: string }
  - エラー: 400 Bad Request - 必須項目不足
- `POST /api/admin/support/tickets/:id/reply` → 返信送信
  - リクエスト: { ticketId: string, message: string }
  - 成功: { message: Message, updated: boolean }
  - エラー: 400 Bad Request - メッセージ空白

## 27. ページ詳細

### 27.1 A-007: 請求・支払い管理 (P-007)
**モックアップ**: [beauty-admin-billing.html](/mockups/beauty-admin-billing.html)

**ページ概要**: サロンオーナー（Owner）専用の請求書確認、支払い方法管理、プラン変更、APIトークン追加購入を統合的に管理するための課金管理画面

**含まれる要素**:
- サイドバーナビゲーション: Salomoniブランド表示、各管理機能へのアクセス
- 概要カード: 現在のプラン、月額料金、次回請求日、APIトークン使用状況
- プラン詳細表示: 現在のプラン内容、制限値、使用状況の可視化
- APIトークンチャージ購入: 追加トークンの購入機能（2プラン）
- 支払い方法管理: クレジットカード情報の登録・編集・削除
- 請求書履歴: 過去の請求書一覧とフィルタリング機能
- 請求書詳細モーダル: 請求内訳とPDFダウンロード機能
- プラン変更機能: 月額・年間プランの選択と変更

**状態と動作**:
- 初期表示: 現在のプラン情報とAPIトークン使用状況を表示
- トークン使用率: プログレスバーで視覚的に使用率を表示（65%等）
- チャージ購入: モーダルダイアログで2種類のチャージプランを選択
- 支払い方法: カード情報の追加・編集・削除、デフォルト設定
- 請求書フィルター: 全て、支払い済み、未払い、延滞中での絞り込み
- プラン変更: 月額/年間タブ切り替え、16%割引の年間プラン表示
- 請求書詳細: 請求項目、APIトークン使用状況、税額計算の表示

**データとAPI**:
- プラン情報: { planName: string, monthlyFee: number, limits: PlanLimits, currentUsage: UsageData }
- APIトークン使用状況: { used: number, limit: number, additionalTokens: number, remainingChats: number }
- 支払い方法: { cardType: string, last4: string, expiryDate: string, isDefault: boolean }
- 請求書情報: { invoiceNumber: string, amount: number, status: 'paid'|'pending'|'overdue', items: InvoiceItem[] }
- `GET /api/owner/billing/summary` → 請求管理サマリー取得
  - リクエスト: { organizationId: string }
  - 成功: { plan: PlanInfo, usage: UsageInfo, nextBilling: Date, paymentMethods: PaymentMethod[] }
  - エラー: 403 Forbidden - オーナー権限なし
- `POST /api/owner/billing/charge-tokens` → APIトークンチャージ購入
  - リクエスト: { package: 'standard'|'premium', tokens: number, amount: number }
  - 成功: { chargeId: string, tokensAdded: number, newBalance: number }
  - エラー: 400 Bad Request - 支払い処理エラー
- `GET /api/owner/billing/invoices` → 請求書履歴取得
  - リクエスト: { organizationId: string, status?: string, page: number }
  - 成功: { invoices: InvoiceInfo[], total: number, pagination: PaginationInfo }
  - エラー: 403 Forbidden - オーナー権限なし
- `PUT /api/owner/billing/plan` → プラン変更
  - リクエスト: { newPlan: string, billingCycle: 'monthly'|'yearly' }
  - 成功: { plan: PlanInfo, effectiveDate: Date, prorationAmount?: number }
  - エラー: 400 Bad Request - プラン変更不可
- `POST /api/owner/billing/payment-method` → 支払い方法追加
  - リクエスト: { cardToken: string, setAsDefault: boolean }
  - 成功: { paymentMethod: PaymentMethod, added: boolean }
  - エラー: 400 Bad Request - カード検証エラー

## 28. ページ詳細

### 28.1 S-001: 組織管理画面 (P-001)
**モックアップ**: [beauty-superadmin-organizations.html](/mockups/beauty-superadmin-organizations.html)

**ページ概要**: SuperAdminがプラットフォーム全体の組織（サロン）を一元管理し、新規登録、編集、削除、ステータス管理を行うための最上位管理画面

**含まれる要素**:
- ヘッダー: Salomoniロゴ、「組織管理画面」タイトル
- 統計カード: 総組織数、アクティブ組織、トライアル中、今月の売上
- 新規組織追加ボタン: 新規組織登録モーダルの呼び出し
- フィルター機能: ステータス別、プラン別、組織名検索
- 組織一覧テーブル: 組織名、オーナー、プラン、ステータス、使用状況表示
- アクションボタン: 編集・削除機能
- 新規登録モーダル: 組織名、オーナー情報、プラン選択
- 編集モーダル: 基本情報、プラン設定、ステータス管理、詳細設定

**状態と動作**:
- 初期表示: 全組織の一覧表示、統計情報の表示
- フィルタリング: ステータス、プラン、組織名でのリアルタイム絞り込み
- 新規登録: モーダルでの必須3項目入力（組織名、オーナー名、メールアドレス）
- 編集機能: 基本情報編集、プラン変更、トークン上限設定、ステータス変更
- 危険操作保護: ステータスを「停止中」に変更する際の警告と確認ダイアログ
- 詳細設定: 組織ID、登録日、最終ログインの表示（読み取り専用）

**データとAPI**:
- 組織基本情報: { id: string, name: string, ownerName: string, email: string, status: 'active'|'trial'|'suspended' }
- プラン情報: { plan: 'basic'|'standard'|'premium', monthlyFee: number, tokenLimit: number }
- 統計情報: { totalOrgs: number, activeOrgs: number, trialOrgs: number, monthlyRevenue: number }
- 使用状況: { stylistCount: number, tokenUsage: number, tokenLimit: number, lastLogin: Date }
- `GET /api/superadmin/organizations` → 組織一覧取得
  - リクエスト: { status?: string, plan?: string, search?: string, page: number }
  - 成功: { organizations: OrganizationInfo[], stats: Statistics, total: number }
  - エラー: 403 Forbidden - SuperAdmin権限なし
- `POST /api/superadmin/organizations` → 新規組織登録
  - リクエスト: { name: string, ownerName: string, email: string, plan: string }
  - 成功: { organization: OrganizationInfo, organizationId: string }
  - エラー: 400 Bad Request - 必須項目不足
- `PUT /api/superadmin/organizations/:id` → 組織情報編集
  - リクエスト: { name?: string, ownerName?: string, email?: string, plan?: string, tokenLimit?: number, status?: string }
  - 成功: { organization: OrganizationInfo, updated: boolean }
  - エラー: 404 Not Found - 組織不存在
- `DELETE /api/superadmin/organizations/:id` → 組織削除
  - リクエスト: { id: string }
  - 成功: { deleted: boolean, message: string }
  - エラー: 409 Conflict - 削除不可（アクティブユーザー存在）

## 25. 添付資料

### 23.1 モバイルアプリ関連
- [チャットインターフェースモックアップ](/mockups/chat-interface.html)
- [今日のアドバイス表示モックアップ](/mockups/fortune-display.html)
- [管理画面モックアップ](/mockups/admin-dashboard.html)
- [運勢グラフカレンダーモックアップ](/mockups/fortune-graph-calendar.html)

### 23.2 統合システム関連
- [本日の施術クライアント一覧](/mockups/beauty-daily-clients.html) - **完了**
- [クライアント直接入力画面](/mockups/beauty-client-input.html) - **完了**
- [クライアント専用チャット](/mockups/chat-interface.html) - **完了**

### 23.3 管理サイト関連
- [管理者ダッシュボード](/mockups/beauty-admin-dashboard.html) - **完了**
- [クライアント管理画面](/mockups/beauty-client-management.html) - **完了**
- [スタイリスト管理画面](/mockups/beauty-stylist-management.html) - **完了**
- [予約・担当管理画面](/mockups/beauty-appointment-management.html) - **完了**
- [データインポート画面](/mockups/beauty-data-import.html) - **完了**
- [サポート管理画面](/mockups/beauty-admin-support.html) - **完了**
- [請求・支払い管理画面](/mockups/beauty-admin-billing.html) - **完了**

### 23.4 SuperAdminサイト関連
- [組織管理画面](/mockups/beauty-superadmin-organizations.html) - **完了**
- [課金・プラン管理画面](/mockups/beauty-superadmin-plans.html) - **完了**
- [サポートチケット管理画面](/mockups/beauty-superadmin-support-simple.html) - **完了**

## 26. ページ詳細

### 26.1 S-002: 課金・プラン管理画面 (P-S002)
**モックアップ**: [beauty-superadmin-plans.html](/mockups/beauty-superadmin-plans.html)

**ページ概要**: スーパー管理者がサブスクリプションプランの設定、トークン追加購入プランの管理、収益シミュレーション、請求管理を統合的に行うための中央管理画面

**含まれる要素**:
- ヘッダー: Salomoniロゴ、スーパー管理者表示
- サイドバーナビゲーション: 組織管理、課金・プラン管理、サポート管理
- タブナビゲーション: 収益シミュレーション、プラン設定、請求管理
- 収益シミュレーションタブ: 現在の収益状況、仮想組織数による収益予測、最適トークン配布計算
- プラン設定タブ: サブスクプラン一覧、トークン追加購入プラン一覧、編集・削除機能
- 請求管理タブ: 請求書一覧、フィルタリング、ステータス管理
- 各種モーダル: プラン編集、トークンプラン編集、請求書詳細表示

**状態と動作**:
- タブ切り替え: 3つのメインタブ間でコンテンツ切り替え
- 収益シミュレーション: 為替レート・API単価・利益率目標の変更でリアルタイム再計算
- 仮想組織数変更: 入力値変更で月額・年額収益を即座に再計算
- プラン管理: プランカードから編集・削除モーダル呼び出し
- トークンプラン管理: 各プランの編集可能、利益率自動計算
- 請求書フィルター: プラン別・ステータス別での絞り込み
- アクションメニュー: 請求書の詳細表示・ダウンロード・再送信

**データとAPI**:
- プラン情報: { id: string, name: string, monthlyPrice: number, tokenLimit: number, currentOrganizations: number }
- トークンプラン: { id: string, name: string, tokens: number, price: number, profitRatio: number }
- 収益データ: { currentMonthlyRevenue: number, estimatedAPICost: number, profitRatio: number }
- 請求書: { invoiceNumber: string, organizationName: string, amount: number, status: string }
- `GET /api/superadmin/plans` → サブスクプラン一覧取得
  - リクエスト: なし
  - 成功: { plans: PlanInfo[], tokenPlans: TokenPlanInfo[] }
  - エラー: 403 Forbidden - スーパー管理者権限なし
- `POST /api/superadmin/plans` → 新規プラン作成
  - リクエスト: { name: string, price: number, tokenLimit: number, features: string[] }
  - 成功: { plan: PlanInfo, created: boolean }
  - エラー: 400 Bad Request - 入力データ不正
- `PUT /api/superadmin/plans/:id` → プラン更新
  - リクエスト: { name?: string, price?: number, tokenLimit?: number }
  - 成功: { plan: PlanInfo, updated: boolean }
  - エラー: 404 Not Found - プラン不存在
- `GET /api/superadmin/revenue/simulate` → 収益シミュレーション実行
  - リクエスト: { virtualOrganizations: { [planId: string]: number }, exchangeRate: number }
  - 成功: { simulation: RevenueSimulation, optimalTokens: OptimalTokenDistribution }
  - エラー: 400 Bad Request - パラメータ不正
- `GET /api/superadmin/invoices` → 請求書一覧取得
  - リクエスト: { planFilter?: string, statusFilter?: string, page: number }
  - 成功: { invoices: InvoiceInfo[], total: number, summary: InvoiceSummary }
  - エラー: 403 Forbidden - スーパー管理者権限なし

## 27. ページ詳細

### 27.1 S-003: サポートチケット管理画面 (P-S003)
**モックアップ**: [beauty-superadmin-support-simple.html](/mockups/beauty-superadmin-support-simple.html)

**ページ概要**: システム管理者（SuperAdmin）が全組織からのサポート依頼を一元管理し、技術的な問題解決や機能に関する質問への対応を効率的に行うためのシンプルな2ペインインターフェース

**含まれる要素**:
- ヘッダー: Salomoni SuperAdminブランド表示
- チケット一覧ペイン: 左側固定幅での縦並びチケットリスト
- 検索バー: サポートチケットの検索機能
- 未回答カウンター: 未回答チケット数の表示
- チケットアイテム: チケット番号、タイトル、組織名、ステータスバッジ
- チケット詳細ペイン: 選択したチケットの詳細表示
- メッセージスレッド: 時系列での会話履歴表示
- 返信入力フォーム: SuperAdminからの返信作成機能

**状態と動作**:
- 初期表示: 未回答チケットを優先的に上部に表示
- チケット選択: クリックで詳細ペインに内容表示、アクティブ状態を視覚化
- ステータス管理: 未回答（オレンジ）・回答済み（緑）の2状態管理
- 返信送信: テキストエリアから返信、送信後自動的にステータス更新
- リアルタイム更新: 新着チケットや返信の通知表示
- キーボードショートカット: Enter送信、Shift+Enter改行対応
- レスポンシブ対応: モバイル時は縦分割レイアウトに変更

**データとAPI**:
- チケット基本情報: { id: string, ticketNumber: string, title: string, organizationName: string, status: 'pending'|'answered' }
- メッセージ情報: { sender: string, senderRole: 'admin'|'support', content: string, timestamp: Date }
- チケット統計: { totalTickets: number, pendingCount: number, answeredCount: number }
- `GET /api/superadmin/support/tickets` → チケット一覧取得
  - リクエスト: { search?: string, status?: string }
  - 成功: { tickets: TicketInfo[], pendingCount: number }
  - エラー: 403 Forbidden - SuperAdmin権限なし
- `GET /api/superadmin/support/tickets/:id` → チケット詳細取得
  - リクエスト: { ticketId: string }
  - 成功: { ticket: TicketDetail, messages: Message[] }
  - エラー: 404 Not Found - チケット不存在
- `POST /api/superadmin/support/tickets/:id/reply` → 返信送信
  - リクエスト: { ticketId: string, content: string }
  - 成功: { message: Message, statusUpdated: boolean }
  - エラー: 400 Bad Request - 内容空白
- `PUT /api/superadmin/support/tickets/:id/status` → ステータス更新
  - リクエスト: { ticketId: string, status: 'pending'|'answered' }
  - 成功: { ticket: TicketInfo, updated: boolean }
  - エラー: 404 Not Found - チケット不存在

---

※この統合要件定義書は、SalomoniとIrohaの機能を組み合わせた包括的なプラットフォーム仕様です。今後の要件追加やUX変更に応じて、ドキュメントはバージョン管理・更新されます。