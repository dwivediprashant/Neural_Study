import { useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import styles from './TeacherProfilePage.module.css';

const TeacherProfilePage = () => {
  const outletContext = useOutletContext() ?? {};
  const { currentUser, lectures = [], status, onRefresh } = outletContext;
  const { t } = useTranslation();

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
        label: t('teacher.profile.stats.total.label'),
        value: lectureStats.total,
        hint: t('teacher.profile.stats.total.hint'),
      },
      {
        label: t('teacher.profile.stats.average.label'),
        value: lectureStats.averageDuration
          ? t('teacher.profile.stats.average.value', { minutes: lectureStats.averageDuration })
          : t('teacher.profile.stats.average.empty'),
        hint: t('teacher.profile.stats.average.hint'),
      },
      {
        label: t('teacher.profile.stats.subjects.label'),
        value: lectureStats.subjects.length,
        hint: t('teacher.profile.stats.subjects.hint'),
      },
      {
        label: t('teacher.profile.stats.sync.label'),
        value: status?.lecturesLoading
          ? t('teacher.profile.stats.sync.valueSyncing')
          : t('teacher.profile.stats.sync.valueIdle'),
        hint: status?.lecturesLoading
          ? t('teacher.profile.stats.sync.hintSyncing')
          : t('teacher.profile.stats.sync.hintIdle'),
      },
    ],
    [
      lectureStats.averageDuration,
      lectureStats.subjects.length,
      lectureStats.total,
      status?.lecturesLoading,
      t,
    ]
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
              <p className={styles.heroEyebrow}>{t('teacher.profile.heroEyebrow')}</p>
              <div className={styles.heroTitleRow}>
                <h1 className={styles.heroTitle}>{currentUser?.name ?? t('teacher.profile.fallbackName')}</h1>
                <span
                  className={styles.heroVerified}
                  aria-label={t('teacher.profile.verifiedAria')}
                >
                  ✔
                </span>
              </div>
            </div>
          </div>

          <div className={styles.heroInfoGrid}>
            <div className={styles.heroMetaStack}>
              <dl className={styles.metaList}>
                {currentUser?.email ? (
                  <div>
                    <dt>{t('teacher.profile.meta.email')}</dt>
                    <dd>{currentUser.email}</dd>
                  </div>
                ) : null}
                {currentUser?.role ? (
                  <div>
                    <dt>{t('teacher.profile.meta.role')}</dt>
                    <dd>{currentUser.role}</dd>
                  </div>
                ) : null}
                {signupDate ? (
                  <div>
                    <dt>{t('teacher.profile.meta.joined')}</dt>
                    <dd>{signupDate}</dd>
                  </div>
                ) : null}
              </dl>

              <div className={styles.heroActions}>
                <Link to="/teacher/upload" className={styles.primaryAction}>
                  {t('teacher.nav.upload')}
                </Link>
                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={onRefresh}
                  disabled={!onRefresh || status?.lecturesLoading}
                >
                  {status?.lecturesLoading
                    ? t('teacher.profile.refreshBusy')
                    : t('teacher.profile.refreshIdle')}
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
            <h2 id="teacher-subjects-heading">{t('teacher.profile.subjects.title')}</h2>
            <p>{t('teacher.profile.subjects.description')}</p>
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
            <div className={styles.emptyState}>{t('teacher.profile.subjects.empty')}</div>
          )}
        </section>
      </div>

      <section className={styles.recentSection} aria-labelledby="teacher-recent-heading">
        <header className={styles.panelHeader}>
          <h2 id="teacher-recent-heading">{t('teacher.profile.recent.title')}</h2>
          <p>{t('teacher.profile.recent.description')}</p>
        </header>
        {lectureStats.recent ? (
          <article className={styles.recentCard}>
            <div className={styles.recentBody}>
              <p className={styles.recentEyebrow}>
                {lectureStats.recent.exam ?? t('teacher.profile.genericExam')}
              </p>
              <h3 className={styles.recentTitle}>{lectureStats.recent.title}</h3>
              {lectureStats.recent.description ? (
                <p className={styles.recentDescription}>{lectureStats.recent.description}</p>
              ) : null}
              <div className={styles.recentMeta}>
                {lectureStats.recent.durationMinutes ? (
                  <span>
                    {t('teacher.profile.duration', {
                      minutes: lectureStats.recent.durationMinutes,
                    })}
                  </span>
                ) : null}
                {lectureStats.recent.subject ? <span>{lectureStats.recent.subject}</span> : null}
                <span>
                  {t('teacher.profile.published', {
                    timestamp: new Date(lectureStats.recent.createdAt).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  })}
                </span>
              </div>
            </div>
            {lectureStats.recent.thumbnailUrl ? (
              <img
                src={lectureStats.recent.thumbnailUrl}
                alt={t('teacher.profile.thumbnailAlt')}
                className={styles.recentThumb}
                loading="lazy"
              />
            ) : null}
          </article>
        ) : (
          <div className={styles.emptyState}>{t('teacher.profile.recent.empty')}</div>
        )}
      </section>
    </section>
  );
};

export default TeacherProfilePage;
