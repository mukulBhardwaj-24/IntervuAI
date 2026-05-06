import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
    participantId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userName: { type: String, required: true }
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userName: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: String, required: true }
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    participants: { type: [participantSchema], default: [] },
    code: { type: String, default: '' },
    messages: { type: [messageSchema], default: [] },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
)

export const Room = mongoose.model('Room', roomSchema);
