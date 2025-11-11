import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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

const TeacherUploadsPage = () => {
  const outletContext = useOutletContext() ?? {};
  const { lectures = [], lecturesLoading, handleLectureDeleted } = outletContext;
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  const filtered = useMemo(() => filterLectures(lectures, search.trim()), [lectures, search]);

  const handleDelete = async (lectureId) => {
    const confirmed = window.confirm(t('teacher.uploads.confirmDelete'));
    if (!confirmed) return;
    const result = await handleLectureDeleted?.(lectureId);
    if (!result?.success) {
      window.alert(result?.error || t('teacher.uploads.deleteFailed'));
    }
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{t('teacher.uploads.eyebrow')}</p>
          <h1 className={styles.title}>{t('teacher.uploads.title')}</h1>
          <p className={styles.subtitle}>{t('teacher.uploads.subtitle')}</p>
        </div>
        <div className={styles.actions}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder={t('teacher.uploads.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={lecturesLoading}
            aria-label={t('teacher.uploads.searchAria')}
          />
        </div>
      </header>

      {lecturesLoading ? (
        <div className={styles.stateCard}>{t('teacher.uploads.loading')}</div>
      ) : filtered.length ? (
        <ul className={styles.list}>
          {filtered.map((lecture) => {
            const lectureId = lecture.id ?? lecture._id;
            const languageLabel = lecture.language
              ? t(`common.languages.${String(lecture.language).toLowerCase()}`, {
                  defaultValue: lecture.language,
                })
              : null;
            const publishedDate = lecture.updatedAt ?? lecture.createdAt;
            const publishedLabel = publishedDate
              ? new Date(publishedDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : null;
            const metaSegments = [
              (lecture.exam ?? t('teacher.uploads.generalExam')).toUpperCase(),
              lecture.subject,
              languageLabel,
            ].filter(Boolean);
            const metaLine = metaSegments.join(' • ');
            const durationLabel = lecture.durationMinutes
              ? t('teacher.uploads.durationValue', { minutes: lecture.durationMinutes })
              : t('teacher.uploads.durationUnknown');
            const assetStatus = lecture.resourceUrl
              ? t('teacher.uploads.assetAvailable')
              : t('teacher.uploads.assetMissing');
            const assetFootnote = lecture.resourceUrl
              ? t('teacher.uploads.assetReady')
              : t('teacher.uploads.assetUpload');
            const summaryParts = [assetStatus, durationLabel];
            const summaryLine = summaryParts.filter(Boolean).join(' • ');
            const ratingAverage =
              typeof lecture.ratingAverage === 'number' ? lecture.ratingAverage.toFixed(1) : null;
            const ratingCount = typeof lecture.ratingCount === 'number' ? lecture.ratingCount : 0;
            const ratingValueLabel = ratingAverage
              ? t('teacher.uploads.ratingValue', { rating: ratingAverage })
              : t('teacher.uploads.ratingNone');
            const ratingCountLabel = ratingCount
              ? t('teacher.uploads.ratingCount', { count: ratingCount })
              : t('teacher.uploads.ratingAwaiting');
            const lectureTitle = lecture.title || t('teacher.uploads.untitledLecture');

            return (
              <li key={lectureId} className={styles.listItem}>
                <article className={styles.lectureCard}>
                  <div className={styles.cardVisual}>
                    <div className={styles.thumbShell}>
                      <span className={styles.badgeSecondary}>{t('teacher.uploads.badgeLecture')}</span>
                      {lecture.thumbnailUrl ? (
                        <img
                          src={lecture.thumbnailUrl}
                          alt={t('teacher.uploads.thumbnailAlt', { title: lectureTitle })}
                        />
                      ) : (
                        <div className={styles.thumbFallback}>{t('teacher.uploads.thumbnailFallback')}</div>
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
                        <h4 className={styles.lectureTitle}>{lectureTitle}</h4>
                        <p className={styles.lectureMeta}>{metaLine || t('teacher.uploads.detailsMissing')}</p>
                      </div>
                      <div className={styles.ratingSummary}>
                        <span className={styles.ratingValue}>{ratingValueLabel}</span>
                        <span className={styles.ratingCount}>{ratingCountLabel}</span>
                      </div>
                    </header>
                    <p className={styles.lectureDescription}>{summaryLine}</p>
                    {publishedLabel ? (
                      <span className={styles.publishBadge}>
                        {t('teacher.uploads.updated', { date: publishedLabel })}
                      </span>
                    ) : null}
                    <div className={styles.lectureActionsRow}>
                      <button
                        type="button"
                        className={styles.lectureRemoveButton}
                        onClick={() => handleDelete(lectureId)}
                      >
                        {t('teacher.uploads.removeLecture')}
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
          {lectures.length
            ? t('teacher.uploads.emptySearch')
            : t('teacher.uploads.emptyInitial')}
        </div>
      )}
    </section>
  );
};

export default TeacherUploadsPage;
