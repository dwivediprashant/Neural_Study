import Comment from '../models/Comment.js';
import Lecture from '../models/Lecture.js';

const buildPopulateConfig = () => [
  {
    path: 'lectureId',
    select: 'title thumbnailUrl durationMinutes subject exam language ownerName',
  },
  {
    path: 'studentId',
    select: 'name email',
  },
  {
    path: 'teacherId',
    select: 'name email',
  },
];

const normalizeRating = (value) => {
  if (value === undefined || value === null) return undefined;
  const num = Number(value);
  if (Number.isNaN(num)) return undefined;
  return Math.min(5, Math.max(1, Math.round(num)));
};

export const createComment = async (req, res) => {
  try {
    const { lectureId, content, rating } = req.body || {};

    if (!lectureId) {
      return res.status(400).json({ message: 'Lecture ID is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const lecture = await Lecture.findById(lectureId).select('owner');
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    const comment = await Comment.create({
      lectureId,
      teacherId: lecture.owner,
      studentId: req.user.id,
      content: content.trim(),
      status: 'pending',
      rating: normalizeRating(rating),
    });

    const populated = await comment.populate(buildPopulateConfig());

    return res.status(201).json({ comment: populated });
  } catch (error) {
    console.error('Failed to create comment', error);
    return res.status(500).json({ message: 'Unable to create comment' });
  }
};

export const listComments = async (req, res) => {
  try {
    const { lectureId, teacherId: teacherQuery, status } = req.query || {};

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const filter = {};
    if (lectureId) {
      filter.lectureId = lectureId;
    }
    if (status) {
      filter.status = status;
    }

    if (req.user.role === 'teacher') {
      filter.teacherId = teacherQuery || req.user.id;
    } else if (req.user.role === 'student') {
      filter.studentId = req.user.id;
      if (teacherQuery) {
        filter.teacherId = teacherQuery;
      }
    } else {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const comments = await Comment.find(filter)
      .sort({ createdAt: -1 })
      .populate(buildPopulateConfig())
      .lean();

    return res.json({ comments });
  } catch (error) {
    console.error('Failed to list comments', error);
    return res.status(500).json({ message: 'Unable to load comments' });
  }
};

export const resolveComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { replyContent } = req.body || {};

    if (!replyContent || !replyContent.trim()) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (String(comment.teacherId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only resolve comments on your lectures' });
    }

    comment.replyContent = replyContent.trim();
    comment.repliedAt = new Date();
    comment.status = 'solved';

    await comment.save();
    const populated = await comment.populate(buildPopulateConfig());

    return res.json({ comment: populated });
  } catch (error) {
    console.error('Failed to resolve comment', error);
    return res.status(500).json({ message: 'Unable to update comment' });
  }
};
