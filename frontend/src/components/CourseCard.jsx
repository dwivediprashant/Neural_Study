import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import styles from './CourseCard.module.css';
import { formatProgressLabel } from '../utils/downloads';

const CourseCard = ({ course }) => {
  const {
    downloads,
    saveCourse,
    removeCourse,
    pendingDownloadIds,
    progress,
  } = useOutletContext();
  const { t } = useTranslation();

  const moduleCount = course.modules?.length ?? 0;
  const size = course.totalSizeMB
    ? t('courseCard.size.value', { value: course.totalSizeMB })
    : t('courseCard.size.tbd');
  const downloadRecord = downloads.find((item) => item.id === course._id);
  const cachedAssets = downloadRecord?.cachedAssets?.length ?? 0;
  const totalAssets = downloadRecord?.assets?.length ?? 0;
  const isDownloaded = Boolean(downloadRecord);
  const isPending = pendingDownloadIds?.has?.(course._id);
  const progressState = progress?.get?.(course._id);
  const downloadLabel = isPending
    ? progressState && progressState.total
      ? t('downloads.progress.caching', {
          success: progressState.completed ?? progressState.success ?? 0,
          total: progressState.total,
        })
      : t('courseCard.download.caching')
    : isDownloaded
      ? t('courseCard.download.remove')
      : t('courseCard.download.save');
  const progressLabel =
    formatProgressLabel(progressState, t) ||
    (isDownloaded
      ? t('courseCard.progress.cachedAssets', {
          cached: cachedAssets,
          total: totalAssets || '—',
        })
      : null);

  const languageLabel = course.language
    ? t(`common.languages.${String(course.language).toLowerCase()}`, {
        defaultValue: course.language,
      })
    : null;

  const updatedLabel = course.updatedAt
    ? t('courseCard.updated', {
        date: new Date(course.updatedAt).toLocaleDateString(),
      })
    : t('courseCard.updatedRecent');

  const moduleCountLabel = t('courseCard.modules', { count: moduleCount });
  const metaLine = t('courseCard.meta', {
    modules: moduleCountLabel,
    updated: updatedLabel,
  });

  const handleDownloadToggle = () => {
    if (isDownloaded) {
      removeCourse(course._id);
    } else {
      saveCourse(course);
    }
  };

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <span className={styles.exam}>{course.exam}</span>
        {languageLabel ? (
          <span className={styles.language}>{languageLabel}</span>
        ) : null}
      </header>
      <h3 className={styles.title}>{course.title}</h3>
      <p className={styles.meta}>{metaLine}</p>
      <p className={styles.size}>{size}</p>
      <footer className={styles.footer}>
        <Link to={`/courses/${course._id}`} className={styles.link} state={{ course }}>
          {t('courseCard.links.viewDetails')}
        </Link>
        <div className={styles.downloadColumn}>
          {progressLabel ? <p className={styles.progressLabel}>{progressLabel}</p> : null}
          <button
            type="button"
            className={isDownloaded ? styles.removeButton : styles.downloadButton}
            onClick={handleDownloadToggle}
            disabled={isPending}
          >
            {downloadLabel}
          </button>
        </div>
      </footer>
    </article>
  );
};

export default CourseCard;
