import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema(
  {
    questionIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    selectedIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    correctIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { _id: false }
);

const testAttemptSchema = new mongoose.Schema(
  {
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 1,
    },
    percent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    durationMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    responses: {
      type: [responseSchema],
      default: [],
    },
    meta: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const TestAttempt = mongoose.models.TestAttempt || mongoose.model('TestAttempt', testAttemptSchema);

export default TestAttempt;
