import dotenv from 'dotenv';
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';

// 環境変数の読み込み
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkAICharacter() {
  const userId = '68428da0e0fd17850082f240'; // metav2icer@gmail.comのユーザーID
  const userObjectId = new ObjectId(userId);
  const client = new MongoClient(process.env.MONGODB_URI || '');

  try {
    await client.connect();
    console.log('データベースに接続しました');

    const db = client.db();
    
    // ユーザー情報を確認
    const user = await db.collection('users').findOne({ _id: userObjectId });
    console.log('\n===== ユーザー情報 =====');
    if (user) {
      console.log('ユーザーが見つかりました:', {
        id: user._id,
        email: user.email,
        name: user.name,
        organizationId: user.organizationId
      });
    } else {
      console.log('ユーザーが見つかりません');
    }

    // AIキャラクター情報を確認
    const aiCharacter = await db.collection('aicharacters').findOne({ userId });
    console.log('\n===== AIキャラクター情報 =====');
    if (aiCharacter) {
      console.log('AIキャラクターが見つかりました:', {
        id: aiCharacter._id,
        userId: aiCharacter.userId,
        name: aiCharacter.name,
        isActive: aiCharacter.isActive,
        createdAt: aiCharacter.createdAt
      });
    } else {
      console.log('AIキャラクターが見つかりません');
      
      // 他のユーザーIDで検索してみる
      const allAICharacters = await db.collection('aicharacters').find({}).limit(5).toArray();
      console.log('\n===== 既存のAIキャラクター（最初の5件） =====');
      allAICharacters.forEach((char, index) => {
        console.log(`${index + 1}. userId: ${char.userId}, name: ${char.name}`);
      });
    }

    // 四柱推命データも確認
    const fourPillarsData = await db.collection('fourpillarsdata').findOne({ userId });
    console.log('\n===== 四柱推命データ =====');
    if (fourPillarsData) {
      console.log('四柱推命データが見つかりました:', {
        id: fourPillarsData._id,
        userId: fourPillarsData.userId,
        birthDate: fourPillarsData.birthDate,
        createdAt: fourPillarsData.createdAt
      });
    } else {
      console.log('四柱推命データが見つかりません');
    }

  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await client.close();
    console.log('\nデータベース接続を閉じました');
  }
}

checkAICharacter().catch(console.error);