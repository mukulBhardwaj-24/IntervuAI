import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  createSubmission,
  getUserSubmissions,
  getSubmissionById,
  getSubmissionStats
} from '../controllers/submissionController.js';

const router = express.Router();

router.post('/', authMiddleware, createSubmission);
router.get('/submission/:id', getSubmissionById);
router.get('/:userId/stats', getSubmissionStats);
router.get('/:userId', getUserSubmissions);

export default router;
