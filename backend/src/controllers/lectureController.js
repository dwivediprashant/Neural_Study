import mongoose from 'mongoose';

import Lecture from '../models/Lecture.js';
import LectureRating from '../models/LectureRating.js';
import User from '../models/User.js';

const sanitizeLecture = (lecture) => {
  if (!lecture) return null;
  return {
    id: lecture._id,
    title: lecture.title,
    description: lecture.description,
    thumbnailUrl: lecture.thumbnailUrl,
    resourceUrl: lecture.resourceUrl,
    durationMinutes: lecture.durationMinutes,
    subject: lecture.subject,
    exam: lecture.exam,
    language: lecture.language,
    tags: lecture.tags,
    owner: lecture.owner,
    ownerName: lecture.ownerName,
    isPublished: lecture.isPublished,
    createdAt: lecture.createdAt,
    updatedAt: lecture.updatedAt,
  };
};

const formatAverage = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  return Math.round(value * 100) / 100;
};

const collectLectureRatings = async (lectureIds, userId) => {
  if (!Array.isArray(lectureIds) || lectureIds.length === 0) {
    return { summaryMap: new Map(), userMap: new Map() };
  }

  const normalizedIds = lectureIds
    .map((value) => (value instanceof mongoose.Types.ObjectId ? value : new mongoose.Types.ObjectId(value)))
    .filter(Boolean);

  if (!normalizedIds.length) {
    return { summaryMap: new Map(), userMap: new Map() };
  }

  const summaries = await LectureRating.aggregate([
    { $match: { lecture: { $in: normalizedIds } } },
    {
      $group: {
        _id: '$lecture',
        average: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const summaryMap = new Map(
    summaries.map(({ _id, average, count }) => [
      _id.toString(),
      {
        average: formatAverage(average),
        count,
      },
    ])
  );

  if (!userId) {
    return { summaryMap, userMap: new Map() };
  }

  const userRatings = await LectureRating.find({ lecture: { $in: normalizedIds }, student: userId })
    .select('lecture rating')
    .lean();

  const userMap = new Map(userRatings.map(({ lecture, rating }) => [lecture.toString(), rating]));

  return { summaryMap, userMap };
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }
  return false;
};

const normalizeTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags.map((tag) => tag?.toString?.().trim()).filter(Boolean);
  }
  return tags
    .toString()
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
};

export const listLectures = async (req, res) => {
  try {
    const { mine, owner, exam, limit } = req.query ?? {};
    const filter = {};

    if (parseBoolean(mine) || owner === 'me') {
      if (!req.user) {
        return res.status(401).json({ message: req.t('errors.authRequired') });
      }
      filter.owner = req.user.id;
    } else if (owner && mongoose.Types.ObjectId.isValid(owner)) {
      filter.owner = owner;
      filter.isPublished = true;
    } else {
      filter.isPublished = true;
    }

    if (exam) {
      filter.exam = exam.toUpperCase();
    }

    const query = Lecture.find(filter).sort({ createdAt: -1 });
    if (limit) {
      const parsedLimit = Number.parseInt(limit, 10);
      if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
        query.limit(Math.min(parsedLimit, 100));
      }
    }

    const lectures = await query.lean();

    const { summaryMap, userMap } = await collectLectureRatings(
      lectures.map((lecture) => lecture._id),
      req.user?.role === 'student' ? req.user.id : null
    );

    const response = lectures.map((lecture) => {
      const base = sanitizeLecture(lecture);
      const key = lecture._id.toString();
      const summary = summaryMap.get(key);
      const enriched = {
        ...base,
        ratingAverage: summary?.average ?? null,
        ratingCount: summary?.count ?? 0,
      };
      if (userMap.has(key)) {
        enriched.myRating = userMap.get(key);
      }
      return enriched;
    });

    res.json({ lectures: response });
  } catch (error) {
    console.error('Error fetching lectures:', error);
    res.status(500).json({ message: req.t('errors.loadLectures') });
  }
};

export const createLecture = async (req, res) => {
  try {
    const { title, description, thumbnailUrl, resourceUrl, durationMinutes, subject, exam, language, tags, isPublished } =
      req.body ?? {};

    if (!title?.trim?.()) {
      return res.status(400).json({ message: req.t('errors.titleRequired') });
    }

    if (!resourceUrl?.trim?.()) {
      return res.status(400).json({ message: req.t('errors.resourceUrlRequired') });
    }

    const teacher = await User.findById(req.user.id).select('name');
    if (!teacher) {
      return res.status(404).json({ message: req.t('errors.teacherNotFound') });
    }

    const lecture = await Lecture.create({
      title: title.trim(),
      description: description?.trim() || '',
      thumbnailUrl: thumbnailUrl?.trim() || '',
      resourceUrl: resourceUrl.trim(),
      durationMinutes: typeof durationMinutes === 'number' ? durationMinutes : Number(durationMinutes) || undefined,
      subject: subject?.trim() || '',
      exam: exam?.toUpperCase?.() || 'GENERAL',
      language: language?.toUpperCase?.() || 'EN',
      tags: normalizeTags(tags),
      owner: req.user.id,
      ownerName: teacher.name,
      isPublished: parseBoolean(isPublished) || isPublished === undefined ? true : false,
    });

    res.status(201).json({ lecture: sanitizeLecture(lecture) });
  } catch (error) {
    console.error('Error creating lecture:', error);
    res.status(400).json({ message: req.t('errors.uploadLecture'), details: error.message });
  }
};

export const getLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      return res.status(404).json({ message: req.t('errors.lectureNotFound') });
    }

    const lecture = await Lecture.findById(lectureId).lean();
    if (!lecture) {
      return res.status(404).json({ message: req.t('errors.lectureNotFound') });
    }

    if (!lecture.isPublished && (!req.user || req.user.id !== lecture.owner.toString())) {
      return res.status(403).json({ message: req.t('errors.permissionDenied') });
    }

    const { summaryMap, userMap } = await collectLectureRatings(
      [lecture._id],
      req.user?.role === 'student' ? req.user.id : null
    );
    const key = lecture._id.toString();
    const summary = summaryMap.get(key);

    const payload = {
      ...sanitizeLecture(lecture),
      ratingAverage: summary?.average ?? null,
      ratingCount: summary?.count ?? 0,
      myRating: userMap.get(key) ?? null,
    };

    res.json({ lecture: payload });
  } catch (error) {
    console.error('Error fetching lecture:', error);
    res.status(500).json({ message: req.t('errors.loadLecture') });
  }
};

export const rateLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { rating } = req.body ?? {};

    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      return res.status(404).json({ message: req.t('errors.lectureNotFound') });
    }

    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: req.t('errors.ratingRange') });
    }

    const lecture = await Lecture.findById(lectureId).select('_id owner isPublished');
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    if (!lecture.isPublished && lecture.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: req.t('errors.rateUnpublished') });
    }

    await LectureRating.findOneAndUpdate(
      { lecture: lecture._id, student: req.user.id },
      { rating: numericRating },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const { summaryMap, userMap } = await collectLectureRatings([lecture._id], req.user.id);
    const key = lecture._id.toString();
    const summary = summaryMap.get(key);

    res.json({
      average: summary?.average ?? numericRating,
      count: summary?.count ?? 1,
      rating: userMap.get(key) ?? numericRating,
    });
  } catch (error) {
    console.error('Error saving lecture rating:', error);
    res.status(500).json({ message: req.t('errors.saveRating') });
  }
};

export const getLectureRatings = async (req, res) => {
  try {
    const { lectureId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    const lectureExists = await Lecture.exists({ _id: lectureId });
    if (!lectureExists) {
      return res.status(404).json({ message: req.t('errors.lectureNotFound') });
    }

    const { summaryMap, userMap } = await collectLectureRatings(
      [lectureId],
      req.user?.role === 'student' ? req.user.id : null
    );
    const summary = summaryMap.get(lectureId) ?? { average: null, count: 0 };

    res.json({
      average: summary.average,
      count: summary.count,
      rating: userMap.get(lectureId) ?? null,
    });
  } catch (error) {
    console.error('Error loading lecture ratings:', error);
    res.status(500).json({ message: req.t('errors.loadRatings') });
  }
};

export const deleteLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      return res.status(404).json({ message: req.t('errors.lectureNotFound') });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: req.t('errors.lectureNotFound') });
    }

    if (lecture.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: req.t('errors.deleteOwnLecture') });
    }

    await lecture.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting lecture:', error);
    res.status(500).json({ message: req.t('errors.deleteLecture') });
  }
};
