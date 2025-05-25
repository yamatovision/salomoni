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
  '/characters/me',
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

export const aiCharacterRoutes = router;