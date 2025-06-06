import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3002;

// CORS設定
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// テストエンドポイント
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Test server is working' });
});

// ログインエンドポイント
app.post('/api/auth/login', (req, res) => {
  console.log('Login request:', req.body);
  res.json({ 
    success: true, 
    data: { 
      user: { email: req.body.email },
      accessToken: 'test-token' 
    } 
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});