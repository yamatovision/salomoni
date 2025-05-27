#!/usr/bin/env ts-node

/**
 * 特定の組織とその関連データをMongoDBから削除するスクリプト
 * 
 * 使用方法:
 * npx ts-node scripts/delete-organization.ts "組織名"
 * または
 * npx ts-node scripts/delete-organization.ts --id "組織ID"
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { OrganizationModel } from '../src/features/organizations/models/organization.model';
import { UserModel } from '../src/features/users/models/user.model';
import { ClientModel } from '../src/features/clients/models/client.model';
import { AppointmentModel } from '../src/features/appointments/models/appointment.model';
import { ConversationModel } from '../src/features/chat/models/conversation.model';
import { ChatMessageModel } from '../src/features/chat/models/chat-message.model';
import { Invoice } from '../src/features/billing/models/invoice.model';
import { Subscription } from '../src/features/billing/models/subscription.model';
import { PaymentHistory } from '../src/features/billing/models/payment-history.model';
import { TokenUsage } from '../src/features/billing/models/token-usage.model';
import { SupportTicketModel } from '../src/features/support/models/support-ticket.model';
import { ImportHistoryModel } from '../src/features/import/models/import-history.model';
import { AICharacterModel } from '../src/features/ai-characters/models/ai-character.model';
import { AIMemoryModel } from '../src/features/ai-characters/models/ai-memory.model';

// 環境変数の読み込み
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salomoni';

// 削除対象の組織名（デフォルト）
const TARGET_ORG_NAME = 'Salomoni Beauty Salon';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDBに接続しました');
  } catch (error) {
    console.error('❌ MongoDB接続エラー:', error);
    process.exit(1);
  }
}

async function deleteOrganizationAndRelatedData(organizationName?: string, organizationId?: string) {
  try {
    // 組織を検索
    let organization;
    if (organizationId) {
      organization = await OrganizationModel.findById(organizationId);
    } else {
      organization = await OrganizationModel.findOne({ name: organizationName });
    }

    if (!organization) {
      console.log(`❌ 組織が見つかりません: ${organizationName || organizationId}`);
      return;
    }

    const orgId = (organization._id as any).toString();
    console.log(`\n🗑️  組織「${organization.name}」(ID: ${orgId})とその関連データを削除します\n`);

    // 削除前の確認
    console.log('📊 削除対象データの確認:');
    
    // ユーザー数を確認
    const userCount = await UserModel.countDocuments({ organizationId: orgId });
    console.log(`   - ユーザー: ${userCount}件`);

    // クライアント数を確認
    const clientCount = await ClientModel.countDocuments({ organizationId: orgId });
    console.log(`   - クライアント: ${clientCount}件`);

    // 予約数を確認
    const appointmentCount = await AppointmentModel.countDocuments({ organizationId: orgId });
    console.log(`   - 予約: ${appointmentCount}件`);

    // チャット関連
    const conversationCount = await ConversationModel.countDocuments({ organizationId: orgId });
    console.log(`   - 会話: ${conversationCount}件`);

    // 請求関連
    const invoiceCount = await Invoice.countDocuments({ organizationId: orgId });
    console.log(`   - 請求書: ${invoiceCount}件`);

    const subscriptionCount = await Subscription.countDocuments({ organizationId: orgId });
    console.log(`   - サブスクリプション: ${subscriptionCount}件`);

    // 削除実行の確認
    console.log('\n⚠️  本当に削除しますか？ この操作は取り消せません。');
    console.log('削除を続行する場合は5秒後に自動的に実行されます...\n');

    // 5秒待機
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔄 削除を開始します...\n');

    // 1. AIメモリを削除
    const aiMemoryResult = await AIMemoryModel.deleteMany({ organizationId: orgId });
    console.log(`✅ AIメモリを削除しました: ${aiMemoryResult.deletedCount}件`);

    // 2. AIキャラクターを削除
    const aiCharacterResult = await AICharacterModel.deleteMany({ organizationId: orgId });
    console.log(`✅ AIキャラクターを削除しました: ${aiCharacterResult.deletedCount}件`);

    // 3. チャットメッセージを削除
    const conversations = await ConversationModel.find({ organizationId: orgId });
    const conversationIds = conversations.map(c => c._id);
    const chatMessageResult = await ChatMessageModel.deleteMany({ conversationId: { $in: conversationIds } });
    console.log(`✅ チャットメッセージを削除しました: ${chatMessageResult.deletedCount}件`);

    // 4. 会話を削除
    const conversationResult = await ConversationModel.deleteMany({ organizationId: orgId });
    console.log(`✅ 会話を削除しました: ${conversationResult.deletedCount}件`);

    // 5. 予約を削除
    const appointmentResult = await AppointmentModel.deleteMany({ organizationId: orgId });
    console.log(`✅ 予約を削除しました: ${appointmentResult.deletedCount}件`);

    // 6. クライアントを削除
    const clientResult = await ClientModel.deleteMany({ organizationId: orgId });
    console.log(`✅ クライアントを削除しました: ${clientResult.deletedCount}件`);

    // 7. トークン使用履歴を削除
    const tokenUsageResult = await TokenUsage.deleteMany({ organizationId: orgId });
    console.log(`✅ トークン使用履歴を削除しました: ${tokenUsageResult.deletedCount}件`);

    // 8. 支払い履歴を削除
    const paymentHistoryResult = await PaymentHistory.deleteMany({ organizationId: orgId });
    console.log(`✅ 支払い履歴を削除しました: ${paymentHistoryResult.deletedCount}件`);

    // 9. 請求書を削除
    const invoiceResult = await Invoice.deleteMany({ organizationId: orgId });
    console.log(`✅ 請求書を削除しました: ${invoiceResult.deletedCount}件`);

    // 10. サブスクリプションを削除
    const subscriptionResult = await Subscription.deleteMany({ organizationId: orgId });
    console.log(`✅ サブスクリプションを削除しました: ${subscriptionResult.deletedCount}件`);

    // 11. サポートチケットを削除
    const supportTicketResult = await SupportTicketModel.deleteMany({ organizationId: orgId });
    console.log(`✅ サポートチケットを削除しました: ${supportTicketResult.deletedCount}件`);

    // 12. インポート履歴を削除
    const importHistoryResult = await ImportHistoryModel.deleteMany({ organizationId: orgId });
    console.log(`✅ インポート履歴を削除しました: ${importHistoryResult.deletedCount}件`);

    // 13. ユーザーを削除
    const userResult = await UserModel.deleteMany({ organizationId: orgId });
    console.log(`✅ ユーザーを削除しました: ${userResult.deletedCount}件`);

    // 14. 最後に組織を削除
    const orgResult = await OrganizationModel.deleteOne({ _id: orgId });
    console.log(`✅ 組織を削除しました: ${orgResult.deletedCount}件`);

    console.log('\n✨ すべての関連データを削除しました！');

  } catch (error) {
    console.error('❌ 削除中にエラーが発生しました:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();

    // コマンドライン引数を処理
    const args = process.argv.slice(2);
    let organizationName: string | undefined = TARGET_ORG_NAME;
    let organizationId: string | undefined;

    if (args.length > 0) {
      if (args[0] === '--id' && args[1]) {
        organizationId = args[1];
      } else {
        organizationName = args[0];
      }
    }

    // 削除を実行
    if (organizationId || organizationName) {
      await deleteOrganizationAndRelatedData(organizationName, organizationId);
    } else {
      console.log('❌ 組織名またはIDを指定してください');
      return;
    }

    // 削除後の組織数を表示
    const remainingOrgCount = await OrganizationModel.countDocuments();
    console.log(`\n📊 残りの組織数: ${remainingOrgCount}`);

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB接続を終了しました');
  }
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error);
}