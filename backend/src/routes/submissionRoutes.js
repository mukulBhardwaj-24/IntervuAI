import express from 'express';
import {
  getUserSubmissions,
  getSubmissionById,
  getSubmissionStats
} from '../controllers/submissionController.js';

const router = express.Router();

router.get('/submission/:id', getSubmissionById);
router.get('/:userId/stats', getSubmissionStats);
router.get('/:userId', getUserSubmissions);

export default router;
