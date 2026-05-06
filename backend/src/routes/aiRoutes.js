import express from 'express';
import { aiChatRateLimiter, getHint, getReview, postAiChat } from '../controllers/aiController.js';

const router = express.Router();

router.post('/hint', getHint);
router.post('/review', getReview);
router.post('/chat', aiChatRateLimiter, postAiChat);

export default router;
