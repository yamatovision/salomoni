import { Router } from 'express';
import { AICharacterController } from '../controllers/ai-character.controller';
import { authenticate } from '../../../common/middleware/auth';
import { handleValidationErrors } from '../../../common/middleware/validationHandler';
import {
  createAICharacterValidator,
  updateAICharacterValidator,
  createUpdateAIMemoryValidator,
  getAIMemoryValidator,
  idParamValidator,
  setupStatusValidator,
  processNaturalInputValidator,
  setupAICharacterValidator,
  setupClientAICharacterValidator,
} from '../validators/ai-character.validator';

const router = Router();
const aiCharacterController = new AICharacterController();

// AIキャラクター関連
router.post(
  '/characters',
  authenticate,
  createAICharacterValidator,
  handleValidationErrors,
  aiCharacterController.createAICharacter
);

router.get(
  '/my-character',
  authenticate,
  aiCharacterController.getMyAICharacter
);

router.get(
  '/characters/:id',
  authenticate,
  idParamValidator,
  handleValidationErrors,
  aiCharacterController.getAICharacter
);

router.put(
  '/characters/:id',
  authenticate,
  updateAICharacterValidator,
  handleValidationErrors,
  aiCharacterController.updateAICharacter
);

router.delete(
  '/characters/:id',
  authenticate,
  idParamValidator,
  handleValidationErrors,
  aiCharacterController.deleteAICharacter
);

// AIメモリ関連
router.post(
  '/characters/:characterId/memory',
  authenticate,
  createUpdateAIMemoryValidator,
  handleValidationErrors,
  aiCharacterController.createOrUpdateMemory
);

router.get(
  '/characters/:characterId/memory',
  authenticate,
  getAIMemoryValidator,
  handleValidationErrors,
  aiCharacterController.getMemories
);

// セットアップ関連
router.get(
  '/setup-status',
  authenticate,
  setupStatusValidator,
  handleValidationErrors,
  aiCharacterController.getSetupStatus
);

router.post(
  '/process-natural-input',
  authenticate,
  processNaturalInputValidator,
  handleValidationErrors,
  aiCharacterController.processNaturalInput
);

router.post(
  '/setup',
  authenticate,
  setupAICharacterValidator,
  handleValidationErrors,
  aiCharacterController.setupAICharacter
);

// クライアント用AIキャラクター関連
router.get(
  '/clients/:clientId/setup-status',
  authenticate,
  handleValidationErrors,
  aiCharacterController.getClientSetupStatus
);

router.post(
  '/clients/:clientId/setup',
  authenticate,
  setupClientAICharacterValidator,
  handleValidationErrors,
  aiCharacterController.setupClientAICharacter
);

export const aiCharacterRoutes = router;