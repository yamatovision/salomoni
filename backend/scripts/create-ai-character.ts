import mongoose from 'mongoose';
import { AICharacterModel } from '../src/features/ai-characters/models/ai-character.model';
import { UserModel } from '../src/features/users/models/user.model';
import { AICharacterStyle } from '../src/types';

async function createAICharacter() {
  try {
    // MongoDB接続
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/salomoni';
    await mongoose.connect(mongoUri);
    console.log('MongoDB接続成功');

    const userId = '6835112129f08b7dd6eb7009';
    
    // ユーザーが存在するか確認
    let user = await UserModel.findById(userId);
    
    if (!user) {
      console.log('ユーザーが見つからないため、テストユーザーを作成します...');
      user = await UserModel.create({
        _id: userId,
        email: 'shiraishi.tatsuya@mikoto.co.jp',
        name: '白石達也',
        role: 'user',
        organizationId: '68345d76c82f76700e30e44a',
        isActive: true
      });
      console.log('テストユーザー作成完了:', user.email);
    } else {
      console.log('ユーザー確認:', user.email);
    }

    // AIキャラクターが既に存在するか確認
    const existingCharacter = await AICharacterModel.findOne({ userId });
    
    if (existingCharacter) {
      console.log('AIキャラクターは既に存在します:', existingCharacter.name);
      return;
    }

    // AIキャラクターを作成
    const aiCharacter = await AICharacterModel.create({
      userId: userId,
      name: '美容アドバイザー みお',
      styleFlags: [AICharacterStyle.FRIENDLY, AICharacterStyle.PROFESSIONAL],
      personalityScore: {
        softness: 70,
        energy: 60,
        formality: 40
      }
    });

    console.log('AIキャラクター作成完了:', {
      id: aiCharacter.id,
      name: aiCharacter.name,
      userId: aiCharacter.userId,
      styleFlags: aiCharacter.styleFlags,
      personalityScore: aiCharacter.personalityScore
    });

    // 作成確認
    const verification = await AICharacterModel.findOne({ userId });
    console.log('作成確認:', verification ? '成功' : '失敗');

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB接続終了');
  }
}

createAICharacter();