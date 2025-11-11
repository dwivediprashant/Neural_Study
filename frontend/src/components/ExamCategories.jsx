import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import styles from './ExamCategories.module.css';

const EXAM_CATEGORIES = [
  {
    id: 'neet',
    icon: '🧬',
    accent: 'accentNeet',
    tagKeys: ['class11', 'class12', 'dropper'],
    links: {
      class11: 'https://www.pw.live/neet/class-11',
      class12: 'https://www.pw.live/neet/class-12',
      dropper: 'https://www.pw.live/neet/dropper',
    },
  },
  {
    id: 'iit',
    icon: '🧪',
    accent: 'accentJee',
    tagKeys: ['class11', 'class12', 'dropper'],
    links: {
      class11: 'https://www.pw.live/iit-jee/class-11',
      class12: 'https://www.pw.live/iit-jee/class-12',
      dropper: 'https://www.pw.live/iit-jee/dropper',
    },
  },
  {
    id: 'gate',
    icon: '⚙️',
    accent: 'accentGate',
    tagKeys: ['cse', 'ece', 'ee'],
    links: {
      cse: 'https://www.pw.live/gate/cse',
      ece: 'https://www.pw.live/gate/ece',
      ee: 'https://www.pw.live/gate/ee',
    },
  },
  {
    id: 'upsc',
    icon: '🧭',
    accent: 'accentUpsc',
    tagKeys: ['prelims', 'mains', 'optional'],
    links: {
      prelims: 'https://www.pw.live/upsc/prelims',
      mains: 'https://www.pw.live/upsc/mains',
      optional: 'https://www.pw.live/upsc/optional',
    },
  },
];

const ExamCategoryCard = ({ category, t }) => (
  <article className={styles.card}>
    <div className={`${styles.iconWrap} ${styles[category.accent]}`} aria-hidden="true">
      <span className={styles.icon}>{category.icon}</span>
    </div>

    <div className={styles.cardBody}>
      <h3 className={styles.cardTitle}>{t(`exams.categories.${category.id}.title`)}</h3>
      <div className={styles.tagRow}>
        {category.tagKeys.map((tagKey) => (
          <a
            key={tagKey}
            href={category.links[tagKey]}
            className={styles.tag}
            target="_blank"
            rel="noreferrer"
          >
            {t(`exams.categories.${category.id}.tags.${tagKey}`)}
          </a>
        ))}
      </div>
      <Link to="/courses" className={styles.actionLink} state={{ focusExam: category.id }}>
        {t('exams.explore')}
      </Link>
    </div>
  </article>
);

const ExamCategories = () => {
  const { t } = useTranslation();

  return (
    <section className={styles.section} aria-labelledby="exam-categories-heading">
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>{t('exams.eyebrow')}</span>
          <h2 id="exam-categories-heading" className={styles.title}>
            {t('exams.title')}
          </h2>
          <p className={styles.subtitle}>{t('exams.subtitle')}</p>
        </header>

        <div className={styles.grid}>
          {EXAM_CATEGORIES.map((category) => (
            <ExamCategoryCard key={category.id} category={category} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExamCategories;
