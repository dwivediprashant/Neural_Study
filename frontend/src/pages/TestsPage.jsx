import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import styles from './TestsPage.module.css';
import { fetchTests } from '../api/client';
import { DUMMY_LECTURE_TEST } from '../data/dummyLectureTest';

const formatDuration = (minutes) => {
  if (!minutes || Number.isNaN(Number(minutes))) return '15 min';
  return `${minutes} min`;
};

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
      ) : tests.length === 0 ? (
        <div className={styles.stateCard}>No tests available right now. Please check back soon.</div>
      ) : (
        <div className={styles.grid}>
          {tests.map((topic) => (
            <article key={topic.slug} className={styles.card}>
              <header className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{topic.title}</h2>
                <div className={styles.cardMeta}>
                  <span className={styles.badge}>{formatDuration(topic.durationMinutes)}</span>
                  {topic.difficulty ? (
                    <span className={`${styles.badge} ${styles.badgeNeutral}`}>{topic.difficulty}</span>
                  ) : null}
                </div>
              </header>
              <p className={styles.cardDescription}>{topic.description}</p>
              <div className={styles.cardActions}>
                <Link to={`/tests/${topic.slug}`} className={styles.cardButton}>
                  Start test
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default TestsPage;
