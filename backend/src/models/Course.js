import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['video', 'pdf', 'quiz', 'flashcard', 'assignment'],
      required: true,
    },
    description: String,
    durationMinutes: Number,
    assetUrl: String,
    sizeMB: Number,
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    exam: {
      type: String,
      enum: ['JEE', 'NEET', 'APTITUDE'],
      required: true,
    },
    description: String,
    level: {
      type: String,
      enum: ['FOUNDATION', 'INTERMEDIATE', 'ADVANCED'],
      default: 'INTERMEDIATE',
    },
    language: {
      type: String,
      enum: ['EN', 'HI'],
      default: 'EN',
    },
    tags: [String],
    modules: [
      {
        name: { type: String, required: true },
        order: Number,
        lessons: [lessonSchema],
      },
    ],
    totalSizeMB: Number,
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Course = mongoose.model('Course', courseSchema);

export default Course;
