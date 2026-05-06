import mongoose from 'mongoose';

const { Schema } = mongoose;

const SubmissionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    language: { type: String, required: true },
    source: { type: String, required: true },
    stdin: { type: String },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    result: { type: Schema.Types.Mixed }, 
  },
  { timestamps: true }
);

const Submission = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);

export default Submission;