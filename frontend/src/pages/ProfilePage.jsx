import { useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';

import styles from './ProfilePage.module.css';

const FALLBACK_STUDENT = {
  name: 'Aditi Patel',
  grade: 'JEE Advanced Prep',
  location: 'Jaipur, Rajasthan',
  joinedOn: 'Feb 2025',
};

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
    });
  } catch (_) {
    return null;
  }
};

function ProfilePage() {
  const outletContext = useOutletContext() ?? {};
  const {
    currentUser,
    profile = FALLBACK_STUDENT,
    courses = [],
    downloads = [],
    downloadsStats = {
      total: 0,
      sizeMB: 0,
      assetsCached: 0,
      assetsFailed: 0,
      lastUpdated: null,
    },
    testAttempts = [],
    testAttemptsLoading = false,
    testAttemptsError = null,
  } = outletContext;

  const resolvedProfile = useMemo(() => {
    if (!currentUser) {
      return profile;
    }

    return {
      name: currentUser.name || profile.name || FALLBACK_STUDENT.name,
      grade: currentUser.meta?.grade || profile.grade || FALLBACK_STUDENT.grade,
      location: currentUser.meta?.location || profile.location || FALLBACK_STUDENT.location,
      joinedOn:
        formatDate(currentUser.createdAt) || profile.joinedOn || FALLBACK_STUDENT.joinedOn,
      email: currentUser.email,
    };
  }, [currentUser, profile]);

  const greetingName = resolvedProfile.name?.split(' ')?.[0] ?? FALLBACK_STUDENT.name.split(' ')[0];

  const enrolledCourses = useMemo(() => {
    if (!Array.isArray(courses) || courses.length === 0) {
      return [];
    }

    return courses.slice(0, 4).map((course) => ({
      id: course._id || course.id,
      title: course.title || course.name || 'Untitled course',
      exam: course.exam || course.category || 'General',
      language: course.language || course.languages?.join(', ') || 'English',
      progress: course.progressPercentage ?? 0,
    }));
  }, [courses]);

  const offlineCourseCount = downloadsStats.total ?? 0;
  const totalCourses = courses?.length ?? 0;

  const testSummary = useMemo(() => {
    if (!Array.isArray(testAttempts) || testAttempts.length === 0) {
      return {
        attempts: 0,
        averagePercent: null,
        bestPercent: null,
        recentTrend: null,
      };
    }

    const attempts = testAttempts.length;
    const percents = testAttempts.map((attempt) => attempt.percent ?? 0);
    const averagePercent = Math.round(percents.reduce((sum, value) => sum + value, 0) / attempts);
    const bestPercent = Math.max(...percents.map((value) => Math.round(value)));

    let recentTrend = null;
    if (attempts >= 2) {
      const [latest, previous] = percents;
      const delta = Math.round(latest - previous);
      recentTrend = delta === 0 ? 'No change from last attempt' : `${delta > 0 ? '+' : ''}${delta}% vs last attempt`;
    }

    return {
      attempts,
      averagePercent,
      bestPercent,
      recentTrend,
    };
  }, [testAttempts]);

  const recentReports = useMemo(() => testAttempts.slice(0, 3), [testAttempts]);

  const focusSuggestions = useMemo(() => {
    if (!Array.isArray(courses) || courses.length === 0) {
      return [];
    }

    return [...courses]
      .sort((a, b) => (a.progressPercentage ?? 0) - (b.progressPercentage ?? 0))
      .slice(0, 3)
      .map((course) => ({
        id: course._id || course.id,
        title: course.title || course.name || 'Untitled course',
        progress: Math.round(course.progressPercentage ?? 0),
        exam: course.exam || 'General',
      }));
  }, [courses]);

  const formatSizeMB = (value) => {
    if (!value || Number.isNaN(value)) return '0 MB';
    if (value < 1) return `${(value * 1024).toFixed(0)} KB`;
    return `${value.toFixed(1)} MB`;
  };

  const quickStats = useMemo(
    () => [
      {
        label: 'Tests completed',
        value: testSummary.attempts ?? 0,
        hint:
          testSummary.attempts > 0
            ? `Best score ${testSummary.bestPercent ?? 0}%`
            : 'Launch a quiz to capture your first score.',
      },
      {
        label: 'Average score',
        value: testSummary.averagePercent !== null ? `${testSummary.averagePercent}%` : '—',
        hint: testSummary.recentTrend ?? 'Take another attempt to build momentum.',
      },
      {
        label: 'Courses enrolled',
        value: totalCourses,
        hint: totalCourses ? 'Focus on consistent completion.' : 'Browse Explore to join a course.',
      },
      {
        label: 'Offline ready',
        value: offlineCourseCount,
        hint:
          offlineCourseCount > 0
            ? `${formatSizeMB(downloadsStats.sizeMB)} cached for study without internet.`
            : 'Save key lectures for low-connectivity sessions.',
      },
    ],
    [
      testSummary.attempts,
      testSummary.bestPercent,
      testSummary.averagePercent,
      testSummary.recentTrend,
      totalCourses,
      offlineCourseCount,
      downloadsStats.sizeMB,
    ]
  );

  const level = useMemo(
    () => Math.max(1, Math.floor((testSummary.bestPercent ?? 0) / 20) + 1),
    [testSummary.bestPercent]
  );

  const xpPercent = useMemo(() => {
    if (testSummary.averagePercent === null || Number.isNaN(testSummary.averagePercent)) {
      return 0;
    }
    return Math.min(100, Math.max(0, Math.round(testSummary.averagePercent)));
  }, [testSummary.averagePercent]);

  const streakLabel = useMemo(() => {
    if (testSummary.attempts >= 3) {
      return `On a ${testSummary.attempts}-test streak`;
    }
    if (testSummary.attempts === 2) {
      return 'Momentum building';
    }
    if (testSummary.attempts === 1) {
      return 'Great start—keep going!';
    }
    return 'Launch a test to begin your streak';
  }, [testSummary.attempts]);

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div className={styles.heroRibbon}>Neural Study · Prep tier</div>
            <div className={styles.heroAvatar} aria-hidden="true">
              <svg viewBox="0 0 48 48" role="img" aria-label="Profile icon">
                <defs>
                  <linearGradient id="profileIconGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <rect width="48" height="48" rx="14" fill="url(#profileIconGradient)" />
                <path
                  d="M24 14a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 14c5.523 0 10 2.91 10 6.5V36a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2v-1.5c0-3.59 4.477-6.5 10-6.5Z"
                  fill="#f8fafc"
                />
              </svg>
            </div>
          </div>
          <div className={styles.heroBody}>
            <div className={styles.heroBadgeRow}>
              <span className={styles.heroChip}>Level {level}</span>
              <span className={styles.heroChipSoft}>{streakLabel}</span>
            </div>
            <h1 className={styles.heroTitle}>{resolvedProfile.name}</h1>
            <p className={styles.heroSubtitle}>
              Stay on top of your preparation with a personalised snapshot of progress, tests, and downloads.
            </p>
            <div className={styles.heroMeta}>
              {resolvedProfile.grade ? <span>{resolvedProfile.grade}</span> : null}
              {resolvedProfile.location ? <span>{resolvedProfile.location}</span> : null}
              {resolvedProfile.email ? <span>{resolvedProfile.email}</span> : null}
              {resolvedProfile.joinedOn ? <span>Member since {resolvedProfile.joinedOn}</span> : null}
            </div>
            <div className={styles.heroProgress}>
              <div className={styles.heroProgressTrack}>
                <div className={styles.heroProgressValue} style={{ width: `${xpPercent}%` }} />
              </div>
              <span>{xpPercent}% mastery</span>
            </div>
          </div>
          <div className={styles.heroActions}>
            <Link to="/courses" className={styles.primaryAction}>
              Explore courses
            </Link>
            <Link to="/downloads" className={styles.secondaryAction}>
              Manage downloads
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.quickStatsSection} aria-labelledby="quick-stats-heading">
        <div className={styles.sectionHeading}>
          <h2 id="quick-stats-heading">At a glance</h2>
          <p>A minimal overview of the essentials powering your study plan.</p>
        </div>
        <div className={styles.quickStatsGrid}>
          {quickStats.map((item) => (
            <article key={item.label} className={styles.quickStatCard}>
              <p className={styles.quickStatLabel}>{item.label}</p>
              <p className={styles.quickStatValue}>{item.value}</p>
              <p className={styles.quickStatHint}>{item.hint}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.reportsSection} aria-labelledby="recent-tests-heading">
        <div className={styles.sectionHeader}>
          <h2 id="recent-tests-heading" className={styles.sectionTitle}>
            Recent test reports
          </h2>
          <p className={styles.sectionHint}>
            Track how your quick drills are trending. Reports are kept for your latest attempts.
          </p>
        </div>
        {testAttemptsLoading ? (
          <div className={styles.stateCard}>Loading recent attempts…</div>
        ) : testAttemptsError ? (
          <div className={styles.stateCard}>{testAttemptsError}</div>
        ) : recentReports.length ? (
          <ul className={styles.reportsList}>
            {recentReports.map((report) => (
              <li key={report.id} className={styles.reportCard}>
                <div className={styles.reportHeader}>
                  <h3 className={styles.reportTitle}>{report.title}</h3>
                  <span className={styles.reportScore}>{Math.round(report.percent)}%</span>
                </div>
                <p className={styles.reportMeta}>
                  {report.score}/{report.total} correct · {report.difficulty} · {report.duration}
                </p>
                <p className={styles.reportTimestamp}>
                  Completed {new Date(report.completedAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.emptyState}>
            <p>No tests attempted yet.</p>
            <p className={styles.emptyHint}>
              Head to <Link to="/tests">Tests</Link> to take your first drill.
            </p>
          </div>
        )}
      </section>
      <section className={styles.focusSection} aria-labelledby="up-next-heading">
        <div className={styles.sectionHeader}>
          <h2 id="up-next-heading" className={styles.sectionTitle}>
            Up next
          </h2>
          <p className={styles.sectionHint}>Courses closest to completion appear first.</p>
        </div>
        {focusSuggestions.length ? (
          <ul className={styles.focusList}>
            {focusSuggestions.map((item) => (
              <li key={item.id} className={styles.focusItem}>
                <h3>{item.title}</h3>
                <p>
                  {item.exam} · {item.progress}% complete
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.emptyState}>
            <p>No recommendations yet.</p>
            <p className={styles.emptyHint}>Start a course to get personalised next steps.</p>
          </div>
        )}
      </section>
    </section>
  );
}

export default ProfilePage;
