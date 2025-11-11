import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import styles from './DownloadsPage.module.css';
import {
  formatProgressLabel,
  makeCourseProgressKey,
  makeLectureProgressKey,
  makeModuleProgressKey,
} from '../utils/downloads';
import { resolveMedia } from '../utils/media';
import MediaModal from '../components/MediaModal';

const DownloadsPage = () => {
  const [preview, setPreview] = useState(null);
  const {
    downloads,
    status,
    removeCourse,
    removeLecture,
    pendingDownloadIds,
    pendingLectureIds,
    pendingDownloadKeys,
    progress,
    courses = [],
    registerLectureView,
  } = useOutletContext();

  const { t } = useTranslation();

  const formatRetryMessage = (count) => {
    if (!count) return null;
    return t('downloadsPage.retry.pending', { count });
  };

  const totalSizeMB = downloads.reduce((acc, item) => acc + (item.totalSizeMB || 0), 0);
  const totalSizeGB = (totalSizeMB / 1024).toFixed(2);

  const queuedDownloads = Array.from(pendingDownloadKeys || []).filter((key) => key.includes('module:'));

  const courseDownloads = downloads.filter((item) => item.type !== 'lecture');
  const lectureDownloads = downloads.filter((item) => item.type === 'lecture');
  const hasCourseDownloads = courseDownloads.length > 0;
  const hasLectureDownloads = lectureDownloads.length > 0;

  const handleOpenPreview = (payload) => {
    setPreview(payload);
    if (payload?.sourceLecture) {
      registerLectureView?.(payload.sourceLecture);
    }
  };

  const handleClosePreview = () => {
    setPreview(null);
  };

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.heroCopy}>
          <span className={styles.heroEyebrow}>{t('downloadsPage.hero.eyebrow')}</span>
          <div className={styles.heroHeading}>
            <span className={styles.heroIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path
                  fill="currentColor"
                  d="M6.5 10.5a4.5 4.5 0 0 1 8.812-1.53 3.751 3.751 0 0 1 4.938 3.53 3.75 3.75 0 0 1-1.23 2.756.75.75 0 1 1-1.015-1.106 2.252 2.252 0 0 0-.005-3.345 2.25 2.25 0 0 0-3.028.209.75.75 0 0 1-1.279-.463A3 3 0 1 0 9.5 12H11a.75.75 0 0 1 0 1.5H6.5A1.5 1.5 0 0 1 5 12a4.5 4.5 0 0 1 1.5-1.5Zm6.22 6.22 1.47-1.47a.75.75 0 1 1 1.06 1.06l-2.75 2.75a.75.75 0 0 1-1.06 0l-2.75-2.75a.75.75 0 1 1 1.06-1.06l1.47 1.47V14a.75.75 0 0 1 1.5 0v2.72ZM6.5 10.5"
                />
              </svg>
            </span>
            <h2 className={styles.heading}>{t('downloadsPage.hero.heading')}</h2>
          </div>
          <p className={styles.subheading}>{t('downloadsPage.hero.subheading')}</p>
        </div>
        <div className={styles.storageCard}>
          <p className={styles.storageTitle}>{t('downloadsPage.storage.title')}</p>
          <p className={styles.storageValue}>
            {t('downloadsPage.storage.usage', { used: totalSizeGB, limit: '2.0' })}
          </p>
          <p className={styles.storageHint}>{t('downloadsPage.storage.hint')}</p>
        </div>
      </header>

      {status.isOffline && (
        <div className={styles.notice}>{t('downloadsPage.notice.offline')}</div>
      )}

      {!downloads.length ? (
        <div className={styles.emptyState}>
          <p>{t('downloadsPage.empty.title')}</p>
          <p className={styles.emptyHint}>{t('downloadsPage.empty.hint')}</p>
        </div>
      ) : (
        <>
          {hasCourseDownloads ? (
            <div className={styles.grid}>
              {courseDownloads.map((course) => {
                const courseKey = makeCourseProgressKey(course.id);
                const courseProgress = progress?.get?.(courseKey);
                const cachedAssetsCount = course.cachedAssets?.length ?? 0;
                const totalAssetsCount = course.assets?.length ?? '—';
                const courseLabel =
                  formatProgressLabel(courseProgress, t) ||
                  (cachedAssetsCount
                    ? t('downloadsPage.courses.cachedSummary', {
                        cached: cachedAssetsCount,
                        total: totalAssetsCount,
                      })
                    : null);

                const originalCourse = courses.find((item) => item._id === course.id);
                const moduleSource = originalCourse?.modules ?? course.modules ?? [];
                const preferredAssets = course.cachedAssets?.length ? course.cachedAssets : course.assets || [];
                const lessonAssets = moduleSource
                  .flatMap((module) => module?.lessons ?? [])
                  .map((lesson) => lesson?.assetUrl)
                  .filter((asset) => typeof asset === 'string');
                const mediaCandidates = [course.previewUrl, ...preferredAssets, ...lessonAssets].filter(
                  (asset) => typeof asset === 'string'
                );
                const courseMedia = resolveMedia(mediaCandidates);
                const description =
                  originalCourse?.description ||
                  t('downloadsPage.courses.descriptionFallback');

                const moduleSummary = moduleSource.map((module, moduleIndex) => {
                  const lessons = module?.lessons ?? [];
                  const assets = lessons.filter((lesson) => lesson.assetUrl);
                  const cachedCount = assets.filter((lesson) => course.cachedAssets?.includes?.(lesson.assetUrl)).length;
                  const moduleKey = makeModuleProgressKey(course.id, module._id || module.id || module.name || module.order || moduleIndex);
                  const progressState = progress?.get?.(moduleKey);
                  const label =
                    formatProgressLabel(progressState, t) ||
                    (cachedCount
                      ? t('downloadsPage.courses.module.cached', {
                          cached: cachedCount,
                          total: assets.length,
                        })
                      : assets.length
                      ? t('downloadsPage.courses.module.notCached')
                      : t('downloadsPage.courses.module.noAssets'));

                  return {
                    key: moduleKey,
                    name:
                      module.name ||
                      t('downloadsPage.courses.module.fallback', {
                        index: (module.order ?? moduleIndex) + 1,
                      }),
                    assetsCount: assets.length,
                    label,
                  };
                });

                return (
                  <article key={course.id} className={styles.card}>
                    <div className={styles.cardVisual}>
                      <div className={styles.thumbShell}>
                        {course.thumbnailUrl ? (
                          <img src={course.thumbnailUrl} alt="Course thumbnail" className={styles.thumbnailImage} />
                        ) : (
                          <div className={styles.mediaPlaceholder}>
                            <span>{t('downloadsPage.courses.noPreview')}</span>
                          </div>
                        )}
                        <span className={styles.badge}>{t('downloadsPage.courses.badge')}</span>
                      </div>
                      <div className={styles.visualFooter}>
                        <p>
                          {course.cachedAssets?.length
                            ? t('downloadsPage.courses.status.offlineReady')
                            : t('downloadsPage.courses.status.cachePrompt')}
                        </p>
                        {course.failedAssets?.length ? (
                          <span>{formatRetryMessage(course.failedAssets.length)}</span>
                        ) : null}
                      </div>
                      {courseMedia ? (
                        <button
                          type="button"
                          className={styles.previewButton}
                          onClick={() =>
                            handleOpenPreview({
                              title: course.title,
                              media: { ...courseMedia, poster: course.thumbnailUrl || undefined },
                            })
                          }
                        >
                          {t('downloadsPage.actions.preview')}
                        </button>
                      ) : null}
                    </div>

                    <div className={styles.cardDetails}>
                      <header className={styles.detailHeader}>
                        <h3 className={styles.title}>{course.title}</h3>
                        <p className={styles.meta}>
                          {t('downloadsPage.courses.meta', {
                            modules: course.moduleCount || moduleSource.length,
                            size: course.totalSizeMB || '—',
                          })}
                        </p>
                      </header>

                      <p className={styles.description}>{description}</p>
                      {courseLabel ? <p className={styles.progressLabel}>{courseLabel}</p> : null}

                      {moduleSummary.length ? (
                        <div className={styles.moduleList}>
                          <h4 className={styles.moduleHeading}>
                            {t('downloadsPage.courses.module.heading')}
                          </h4>
                          <ul>
                            {moduleSummary.map((module) => (
                              <li key={module.key} className={styles.moduleItem}>
                                <span className={styles.moduleName}>{module.name}</span>
                                <span className={styles.moduleMeta}>{module.label}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div className={styles.actionsRow}>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => removeCourse(course.id)}
                          disabled={pendingDownloadIds?.has?.(course.id)}
                        >
                          {pendingDownloadIds?.has?.(course.id)
                            ? t('downloadsPage.actions.removing')
                            : t('downloadsPage.actions.removeDownload')}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

          {hasLectureDownloads ? (
            <section className={styles.lectureDownloads} aria-labelledby="offline-lecture-heading">
              <header className={styles.lectureDownloadsHeader}>
                <h3 id="offline-lecture-heading">
                  {t('downloadsPage.lectures.heading')}
                </h3>
                <p>{t('downloadsPage.lectures.subheading')}</p>
              </header>

              <div className={styles.lectureGrid}>
                {lectureDownloads.map((lecture) => {
                  const lectureKey = makeLectureProgressKey(lecture.id);
                  const lectureProgress = progress?.get?.(lectureKey);
                  const label =
                    formatProgressLabel(lectureProgress, t) ||
                    (lecture.cachedAssets?.length
                      ? t('downloadsPage.lectures.cachedSummary', {
                          cached: lecture.cachedAssets.length,
                          total: lecture.assets?.length || '—',
                        })
                      : lecture.assets?.length
                      ? t('downloadsPage.lectures.assetsAvailable')
                      : t('downloadsPage.lectures.assetsCached'));

                  const lectureCandidates = [
                    lecture.previewUrl,
                    ...(lecture.cachedAssets || []),
                    ...(lecture.assets || []),
                    lecture.videoUrl,
                    lecture.mediaUrl,
                    lecture.resourceUrl,
                  ].filter((asset) => typeof asset === 'string');
                  const lectureMedia = resolveMedia(lectureCandidates);

                  return (
                    <article key={lecture.id} className={styles.lectureCard}>
                      <div className={styles.cardVisual}>
                        <div className={styles.thumbShell}>
                          <span className={styles.badgeSecondary}>{t('downloadsPage.lectures.badge')}</span>
                          {lecture.thumbnailUrl ? (
                            <img src={lecture.thumbnailUrl} alt="Thumbnail" className={styles.lectureThumb} />
                          ) : (
                            <div className={styles.mediaPlaceholder}>
                              <span>{lecture.exam ?? t('downloadsPage.lectures.placeholder')}</span>
                            </div>
                          )}
                        </div>
                        <div className={styles.visualFooter}>
                          <p>{label || t('downloadsPage.lectures.assetsCached')}</p>
                          {lecture.failedAssets?.length ? (
                            <span>{formatRetryMessage(lecture.failedAssets.length)}</span>
                          ) : null}
                        </div>
                        {lectureMedia ? (
                          <button
                            type="button"
                            className={styles.previewButton}
                            onClick={() => {
                              const sourceLecture = {
                                ...lecture,
                                id: lecture.id,
                                title: lecture.title,
                                exam: lecture.exam,
                                subject: lecture.subject,
                                tags: lecture.tags,
                                durationMinutes: lecture.durationMinutes,
                                thumbnailUrl: lecture.thumbnailUrl,
                                viewedAt: new Date().toISOString(),
                              };

                              handleOpenPreview({
                                title: lecture.title,
                                media: { ...lectureMedia, poster: lecture.thumbnailUrl || undefined },
                                sourceLecture,
                              });
                            }}
                          >
                            {t('downloadsPage.actions.preview')}
                          </button>
                        ) : null}
                      </div>

                      <div className={styles.cardDetails}>
                        <header className={styles.detailHeader}>
                          <h4 className={styles.lectureTitle}>{lecture.title}</h4>
                          <p className={styles.lectureMeta}>
                            {[lecture.exam, lecture.subject, lecture.language].filter(Boolean).join(' • ') ||
                              t('downloadsPage.lectures.metaFallback')}
                          </p>
                        </header>
                        <p className={styles.lectureDescription}>
                          {[ 
                            t('downloadsPage.lectures.cachedAssets', {
                              count: lecture.cachedAssets?.length || 0,
                            }),
                            lecture.durationMinutes
                              ? t('downloadsPage.lectures.duration', {
                                  minutes: lecture.durationMinutes,
                                })
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' • ')}
                        </p>

                        <div className={styles.lectureActionsRow}>
                          <button
                            type="button"
                            className={styles.lectureRemoveButton}
                            onClick={() => removeLecture(lecture.id)}
                            disabled={pendingLectureIds?.has?.(lecture.id)}
                          >
                            {pendingLectureIds?.has?.(lecture.id)
                              ? t('downloadsPage.actions.removing')
                              : t('downloadsPage.actions.removeLecture')}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </>
      )}

      {queuedDownloads.length ? (
        <aside className={styles.queueBanner}>
          <strong>{t('downloadsPage.queue.count', { count: queuedDownloads.length })}</strong>
          <span>{t('downloadsPage.queue.hint')}</span>
        </aside>
      ) : null}
      <MediaModal open={Boolean(preview)} title={preview?.title} media={preview?.media} onClose={handleClosePreview} />
    </section>
  );
};

export default DownloadsPage;
