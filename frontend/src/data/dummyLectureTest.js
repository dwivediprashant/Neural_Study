export const DUMMY_LECTURE_TEST = {
  slug: 'demo-lecture-quiz',
  title: 'Demo Lecture Quiz',
  description: 'Preview the upcoming lecture-linked quiz experience with a short virtual test.',
  durationMinutes: 10,
  difficulty: 'Sample',
  tags: ['demo', 'lecture'],
};

export const DUMMY_LECTURE_TEST_PAYLOAD = {
  slug: DUMMY_LECTURE_TEST.slug,
  title: DUMMY_LECTURE_TEST.title,
  durationMinutes: DUMMY_LECTURE_TEST.durationMinutes,
  difficulty: DUMMY_LECTURE_TEST.difficulty,
  questions: [
    {
      prompt: 'Which study habit helps you retain lecture content more effectively?',
      options: ['Listening once', 'Taking summary notes', 'Skipping to quizzes', 'Watching at 2x speed'],
      answerIndex: 1,
      explanation: 'Lightweight note-taking consolidates the main lecture ideas you will need for the quiz.',
    },
    {
      prompt: 'How do offline quizzes complement lecture downloads?',
      options: [
        'They do not work offline',
        'They provide quick recall checks even without internet',
        'They require live proctoring',
        'They delete lecture files after completion',
      ],
      answerIndex: 1,
      explanation: 'Quizzes will be cached with the lecture so you can revise anywhere.',
    },
    {
      prompt: 'What is the best next step after watching a lecture?',
      options: ['Close the app', 'Attempt the linked quiz to reinforce learning', 'Uninstall the app', 'Rewatch immediately'],
      answerIndex: 1,
      explanation: 'Taking the linked quiz right away strengthens recall and highlights weak spots.',
    },
  ],
};
