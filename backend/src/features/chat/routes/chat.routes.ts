import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticate } from '../../../common/middleware/auth';
import { handleValidationErrors } from '../../../common/middleware/validationHandler';
import {
  createConversationValidator,
  getConversationsValidator,
  sendMessageValidator,
  getMessagesValidator,
  conversationIdParamValidator,
} from '../validators/chat.validator';

const router = Router();
const chatController = new ChatController();

// 会話セッション関連
router.post(
  '/conversations',
  authenticate,
  createConversationValidator,
  handleValidationErrors,
  chatController.createConversation
);

router.get(
  '/conversations',
  authenticate,
  getConversationsValidator,
  handleValidationErrors,
  chatController.getConversations
);

router.post(
  '/conversations/:conversationId/send',
  authenticate,
  sendMessageValidator,
  handleValidationErrors,
  chatController.sendMessage
);

router.get(
  '/conversations/:conversationId/messages',
  authenticate,
  getMessagesValidator,
  handleValidationErrors,
  chatController.getMessages
);

router.post(
  '/conversations/:conversationId/end',
  authenticate,
  conversationIdParamValidator,
  handleValidationErrors,
  chatController.endConversation
);

// 簡易チャット開始（既存または新規会話）
router.post(
  '/start',
  authenticate,
  chatController.startChat
);

export const chatRoutes = router;