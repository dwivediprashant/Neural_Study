import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import styles from './ExploreLecturesPage.module.css';
import { formatProgressLabel, makeLectureProgressKey } from '../utils/downloads';

const FALLBACK_THUMBNAILS = {
  JEE: '/b75e0c1a-6893-4b31-8d79-f37a1c72115a.webp',
  NEET: '/c.webp',
  APTITUDE: '/9816db69-099c-4020-935c-b98cc3ab4464.webp',
};

const LECTURE_LANG_LABEL = {
  EN: 'English',
  HI: 'Hindi',
};

const LectureCard = ({ lecture, downloadsState }) => {
  const { downloads, saveLecture, removeLecture, pendingLectureIds, progress } = downloadsState;

  const lectureId = lecture.raw?._id ?? lecture.raw?.id ?? lecture.id;
  const downloadRecord = downloads.find((item) => item.id === lectureId);
  const isDownloaded = Boolean(downloadRecord);
  const progressKey = makeLectureProgressKey(lectureId);
  const progressState = progress?.get?.(progressKey);
  const isPending = pendingLectureIds?.has?.(lectureId);
  const cachedAssets = downloadRecord?.cachedAssets?.length ?? 0;
  const totalAssets = downloadRecord?.assets?.length ?? lecture.assetCount ?? 0;

  const progressLabel =
    formatProgressLabel(progressState) ||
    (isDownloaded
      ? cachedAssets && totalAssets
        ? `Cached ${cachedAssets}/${totalAssets}`
        : 'Cached offline'
      : null);

  const handleToggle = () => {
    if (!lectureId) return;
    if (isDownloaded) {
      removeLecture?.(lectureId);
    } else {
      saveLecture?.(lecture.raw ?? lecture);
    }
  };

  return (
    <article className={styles.lectureCard} aria-labelledby={`${lectureId}-title`}>
      <div className={styles.lectureMedia}>
        {lecture.thumbnail ? (
          <img src={lecture.thumbnail} alt="Lecture thumbnail" className={styles.lectureThumb} loading="lazy" />
        ) : (
          <div className={styles.lecturePlaceholder} aria-hidden="true">
            <span>{lecture.exam}</span>
          </div>
        )}
      </div>

      <div className={styles.lectureBody}>
        <header className={styles.lectureHeader}>
          <h3 className={styles.lectureTitle} id={`${lectureId}-title`}>
            {lecture.title}
          </h3>
          <div className={styles.lectureBadges}>
            {lecture.exam ? <span className={styles.lectureBadge}>{lecture.exam}</span> : null}
            {lecture.subject ? <span className={styles.lectureBadgeSecondary}>{lecture.subject}</span> : null}
            {lecture.durationLabel ? <span className={styles.lectureBadgeSecondary}>{lecture.durationLabel}</span> : null}
            {lecture.language ? <span className={styles.lectureBadgeSecondary}>{lecture.language}</span> : null}
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
            <a href={lecture.resourceUrl} className={styles.lectureLink} target="_blank" rel="noreferrer">
              Open resource
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
              {isPending ? 'Caching…' : isDownloaded ? 'Remove offline' : 'Save offline'}
            </button>
          </div>
        </footer>
      </div>
    </article>
  );
};

const ExploreLecturesPage = () => {
  const {
    lectures = [],
    lecturesLoading,
    lecturesError,
    downloads = [],
    saveLecture,
    removeLecture,
    pendingLectureIds,
    progress = new Map(),
    pushToast,
    handleRefresh,
  } = useOutletContext() ?? {};
  const [searchTerm, setSearchTerm] = useState('');

  const decoratedLectures = useMemo(
    () =>
      lectures.map((lecture) => {
        const createdAt = lecture.createdAt ? new Date(lecture.createdAt) : null;
        const assets = [];
        if (lecture.resourceUrl) assets.push(lecture.resourceUrl);
        (lecture.assets ?? []).forEach((asset) => {
          if (asset) assets.push(asset);
        });

        const languageLabel = LECTURE_LANG_LABEL[lecture.language] ?? lecture.language ?? null;

        return {
          id: lecture._id ?? lecture.id,
          raw: lecture,
          title: lecture.title ?? 'Untitled lecture',
          description: lecture.description ?? '',
          exam: lecture.exam ?? 'GENERAL',
          subject: lecture.subject ?? null,
          durationLabel: lecture.durationMinutes ? `${lecture.durationMinutes} mins` : null,
          language: languageLabel,
          tags: (lecture.tags ?? []).filter(Boolean).slice(0, 5),
          thumbnail: lecture.thumbnailUrl || FALLBACK_THUMBNAILS[lecture.exam] || '/b75e0c1a-6893-4b31-8d79-f37a1c72115a.webp',
          resourceUrl: lecture.resourceUrl ?? null,
          assetCount: assets.length,
          publishedLabel: createdAt
            ? `Published ${createdAt.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}`
            : null,
        };
      }),
    [lectures]
  );

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

  const lectureDownloadsState = useMemo(
    () => ({ downloads, saveLecture, removeLecture, pendingLectureIds, progress }),
    [downloads, saveLecture, removeLecture, pendingLectureIds, progress]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSearchTerm((previous) => previous.trim());
    if (!lectures.length && !lecturesLoading) {
      pushToast?.('No lectures available yet. Check back soon!', 'info');
    }
  };

  const handleClear = () => {
    setSearchTerm('');
  };

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <div className={styles.searchRow}>
          <form className={styles.searchForm} role="search" onSubmit={handleSubmit}>
            <div className={styles.searchFieldWrap}>
              <input
                id="explore-lecture-search"
                type="search"
                className={styles.searchInput}
                placeholder="Search lectures by title, subject, or tag"
                aria-label="Search lectures"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                disabled={lecturesLoading}
              />
              {searchTerm ? (
                <button type="button" className={styles.clearButton} onClick={handleClear}>
                  Clear
                </button>
              ) : null}
            </div>
            <button type="submit" className={styles.searchButton} disabled={lecturesLoading}>
              {lecturesLoading ? 'Searching…' : 'Search'}
            </button>
          </form>
          <p className={styles.searchHint}>Tip: try keywords like "mechanics", "organic", or "aptitude".</p>
        </div>

        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Lectures ready for offline-first revision</h1>
          <p className={styles.pageSubtitle}>
            Browse mentor-uploaded lessons. Save any lecture offline for buffer-free viewing and study on the go.
          </p>
        </header>

        {lecturesError ? (
          <div className={styles.stateCard} role="alert">
            <h2>Unable to load lectures</h2>
            <p>{lecturesError}</p>
            {handleRefresh ? (
              <button type="button" className={styles.searchButton} onClick={handleRefresh}>
                Retry
              </button>
            ) : null}
          </div>
        ) : lecturesLoading && !decoratedLectures.length ? (
          <div className={styles.stateCard} role="status">
            <h2>Loading lectures…</h2>
            <p>Fetching the latest drops from Neural mentors.</p>
          </div>
        ) : filteredLectures.length ? (
          <div className={styles.lectureGrid}>
            {filteredLectures.map((lecture) => (
              <LectureCard key={lecture.id} lecture={lecture} downloadsState={lectureDownloadsState} />
            ))}
          </div>
        ) : (
          <div className={styles.stateCard} role="status">
            <h2>No lectures match that search</h2>
            <p>Adjust your keywords or check again later as mentors upload new lessons.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ExploreLecturesPage;
