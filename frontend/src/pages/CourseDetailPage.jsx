import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
  }, [memoizedCourse, t]);

  useEffect(() => {
    const needsFetch = !memoizedCourse || !(memoizedCourse.modules?.length);
    if (!needsFetch) return;

    let cancelled = false;

    if (status?.isOffline) {
      setCourseLoading(false);
      setCourseError(t('courseDetail.errors.notCached'));
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
        const message = err?.response?.data?.message || err?.message || t('courseDetail.errors.fetch');
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
    formatProgressLabel(courseProgress, t) ||
    (isCourseCached && totalCourseAssets
      ? t('downloadsPage.courses.cachedSummary', {
          cached: cachedCourseAssets,
          total: totalCourseAssets,
        })
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
      formatProgressLabel(moduleProgress, t) ||
      (hasCachedAssets
        ? t('downloadsPage.courses.module.cached', {
            cached: moduleCachedCount,
            total: moduleAssetsCount,
          })
        : null);
    const moduleBadgeLabel =
      moduleLabel ?? (moduleHasAssets ? t('courseDetail.module.badgeFallback') : null);
    const moduleBadgeTone = hasCachedAssets
      ? styles.moduleBadgeSuccess
      : isPending
      ? styles.moduleBadgeActive
      : styles.moduleBadgeNeutral;
    const moduleAssetSummary = moduleHasAssets
      ? t('courseDetail.module.assetSummary', { count: moduleAssetsCount })
      : t('courseDetail.module.assetSummaryStreaming');

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
  const description = course.description || t('courseDetail.descriptionFallback');

  const resolvedLanguage = course?.language
    ? t(`common.languages.${String(course.language).toLowerCase()}`, {
        defaultValue: course.language,
      })
    : t('courseDetail.meta.languageUnknown');

  const [preview, setPreview] = useState({ open: false, assetUrl: '', title: '', lessonType: '' });

  const closePreview = () => setPreview({ open: false, assetUrl: '', title: '', lessonType: '' });

  if (courseLoading) {
    return (
      <section className={styles.emptyWrapper}>
        <h2 className={styles.heading}>{t('courseDetail.load.heading')}</h2>
        <p className={styles.description}>{t('courseDetail.load.description')}</p>
        <Link to="/" className={styles.backLink}>
          {t('courseDetail.actions.back')}
        </Link>
      </section>
    );
  }

  if (!course) {
    return (
      <section className={styles.emptyWrapper}>
        <h2 className={styles.heading}>{t('courseDetail.unavailable.heading')}</h2>
        <p className={styles.description}>
          {courseError ||
            (status?.isOffline
              ? t('courseDetail.unavailable.offline')
              : t('courseDetail.unavailable.message'))}
        </p>
        <Link to="/" className={styles.backLink}>
          {t('courseDetail.actions.back')}
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
              {t('courseDetail.media.noSupport')}
            </video>
          ) : (
            <div className={styles.mediaPlaceholder}>
              <span>{t('courseDetail.media.noPreview')}</span>
            </div>
          )}
          <p className={styles.mediaHint}>
            {course.cachedAssets?.length || cachedCourseAssets
              ? t('courseDetail.media.hintReady')
              : t('courseDetail.media.hintPrompt')}
            {failedAssetCount
              ? ` • ${t('downloadsPage.retry.pending', { count: failedAssetCount })}`
              : ''}
          </p>
        </div>

        <header className={styles.headerCard}>
          <div>
            <span className={styles.exam}>{course.exam}</span>
            <h2 className={styles.title}>{course.title}</h2>
            <p className={styles.meta}>
              {t('courseDetail.meta.line', {
                modules: course.modules?.length || 0,
                lessons: totalLessons,
                language: resolvedLanguage,
              })}
            </p>
            <p className={styles.description}>{description}</p>
            <div className={styles.downloadSummaryRow}>
              <span className={`${styles.summaryChip} ${styles.summaryChipPrimary}`}>
                {t('courseDetail.summary.modulesCached', {
                  cached: fullyCachedModulesCount,
                  total: modulesWithAssetsCount || course.modules?.length || 0,
                })}
              </span>
              {partiallyCachedModulesCount ? (
                <span className={`${styles.summaryChip} ${styles.summaryChipInfo}`}>
                  {t('courseDetail.summary.modulesProgress', {
                    count: partiallyCachedModulesCount,
                  })}
                </span>
              ) : null}
              {failedAssetCount ? (
                <span className={`${styles.summaryChip} ${styles.summaryChipWarning}`}>
                  {t('courseDetail.summary.assetsFailed', { count: failedAssetCount })}
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
                  ? t('downloads.progress.caching', {
                      success: courseProgress.completed ?? courseProgress.success ?? 0,
                      total: courseProgress.total,
                    })
                  : t('courseCard.download.caching')
                : isCourseCached
                ? t('courseDetail.actions.removeFull')
                : t('courseDetail.actions.downloadFull')}
            </button>
            <Link to="/" className={styles.secondaryLink}>
              {t('courseDetail.actions.back')}
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
                        ? t('downloads.progress.caching', {
                            success: moduleProgress.completed ?? moduleProgress.success ?? 0,
                            total: moduleProgress.total,
                          })
                        : t('courseCard.download.caching')
                      : hasCachedAssets
                      ? t('courseDetail.actions.removeModule')
                      : moduleHasAssets
                      ? t('courseDetail.actions.downloadModule')
                      : t('courseDetail.actions.noAssets')}
                  </button>
                </div>
              </header>

              <ul className={styles.lessonList}>
                {lessons.map((lesson, lessonIndex) => (
                  <li key={`${moduleKey}-${lessonIndex}`} className={styles.lessonItem}>
                    <div>
                      <span className={styles.lessonType}>
                        {lesson.type?.toUpperCase() || t('courseDetail.lessons.typeFallback')}
                      </span>
                      <p className={styles.lessonTitle}>{lesson.title}</p>
                      {lesson.description ? (
                        <p className={styles.lessonDescription}>{lesson.description}</p>
                      ) : null}
                    </div>
                    <div className={styles.lessonMetaBlock}>
                      {lesson.durationMinutes ? (
                        <span className={styles.lessonMeta}>
                          {t('courseDetail.lessons.duration', { minutes: lesson.durationMinutes })}
                        </span>
                      ) : null}
                      {lesson.sizeMB ? (
                        <span className={styles.lessonMeta}>
                          {t('courseDetail.lessons.size', { size: lesson.sizeMB })}
                        </span>
                      ) : null}
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
                          {t('courseDetail.actions.previewAsset')}
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
