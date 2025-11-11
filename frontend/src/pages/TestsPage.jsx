import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import styles from './TestsPage.module.css';
import { fetchTests } from '../api/client';
import { DUMMY_LECTURE_TEST } from '../data/dummyLectureTest';

const formatDuration = (minutes) => {
  if (!minutes || Number.isNaN(Number(minutes))) return '15 min';
  return `${minutes} min`;
};

const FLASHCARD_CONFIG = [
  {
    slug: 'concept-sprint-mini-deck',
    theme: 'violet',
    secondaryTone: 'violet',
    translationBase: 'tests.flashcards.concept',
  },
  {
    slug: 'strategy-snapshot-pack',
    theme: 'amber',
    secondaryTone: 'amber',
    translationBase: 'tests.flashcards.strategy',
  },
];

const TestsPage = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { tests: apiTests } = await fetchTests();
        const mergedTests = [...(apiTests ?? [])];
        const alreadyExists = mergedTests.some((item) => item.slug === DUMMY_LECTURE_TEST.slug);
        if (!alreadyExists) {
          mergedTests.unshift({ ...DUMMY_LECTURE_TEST, isPreview: true });
        }
        setTests(mergedTests);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch tests', err);
        setError(t('tests.error'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [t]);

  const displayCards = useMemo(() => {
    const enriched = tests.map((topic) => ({
      ...topic,
      theme: topic.theme ?? 'indigo',
      secondaryLabel: topic.secondaryLabel ?? topic.difficulty,
      secondaryTone: topic.secondaryTone ?? 'neutral',
    }));

    const flashCards = FLASHCARD_CONFIG.map(({ slug, theme, secondaryTone, translationBase }) => ({
      slug,
      theme,
      secondaryTone,
      isDummy: true,
      title: t(`${translationBase}.title`),
      description: t(`${translationBase}.description`),
      durationLabel: t(`${translationBase}.duration`),
      secondaryLabel: t(`${translationBase}.secondary`),
    }));

    return [...enriched, ...flashCards];
  }, [tests, t]);

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <span className={styles.pageEyebrow}>{t('tests.practiceEyebrow')}</span>
        <h1 className={styles.pageTitle}>{t('tests.practiceTitle')}</h1>
        <p className={styles.pageSubtitle}>{t('tests.practiceSubtitle')}</p>
      </header>

      {loading ? (
        <div className={styles.stateCard}>{t('tests.loading')}</div>
      ) : error ? (
        <div className={styles.stateCard}>{error}</div>
      ) : (
        <div className={styles.grid}>
          {displayCards.map((topic) => {
            const isDummy = Boolean(topic.isDummy);
            const durationText = topic.durationLabel ?? formatDuration(topic.durationMinutes);
            const secondaryLabel = topic.secondaryLabel;
            const secondaryTone = topic.secondaryTone ?? 'neutral';
            const themeClassName = topic.theme ? styles[`cardTheme_${topic.theme}`] : '';

            return (
              <article
                key={topic.slug}
                className={`${styles.card} ${themeClassName} ${isDummy ? styles.cardDummy : ''}`}
              >
                <header className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>{topic.title}</h2>
                  <div className={styles.cardMeta}>
                    <span className={`${styles.badge} ${styles.badgePrimary}`}>{durationText}</span>
                    {secondaryLabel ? (
                      <span className={`${styles.badge} ${styles[`badge_${secondaryTone}`]}`}>{secondaryLabel}</span>
                    ) : null}
                  </div>
                </header>
                <p className={styles.cardDescription}>{topic.description}</p>
                <div className={styles.cardActions}>
                  {isDummy ? (
                    <button type="button" className={`${styles.cardButton} ${styles.cardButtonDisabled}`} disabled>
                      {t('tests.comingSoon')}
                    </button>
                  ) : (
                    <Link to={`/tests/${topic.slug}`} className={styles.cardButton}>
                      {t('tests.startTest')}
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default TestsPage;
