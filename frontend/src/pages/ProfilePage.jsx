import { useMemo, useState, useCallback } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";

import styles from "./ProfilePage.module.css";
import { SUPPORTED_LANGUAGES } from "../i18n/index.js";

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
  const { t, i18n } = useTranslation();
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

  const [wifiOnly, setWifiOnly] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  const activeLanguage = useMemo(() => {
    const raw = i18n.language || i18n.resolvedLanguage || "en";
    return raw.split("-")[0].toLowerCase();
  }, [i18n.language, i18n.resolvedLanguage]);

  const handleLanguageSelect = useCallback(
    (code) => {
      if (!code || code === activeLanguage) return;
      i18n.changeLanguage(code);
    },
    [i18n, activeLanguage]
  );

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
      title:
        course.title || course.name || t("profilePage.courseFallback.title"),
      exam:
        course.exam || course.category || t("profilePage.courseFallback.exam"),
      language:
        course.language ||
        course.languages?.join(", ") ||
        t("common.languages.en"),
      progress: course.progressPercentage ?? 0,
    }));
  }, [courses, t]);

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

    let recentTrendKey = null;
    let recentTrendDelta = null;
    if (attempts >= 2) {
      const [latest, previous] = percents;
      const delta = Math.round(latest - previous);
      if (delta === 0) {
        recentTrendKey = "unchanged";
      } else {
        recentTrendKey = "delta";
        recentTrendDelta = delta;
      }
    }

    return {
      attempts,
      averagePercent,
      bestPercent,
      recentTrendKey,
      recentTrendDelta,
    };
  }, [testAttempts]);

  const recentReports = useMemo(() => testAttempts.slice(0, 3), [testAttempts]);

  const formatSize = (value) => {
    if (!value || Number.isNaN(value)) {
      return t("profilePage.downloads.formatMb", { value: 0 });
    }
    if (value < 1) {
      return t("profilePage.downloads.formatKb", {
        value: (value * 1024).toFixed(0),
      });
    }
    return t("profilePage.downloads.formatMb", {
      value: Number.parseFloat(value.toFixed(1)),
    });
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
      return t("profilePage.hero.streakMessages.threePlus", {
        count: testSummary.attempts,
      });
    }
    if (testSummary.attempts === 2) {
      return t("profilePage.hero.streakMessages.two");
    }
    if (testSummary.attempts === 1) {
      return t("profilePage.hero.streakMessages.one");
    }
    return t("profilePage.hero.streakMessages.zero");
  }, [t, testSummary.attempts]);

  const achievementBadges = useMemo(
    () => [
      {
        id: "streak",
        icon: "🔥",
        title:
          testSummary.attempts >= 3
            ? t("profilePage.achievement.streak.title.active")
            : t("profilePage.achievement.streak.title.idle"),
        caption:
          testSummary.attempts >= 3
            ? t("profilePage.achievement.streak.caption.active", {
                count: testSummary.attempts,
              })
            : t("profilePage.achievement.streak.caption.idle"),
      },
      {
        id: "collector",
        icon: "📦",
        title:
          offlineCourseCount > 0
            ? t("profilePage.achievement.collector.title.active")
            : t("profilePage.achievement.collector.title.idle"),
        caption:
          offlineCourseCount > 0
            ? t("profilePage.achievement.collector.caption.active", {
                count: offlineCourseCount,
              })
            : t("profilePage.achievement.collector.caption.idle"),
      },
      {
        id: "level",
        icon: "🚀",
        title: t("profilePage.achievement.level.title", { level }),
        caption: xpPercent
          ? t("profilePage.achievement.level.caption.filled", {
              percent: xpPercent,
            })
          : t("profilePage.achievement.level.caption.empty"),
      },
    ],
    [level, offlineCourseCount, t, testSummary.attempts, xpPercent]
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

    const formattedDelta =
      typeof testSummary.recentTrendDelta === "number"
        ? `${testSummary.recentTrendDelta > 0 ? "+" : ""}${
            testSummary.recentTrendDelta
          }`
        : null;
    const scoreHint =
      testSummary.recentTrendKey === "delta"
        ? t("profilePage.recentTrend.delta", { delta: formattedDelta })
        : testSummary.recentTrendKey === "unchanged"
        ? t("profilePage.recentTrend.unchanged")
        : t("profilePage.insights.score.hintFallback");

    const offlineHint =
      offlineCourseCount > 0
        ? t("profilePage.insights.offline.hintPlural", {
            count: offlineCourseCount,
          })
        : t("profilePage.insights.offline.hintEmpty");

    return [
      {
        id: "score",
        label: t("profilePage.insights.score.label"),
        value:
          testSummary.averagePercent !== null
            ? `${testSummary.averagePercent}%`
            : "—",
        hint: scoreHint,
        percent: testSummary.averagePercent ?? 0,
        color: "#6366f1",
      },
      {
        id: "offline",
        label: t("profilePage.insights.offline.label"),
        value: formatSize(downloadsStats.sizeMB),
        hint: offlineHint,
        percent: offlinePercent,
        color: "#22d3ee",
      },
      {
        id: "streak",
        label: t("profilePage.insights.streak.label"),
        value: t("profilePage.insights.streak.value", {
          count: testSummary.attempts ?? 0,
        }),
        hint: streakLabel,
        percent: streakPercent,
        color: "#f97316",
      },
    ];
  }, [
    downloadsStats.sizeMB,
    formatSize,
    offlineCourseCount,
    streakLabel,
    t,
    testSummary.averagePercent,
    testSummary.attempts,
    testSummary.recentTrendDelta,
    testSummary.recentTrendKey,
  ]);

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
        title: lecture.title || t("teacher.uploads.untitledLecture"),
        subject:
          lecture.subject ||
          lecture.exam ||
          t("profilePage.courseFallback.exam"),
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
    t,
  ]);

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCard}>
          <div className={styles.heroPrimary}>
            <div className={styles.heroAvatar} aria-hidden="true">
              <svg
                viewBox="0 0 72 72"
                role="img"
                aria-label={t("profilePage.hero.iconAria")}
              >
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
                <p className={styles.heroEyebrow}>
                  {t("profilePage.hero.eyebrow")}
                </p>
                <h1 className={styles.heroTitle}>
                  {resolvedProfile.name || t("profilePage.hero.fallbackName")}
                </h1>
              </div>
              <ul className={styles.heroBadgeStrip}>
                <li
                  className={styles.heroBadge}
                  tabIndex={0}
                  aria-label={t("profilePage.badges.streak.aria")}
                  data-hint={t("profilePage.badges.streak.hint")}
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
                  aria-label={t("profilePage.badges.accuracy.aria")}
                  data-hint={t("profilePage.badges.accuracy.hint")}
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
                  aria-label={t("profilePage.badges.power.aria")}
                  data-hint={t("profilePage.badges.power.hint")}
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
                  <span>
                    {t("profilePage.hero.memberSince", {
                      date: resolvedProfile.joinedOn,
                    })}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className={styles.heroStatus}>
            <span className={styles.heroLevelBadge}>
              {t("profilePage.hero.level", { level })}
            </span>
            <div className={styles.heroProgress}>
              <div className={styles.heroProgressTrack}>
                <div
                  className={styles.heroProgressValue}
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <span>
                {t("profilePage.hero.mastery", {
                  percent: xpPercent,
                })}
              </span>
            </div>
            <p className={styles.heroStatusHint}>{streakLabel}</p>
            <div className={styles.heroActions}>
              <Link to="/courses" className={styles.primaryAction}>
                {t("profilePage.hero.primaryAction")}
              </Link>
              <Link to="/downloads" className={styles.secondaryAction}>
                {t("profilePage.hero.secondaryAction")}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.cardsGrid}>
        <article className={`${styles.card} ${styles.cardLagoon}`}>
          <header className={styles.cardHeader}>
            <span className={styles.cardEyebrow}>
              {t("profilePage.cards.performance.eyebrow")}
            </span>
            <h2>{t("profilePage.cards.performance.title")}</h2>
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
            <span className={styles.cardEyebrow}>
              {t("profilePage.cards.recent.eyebrow")}
            </span>
            <h2 id="recent-tests-heading">
              {t("profilePage.cards.recent.title")}
            </h2>
          </header>
          {testAttemptsLoading ? (
            <div className={styles.stateCard}>
              {t("profilePage.cards.recent.loading")}
            </div>
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
                    {t("profilePage.reports.meta", {
                      correct: report.score,
                      total: report.total,
                      difficulty: report.difficulty,
                      duration: report.duration,
                    })}
                  </p>
                  <p className={styles.reportTimestamp}>
                    {t("profilePage.reports.timestamp", {
                      timestamp: new Date(report.completedAt).toLocaleString(),
                    })}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.cardEmpty}>
              {t("profilePage.cards.recent.empty")}
            </p>
          )}
        </article>

        <article
          className={`${styles.card} ${styles.cardBlush}`}
          aria-labelledby="recently-viewed-heading"
        >
          <header className={styles.cardHeader}>
            <span className={styles.cardEyebrow}>
              {t("profilePage.cards.recentLectures.eyebrow")}
            </span>
            <h2 id="recently-viewed-heading">
              {t("profilePage.cards.recentLectures.title")}
            </h2>
          </header>
          {recentlyViewedLectures.length ? (
            <ul className={styles.recentLecturesList}>
              {recentlyViewedLectures.map((lecture) => (
                <li key={lecture.id} className={styles.recentLectureItem}>
                  <div className={styles.recentLecturePreview}>
                    {lecture.thumbnail ? (
                      <img
                        src={lecture.thumbnail}
                        alt={t("profilePage.recentLectures.thumbnailAlt")}
                        className={styles.recentLectureThumb}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className={styles.recentLecturePlaceholder}
                        aria-hidden="true"
                      >
                        <span>{lecture.subject?.slice(0, 3) ?? "LED"}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.recentLectureBody}>
                    <h3>{lecture.title}</h3>
                    <p>
                      {lecture.subject}
                      {lecture.duration
                        ? ` • ${t("profilePage.recentLectures.duration", {
                            minutes: lecture.duration,
                          })}`
                        : ""}
                    </p>
                    {lecture.viewedAt ? (
                      <span className={styles.recentLectureTimestamp}>
                        {t("profilePage.recentLectures.viewed", {
                          timestamp: new Date(
                            lecture.viewedAt
                          ).toLocaleString(),
                        })}
                      </span>
                    ) : null}
                  </div>
                  <div className={styles.recentLectureRating}>
                    <div
                      className={styles.ratingStars}
                      role="radiogroup"
                      aria-label={t("profilePage.ratings.groupAria", {
                        title: lecture.title,
                      })}
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={`${styles.ratingStar} ${
                            (lecture.myRating ?? 0) >= value
                              ? styles.ratingStarActive
                              : ""
                          }`}
                          onClick={() => handleRateLecture(lecture.id, value)}
                          disabled={!rateLecture || ratingBusyId === lecture.id}
                          aria-label={t("profilePage.ratings.starAria", {
                            count: value,
                          })}
                          aria-pressed={(lecture.myRating ?? 0) === value}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <div className={styles.ratingSummary}>
                      <span>
                        {lecture.ratingAverage != null
                          ? t("profilePage.ratings.value", {
                              rating: lecture.ratingAverage.toFixed(1),
                            })
                          : t("profilePage.ratings.none")}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {lecture.ratingCount
                          ? t("profilePage.ratings.votes", {
                              count: lecture.ratingCount,
                            })
                          : t("profilePage.ratings.votesEmpty")}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.cardEmpty}>
              {t("profilePage.cards.recentLectures.empty")}
            </p>
          )}
        </article>

        <article className={`${styles.card} ${styles.cardSettings}`}>
          <header className={styles.settingsHeader}>
            <span className={styles.cardEyebrow}>
              {t("settings.communityLabel", { defaultValue: "Settings" })}
            </span>
            <h2>
              {t("settings.sectionHeading", { defaultValue: "Settings" })}
            </h2>
          </header>
          <div className={styles.miniSettingsGrid}>
            <div className={styles.languageRow}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isActive = activeLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    className={
                      isActive ? styles.languagePillActive : styles.languagePill
                    }
                    onClick={() => handleLanguageSelect(lang.code)}
                  >
                    <span aria-hidden="true">
                      {lang.icon ? `${lang.icon} ` : ""}
                    </span>
                    {t(lang.labelKey)}
                  </button>
                );
              })}
            </div>
            <div className={styles.toggleRow}>
              <label className={styles.toggleItem}>
                <input
                  type="checkbox"
                  checked={wifiOnly}
                  onChange={() => setWifiOnly((value) => !value)}
                />
                <div>
                  <p>{t("settings.syncWifiOnlyLabel")}</p>
                  <span>{t("settings.syncWifiOnlyHint")}</span>
                </div>
              </label>
              <label className={styles.toggleItem}>
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={() => setAutoSync((value) => !value)}
                />
                <div>
                  <p>{t("settings.autoSyncLabel")}</p>
                  <span>{t("settings.autoSyncHint")}</span>
                </div>
              </label>
            </div>
          </div>
          <p className={styles.settingsHint}>
            {t("settings.moreLanguagesNote")}
          </p>
        </article>
      </section>
    </section>
  );
}

export default ProfilePage;
