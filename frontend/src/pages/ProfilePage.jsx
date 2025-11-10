import { useMemo, useState, useCallback } from "react";
import { Link, useOutletContext } from "react-router-dom";

import styles from "./ProfilePage.module.css";

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
    });
  } catch (_) {
    return null;
  }
};

function ProfilePage() {
  const outletContext = useOutletContext() ?? {};
  const {
    currentUser,
    profile = {},
    courses = [],
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
    rateLecture,
    refreshLectureRating,
  } = outletContext;

  const resolvedProfile = useMemo(() => {
    const base = profile ?? {};
    const user = currentUser ?? {};

    return {
      name: user.name ?? base.name ?? "",
      grade: user.meta?.grade ?? base.grade ?? "",
      location: user.meta?.location ?? base.location ?? "",
      joinedOn: formatDate(user.createdAt) ?? base.joinedOn ?? "",
      email: user.email ?? base.email ?? "",
    };
  }, [currentUser, profile]);

  const enrolledCourses = useMemo(() => {
    if (!Array.isArray(courses) || courses.length === 0) {
      return [];
    }

    return courses.slice(0, 4).map((course) => ({
      id: course._id || course.id,
      title: course.title || course.name || "Untitled course",
      exam: course.exam || course.category || "General",
      language: course.language || course.languages?.join(", ") || "English",
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
    const averagePercent = Math.round(
      percents.reduce((sum, value) => sum + value, 0) / attempts
    );
    const bestPercent = Math.max(...percents.map((value) => Math.round(value)));

    let recentTrend = null;
    if (attempts >= 2) {
      const [latest, previous] = percents;
      const delta = Math.round(latest - previous);
      recentTrend =
        delta === 0
          ? "No change from last attempt"
          : `${delta > 0 ? "+" : ""}${delta}% vs last attempt`;
    }

    return {
      attempts,
      averagePercent,
      bestPercent,
      recentTrend,
    };
  }, [testAttempts]);

  const recentReports = useMemo(() => testAttempts.slice(0, 3), [testAttempts]);

  const formatSizeMB = (value) => {
    if (!value || Number.isNaN(value)) return "0 MB";
    if (value < 1) return `${(value * 1024).toFixed(0)} KB`;
    return `${value.toFixed(1)} MB`;
  };

  const level = useMemo(
    () => Math.max(1, Math.floor((testSummary.bestPercent ?? 0) / 20) + 1),
    [testSummary.bestPercent]
  );

  const xpPercent = useMemo(() => {
    if (
      testSummary.averagePercent === null ||
      Number.isNaN(testSummary.averagePercent)
    ) {
      return 0;
    }
    return Math.min(100, Math.max(0, Math.round(testSummary.averagePercent)));
  }, [testSummary.averagePercent]);

  const streakLabel = useMemo(() => {
    if (testSummary.attempts >= 3) {
      return `On a ${testSummary.attempts}-test streak`;
    }
    if (testSummary.attempts === 2) {
      return "Momentum building";
    }
    if (testSummary.attempts === 1) {
      return "Great start—keep going!";
    }
    return "Launch a test to begin your streak";
  }, [testSummary.attempts]);

  const achievementBadges = useMemo(
    () => [
      {
        id: "streak",
        icon: "🔥",
        title: testSummary.attempts >= 3 ? "Streak master" : "Warm up",
        caption:
          testSummary.attempts >= 3
            ? `${testSummary.attempts} drills in a row`
            : "Build your streak with consistent drills",
      },
      {
        id: "collector",
        icon: "📦",
        title: offlineCourseCount > 0 ? "Offline collector" : "Cache seeker",
        caption:
          offlineCourseCount > 0
            ? `${offlineCourseCount} lecture${
                offlineCourseCount === 1 ? "" : "s"
              } ready offline`
            : "Save lectures for zero-buffer revision",
      },
      {
        id: "level",
        icon: "🚀",
        title: `Level ${level}`,
        caption: xpPercent
          ? `${xpPercent}% mastery unlocked`
          : "Complete tests to boost mastery",
      },
    ],
    [level, offlineCourseCount, testSummary.attempts, xpPercent]
  );

  const insightStats = useMemo(() => {
    const offlinePercent = Math.min(
      100,
      Math.round(((downloadsStats.sizeMB ?? 0) / 2048) * 100)
    );
    const streakPercent = Math.min(
      100,
      Math.round((testSummary.attempts / 5) * 100)
    );

    return [
      {
        id: "score",
        label: "Accuracy pulse",
        value:
          testSummary.averagePercent !== null
            ? `${testSummary.averagePercent}%`
            : "—",
        hint:
          testSummary.recentTrend ??
          "Complete another drill to track improvement.",
        percent: testSummary.averagePercent ?? 0,
        color: "#6366f1",
      },
      {
        id: "offline",
        label: "Offline readiness",
        value: formatSizeMB(downloadsStats.sizeMB),
        hint:
          offlineCourseCount > 0
            ? `${offlineCourseCount} cached lecture${
                offlineCourseCount === 1 ? "" : "s"
              }`
            : "Cache lectures to continue learning offline.",
        percent: offlinePercent,
        color: "#22d3ee",
      },
      {
        id: "streak",
        label: "Consistency streak",
        value: `${testSummary.attempts ?? 0} attempts`,
        hint: streakLabel,
        percent: streakPercent,
        color: "#f97316",
      },
    ];
  }, [downloadsStats.sizeMB, offlineCourseCount, streakLabel, testSummary]);

  const [ratingBusyId, setRatingBusyId] = useState(null);

  const handleRateLecture = useCallback(
    async (lectureId, value) => {
      if (!lectureId || typeof value !== "number" || value < 1 || value > 5) {
        return;
      }
      if (ratingBusyId === lectureId) return;
      setRatingBusyId(lectureId);
      try {
        const result = await rateLecture?.(lectureId, value);
        if (!result?.success && refreshLectureRating) {
          await refreshLectureRating(lectureId);
        }
      } finally {
        setRatingBusyId(null);
      }
    },
    [rateLecture, refreshLectureRating, ratingBusyId]
  );

  const recentlyViewedLectures = useMemo(() => {
    const contextRecentLectures = outletContext?.recentLectures;
    if (Array.isArray(contextRecentLectures) && contextRecentLectures.length) {
      return contextRecentLectures.slice(0, 4);
    }

    const candidateSources = [
      profile?.recentLectures,
      profile?.recentlyViewedLectures,
      currentUser?.recentLectures,
    ].filter(Array.isArray);

    if (!candidateSources.length) {
      return [];
    }

    const source = candidateSources[0];

    return source.slice(0, 4).map((lecture, index) => {
      const viewedAt =
        lecture.viewedAt ||
        lecture.lastViewedAt ||
        lecture.updatedAt ||
        lecture.completedAt ||
        lecture.createdAt ||
        null;

      return {
        id: lecture.id || lecture._id || `recent-${index}`,
        title: lecture.title || "Untitled lecture",
        subject: lecture.subject || lecture.exam || "General",
        duration: lecture.duration || lecture.durationMinutes || null,
        viewedAt,
        thumbnail: lecture.thumbnail || lecture.thumbnailUrl || null,
        ratingAverage: lecture.ratingAverage ?? null,
        ratingCount: lecture.ratingCount ?? 0,
        myRating: lecture.myRating ?? null,
      };
    });
  }, [
    outletContext?.recentLectures,
    profile?.recentLectures,
    profile?.recentlyViewedLectures,
    currentUser?.recentLectures,
  ]);

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCard}>
          <div className={styles.heroPrimary}>
            <div className={styles.heroAvatar} aria-hidden="true">
              <svg viewBox="0 0 72 72" role="img" aria-label="Profile icon">
                <defs>
                  <linearGradient
                    id="profileIconGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
                <rect
                  width="72"
                  height="72"
                  rx="20"
                  fill="url(#profileIconGradient)"
                />
                <path
                  d="M36 20a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 21c8.285 0 15 4.365 15 9.75V54a3 3 0 0 1-3 3H24a3 3 0 0 1-3-3v-3.25C21 45.365 27.715 41 36 41Z"
                  fill="#f8fafc"
                />
              </svg>
            </div>
            <div className={styles.heroSummary}>
              <div>
                <p className={styles.heroEyebrow}>Player profile</p>
                <h1 className={styles.heroTitle}>
                  {resolvedProfile.name || "Learner"}
                </h1>
              </div>
              <ul className={styles.heroBadgeStrip}>
                <li
                  className={styles.heroBadge}
                  tabIndex={0}
                  aria-label="Elite streak badge"
                  data-hint="Maintain a blazing practice streak"
                >
                  <svg viewBox="0 0 64 80" aria-hidden="true">
                    <circle cx="32" cy="28" r="26" fill="#ef4444" />
                    <circle cx="32" cy="28" r="20" fill="#fff7ed" />
                    <path
                      d="M32 14 35.9 24.6 47 25.4 38 33.2 40.8 44 32 38.4 23.2 44 26 33.2 17 25.4 28.1 24.6Z"
                      fill="#facc15"
                    />
                    <path
                      d="M22 42 12 70 26 60 32 78 38 60 52 70 42 42Z"
                      fill="#22c55e"
                    />
                  </svg>
                </li>
                <li
                  className={styles.heroBadge}
                  tabIndex={0}
                  aria-label="Accuracy boost badge"
                  data-hint="Score above 80% in recent drills"
                >
                  <svg viewBox="0 0 64 80" aria-hidden="true">
                    <circle cx="32" cy="28" r="26" fill="#2563eb" />
                    <circle cx="32" cy="28" r="20" fill="#eff6ff" />
                    <path
                      d="M31.5 18 28 26l-8 .58 6.2 5.42L24 40l7.5-4.6L39 40l-2.2-8 6.2-5.42-8-.58-3.5-8Z"
                      fill="#2563eb"
                    />
                    <path
                      d="M20 42 11 68 24 59 32 76 40 59 53 68 44 42Z"
                      fill="#60a5fa"
                    />
                  </svg>
                </li>
                <li
                  className={styles.heroBadge}
                  tabIndex={0}
                  aria-label="Power-ups badge"
                  data-hint="Unlock advanced practice power-ups"
                >
                  <svg viewBox="0 0 64 80" aria-hidden="true">
                    <circle cx="32" cy="28" r="26" fill="#f97316" />
                    <circle cx="32" cy="28" r="20" fill="#fff7ed" />
                    <path
                      d="M32 16l4 8 9 .65-6.8 5.8L40.4 38 32 33.3 23.6 38l2.2-7.55-6.8-5.8 9-.65Z"
                      fill="#fb923c"
                    />
                    <path
                      d="M21 42 12 66 26 56 32 74 38 56 52 66 43 42Z"
                      fill="#fbbf24"
                    />
                  </svg>
                </li>
              </ul>
              <div className={styles.heroMeta}>
                {resolvedProfile.grade ? (
                  <span>{resolvedProfile.grade}</span>
                ) : null}
                {resolvedProfile.location ? (
                  <span>{resolvedProfile.location}</span>
                ) : null}
                {resolvedProfile.joinedOn ? (
                  <span>Member since {resolvedProfile.joinedOn}</span>
                ) : null}
              </div>
            </div>
          </div>
          <div className={styles.heroStatus}>
            <span className={styles.heroLevelBadge}>Level {level}</span>
            <div className={styles.heroProgress}>
              <div className={styles.heroProgressTrack}>
                <div
                  className={styles.heroProgressValue}
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <span>{xpPercent}% mastery</span>
            </div>
            <p className={styles.heroStatusHint}>{streakLabel}</p>
            <div className={styles.heroActions}>
              <Link to="/courses" className={styles.primaryAction}>
                Explore courses
              </Link>
              <Link to="/downloads" className={styles.secondaryAction}>
                Manage downloads
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.cardsGrid}>
        <article className={`${styles.card} ${styles.cardLagoon}`}>
          <header className={styles.cardHeader}>
            <span className={styles.cardEyebrow}>Performance</span>
            <h2>Skill pulse</h2>
          </header>
          <div className={styles.quickStatsGrid}>
            {insightStats.map((item) => (
              <div
                key={item.id}
                className={styles.quickStatCard}
                style={{
                  "--stat-color": item.color,
                  "--stat-value": `${item.percent}`,
                }}
              >
                <div className={styles.quickStatChart} aria-hidden="true">
                  <div className={styles.quickStatChartInner}>
                    <span>{item.value}</span>
                  </div>
                </div>
                <div className={styles.quickStatCopy}>
                  <p className={styles.quickStatLabel}>{item.label}</p>
                  <p className={styles.quickStatHint}>{item.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article
          className={`${styles.card} ${styles.cardMint}`}
          aria-labelledby="recent-tests-heading"
        >
          <header className={styles.cardHeader}>
            <span className={styles.cardEyebrow}>Recent</span>
            <h2 id="recent-tests-heading">Test reports</h2>
          </header>
          {testAttemptsLoading ? (
            <div className={styles.stateCard}>Loading recent attempts…</div>
          ) : testAttemptsError ? (
            <div className={styles.stateCard}>{testAttemptsError}</div>
          ) : recentReports.length ? (
            <ul className={styles.reportsList}>
              {recentReports.map((report) => (
                <li
                  key={report.id}
                  className={styles.reportCard}
                  data-state={
                    report.percent >= 70
                      ? "high"
                      : report.percent <= 40
                      ? "low"
                      : "mid"
                  }
                >
                  <div className={styles.reportHeader}>
                    <h3 className={styles.reportTitle}>{report.title}</h3>
                    <span className={styles.reportScore}>
                      {Math.round(report.percent)}%
                    </span>
                  </div>
                  <p className={styles.reportMeta}>
                    {report.score}/{report.total} correct · {report.difficulty}{" "}
                    · {report.duration}
                  </p>
                  <p className={styles.reportTimestamp}>
                    Completed {new Date(report.completedAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.cardEmpty}>
              Your next quiz will appear here once completed.
            </p>
          )}
        </article>

        <article
          className={`${styles.card} ${styles.cardBlush}`}
          aria-labelledby="recently-viewed-heading"
        >
          <header className={styles.cardHeader}>
            <span className={styles.cardEyebrow}>Playback</span>
            <h2 id="recently-viewed-heading">Recently viewed lectures</h2>
          </header>
          {recentlyViewedLectures.length ? (
            <ul className={styles.recentLecturesList}>
              {recentlyViewedLectures.map((lecture) => (
                <li key={lecture.id} className={styles.recentLectureItem}>
                  <div className={styles.recentLecturePreview}>
                    {lecture.thumbnail ? (
                      <img
                        src={lecture.thumbnail}
                        alt="Lecture thumbnail"
                        className={styles.recentLectureThumb}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.recentLecturePlaceholder} aria-hidden="true">
                        <span>{lecture.subject?.slice(0, 3) ?? "LED"}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.recentLectureBody}>
                    <h3>{lecture.title}</h3>
                    <p>
                      {lecture.subject}
                      {lecture.duration ? ` • ${lecture.duration} mins` : ""}
                    </p>
                    {lecture.viewedAt ? (
                      <span className={styles.recentLectureTimestamp}>
                        Viewed {new Date(lecture.viewedAt).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                  <div className={styles.recentLectureRating}>
                    <div className={styles.ratingStars} role="radiogroup" aria-label={`Rate ${lecture.title}`}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={`${styles.ratingStar} ${
                            (lecture.myRating ?? 0) >= value ? styles.ratingStarActive : ""
                          }`}
                          onClick={() => handleRateLecture(lecture.id, value)}
                          disabled={!rateLecture || ratingBusyId === lecture.id}
                          aria-label={`Give ${value} star${value === 1 ? "" : "s"}`}
                          aria-pressed={(lecture.myRating ?? 0) === value}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <div className={styles.ratingSummary}>
                      <span>
                        {lecture.ratingAverage != null
                          ? `${lecture.ratingAverage.toFixed(1)} / 5`
                          : "No rating"}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {lecture.ratingCount ? `${lecture.ratingCount} vote${lecture.ratingCount === 1 ? "" : "s"}` : "Be first"}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.cardEmpty}>
              Recently opened lectures will appear here as you continue learning.
            </p>
          )}
        </article>
      </section>
    </section>
  );
}

export default ProfilePage;
