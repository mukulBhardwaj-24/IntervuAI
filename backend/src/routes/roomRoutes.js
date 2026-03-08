import { Router } from 'express';
import {
  createRoomController,
  getRoomController,
  joinRoomController
} from '../controllers/roomController.js';

const router = Router();

router.post('/', createRoomController);
router.get('/:roomId', getRoomController);
router.post('/:roomId/join', joinRoomController);

export default router;
