import mongoose from 'mongoose';

const lectureRatingSchema = new mongoose.Schema(
  {
    lecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

lectureRatingSchema.index({ lecture: 1, student: 1 }, { unique: true });

const LectureRating = mongoose.model('LectureRating', lectureRatingSchema);

export default LectureRating;
