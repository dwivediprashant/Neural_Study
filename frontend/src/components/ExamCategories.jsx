import { Link } from 'react-router-dom';

import styles from './ExamCategories.module.css';

const EXAM_CATEGORIES = [
  {
    id: 'neet',
    title: 'NEET',
    icon: '🧬',
    accent: 'accentNeet',
    tags: [
      { label: 'Class 11', href: 'https://www.pw.live/neet/class-11' },
      { label: 'Class 12', href: 'https://www.pw.live/neet/class-12' },
      { label: 'Dropper', href: 'https://www.pw.live/neet/dropper' },
    ],
  },
  {
    id: 'iit',
    title: 'IIT JEE',
    icon: '🧪',
    accent: 'accentJee',
    tags: [
      { label: 'Class 11', href: 'https://www.pw.live/iit-jee/class-11' },
      { label: 'Class 12', href: 'https://www.pw.live/iit-jee/class-12' },
      { label: 'Dropper', href: 'https://www.pw.live/iit-jee/dropper' },
    ],
  },
  {
    id: 'gate',
    title: 'GATE',
    icon: '⚙️',
    accent: 'accentGate',
    tags: [
      { label: 'CSE', href: 'https://www.pw.live/gate/cse' },
      { label: 'ECE', href: 'https://www.pw.live/gate/ece' },
      { label: 'EE', href: 'https://www.pw.live/gate/ee' },
    ],
  },
  {
    id: 'upsc',
    title: 'UPSC',
    icon: '🧭',
    accent: 'accentUpsc',
    tags: [
      { label: 'CSE Prelims', href: 'https://www.pw.live/upsc/prelims' },
      { label: 'CSE Mains', href: 'https://www.pw.live/upsc/mains' },
      { label: 'Optional', href: 'https://www.pw.live/upsc/optional' },
    ],
  },
];

const ExamCategoryCard = ({ category }) => (
  <article className={styles.card}>
    <div className={`${styles.iconWrap} ${styles[category.accent]}`} aria-hidden="true">
      <span className={styles.icon}>{category.icon}</span>
    </div>

    <div className={styles.cardBody}>
      <h3 className={styles.cardTitle}>{category.title}</h3>
      <div className={styles.tagRow}>
        {category.tags.map((tag) => (
          <a key={tag.label} href={tag.href} className={styles.tag} target="_blank" rel="noreferrer">
            {tag.label}
          </a>
        ))}
      </div>
      <Link to="/courses" className={styles.actionLink} state={{ focusExam: category.id }}>
        Explore category
      </Link>
    </div>
  </article>
);

const ExamCategories = () => {
  return (
    <section className={styles.section} aria-labelledby="exam-categories-heading">
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Exam catalogue</span>
          <h2 id="exam-categories-heading" className={styles.title}>
            Explore exam categories
          </h2>
          <p className={styles.subtitle}>
            Choose a track to see recommended offline-ready batches for your preparation journey.
          </p>
        </header>

        <div className={styles.grid}>
          {EXAM_CATEGORIES.map((category) => (
            <ExamCategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExamCategories;
