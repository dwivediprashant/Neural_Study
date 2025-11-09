import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useOutletContext, useParams } from 'react-router-dom';

import styles from './CourseDetailPage.module.css';
import {
  createModuleKey,
  formatProgressLabel,
  makeCourseProgressKey,
  makeModuleProgressKey,
} from '../utils/downloads';
import AssetPreviewModal from '../components/AssetPreviewModal.jsx';
import { fetchCourseById } from '../api/client';

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const {
    courses,
    downloads,
    saveCourse,
    removeCourse,
    saveModule,
    removeModule,
    pendingDownloadIds,
    pendingDownloadKeys,
    progress,
    status,
  } = useOutletContext();

  const memoizedCourse = useMemo(() => {
    if (location.state?.course) return location.state.course;
    return courses.find((c) => c._id === courseId);
  }, [courseId, courses, location.state]);

  const [courseData, setCourseData] = useState(memoizedCourse);
  const [courseLoading, setCourseLoading] = useState(!memoizedCourse);
  const [courseError, setCourseError] = useState(null);

  useEffect(() => {
    if (memoizedCourse) {
      setCourseData(memoizedCourse);
      setCourseLoading(false);
      setCourseError(null);
    }
  }, [memoizedCourse]);

  useEffect(() => {
    const needsFetch = !memoizedCourse || !(memoizedCourse.modules?.length);
    if (!needsFetch) return;

    let cancelled = false;

    if (status?.isOffline) {
      setCourseLoading(false);
      setCourseError(
        'This course is not cached yet. Connect to the internet and sync to load full details.'
      );
      return () => {
        cancelled = true;
      };
    }

    const loadCourse = async () => {
      try {
        setCourseLoading(true);
        setCourseError(null);
        const data = await fetchCourseById(courseId);
        if (cancelled) return;
        const resolvedCourse = data?.course ?? data;
        setCourseData(resolvedCourse);
      } catch (err) {
        if (cancelled) return;
        const message =
          err?.response?.data?.message || err?.message || 'Unable to load course details.';
        setCourseError(message);
      } finally {
        if (!cancelled) {
          setCourseLoading(false);
        }
      }
    };

    loadCourse();

    return () => {
      cancelled = true;
    };
  }, [courseId, memoizedCourse, status?.isOffline]);

  const course = courseData;

  const downloadRecord = downloads.find((item) => item.id === course?._id);
  const totalCourseAssets = downloadRecord?.assets?.length ?? 0;
  const cachedCourseAssets = downloadRecord?.cachedAssets?.length ?? 0;
  const isCourseCached = Boolean(downloadRecord);
  const courseProgress = progress.get(makeCourseProgressKey(courseId));
  const coursePending = pendingDownloadIds?.has?.(courseId);
  const courseLabel =
    formatProgressLabel(courseProgress) ||
    (isCourseCached && totalCourseAssets
      ? `Cached ${cachedCourseAssets}/${totalCourseAssets}`
      : null);

  const modules = course.modules ?? [];
  const moduleDownloadInfo = modules.map((module, moduleIndex) => {
    const moduleKey = createModuleKey(module, moduleIndex);
    const progressKey = makeModuleProgressKey(course._id, moduleKey);
    const moduleProgress = progress.get(progressKey);
    const isPending = pendingDownloadKeys?.has?.(progressKey);

    const lessons = module?.lessons ?? [];
    const moduleAssets = lessons.filter((lesson) => lesson.assetUrl);
    const moduleAssetsCount = moduleAssets.length;
    const moduleCachedCount = moduleAssets.filter((lesson) =>
      downloadRecord?.cachedAssets?.includes?.(lesson.assetUrl)
    ).length;
    const moduleHasAssets = moduleAssetsCount > 0;
    const hasCachedAssets = moduleCachedCount > 0;
    const isFullyCached = moduleHasAssets && moduleCachedCount === moduleAssetsCount;

    const moduleLabel =
      formatProgressLabel(moduleProgress) ||
      (hasCachedAssets ? `Cached ${moduleCachedCount}/${moduleAssetsCount}` : null);
    const moduleBadgeLabel = moduleLabel ?? (moduleHasAssets ? 'Not cached yet' : null);
    const moduleBadgeTone = hasCachedAssets
      ? styles.moduleBadgeSuccess
      : isPending
      ? styles.moduleBadgeActive
      : styles.moduleBadgeNeutral;
    const moduleAssetSummary = moduleHasAssets
      ? `${moduleAssetsCount} downloadable asset${moduleAssetsCount !== 1 ? 's' : ''}`
      : 'Streaming content only';

    return {
      module,
      moduleIndex,
      moduleKey,
      progressKey,
      moduleProgress,
      isPending,
      lessons,
      moduleAssets,
      moduleAssetsCount,
      moduleCachedCount,
      moduleHasAssets,
      hasCachedAssets,
      isFullyCached,
      moduleLabel,
      moduleBadgeLabel,
      moduleBadgeTone,
      moduleAssetSummary,
    };
  });

  const modulesWithAssetsCount = moduleDownloadInfo.filter((info) => info.moduleHasAssets).length;
  const fullyCachedModulesCount = moduleDownloadInfo.filter((info) => info.isFullyCached).length;
  const partiallyCachedModulesCount = moduleDownloadInfo.filter(
    (info) => info.moduleHasAssets && info.hasCachedAssets && !info.isFullyCached
  ).length;

  const lessonAssets = modules
    .flatMap((module) => module.lessons ?? [])
    .map((lesson) => lesson.assetUrl)
    .filter(Boolean);
  const preferredAssets = (downloadRecord?.cachedAssets?.length ? downloadRecord.cachedAssets : downloadRecord?.assets) ?? [];
  const availableAssets = preferredAssets.length ? preferredAssets : lessonAssets;
  const videoAsset = availableAssets.find((asset) => /\.mp4(\?|$)/.test(asset));
  const failedAssetCount = downloadRecord?.failedAssets?.length ?? 0;
  const description = course.description || 'Offline copy ready for playback and revision.';

  const [preview, setPreview] = useState({ open: false, assetUrl: '', title: '', lessonType: '' });

  const closePreview = () => setPreview({ open: false, assetUrl: '', title: '', lessonType: '' });

  if (courseLoading) {
    return (
      <section className={styles.emptyWrapper}>
        <h2 className={styles.heading}>Loading course…</h2>
        <p className={styles.description}>Fetching the latest modules and lessons.</p>
        <Link to="/" className={styles.backLink}>
          Back to catalog
        </Link>
      </section>
    );
  }

  if (!course) {
    return (
      <section className={styles.emptyWrapper}>
        <h2 className={styles.heading}>Course details unavailable</h2>
        <p className={styles.description}>
          {courseError ||
            (status?.isOffline
              ? 'This course is not cached yet. Connect to the internet and try syncing again.'
              : 'We could not find that course. Try another one from the catalog.')}
        </p>
        <Link to="/" className={styles.backLink}>
          Back to catalog
        </Link>
      </section>
    );
  }

  const totalLessons = course.modules?.reduce((acc, module) => acc + (module.lessons?.length || 0), 0) || 0;

  return (
    <section className={styles.wrapper}>
      <AssetPreviewModal
        open={preview.open}
        assetUrl={preview.assetUrl}
        title={preview.title}
        lessonType={preview.lessonType}
        onClose={closePreview}
      />
      <div className={styles.heroPanel}>
        <div className={styles.mediaColumn}>
          {videoAsset ? (
            <video key={videoAsset} className={styles.mediaPlayer} src={videoAsset} controls preload="metadata">
              Your browser does not support offline playback.
            </video>
          ) : (
            <div className={styles.mediaPlaceholder}>
              <span>No video preview available</span>
            </div>
          )}
          <p className={styles.mediaHint}>
            {course.cachedAssets?.length || cachedCourseAssets
              ? 'Offline playback ready.'
              : 'Cache this course to enable offline playback.'}
            {failedAssetCount ? ` • ${failedAssetCount} asset(s) pending retry.` : ''}
          </p>
        </div>

        <header className={styles.headerCard}>
          <div>
            <span className={styles.exam}>{course.exam}</span>
            <h2 className={styles.title}>{course.title}</h2>
            <p className={styles.meta}>
              {course.modules?.length || 0} modules • {totalLessons} lessons • {course.language}
            </p>
            <p className={styles.description}>{description}</p>
            <div className={styles.downloadSummaryRow}>
              <span className={`${styles.summaryChip} ${styles.summaryChipPrimary}`}>
                {fullyCachedModulesCount}/{modulesWithAssetsCount || course.modules?.length || 0} modules cached
              </span>
              {partiallyCachedModulesCount ? (
                <span className={`${styles.summaryChip} ${styles.summaryChipInfo}`}>
                  {partiallyCachedModulesCount} in progress
                </span>
              ) : null}
              {failedAssetCount ? (
                <span className={`${styles.summaryChip} ${styles.summaryChipWarning}`}>
                  {failedAssetCount} asset{failedAssetCount !== 1 ? 's' : ''} failed
                </span>
              ) : null}
            </div>
          </div>
          <div className={styles.actions}>
            {courseLabel ? <p className={styles.progressLabel}>{courseLabel}</p> : null}
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => (isCourseCached ? removeCourse(course._id) : saveCourse(course))}
              disabled={coursePending}
            >
              {coursePending
                ? courseProgress?.total
                  ? `Caching ${courseProgress.completed}/${courseProgress.total}`
                  : 'Caching…'
                : isCourseCached
                ? 'Remove full course'
                : 'Download full course'}
            </button>
            <Link to="/" className={styles.secondaryLink}>
              Back to catalog
            </Link>
          </div>
        </header>
      </div>

      <div className={styles.moduleList}>
        {moduleDownloadInfo.map((info) => {
          const {
            module,
            moduleKey,
            moduleProgress,
            isPending,
            lessons,
            hasCachedAssets,
            moduleHasAssets,
            moduleBadgeLabel,
            moduleBadgeTone,
            moduleAssetSummary,
          } = info;

          const handleModuleToggle = () => {
            if (hasCachedAssets) {
              removeModule(course, module, moduleKey);
            } else if (moduleHasAssets) {
              saveModule(course, module, moduleKey);
            }
          };

          return (
            <article key={moduleKey} className={styles.moduleCard}>
              <header className={styles.moduleHeader}>
                <div className={styles.moduleInfo}>
                  <h3 className={styles.moduleTitle}>
                    {module.order ? `${module.order}. ` : ''}
                    {module.name}
                  </h3>
                  <div className={styles.moduleMetaRow}>
                    <span className={styles.moduleAssetSummary}>{moduleAssetSummary}</span>
                    {moduleBadgeLabel ? (
                      <span className={`${styles.moduleBadge} ${moduleBadgeTone}`}>
                        {moduleBadgeLabel}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className={styles.moduleActions}>
                  <button
                    type="button"
                    className={styles.outlineButton}
                    onClick={handleModuleToggle}
                    disabled={isPending || !moduleHasAssets}
                  >
                    {isPending
                      ? moduleProgress?.total
                        ? `Caching ${moduleProgress.completed}/${moduleProgress.total}`
                        : 'Caching…'
                      : hasCachedAssets
                      ? 'Remove module'
                      : moduleHasAssets
                      ? 'Download module'
                      : 'No assets'}
                  </button>
                </div>
              </header>

              <ul className={styles.lessonList}>
                {lessons.map((lesson, lessonIndex) => (
                  <li key={`${moduleKey}-${lessonIndex}`} className={styles.lessonItem}>
                    <div>
                      <span className={styles.lessonType}>{lesson.type?.toUpperCase() || 'LESSON'}</span>
                      <p className={styles.lessonTitle}>{lesson.title}</p>
                      {lesson.description ? (
                        <p className={styles.lessonDescription}>{lesson.description}</p>
                      ) : null}
                    </div>
                    <div className={styles.lessonMetaBlock}>
                      {lesson.durationMinutes ? (
                        <span className={styles.lessonMeta}>{lesson.durationMinutes} mins</span>
                      ) : null}
                      {lesson.sizeMB ? <span className={styles.lessonMeta}>{lesson.sizeMB} MB</span> : null}
                      {lesson.assetUrl ? (
                        <button
                          type="button"
                          className={styles.previewButton}
                          onClick={() =>
                            setPreview({
                              open: true,
                              assetUrl: lesson.assetUrl,
                              title: lesson.title,
                              lessonType: lesson.type?.toUpperCase() || 'LESSON',
                            })
                          }
                        >
                          Preview asset
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default CourseDetailPage;
