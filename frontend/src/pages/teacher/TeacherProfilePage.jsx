import { useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';

import styles from './TeacherProfilePage.module.css';

const TeacherProfilePage = () => {
  const outletContext = useOutletContext() ?? {};
  const { currentUser, lectures = [], status, onRefresh } = outletContext;

  const lectureStats = useMemo(() => {
    if (!Array.isArray(lectures) || lectures.length === 0) {
      return {
        total: 0,
        averageDuration: 0,
        subjects: [],
        recent: null,
        tags: [],
      };
    }

    const durations = lectures
      .map((lecture) => Number.parseFloat(lecture.durationMinutes) || 0)
      .filter((value) => value > 0);
    const averageDuration = durations.length
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : 0;

    const subjectCounts = new Map();
    const tagSet = new Set();
    lectures.forEach((lecture) => {
      if (lecture.subject) {
        const key = lecture.subject.trim();
        subjectCounts.set(key, (subjectCounts.get(key) ?? 0) + 1);
      }
      (lecture.tags ?? []).forEach((tag) => {
        if (tag) tagSet.add(tag.trim());
      });
    });

    const subjects = Array.from(subjectCounts.entries())
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count);

    const recent = [...lectures].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    return {
      total: lectures.length,
      averageDuration,
      subjects,
      recent,
      tags: Array.from(tagSet).slice(0, 8),
    };
  }, [lectures]);

  const teacherInitial = currentUser?.name?.trim()?.[0]?.toUpperCase() ?? 'T';

  const signupDate = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
      })
    : null;

  const quickStats = useMemo(
    () => [
      {
        label: 'Total uploads',
        value: lectureStats.total,
        hint: 'Published to the student catalogue',
      },
      {
        label: 'Avg. duration',
        value: lectureStats.averageDuration ? `${lectureStats.averageDuration} mins` : '—',
        hint: 'Across timed lecture uploads',
      },
      {
        label: 'Unique subjects',
        value: lectureStats.subjects.length,
        hint: 'Based on your current uploads',
      },
      {
        label: 'Sync status',
        value: status?.lecturesLoading ? 'Syncing…' : 'Up to date',
        hint: status?.lecturesLoading ? 'Fetching the latest data' : 'Last refresh is live',
      },
    ],
    [lectureStats.averageDuration, lectureStats.subjects.length, lectureStats.total, status?.lecturesLoading]
  );

  return (
    <section className={styles.page}>
      <header className={styles.heroSection}>
        <div className={styles.heroMain}>
          <div className={styles.heroIdentity}>
            <div className={styles.heroAvatar} aria-hidden="true">
              <span>{teacherInitial}</span>
            </div>
            <div className={styles.heroHeading}>
              <p className={styles.heroEyebrow}>Teacher workspace</p>
              <div className={styles.heroTitleRow}>
                <h1 className={styles.heroTitle}>{currentUser?.name ?? 'Educator'}</h1>
                <span className={styles.heroVerified} aria-label="Verified educator">✔</span>
              </div>
            </div>
          </div>

          <div className={styles.heroInfoGrid}>
            <div className={styles.heroMetaStack}>
              <dl className={styles.metaList}>
                {currentUser?.email ? (
                  <div>
                    <dt>Email</dt>
                    <dd>{currentUser.email}</dd>
                  </div>
                ) : null}
                {currentUser?.role ? (
                  <div>
                    <dt>Role</dt>
                    <dd>{currentUser.role}</dd>
                  </div>
                ) : null}
                {signupDate ? (
                  <div>
                    <dt>Joined</dt>
                    <dd>{signupDate}</dd>
                  </div>
                ) : null}
              </dl>

              <div className={styles.heroActions}>
                <Link to="/teacher/upload" className={styles.primaryAction}>
                  Upload lecture
                </Link>
                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={onRefresh}
                  disabled={!onRefresh || status?.lecturesLoading}
                >
                  {status?.lecturesLoading ? 'Refreshing…' : 'Refresh data'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.heroStatsRow}>
          {quickStats.map((item) => (
            <article key={item.label} className={styles.statCard}>
              <p className={styles.statLabel}>{item.label}</p>
              <p className={styles.statValue}>{item.value}</p>
              <p className={styles.statHint}>{item.hint}</p>
            </article>
          ))}
        </div>
      </header>

      <div className={styles.panelGrid}>
        <section className={styles.panel} aria-labelledby="teacher-subjects-heading">
          <header className={styles.panelHeader}>
            <h2 id="teacher-subjects-heading">You have uploaded lectures of</h2>
            <p>Your most frequently published lecture categories.</p>
          </header>
          {lectureStats.subjects.length ? (
            <ul className={styles.subjectList}>
              {lectureStats.subjects.map((item) => (
                <li key={item.subject} className={styles.subjectChip}>
                  <span>{item.subject}</span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyState}>Upload your first lecture to start tracking subject stats.</div>
          )}
        </section>
      </div>

      <section className={styles.recentSection} aria-labelledby="teacher-recent-heading">
        <header className={styles.panelHeader}>
          <h2 id="teacher-recent-heading">Latest upload</h2>
          <p>Highlight of your most recent lecture shared with students.</p>
        </header>
        {lectureStats.recent ? (
          <article className={styles.recentCard}>
            <div className={styles.recentBody}>
              <p className={styles.recentEyebrow}>{lectureStats.recent.exam ?? 'GENERAL'}</p>
              <h3 className={styles.recentTitle}>{lectureStats.recent.title}</h3>
              {lectureStats.recent.description ? (
                <p className={styles.recentDescription}>{lectureStats.recent.description}</p>
              ) : null}
              <div className={styles.recentMeta}>
                {lectureStats.recent.durationMinutes ? (
                  <span>{lectureStats.recent.durationMinutes} mins</span>
                ) : null}
                {lectureStats.recent.subject ? <span>{lectureStats.recent.subject}</span> : null}
                <span>
                  Published{' '}
                  {new Date(lectureStats.recent.createdAt).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
            {lectureStats.recent.thumbnailUrl ? (
              <img
                src={lectureStats.recent.thumbnailUrl}
                alt="Lecture thumbnail"
                className={styles.recentThumb}
                loading="lazy"
              />
            ) : null}
          </article>
        ) : (
          <div className={styles.emptyState}>Your most recent upload will appear here once you publish a lecture.</div>
        )}
      </section>
    </section>
  );
};

export default TeacherProfilePage;
