import mongoose from 'mongoose';
import { AICharacterModel } from '../src/features/ai-characters/models/ai-character.model';
import { UserModel } from '../src/features/users/models/user.model';

async function checkAICharacters() {
  try {
    // MongoDB接続
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/salomoni';
    await mongoose.connect(mongoUri);
    console.log('MongoDB接続成功');

    // 指定ユーザーの情報を取得
    const userId = '6835112129f08b7dd6eb7009';
    const user = await UserModel.findById(userId);
    console.log('ユーザー情報:', {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      role: user?.role
    });

    // AIキャラクターの存在確認
    const aiCharacter = await AICharacterModel.findOne({ userId });
    console.log('AIキャラクター存在:', aiCharacter ? 'あり' : 'なし');
    
    if (aiCharacter) {
      console.log('AIキャラクター詳細:', {
        id: aiCharacter.id,
        name: aiCharacter.name,
        userId: aiCharacter.userId,
        styleFlags: aiCharacter.styleFlags,
        personalityScore: aiCharacter.personalityScore
      });
    }

    // 全AIキャラクター数
    const totalCount = await AICharacterModel.countDocuments();
    console.log('データベース内の全AIキャラクター数:', totalCount);

    // 全AIキャラクターの概要
    const allCharacters = await AICharacterModel.find({}, 'userId clientId name').limit(10);
    console.log('AIキャラクター一覧 (最大10件):');
    allCharacters.forEach(char => {
      console.log(`- ID: ${char.id}, Name: ${char.name}, UserId: ${char.userId}, ClientId: ${char.clientId}`);
    });

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB接続終了');
  }
}

checkAICharacters();