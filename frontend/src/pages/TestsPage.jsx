import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import styles from './TestsPage.module.css';
import { fetchTests } from '../api/client';
import { DUMMY_LECTURE_TEST } from '../data/dummyLectureTest';

const formatDuration = (minutes) => {
  if (!minutes || Number.isNaN(Number(minutes))) return '15 min';
  return `${minutes} min`;
};

const DUMMY_FLASH_CARDS = [
  {
    slug: 'concept-sprint-mini-deck',
    title: 'Concept Sprint Mini Deck',
    description: 'Preview key formulas and rapid-fire prompts to warm up before a lecture quiz.',
    durationLabel: '5 min burst',
    secondaryLabel: 'Preview deck',
    secondaryTone: 'violet',
    theme: 'violet',
    isDummy: true,
  },
  {
    slug: 'strategy-snapshot-pack',
    title: 'Strategy Snapshot Pack',
    description: 'Glance through quick tactics to improve accuracy during timed assessments.',
    durationLabel: '8 min focus',
    secondaryLabel: 'Tactics',
    secondaryTone: 'amber',
    theme: 'amber',
    isDummy: true,
  },
];

const TestsPage = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setError('Unable to load tests right now. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const displayCards = useMemo(() => {
    const enriched = tests.map((topic) => ({
      ...topic,
      theme: topic.theme ?? 'indigo',
      secondaryLabel: topic.secondaryLabel ?? topic.difficulty,
      secondaryTone: topic.secondaryTone ?? 'neutral',
    }));
    return [...enriched, ...DUMMY_FLASH_CARDS];
  }, [tests]);

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <span className={styles.pageEyebrow}>Practice Zone</span>
        <h1 className={styles.pageTitle}>Test yourself with fast revision drills</h1>
        <p className={styles.pageSubtitle}>
          Choose a topic to launch a bite-sized assessment. Each test is optimised for offline-first practice
          sessions with instant scoring once you reconnect.
        </p>
      </header>

      {loading ? (
        <div className={styles.stateCard}>Loading tests…</div>
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
                      Coming soon
                    </button>
                  ) : (
                    <Link to={`/tests/${topic.slug}`} className={styles.cardButton}>
                      Start test
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
