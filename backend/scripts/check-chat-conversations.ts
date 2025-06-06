import mongoose from 'mongoose';
import { ConversationModel } from '../src/features/chat/models/conversation.model';
import { ChatMessageModel } from '../src/features/chat/models/chat-message.model';
import { logger } from '../src/common/utils/logger';
import dotenv from 'dotenv';

dotenv.config();

async function checkChatConversations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    logger.info('データベースに接続しました');

    const userId = '68428da0e0fd17850082f240';
    const clientId = '68428ccde0fd17850082f151';

    // 1. 該当ユーザーの全会話を確認
    const userConversations = await ConversationModel.find({
      $or: [
        { userId: userId },
        { clientId: clientId }
      ]
    }).sort({ createdAt: -1 });

    logger.info('\n===== 該当ユーザー/クライアントの全会話 =====');
    userConversations.forEach((conv, index) => {
      logger.info(`${index + 1}. 会話ID: ${conv._id}`);
      logger.info(`   ユーザー: ${conv.userId || 'なし'}`);
      logger.info(`   クライアント: ${conv.clientId || 'なし'}`);
      logger.info(`   AIキャラクター: ${conv.aiCharacterId}`);
      logger.info(`   コンテキスト: ${conv.context}`);
      logger.info(`   作成日時: ${conv.createdAt}`);
      logger.info(`   終了日時: ${conv.endedAt || '未終了'}`);
      logger.info(`   メッセージ数: ${conv.messageCount}`);
      logger.info('   ---');
    });

    // 2. 特定の会話IDの詳細確認
    const specificConversationId = '6842d5e1307f75627e6bcb71'; // ログで見つかった会話ID
    const conversation = await ConversationModel.findById(specificConversationId);
    
    if (conversation) {
      logger.info(`\n===== 会話 ${specificConversationId} の詳細 =====`);
      logger.info(`ユーザー: ${conversation.userId || 'なし'}`);
      logger.info(`クライアント: ${conversation.clientId || 'なし'}`);
      logger.info(`AIキャラクター: ${conversation.aiCharacterId}`);
      logger.info(`コンテキスト: ${conversation.context}`);
      logger.info(`作成日時: ${conversation.createdAt}`);
      logger.info(`メッセージ数: ${conversation.messageCount}`);

      // この会話のメッセージも確認
      const messages = await ChatMessageModel.find({ conversationId: specificConversationId })
        .sort({ createdAt: 1 });
      
      logger.info(`\n===== 会話 ${specificConversationId} のメッセージ =====`);
      messages.forEach((msg, index) => {
        logger.info(`${index + 1}. メッセージID: ${msg._id}`);
        logger.info(`   メッセージタイプ: ${msg.type}`);
        logger.info(`   メタデータ: ${JSON.stringify(msg.metadata)}`);
        logger.info(`   内容: ${msg.content.substring(0, 100)}...`);
        logger.info(`   作成日時: ${msg.createdAt}`);
        logger.info('   ---');
      });
    }

    // 3. ユーザーの個人チャット会話確認
    const personalConversation = await ConversationModel.findById('6842a36b4448bb2c9cd9bc80');
    if (personalConversation) {
      logger.info(`\n===== 個人チャット会話 6842a36b4448bb2c9cd9bc80 の詳細 =====`);
      logger.info(`ユーザー: ${personalConversation.userId || 'なし'}`);
      logger.info(`クライアント: ${personalConversation.clientId || 'なし'}`);
      logger.info(`AIキャラクター: ${personalConversation.aiCharacterId}`);
      logger.info(`コンテキスト: ${personalConversation.context}`);
      logger.info(`メッセージ数: ${personalConversation.messageCount}`);

      const personalMessages = await ChatMessageModel.find({ conversationId: '6842a36b4448bb2c9cd9bc80' })
        .sort({ createdAt: 1 });
      
      logger.info(`\n===== 個人チャット会話のメッセージ =====`);
      personalMessages.forEach((msg, index) => {
        logger.info(`${index + 1}. メッセージID: ${msg._id}`);
        logger.info(`   メッセージタイプ: ${msg.type}`);
        logger.info(`   メタデータ: ${JSON.stringify(msg.metadata)}`);
        logger.info(`   内容: ${msg.content.substring(0, 100)}...`);
        logger.info(`   作成日時: ${msg.createdAt}`);
        logger.info('   ---');
      });
    }

  } catch (error) {
    logger.error('エラーが発生しました:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('\nデータベース接続を閉じました');
  }
}

checkChatConversations();