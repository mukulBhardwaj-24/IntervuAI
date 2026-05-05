import mongoose from 'mongoose';

const { Schema } = mongoose;

const SubmissionSchema = new Schema(
  {
    userId: { type: String },
    language: { type: String, required: true },
    source: { type: String, required: true },
    stdin: { type: String },
    problemId: { type: String },
    result: { type: Schema.Types.Mixed }, 
  },
  { timestamps: true }
);

const Submission = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);

export default Submission;