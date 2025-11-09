import Test from '../models/Test.js';
import TestAttempt from '../models/TestAttempt.js';

const sanitizeAttemptInput = (questions, responses = []) => {
  const cleaned = [];
  questions.forEach((question, index) => {
    const response = responses.find((entry) => entry.questionIndex === index);
    if (response && Number.isInteger(response.selectedIndex)) {
      const correctIndex = question.answerIndex;
      const selectedIndex = Math.max(0, Math.min(question.options.length - 1, response.selectedIndex));
      cleaned.push({
        questionIndex: index,
        selectedIndex,
        correctIndex,
        isCorrect: selectedIndex === correctIndex,
      });
    }
  });
  return cleaned;
};

export const listTests = async (_req, res) => {
  try {
    const tests = await Test.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .select('title slug description durationMinutes difficulty exam tags updatedAt')
      .lean();

    res.json({ tests });
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ message: 'Failed to load tests' });
  }
};

export const getTestBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const testDoc = await Test.findOne({ slug, isPublished: true })
      .select('-__v -createdAt -updatedAt')
      .lean();

    if (!testDoc) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const test = {
      ...testDoc,
      questions: (testDoc.questions || []).map((question) => ({
        ...question,
        options: (question.options || []).map((option) =>
          typeof option === 'string' ? option : option?.text ?? ''
        ),
      })),
    };

    res.json({ test });
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ message: 'Failed to load test' });
  }
};

export const submitTestAttempt = async (req, res) => {
  try {
    const { slug } = req.params;
    const { responses = [], durationMinutes = 0 } = req.body ?? {};

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const test = await Test.findOne({ slug, isPublished: true }).lean();

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    if (!Array.isArray(test.questions) || !test.questions.length) {
      return res.status(400).json({ message: 'Test has no questions configured' });
    }

    const cleanedResponses = sanitizeAttemptInput(test.questions, responses);
    const correctCount = cleanedResponses.filter((entry) => entry.isCorrect).length;
    const total = test.questions.length;
    const percent = (correctCount / total) * 100;

    const attempt = await TestAttempt.create({
      test: test._id,
      userId,
      score: correctCount,
      total,
      percent,
      durationMinutes,
      responses: cleanedResponses,
    });

    res.status(201).json({
      attempt: {
        id: attempt._id,
        testId: test.slug,
        score: attempt.score,
        total: attempt.total,
        percent: attempt.percent,
        durationMinutes: attempt.durationMinutes,
        completedAt: attempt.createdAt,
        difficulty: test.difficulty,
        duration: `${test.durationMinutes} min`,
      },
    });
  } catch (error) {
    console.error('Error submitting test attempt:', error);
    res.status(500).json({ message: 'Failed to submit attempt' });
  }
};

export const listTestAttempts = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 5 } = req.query;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const attempts = await TestAttempt.find({ userId })
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 5)
      .populate('test', 'title slug difficulty durationMinutes')
      .lean();

    res.json({
      attempts: attempts.map((attempt) => ({
        id: attempt._id,
        testId: attempt.test?.slug,
        title: attempt.test?.title,
        score: attempt.score,
        total: attempt.total,
        percent: attempt.percent,
        durationMinutes: attempt.durationMinutes,
        difficulty: attempt.test?.difficulty,
        duration: attempt.test ? `${attempt.test.durationMinutes} min` : undefined,
        completedAt: attempt.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching attempts:', error);
    res.status(500).json({ message: 'Failed to load attempts' });
  }
};
