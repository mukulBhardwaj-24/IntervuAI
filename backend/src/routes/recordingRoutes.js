import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadRecording } from '../controllers/recordingController.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `recording-${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

router.post('/upload', upload.single('recording'), uploadRecording);

export default router;
