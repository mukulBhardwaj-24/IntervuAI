import express from 'express';
import { getHint, getReview } from '../controllers/aiController.js';

const router = express.Router();

router.post('/hint', getHint);
router.post('/review', getReview);

export default router;
