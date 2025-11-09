import { Link, useOutletContext } from 'react-router-dom';
import styles from './CourseCard.module.css';

const formatProgressLabel = (progress) => {
  if (!progress) return null;
  const { total, success, failed } = progress;
  if (!total) return null;
  if (success === total) return 'Cached offline';
  return `Caching ${success}/${total}${failed ? ` • ${failed} failed` : ''}`;
};

const CourseCard = ({ course }) => {
  const {
    downloads,
    saveCourse,
    removeCourse,
    pendingDownloadIds,
    progress,
  } = useOutletContext();

  const moduleCount = course.modules?.length ?? 0;
  const size = course.totalSizeMB ? `${course.totalSizeMB} MB` : 'Size TBD';
  const downloadRecord = downloads.find((item) => item.id === course._id);
  const cachedAssets = downloadRecord?.cachedAssets?.length ?? 0;
  const totalAssets = downloadRecord?.assets?.length ?? 0;
  const isDownloaded = Boolean(downloadRecord);
  const isPending = pendingDownloadIds?.has?.(course._id);
  const progressState = progress?.get?.(course._id);
  const downloadLabel = isPending
    ? progressState && progressState.total
      ? `Caching ${progressState.completed}/${progressState.total}`
      : 'Caching…'
    : isDownloaded
      ? 'Remove offline'
      : 'Save offline';
  const progressLabel =
    formatProgressLabel(progressState) ||
    (isDownloaded
      ? `Cached ${cachedAssets}/${totalAssets || '—'} assets`
      : null);

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
        <span className={styles.language}>{course.language}</span>
      </header>
      <h3 className={styles.title}>{course.title}</h3>
      <p className={styles.meta}>
        {moduleCount} modules • Updated {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : 'recently'}
      </p>
      <p className={styles.size}>{size}</p>
      <footer className={styles.footer}>
        <Link to={`/courses/${course._id}`} className={styles.link} state={{ course }}>
          View details
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
