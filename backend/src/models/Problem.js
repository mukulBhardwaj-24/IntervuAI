import mongoose from 'mongoose';

const { Schema } = mongoose;

const ProblemSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    tags: { type: [String], default: [] },
    statement: { type: String, required: true },
    sampleInput: { type: String, default: '' },
    sampleOutput: { type: String, default: '' }
  },
  { timestamps: true }
);

const Problem = mongoose.models.Problem || mongoose.model('Problem', ProblemSchema);
export default Problem;
