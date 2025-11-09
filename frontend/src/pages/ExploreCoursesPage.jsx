import { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

import styles from "./ExploreCoursesPage.module.css";
import { formatProgressLabel, makeCourseProgressKey, makeLectureProgressKey } from "../utils/downloads";
import { fetchCourses } from "../api/client";

const BANNER_BY_EXAM = {
  JEE: "/b75e0c1a-6893-4b31-8d79-f37a1c72115a.webp",
  NEET: "/c.webp",
  APTITUDE: "/9816db69-099c-4020-935c-b98cc3ab4464.webp",
};

const TONE_BY_EXAM = {
  JEE: "primary",
  NEET: "success",
  APTITUDE: "warning",
};

const languageBadgeMap = {
  EN: "English",
  HI: "Hindi",
};

const Badge = ({ label, tone }) => (
  <span className={`${styles.badge} ${styles[`badge${tone}`]}`}>{label}</span>
);

const CourseCard = ({ course, downloadsState }) => {
  const {
    downloads,
    saveCourse,
    removeCourse,
    pendingDownloadIds,
    progress,
  } = downloadsState;

  const courseId = course.raw._id ?? course.raw.id ?? course.id;
  const downloadRecord = downloads.find((item) => item.id === courseId);
  const isDownloaded = Boolean(downloadRecord);
  const cachedAssets = downloadRecord?.cachedAssets?.length ?? 0;
  const totalAssets = downloadRecord?.assets?.length ?? 0;
  const progressKey = makeCourseProgressKey(courseId);
  const progressState = progress?.get?.(progressKey);
  const isPending = pendingDownloadIds?.has?.(courseId);

  const downloadLabel = isPending
    ? progressState?.total
      ? `Caching ${progressState.completed}/${progressState.total}`
      : "Caching…"
    : isDownloaded
      ? "Remove offline"
      : "Save offline";

  const progressLabel =
    formatProgressLabel(progressState) ||
    (isDownloaded && totalAssets ? `Cached ${cachedAssets}/${totalAssets}` : null);

  const handleToggle = () => {
    if (isDownloaded) {
      removeCourse(courseId);
    } else {
      saveCourse(course.raw);
    }
  };

  return (
    <article className={styles.card} aria-labelledby={`${course.id}-title`}>
      <span className={`${styles.tag} ${styles[`tag${course.tagTone}`]}`}>
        {course.tagLabel}
      </span>

      <div className={styles.banner} aria-hidden="true" role="img">
        <img src={course.bannerSrc} alt="" loading="lazy" />
      </div>

      <div className={styles.body}>
        <header className={styles.header}>
          <h3 className={styles.title} id={`${course.id}-title`}>
            {course.title}
          </h3>
          <div className={styles.badgeRow}>
            {course.badges.map((badge) => (
              <Badge key={badge.label} {...badge} />
            ))}
          </div>
        </header>

        <p className={styles.highlight}>{course.highlight}</p>

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <span className={styles.metaIcon} aria-hidden="true">
              🎯
            </span>
            <span>
              <strong>Starts:</strong> {course.schedule.start}
            </span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaIcon} aria-hidden="true">
              📅
            </span>
            <span>
              <strong>Ends:</strong> {course.schedule.end}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.actions}>
          <Link
            to={`/courses/${courseId}`}
            state={{ course: course.raw }}
            className={styles.viewLink}
          >
            <span>View details</span>
            <span aria-hidden="true" className={styles.viewLinkIcon}>
              →
            </span>
          </Link>
          <Link
            to={`/courses/${courseId}`}
            state={{ course: course.raw }}
            className={`${styles.button} ${styles.buttonSolid}`}
            onClick={(event) => {
              event.preventDefault();
              handleToggle();
            }}
          >
            {downloadLabel}
          </Link>
        </div>
        {progressLabel ? <p className={styles.progressText}>{progressLabel}</p> : null}
      </div>
    </article>
  );
};

const LectureCard = ({ lecture, downloadsState }) => {
  const { downloads, saveLecture, removeLecture, pendingLectureIds, progress } = downloadsState;

  const hasThumbnail = Boolean(lecture.thumbnail);
  const lectureId = lecture.raw?._id ?? lecture.raw?.id ?? lecture.id;
  const downloadRecord = downloads.find((item) => item.id === lectureId);
  const isDownloaded = Boolean(downloadRecord);
  const progressKey = makeLectureProgressKey(lectureId);
  const progressState = progress?.get?.(progressKey);
  const isPending = pendingLectureIds?.has?.(lectureId);
  const cachedAssets = downloadRecord?.cachedAssets?.length ?? 0;
  const totalAssets = downloadRecord?.assets?.length ?? (cachedAssets || (lecture.assetCount ?? 0));

  const downloadLabel = isPending ? 'Caching…' : isDownloaded ? 'Remove offline' : 'Save offline';
  const progressLabel =
    formatProgressLabel(progressState) ||
    (isDownloaded
      ? cachedAssets && totalAssets
        ? `Cached ${cachedAssets}/${totalAssets}`
        : 'Cached offline'
      : null);

  const handleToggle = () => {
    if (isDownloaded) {
      removeLecture?.(lectureId);
    } else {
      saveLecture?.(lecture.raw ?? lecture);
    }
  };

  return (
    <article className={styles.lectureCard} aria-labelledby={`${lecture.id}-lecture-title`}>
      <div className={styles.lectureMedia}>
        {hasThumbnail ? (
          <img
            src={lecture.thumbnail}
            alt={`Thumbnail for ${lecture.title}`}
            loading="lazy"
          />
        ) : (
          <div className={styles.lecturePlaceholder} aria-hidden="true">
            <span>{lecture.exam}</span>
          </div>
        )}
      </div>

      <div className={styles.lectureBody}>
        <header className={styles.lectureHeader}>
          <h3 className={styles.lectureTitle} id={`${lecture.id}-lecture-title`}>
            {lecture.title}
          </h3>
          <div className={styles.lectureBadges}>
            <span className={styles.lectureBadge}>{lecture.exam}</span>
            {lecture.subject ? <span className={styles.lectureBadgeSecondary}>{lecture.subject}</span> : null}
            {lecture.duration ? (
              <span className={styles.lectureBadgeSecondary}>{lecture.duration} mins</span>
            ) : null}
            {lecture.language ? (
              <span className={styles.lectureBadgeSecondary}>{lecture.language}</span>
            ) : null}
          </div>
        </header>

        {lecture.description ? <p className={styles.lectureDescription}>{lecture.description}</p> : null}

        <div className={styles.lectureMeta}>
          {lecture.publishedLabel ? <span>{lecture.publishedLabel}</span> : null}
          {lecture.tags.length ? (
            <ul className={styles.lectureTags}>
              {lecture.tags.map((tag) => (
                <li key={tag}>#{tag}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <footer className={styles.lectureFooter}>
          {lecture.resourceUrl ? (
            <a
              href={lecture.resourceUrl}
              className={styles.lectureLink}
              target="_blank"
              rel="noreferrer"
            >
              Open lecture resource
            </a>
          ) : null}
          <div className={styles.lectureActions}>
            {progressLabel ? <p className={styles.lectureProgress}>{progressLabel}</p> : null}
            <button
              type="button"
              className={isDownloaded ? styles.lectureRemoveButton : styles.lectureDownloadButton}
              onClick={handleToggle}
              disabled={isPending}
            >
              {downloadLabel}
            </button>
          </div>
        </footer>
      </div>
    </article>
  );
};

const ExploreCoursesPage = () => {
  const {
    courses = [],
    loading,
    error,
    downloads = [],
    saveCourse,
    removeCourse,
    saveLecture,
    removeLecture,
    pendingDownloadIds,
    pendingLectureIds,
    progress = new Map(),
    status,
    lectures = [],
    lecturesLoading,
  } = useOutletContext() ?? {};
  const [searchTerm, setSearchTerm] = useState("");
  const [remoteCourses, setRemoteCourses] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const baseCourses = useMemo(
    () => (remoteCourses ?? courses),
    [remoteCourses, courses]
  );

  const decoratedCourses = useMemo(
    () =>
      baseCourses.map((course) => {
        const primaryTag = course.tags?.[0] ?? course.exam;
        const bannerSrc = BANNER_BY_EXAM[course.exam] ?? "/b75e0c1a-6893-4b31-8d79-f37a1c72115a.webp";
        const tagTone = TONE_BY_EXAM[course.exam] ?? "primary";
        const languageBadge = languageBadgeMap[course.language] ?? course.language;

        return {
          id: course._id ?? course.id,
          raw: course,
          title: course.title,
          description: course.description,
          tagLabel: primaryTag,
          tagTone,
          bannerSrc,
          badges: [
            { label: course.exam, tone: tagTone },
            languageBadge
              ? { label: languageBadge, tone: "neutral" }
              : null,
          ].filter(Boolean),
          highlight: course.description,
          schedule: {
            start: course.createdAt ? new Date(course.createdAt).toLocaleDateString() : undefined,
            end: course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : undefined,
          },
          tags: course.tags ?? [],
          modules: course.modules ?? [],
        };
      }),
    [baseCourses]
  );

  const decoratedLectures = useMemo(
    () =>
      lectures.map((lecture) => {
        const createdAt = lecture.createdAt ? new Date(lecture.createdAt) : null;
        const assets = [];
        if (lecture.resourceUrl) assets.push(lecture.resourceUrl);
        (lecture.assets ?? []).forEach((asset) => {
          if (asset) assets.push(asset);
        });
        return {
          id: lecture._id ?? lecture.id,
          raw: lecture,
          title: lecture.title ?? "Untitled lecture",
          description: lecture.description ?? "",
          exam: lecture.exam ?? "GENERAL",
          subject: lecture.subject ?? null,
          duration: lecture.durationMinutes ? `${lecture.durationMinutes}` : null,
          language: languageBadgeMap[lecture.language] ?? lecture.language ?? null,
          tags: (lecture.tags ?? []).filter(Boolean).slice(0, 5),
          thumbnail: lecture.thumbnailUrl || BANNER_BY_EXAM[lecture.exam] || "/b75e0c1a-6893-4b31-8d79-f37a1c72115a.webp",
          resourceUrl: lecture.resourceUrl ?? null,
          assetCount: assets.length,
          publishedLabel: createdAt
            ? `Published ${createdAt.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}`
            : null,
        };
      }),
    [lectures]
  );

  const filteredCourses = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();
    if (!value) return decoratedCourses;

    return decoratedCourses.filter((course) => {
      const searchableTokens = [
        course.tagLabel,
        ...course.badges.map((badge) => badge.label),
        ...course.tags,
        course.title,
        course.description,
      ]
        .filter(Boolean)
        .map((token) => token.toLowerCase());

      return searchableTokens.some((token) => token.includes(value));
    });
  }, [decoratedCourses, searchTerm]);

  const filteredLectures = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();
    if (!value) return decoratedLectures;

    return decoratedLectures.filter((lecture) => {
      const searchableTokens = [
        lecture.title,
        lecture.description,
        lecture.exam,
        lecture.subject,
        lecture.language,
        ...lecture.tags,
      ]
        .filter(Boolean)
        .map((token) => token.toLowerCase());

      return searchableTokens.some((token) => token.includes(value));
    });
  }, [decoratedLectures, searchTerm]);

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClear = () => {
    setSearchTerm("");
    setRemoteCourses(null);
    setSearchError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const submittedValue = searchTerm.trim();
    setSearchTerm(submittedValue);

    if (!submittedValue) {
      setRemoteCourses(null);
      setSearchError(null);
      return;
    }

    if (status?.isOffline) {
      setRemoteCourses(null);
      setSearchError("Online search is unavailable offline. Showing cached matches.");
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);
      const data = await fetchCourses({ tag: submittedValue, q: submittedValue });
      const results = data?.courses ?? [];
      setRemoteCourses(results);
      if (!results.length) {
        setSearchError("No courses matched that tag on the server.");
      }
    } catch (err) {
      setRemoteCourses(null);
      const message =
        err?.response?.data?.message || err?.message || "Unable to fetch courses right now.";
      setSearchError(message);
    } finally {
      setSearchLoading(false);
    }
  };

  const hasResults = filteredCourses.length > 0;
  const hasLectureResults = filteredLectures.length > 0;

  const courseDownloadsState = useMemo(
    () => ({ downloads, saveCourse, removeCourse, pendingDownloadIds, progress }),
    [downloads, saveCourse, removeCourse, pendingDownloadIds, progress]
  );

  const lectureDownloadsState = useMemo(
    () => ({ downloads, saveLecture, removeLecture, pendingLectureIds, progress }),
    [downloads, saveLecture, removeLecture, pendingLectureIds, progress]
  );

  return (
    <section className={styles.page} id="courses">
      <div className={styles.container}>
        <div className={styles.searchRow}>
          <form className={styles.searchForm} role="search" onSubmit={handleSubmit}>
            <div className={styles.searchFieldWrap}>
              <input
                id="explore-course-search"
                type="search"
                className={styles.searchInput}
                placeholder="Search by tag (e.g., NEET, UPSC, Hinglish)"
                aria-label="Search courses by tag"
                value={searchTerm}
                onChange={handleChange}
                disabled={searchLoading}
              />
              {searchTerm ? (
                <button type="button" className={styles.clearButton} onClick={handleClear}>
                  Clear
                </button>
              ) : null}
            </div>
            <button type="submit" className={styles.searchButton} disabled={searchLoading}>
              {searchLoading ? "Searching…" : "Search"}
            </button>
          </form>
          <p className={styles.searchHint}>Filter batches by exam category or language tags.</p>
          {searchError ? (
            <p className={`${styles.searchStatus} ${styles.searchStatusError}`}>{searchError}</p>
          ) : remoteCourses && !searchLoading ? (
            <p className={styles.searchStatus}>
              Showing {filteredCourses.length} result{filteredCourses.length === 1 ? "" : "s"} from the server.
            </p>
          ) : null}
        </div>

        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Courses designed for deep, personalised learning</h1>
          <p className={styles.pageSubtitle}>
            Browse high-impact programmes curated by mentors. Each batch combines interactive live sessions, structured
            notes, offline-first practice, and guided doubt support.
          </p>
        </header>

        {loading ? (
          <div className={styles.emptyState} role="status">
            <h2>Loading courses…</h2>
            <p>Fetching the latest batches from the offline catalogue.</p>
          </div>
        ) : error ? (
          <div className={styles.emptyState} role="alert">
            <h2>We couldn’t load courses</h2>
            <p>{error}</p>
          </div>
        ) : hasResults ? (
          <div className={styles.grid}>
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} downloadsState={courseDownloadsState} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState} role="status">
            <h2>No batches match that tag yet</h2>
            <p>Try another tag like NEET, UPSC, Hinglish, or Foundation.</p>
            {hasLectureResults ? null : (
              <p className={styles.emptyHint}>
                Teachers are still authoring new lectures&mdash;check back soon!
              </p>
            )}
          </div>
        )}

        <section className={styles.lectureSection} aria-labelledby="teacher-lectures-heading">
          <header className={styles.lectureSectionHeader}>
            <h2 id="teacher-lectures-heading">Fresh lectures from Neural mentors</h2>
            <p>
              Browse individual lecture drops uploaded by teachers. Thumbnails and metadata are provided directly by the
              mentor.
            </p>
          </header>

          {lecturesLoading ? (
            <div className={styles.lectureState} role="status">
              Loading mentor lectures…
            </div>
          ) : hasLectureResults ? (
            <div className={styles.lectureGrid}>
              {filteredLectures.map((lecture) => (
                <LectureCard key={lecture.id} lecture={lecture} downloadsState={lectureDownloadsState} />
              ))}
            </div>
          ) : (
            <div className={styles.lectureState} role="status">
              {lectures.length
                ? 'No lectures match that search.'
                : 'Teachers are preparing new lectures. Check back soon!'}
            </div>
          )}
        </section>
      </div>
    </section>
  );
};

export default ExploreCoursesPage;
