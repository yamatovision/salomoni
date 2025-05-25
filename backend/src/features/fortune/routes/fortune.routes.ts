import { Router } from 'express';
import { FortuneController } from '../controllers/fortune.controller';
import { fortuneValidator } from '../validators/fortune.validator';
import { authenticate } from '../../../common/middleware/auth';
import { handleValidationErrors } from '../../../common/middleware/validationHandler';

const router = Router();
const fortuneController = new FortuneController();

// 日運データ取得
router.get(
  '/daily',
  authenticate,
  ...fortuneValidator.getDailyFortune,
  handleValidationErrors,
  fortuneController.getDailyFortune
);

// 週間運勢取得
router.get(
  '/weekly',
  authenticate,
  ...fortuneValidator.getWeeklyFortune,
  handleValidationErrors,
  fortuneController.getWeeklyFortune
);

// 月間運勢取得
router.get(
  '/monthly',
  authenticate,
  ...fortuneValidator.getMonthlyFortune,
  handleValidationErrors,
  fortuneController.getMonthlyFortune
);

// 本日の相性スタイリスト取得
router.get(
  '/compatibility/today',
  authenticate,
  ...fortuneValidator.getCompatibilityToday,
  handleValidationErrors,
  fortuneController.getCompatibilityToday
);

// AIアドバイス生成
router.get(
  '/users/:userId/daily-advice',
  authenticate,
  ...fortuneValidator.getDailyAdvice,
  handleValidationErrors,
  fortuneController.getDailyAdvice
);

// スタイリスト向け運勢詳細取得
router.get(
  '/stylists/:userId/detail',
  authenticate,
  ...fortuneValidator.getDailyAdvice,
  handleValidationErrors,
  fortuneController.getStylistFortuneDetail
);

// 運勢カード取得
router.get(
  '/cards',
  authenticate,
  ...fortuneValidator.getFortuneCards,
  handleValidationErrors,
  fortuneController.getFortuneCards
);

// アドバイス再生成
router.post(
  '/users/:userId/regenerate',
  authenticate,
  ...fortuneValidator.regenerateAdvice,
  handleValidationErrors,
  fortuneController.regenerateAdvice
);

export const fortuneRoutes = router;