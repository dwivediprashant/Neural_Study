import Course from '../models/Course.js';

const escapeRegex = (input = '') => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildCaseInsensitiveRegex = (value) => new RegExp(escapeRegex(value.trim()), 'i');

const normaliseListParam = (param) => {
  if (!param) return [];
  if (Array.isArray(param)) {
    return param.map((entry) => entry?.toString?.() ?? '').filter(Boolean);
  }
  return param
    .toString()
    .split(',')
    .map((entry) => entry?.trim?.())
    .filter(Boolean);
};

const sanitizeCourse = (course) => {
  if (!course) return null;
  return {
    id: course._id,
    title: course.title,
    slug: course.slug,
    exam: course.exam,
    category: course.category,
    language: course.language,
    languages: course.languages,
    progressPercentage: course.progressPercentage,
    access: course.access,
    thumbnail: course.thumbnail,
    updatedAt: course.updatedAt,
  };
};

export const getCourses = async (req, res) => {
  try {
    const { tag, tags, exam, userId } = req.query;

    const filter = {};

    const tagParams = [...normaliseListParam(tag), ...normaliseListParam(tags)];
    if (tagParams.length) {
      filter.tags = {
        $in: tagParams.map(buildCaseInsensitiveRegex),
      };
    }

    const examParams = normaliseListParam(exam)
      .map((entry) => entry.toUpperCase())
      .filter(Boolean);
    if (examParams.length) {
      filter.exam = { $in: examParams };
    }

    if (userId) {
      filter.$or = [{ owner: userId }, { enrolledUsers: userId }];
    }

    const courses = await Course.find(filter)
      .sort({ updatedAt: -1 })
      .select('-__v')
      .lean();

    res.json({ courses: courses.map(sanitizeCourse) });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Failed to load courses' });
  }
};

export const createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ course });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(400).json({ message: 'Failed to create course', details: error.message });
  }
};
