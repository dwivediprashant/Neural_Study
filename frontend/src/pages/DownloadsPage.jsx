import { useOutletContext } from 'react-router-dom';

import styles from './DownloadsPage.module.css';
import {
  formatProgressLabel,
  makeCourseProgressKey,
  makeLectureProgressKey,
  makeModuleProgressKey,
} from '../utils/downloads';

const DownloadsPage = () => {
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
  } = useOutletContext();

  const totalSizeMB = downloads.reduce((acc, item) => acc + (item.totalSizeMB || 0), 0);
  const totalSizeGB = (totalSizeMB / 1024).toFixed(2);

  const queuedDownloads = Array.from(pendingDownloadKeys || []).filter((key) => key.includes('module:'));

  const courseDownloads = downloads.filter((item) => item.type !== 'lecture');
  const lectureDownloads = downloads.filter((item) => item.type === 'lecture');
  const hasCourseDownloads = courseDownloads.length > 0;
  const hasLectureDownloads = lectureDownloads.length > 0;

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.heroCopy}>
          <span className={styles.heroEyebrow}>Offline hub</span>
          <h2 className={styles.heading}>Downloads at your fingertips</h2>
          <p className={styles.subheading}>
            Keep learning without buffering. Manage cached courses and quick lecture drops in one fast view.
          </p>
        </div>
        <div className={styles.storageCard}>
          <p className={styles.storageTitle}>Storage budget</p>
          <p className={styles.storageValue}>{totalSizeGB} / 2.0 GB used</p>
          <p className={styles.storageHint}>Auto-stop downloads when storage limit is reached.</p>
        </div>
      </header>

      {status.isOffline && (
        <div className={styles.notice}>
          Offline mode — downloads will resume when you reconnect to Wi-Fi.
        </div>
      )}

      {!downloads.length ? (
        <div className={styles.emptyState}>
          <p>No courses or lectures have been saved yet.</p>
          <p className={styles.emptyHint}>Open a course or lecture and tap “Save offline” to cache it.</p>
        </div>
      ) : (
        <>
          {hasCourseDownloads ? (
            <div className={styles.grid}>
              {courseDownloads.map((course) => {
                const courseKey = makeCourseProgressKey(course.id);
                const courseProgress = progress?.get?.(courseKey);
                const courseLabel =
                  formatProgressLabel(courseProgress) ||
                  (course.cachedAssets?.length ? `Cached ${course.cachedAssets.length}/${course.assets?.length || '—'}` : null);

                const originalCourse = courses.find((item) => item._id === course.id);
                const moduleSource = originalCourse?.modules ?? course.modules ?? [];
                const preferredAssets = course.cachedAssets?.length ? course.cachedAssets : course.assets || [];
                const videoAsset = preferredAssets.find((asset) => /\.mp4(\?|$)/.test(asset))
                  || moduleSource.flatMap((module) => module?.lessons ?? [])
                    .map((lesson) => lesson?.assetUrl)
                    .find((url) => /\.mp4(\?|$)/.test(url));
                const description = originalCourse?.description || 'Offline copy ready for playback and revision.';

                const moduleSummary = moduleSource.map((module, moduleIndex) => {
                  const lessons = module?.lessons ?? [];
                  const assets = lessons.filter((lesson) => lesson.assetUrl);
                  const cachedCount = assets.filter((lesson) => course.cachedAssets?.includes?.(lesson.assetUrl)).length;
                  const moduleKey = makeModuleProgressKey(course.id, module._id || module.id || module.name || module.order || moduleIndex);
                  const progressState = progress?.get?.(moduleKey);
                  const label =
                    formatProgressLabel(progressState) ||
                    (cachedCount
                      ? `Cached ${cachedCount}/${assets.length}`
                      : assets.length
                      ? 'Not cached yet'
                      : 'No downloadable assets');

                  return {
                    key: moduleKey,
                    name: module.name || `Module ${module.order || moduleIndex + 1}`,
                    assetsCount: assets.length,
                    label,
                  };
                });

                return (
                  <article key={course.id} className={styles.card}>
                    <div className={styles.cardVisual}>
                      <div className={styles.thumbShell}>
                        {videoAsset ? (
                          <video
                            key={videoAsset}
                            className={styles.mediaPlayer}
                            src={videoAsset}
                            controls
                            preload="metadata"
                          >
                            Your browser does not support offline playback.
                          </video>
                        ) : (
                          <div className={styles.mediaPlaceholder}>
                            <span>No video preview available</span>
                          </div>
                        )}
                        <span className={styles.badge}>Course</span>
                      </div>
                      <div className={styles.visualFooter}>
                        <p>{course.cachedAssets?.length ? 'Offline ready' : 'Cache modules to study offline'}</p>
                        {course.failedAssets?.length ? (
                          <span>{course.failedAssets.length} asset(s) pending retry</span>
                        ) : null}
                      </div>
                    </div>

                    <div className={styles.cardDetails}>
                      <header className={styles.detailHeader}>
                        <h3 className={styles.title}>{course.title}</h3>
                        <p className={styles.meta}>
                          {course.moduleCount || moduleSource.length} modules • {course.totalSizeMB || '—'} MB total
                        </p>
                      </header>

                      <p className={styles.description}>{description}</p>
                      {courseLabel ? <p className={styles.progressLabel}>{courseLabel}</p> : null}

                      {moduleSummary.length ? (
                        <div className={styles.moduleList}>
                          <h4 className={styles.moduleHeading}>Module cache status</h4>
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
                          {pendingDownloadIds?.has?.(course.id) ? 'Removing…' : 'Remove download'}
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
                <h3 id="offline-lecture-heading">Offline lectures</h3>
                <p>Standalone lecture drops cached for on-the-go revision.</p>
              </header>

              <div className={styles.lectureGrid}>
                {lectureDownloads.map((lecture) => {
                  const lectureKey = makeLectureProgressKey(lecture.id);
                  const lectureProgress = progress?.get?.(lectureKey);
                  const label =
                    formatProgressLabel(lectureProgress) ||
                    (lecture.cachedAssets?.length
                      ? `Cached ${lecture.cachedAssets.length}/${lecture.assets?.length || '—'}`
                      : lecture.assets?.length
                      ? 'Assets available'
                      : 'Cached offline');

                  return (
                    <article key={lecture.id} className={styles.lectureCard}>
                      <div className={styles.cardVisual}>
                        <div className={styles.thumbShell}>
                          <span className={styles.badgeSecondary}>Lecture</span>
                          {lecture.thumbnailUrl ? (
                            <img src={lecture.thumbnailUrl} alt="Thumbnail" className={styles.lectureThumb} />
                          ) : (
                            <div className={styles.mediaPlaceholder}>
                              <span>{lecture.exam ?? 'Lecture'}</span>
                            </div>
                          )}
                        </div>
                        <div className={styles.visualFooter}>
                          <p>{label || 'Assets cached'}</p>
                          {lecture.failedAssets?.length ? (
                            <span>{lecture.failedAssets.length} asset(s) pending retry</span>
                          ) : null}
                        </div>
                      </div>

                      <div className={styles.cardDetails}>
                        <header className={styles.detailHeader}>
                          <h4 className={styles.lectureTitle}>{lecture.title}</h4>
                          <p className={styles.lectureMeta}>
                            {[lecture.exam, lecture.subject, lecture.language].filter(Boolean).join(' • ') || 'Metadata coming soon'}
                          </p>
                        </header>
                        <p className={styles.lectureDescription}>
                          Cached assets: {lecture.cachedAssets?.length || 0}
                          {lecture.durationMinutes ? ` • ${lecture.durationMinutes} mins` : ''}
                        </p>

                        <div className={styles.lectureActionsRow}>
                          {lecture.resourceUrl ? (
                            <a className={styles.lectureOpenButton} href={lecture.resourceUrl} target="_blank" rel="noreferrer">
                              Open resource
                            </a>
                          ) : null}
                          <button
                            type="button"
                            className={styles.lectureRemoveButton}
                            onClick={() => removeLecture(lecture.id)}
                            disabled={pendingLectureIds?.has?.(lecture.id)}
                          >
                            {pendingLectureIds?.has?.(lecture.id) ? 'Removing…' : 'Remove lecture'}
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
          <strong>{queuedDownloads.length} module download(s) queued</strong>
          <span>We’ll retry them automatically once you’re back online.</span>
        </aside>
      ) : null}
    </section>
  );
};

export default DownloadsPage;
