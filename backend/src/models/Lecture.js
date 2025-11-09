import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    resourceUrl: {
      type: String,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      min: 0,
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    exam: {
      type: String,
      enum: ['JEE', 'NEET', 'APTITUDE', 'GENERAL'],
      default: 'GENERAL',
    },
    language: {
      type: String,
      enum: ['EN', 'HI', 'BI'],
      default: 'EN',
    },
    tags: {
      type: [String],
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ownerName: {
      type: String,
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

lectureSchema.index({ owner: 1, createdAt: -1 });
lectureSchema.index({ exam: 1, isPublished: 1, createdAt: -1 });

const Lecture = mongoose.model('Lecture', lectureSchema);

export default Lecture;
