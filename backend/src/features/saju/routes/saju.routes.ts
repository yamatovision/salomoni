import { Router } from 'express';
import { sajuController } from '../controllers/saju.controller';
import { authenticate } from '../../../common/middleware/auth';
import { handleValidationErrors } from '../../../common/middleware/validationHandler';
import {
  validateCalculate,
  validateAnalyze,
  validateCompatibility
} from '../validators/saju.validator';

const router = Router();

/**
 * 四柱推命計算実行
 * POST /api/saju/calculate
 */
router.post(
  '/calculate',
  authenticate,
  validateCalculate,
  handleValidationErrors,
  sajuController.calculate.bind(sajuController)
);

/**
 * 四柱推命マスターデータ取得
 * GET /api/saju/masters
 */
router.get(
  '/masters',
  authenticate,
  sajuController.getMasters.bind(sajuController)
);

/**
 * 追加分析実行
 * POST /api/saju/analyze
 */
router.post(
  '/analyze',
  authenticate,
  validateAnalyze,
  handleValidationErrors,
  sajuController.analyze.bind(sajuController)
);

/**
 * 相性診断実行
 * POST /api/saju/compatibility
 */
router.post(
  '/compatibility',
  authenticate,
  validateCompatibility,
  handleValidationErrors,
  sajuController.compatibility.bind(sajuController)
);

export default router;