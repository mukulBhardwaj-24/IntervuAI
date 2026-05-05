import express from 'express';
import { getPlatformAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/', getPlatformAnalytics);

export default router;
