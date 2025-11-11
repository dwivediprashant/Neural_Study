import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import styles from './ExploreLecturesPage.module.css';
import { formatProgressLabel, makeLectureProgressKey } from '../utils/downloads';

const FALLBACK_THUMBNAILS = {
  JEE: '/b75e0c1a-6893-4b31-8d79-f37a1c72115a.webp',
  NEET: '/c.webp',
  APTITUDE: '/9816db69-099c-4020-935c-b98cc3ab4464.webp',
};

const LectureCard = ({ lecture, downloadsState }) => {
  const { downloads, saveLecture, removeLecture, pendingLectureIds, progress } = downloadsState;
  const { t } = useTranslation();

  const lectureId = lecture.raw?._id ?? lecture.raw?.id ?? lecture.id;
  const downloadRecord = downloads.find((item) => item.id === lectureId);
  const isDownloaded = Boolean(downloadRecord);
  const progressKey = makeLectureProgressKey(lectureId);
  const progressState = progress?.get?.(progressKey);
  const isPending = pendingLectureIds?.has?.(lectureId);
  const cachedAssets = downloadRecord?.cachedAssets?.length ?? 0;
  const totalAssets = downloadRecord?.assets?.length ?? lecture.assetCount ?? 0;

  const progressLabel =
    formatProgressLabel(progressState, t) ||
    (isDownloaded
      ? cachedAssets && totalAssets
        ? t('downloadsPage.lectures.cachedSummary', {
            cached: cachedAssets,
            total: totalAssets,
          })
        : t('downloads.progress.cachedOffline')
      : null);

  const languageLabel = lecture.language
    ? t(`common.languages.${String(lecture.language).toLowerCase()}`, {
        defaultValue: lecture.language,
      })
    : null;

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
          <img
            src={lecture.thumbnail}
            alt={t('exploreLectures.lecture.thumbnail', { title: lecture.title })}
            className={styles.lectureThumb}
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
          <h3 className={styles.lectureTitle} id={`${lectureId}-title`}>
            {lecture.title}
          </h3>
          <div className={styles.lectureBadges}>
            {lecture.exam ? <span className={styles.lectureBadge}>{lecture.exam}</span> : null}
            {lecture.subject ? <span className={styles.lectureBadgeSecondary}>{lecture.subject}</span> : null}
            {lecture.durationLabel ? <span className={styles.lectureBadgeSecondary}>{lecture.durationLabel}</span> : null}
            {languageLabel ? <span className={styles.lectureBadgeSecondary}>{languageLabel}</span> : null}
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
              {t('exploreLectures.lecture.openResource')}
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
              {isPending
                ? t('courseCard.download.caching')
                : isDownloaded
                ? t('courseCard.download.remove')
                : t('courseCard.download.save')}
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
  const { t } = useTranslation();
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

        return {
          id: lecture._id ?? lecture.id,
          raw: lecture,
          title: lecture.title ?? t('exploreLectures.lecture.untitled'),
          description: lecture.description ?? '',
          exam: lecture.exam ?? 'GENERAL',
          subject: lecture.subject ?? null,
          durationLabel: lecture.durationMinutes
            ? t('downloadsPage.lectures.duration', { minutes: lecture.durationMinutes })
            : null,
          language: lecture.language,
          tags: (lecture.tags ?? []).filter(Boolean).slice(0, 5),
          thumbnail: lecture.thumbnailUrl || FALLBACK_THUMBNAILS[lecture.exam] || '/b75e0c1a-6893-4b31-8d79-f37a1c72115a.webp',
          resourceUrl: lecture.resourceUrl ?? null,
          assetCount: assets.length,
          publishedLabel: createdAt
            ? t('exploreLectures.lecture.published', {
                date: createdAt.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }),
              })
            : null,
        };
      }),
    [lectures, t]
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
      pushToast?.(t('exploreLectures.search.toastEmpty'), 'info');
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
                placeholder={t('exploreLectures.search.placeholder')}
                aria-label={t('exploreLectures.search.aria')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                disabled={lecturesLoading}
              />
              {searchTerm ? (
                <button type="button" className={styles.clearButton} onClick={handleClear}>
                  {t('common.clear')}
                </button>
              ) : null}
            </div>
            <button type="submit" className={styles.searchButton} disabled={lecturesLoading}>
              {lecturesLoading ? t('exploreLectures.search.loading') : t('common.search')}
            </button>
          </form>
          <p className={styles.searchHint}>{t('exploreLectures.search.hint')}</p>
        </div>

        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{t('exploreLectures.page.title')}</h1>
          <p className={styles.pageSubtitle}>{t('exploreLectures.page.subtitle')}</p>
        </header>

        {lecturesError ? (
          <div className={styles.stateCard} role="alert">
            <h2>{t('exploreLectures.state.errorTitle')}</h2>
            <p>{lecturesError}</p>
            {handleRefresh ? (
              <button type="button" className={styles.searchButton} onClick={handleRefresh}>
                {t('common.retry')}
              </button>
            ) : null}
          </div>
        ) : lecturesLoading && !decoratedLectures.length ? (
          <div className={styles.stateCard} role="status">
            <h2>{t('exploreLectures.state.loadingTitle')}</h2>
            <p>{t('exploreLectures.state.loadingBody')}</p>
          </div>
        ) : filteredLectures.length ? (
          <div className={styles.lectureGrid}>
            {filteredLectures.map((lecture) => (
              <LectureCard key={lecture.id} lecture={lecture} downloadsState={lectureDownloadsState} />
            ))}
          </div>
        ) : (
          <div className={styles.stateCard} role="status">
            <h2>{t('exploreLectures.state.emptyTitle')}</h2>
            <p>{t('exploreLectures.state.emptyBody')}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ExploreLecturesPage;
