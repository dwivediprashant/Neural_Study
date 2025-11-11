import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import styles from './TeacherUploadsPage.module.css';

const filterLectures = (lectures, query) => {
  if (!query) return lectures;
  const value = query.toLowerCase();
  return lectures.filter((lecture) => {
    const tokens = [
      lecture.title,
      lecture.subject,
      lecture.exam,
      lecture.language,
      ...(lecture.tags ?? []),
    ]
      .filter(Boolean)
      .map((token) => token.toLowerCase());

    return tokens.some((token) => token.includes(value));
  });
};

const LANG_LABELS = {
  EN: 'English',
  HI: 'Hindi',
  BI: 'Bilingual',
};

const TeacherUploadsPage = () => {
  const outletContext = useOutletContext() ?? {};
  const { lectures = [], lecturesLoading, handleLectureDeleted } = outletContext;
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => filterLectures(lectures, search.trim()), [lectures, search]);

  const handleDelete = async (lectureId) => {
    const confirmed = window.confirm('Remove this lecture? This action cannot be undone.');
    if (!confirmed) return;
    const result = await handleLectureDeleted?.(lectureId);
    if (!result?.success) {
      window.alert(result?.error || 'Failed to remove lecture');
    }
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>My uploads</p>
          <h1 className={styles.title}>Manage lectures</h1>
          <p className={styles.subtitle}>
            Review, filter, and remove content you have shared with students. Upload changes propagate immediately to
            the student catalogue.
          </p>
        </div>
        <div className={styles.actions}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search by title, subject, tag, or exam"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={lecturesLoading}
            aria-label="Search uploaded lectures"
          />
        </div>
      </header>

      {lecturesLoading ? (
        <div className={styles.stateCard}>Loading your uploads…</div>
      ) : filtered.length ? (
        <ul className={styles.list}>
          {filtered.map((lecture) => {
            const lectureId = lecture.id ?? lecture._id;
            const languageLabel = lecture.language ? LANG_LABELS[lecture.language] ?? lecture.language : null;
            const publishedDate = lecture.updatedAt ?? lecture.createdAt;
            const publishedLabel = publishedDate
              ? new Date(publishedDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : null;
            const metaSegments = [
              (lecture.exam ?? 'GENERAL').toUpperCase(),
              lecture.subject,
              languageLabel,
            ].filter(Boolean);
            const metaLine = metaSegments.join(' • ');
            const durationLabel = lecture.durationMinutes ? `${lecture.durationMinutes} mins` : 'Duration unknown';
            const assetStatus = lecture.resourceUrl ? 'Asset available' : 'Asset missing';
            const assetFootnote = lecture.resourceUrl ? 'Ready for students' : 'Upload resource link';
            const summaryParts = [assetStatus, durationLabel];
            const summaryLine = summaryParts.filter(Boolean).join(' • ');
            const ratingAverage =
              typeof lecture.ratingAverage === 'number' ? lecture.ratingAverage.toFixed(1) : null;
            const ratingCount = typeof lecture.ratingCount === 'number' ? lecture.ratingCount : 0;

            return (
              <li key={lectureId} className={styles.listItem}>
                <article className={styles.lectureCard}>
                  <div className={styles.cardVisual}>
                    <div className={styles.thumbShell}>
                      <span className={styles.badgeSecondary}>Lecture</span>
                      {lecture.thumbnailUrl ? (
                        <img src={lecture.thumbnailUrl} alt={`Thumbnail for ${lecture.title}`} />
                      ) : (
                        <div className={styles.thumbFallback}>No thumbnail</div>
                      )}
                    </div>
                    <div className={styles.visualFooter}>
                      <p>{assetStatus}</p>
                      <span>{assetFootnote}</span>
                    </div>
                  </div>

                  <div className={styles.cardDetails}>
                    <header className={styles.detailHeader}>
                      <div className={styles.detailHeading}>
                        <h4 className={styles.lectureTitle}>{lecture.title}</h4>
                        <p className={styles.lectureMeta}>{metaLine || 'Details missing'}</p>
                      </div>
                      <div className={styles.ratingSummary}>
                        <span className={styles.ratingValue}>
                          {ratingAverage ? `★ ${ratingAverage} / 5` : 'Not rated'}
                        </span>
                        <span className={styles.ratingCount}>
                          {ratingCount ? `${ratingCount} review${ratingCount === 1 ? '' : 's'}` : 'Awaiting reviews'}
                        </span>
                      </div>
                    </header>
                    <p className={styles.lectureDescription}>{summaryLine}</p>
                    {publishedLabel ? (
                      <span className={styles.publishBadge}>Updated {publishedLabel}</span>
                    ) : null}
                    <div className={styles.lectureActionsRow}>
                      <button
                        type="button"
                        className={styles.lectureRemoveButton}
                        onClick={() => handleDelete(lectureId)}
                      >
                        Remove lecture
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className={styles.emptyState}>
          {lectures.length ? 'No uploads match that search.' : 'You have not uploaded any lectures yet.'}
        </div>
      )}
    </section>
  );
};

export default TeacherUploadsPage;
