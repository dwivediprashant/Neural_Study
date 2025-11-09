import dotenv from 'dotenv';

import connectDB from '../src/config/db.js';
import Course from '../src/models/Course.js';

dotenv.config();

const ASSET_URLS = {
  video: '/mock-assets/sample-video.mp4',
  pdf: '/mock-assets/sample-handout.pdf',
  assignment: '/mock-assets/sample-handout.pdf',
  quiz: '/mock-assets/sample-quiz.json',
  flashcard: '/mock-assets/sample-quiz.json',
};

const sampleCourses = [
  {
    title: 'JEE Physics Booster: Mechanics Essentials',
    exam: 'JEE',
    level: 'FOUNDATION',
    language: 'EN',
    description: 'Compressed video lessons and flashcards covering Newtonian mechanics fundamentals for rural learners preparing for JEE.',
    tags: ['physics', 'mechanics', 'foundation'],
    totalSizeMB: 420,
    modules: [
      {
        name: 'Kinematics Refresher',
        order: 1,
        lessons: [
          {
            title: 'Understanding Motion Graphs',
            type: 'video',
            durationMinutes: 14,
            sizeMB: 22,
            assetUrl: ASSET_URLS.video,
            description: 'Low bandwidth animation-driven recap of displacement, velocity, and acceleration graphs.',
          },
          {
            title: 'Equation Sheet (PDF)',
            type: 'pdf',
            sizeMB: 2.1,
            assetUrl: ASSET_URLS.pdf,
            description: 'Printable summary of kinematics formulae with usage hints.',
          },
          {
            title: 'Checkpoint Quiz: Kinematics',
            type: 'quiz',
            sizeMB: 0.3,
            assetUrl: ASSET_URLS.quiz,
            description: '10 MCQ questions auto-graded on sync.',
          },
        ],
      },
      {
        name: 'Forces & Free Body Diagrams',
        order: 2,
        lessons: [
          {
            title: 'Drawing FBDs quickly',
            type: 'video',
            durationMinutes: 16,
            sizeMB: 24,
            assetUrl: ASSET_URLS.video,
          },
          {
            title: 'Practice Set: Force Balance',
            type: 'assignment',
            sizeMB: 3.4,
            assetUrl: ASSET_URLS.assignment,
          },
          {
            title: 'Flashcards: Newton’s Laws',
            type: 'flashcard',
            sizeMB: 0.5,
            assetUrl: ASSET_URLS.flashcard,
          },
        ],
      },
    ],
  },
  {
    title: 'JEE Mathematics Sprint: Algebra & Quadratics',
    exam: 'JEE',
    level: 'INTERMEDIATE',
    language: 'EN',
    description: 'Concept videos, solved examples, and practice quizzes for quadratic equations and progressions.',
    tags: ['mathematics', 'algebra'],
    totalSizeMB: 380,
    modules: [
      {
        name: 'Quadratic Concepts',
        order: 1,
        lessons: [
          {
            title: 'Root Relationships Explained',
            type: 'video',
            durationMinutes: 12,
            sizeMB: 18,
            assetUrl: ASSET_URLS.video,
          },
          {
            title: 'Worked Examples (PDF)',
            type: 'pdf',
            sizeMB: 2.6,
            assetUrl: ASSET_URLS.pdf,
          },
          {
            title: 'Quiz: Quadratic Applications',
            type: 'quiz',
            sizeMB: 0.4,
            assetUrl: ASSET_URLS.quiz,
          },
        ],
      },
      {
        name: 'Arithmetic & Geometric Progressions',
        order: 2,
        lessons: [
          {
            title: 'AP & GP Crash Course',
            type: 'video',
            durationMinutes: 17,
            sizeMB: 25,
            assetUrl: ASSET_URLS.video,
          },
          {
            title: 'Revision Flashcards',
            type: 'flashcard',
            sizeMB: 0.6,
            assetUrl: ASSET_URLS.flashcard,
          },
          {
            title: 'Practice Worksheet',
            type: 'assignment',
            sizeMB: 3.1,
            assetUrl: ASSET_URLS.assignment,
          },
        ],
      },
    ],
  },
  {
    title: 'NEET Biology Core: Cell Structure & Function',
    exam: 'NEET',
    level: 'FOUNDATION',
    language: 'HI',
    description: 'Hindi voice-over lectures, diagrams, and quizzes covering NCERT-aligned cell biology topics.',
    tags: ['biology', 'cell biology', 'hindi'],
    totalSizeMB: 410,
    modules: [
      {
        name: 'Cell Organelles Overview',
        order: 1,
        lessons: [
          {
            title: 'Tour of the Cell (Hindi)',
            type: 'video',
            durationMinutes: 15,
            sizeMB: 21,
            assetUrl: ASSET_URLS.video,
          },
          {
            title: 'Mind Map (PDF)',
            type: 'pdf',
            sizeMB: 1.9,
            assetUrl: ASSET_URLS.pdf,
          },
          {
            title: 'Flashcards: Organelles & Functions',
            type: 'flashcard',
            sizeMB: 0.5,
            assetUrl: ASSET_URLS.flashcard,
          },
        ],
      },
      {
        name: 'Plasma Membrane & Transport',
        order: 2,
        lessons: [
          {
            title: 'Membrane Transport Mechanisms',
            type: 'video',
            durationMinutes: 13,
            sizeMB: 19,
            assetUrl: ASSET_URLS.video,
          },
          {
            title: 'Self-Check Quiz',
            type: 'quiz',
            sizeMB: 0.4,
            assetUrl: ASSET_URLS.quiz,
          },
          {
            title: 'Worksheet: Osmosis & Diffusion',
            type: 'assignment',
            sizeMB: 2.8,
            assetUrl: ASSET_URLS.assignment,
          },
        ],
      },
    ],
  },
  {
    title: 'NEET Chemistry Quick Revise: Organic Basics',
    exam: 'NEET',
    level: 'INTERMEDIATE',
    language: 'EN',
    description: 'Compact organic chemistry primer with solved examples, reaction flashcards, and quizzes.',
    tags: ['chemistry', 'organic'],
    totalSizeMB: 360,
    modules: [
      {
        name: 'General Organic Chemistry',
        order: 1,
        lessons: [
          {
            title: 'Electronic Effects Overview',
            type: 'video',
            durationMinutes: 14,
            sizeMB: 20,
            assetUrl: ASSET_URLS.video,
          },
          {
            title: 'Reaction Mechanisms (PDF)',
            type: 'pdf',
            sizeMB: 3.0,
            assetUrl: ASSET_URLS.pdf,
          },
          {
            title: 'Mechanism Practice Quiz',
            type: 'quiz',
            sizeMB: 0.4,
            assetUrl: ASSET_URLS.quiz,
          },
        ],
      },
      {
        name: 'Hydrocarbons',
        order: 2,
        lessons: [
          {
            title: 'Alkanes & Alkenes explained',
            type: 'video',
            durationMinutes: 12,
            sizeMB: 18,
            assetUrl: ASSET_URLS.video,
          },
          {
            title: 'Problem Set',
            type: 'assignment',
            sizeMB: 3.3,
            assetUrl: ASSET_URLS.assignment,
          },
          {
            title: 'Flashcards: Named Reactions',
            type: 'flashcard',
            sizeMB: 0.6,
            assetUrl: ASSET_URLS.flashcard,
          },
        ],
      },
    ],
  },
  {
    title: 'Competitive Aptitude: Quantitative Mastery',
    exam: 'APTITUDE',
    level: 'INTERMEDIATE',
    language: 'EN',
    description: 'Time-saving strategies, drills, and assignments for arithmetic aptitude across SSC/Banking exams.',
    tags: ['aptitude', 'quant'],
    totalSizeMB: 290,
    modules: [
      {
        name: 'Percentages & Ratios',
        order: 1,
        lessons: [
          {
            title: 'Percent Basics Refresher',
            type: 'video',
            durationMinutes: 11,
            sizeMB: 16,
            assetUrl: ASSET_URLS.video,
          },
          {
            title: 'Ratio Tricks (PDF)',
            type: 'pdf',
            sizeMB: 1.7,
            assetUrl: ASSET_URLS.pdf,
          },
          {
            title: 'Quiz: Percent & Ratio',
            type: 'quiz',
            sizeMB: 0.3,
            assetUrl: ASSET_URLS.quiz,
          },
        ],
      },
      {
        name: 'Time & Work / Time & Distance',
        order: 2,
        lessons: [
          {
            title: 'Time & Work shortcuts',
            type: 'video',
            durationMinutes: 13,
            sizeMB: 19,
            assetUrl: ASSET_URLS.video,
          },
          {
            title: 'Practice Drills (Assignment)',
            type: 'assignment',
            sizeMB: 2.4,
            assetUrl: ASSET_URLS.assignment,
          },
          {
            title: 'Flashcards: Formula Recap',
            type: 'flashcard',
            sizeMB: 0.4,
            assetUrl: ASSET_URLS.flashcard,
          },
        ],
      },
    ],
  },
  {
    title: 'Competitive Aptitude: Logical Reasoning Drill Pack',
    exam: 'APTITUDE',
    level: 'INTERMEDIATE',
    language: 'EN',
    description: 'Reasoning sets, practice assignments, and quizzes covering seating arrangement, coding-decoding, and puzzles.',
    tags: ['aptitude', 'reasoning'],
    totalSizeMB: 310,
    modules: [
      {
        name: 'Seating & Arrangement',
        order: 1,
        lessons: [
          {
            title: 'Circular Arrangement Strategies',
            type: 'video',
            durationMinutes: 15,
            sizeMB: 20,
            assetUrl: ASSET_URLS.video,
          },
          {
            title: 'Practice Set (PDF)',
            type: 'assignment',
            sizeMB: 2.9,
            assetUrl: ASSET_URLS.assignment,
          },
          {
            title: 'Timed Quiz: Seating',
            type: 'quiz',
            sizeMB: 0.4,
            assetUrl: ASSET_URLS.quiz,
          },
        ],
      },
      {
        name: 'Coding-Decoding & Puzzles',
        order: 2,
        lessons: [
          {
            title: 'Coding-Decoding patterns explained',
            type: 'video',
            durationMinutes: 12,
            sizeMB: 17,
            assetUrl: ASSET_URLS.video,
          },
          {
            title: 'Puzzle Drill Sheet',
            type: 'assignment',
            sizeMB: 3.2,
            assetUrl: ASSET_URLS.assignment,
          },
          {
            title: 'Flashcards: Reasoning Tips',
            type: 'flashcard',
            sizeMB: 0.4,
            assetUrl: ASSET_URLS.flashcard,
          },
        ],
      },
    ],
  },
];

const seedCourses = async () => {
  try {
    await connectDB();
    await Course.deleteMany({});
    await Course.insertMany(sampleCourses);
    console.log(`✅ Seeded ${sampleCourses.length} courses successfully.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed courses:', error.message);
    process.exit(1);
  }
};

seedCourses();
