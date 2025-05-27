# Node.js 20のベースイメージを使用
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 開発依存関係も含めてインストール（ビルドに必要）
RUN npm ci

# アプリケーションのソースコードをコピー
COPY . .

# TypeScriptをビルド
RUN npm run build

# 本番用の依存関係のみを再インストール
RUN npm ci --only=production

# Cloud Runではポート8080を使用
ENV PORT=8080

# アプリケーションを実行
CMD ["npm", "start"]