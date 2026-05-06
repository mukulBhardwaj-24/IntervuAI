import { Router } from 'express';
import {
  createRoomController,
  getRoomController,
  joinRoomController
} from '../controllers/roomController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authMiddleware, createRoomController);
router.get('/:roomId', getRoomController);
router.post('/:roomId/join', authMiddleware, joinRoomController);

export default router;
