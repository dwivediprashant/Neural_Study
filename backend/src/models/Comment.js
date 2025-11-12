import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture',
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      required: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['pending', 'solved'],
      default: 'pending',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    replyContent: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    repliedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ teacherId: 1, status: 1, createdAt: -1 });
commentSchema.index({ studentId: 1, createdAt: -1 });
commentSchema.index({ lectureId: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
