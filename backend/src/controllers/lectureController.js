import mongoose from 'mongoose';

import Lecture from '../models/Lecture.js';
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
        return res.status(401).json({ message: 'Authentication required' });
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
    res.json({ lectures: lectures.map(sanitizeLecture) });
  } catch (error) {
    console.error('Error fetching lectures:', error);
    res.status(500).json({ message: 'Failed to load lectures' });
  }
};

export const createLecture = async (req, res) => {
  try {
    const { title, description, thumbnailUrl, resourceUrl, durationMinutes, subject, exam, language, tags, isPublished } =
      req.body ?? {};

    if (!title?.trim?.()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!resourceUrl?.trim?.()) {
      return res.status(400).json({ message: 'Resource URL is required' });
    }

    const teacher = await User.findById(req.user.id).select('name');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher account not found' });
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
    res.status(400).json({ message: 'Failed to upload lecture', details: error.message });
  }
};

export const getLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    const lecture = await Lecture.findById(lectureId).lean();
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    if (!lecture.isPublished && (!req.user || req.user.id !== lecture.owner.toString())) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    res.json({ lecture: sanitizeLecture(lecture) });
  } catch (error) {
    console.error('Error fetching lecture:', error);
    res.status(500).json({ message: 'Failed to load lecture' });
  }
};

export const deleteLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    if (lecture.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only remove your own lectures' });
    }

    await lecture.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting lecture:', error);
    res.status(500).json({ message: 'Failed to delete lecture' });
  }
};
