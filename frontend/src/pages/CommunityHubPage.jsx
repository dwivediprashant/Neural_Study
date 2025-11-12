import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { fetchComments, createCommentEntry } from '../api/client.js';
import styles from './CommunityHubPage.module.css';

const COMMENT_CHAR_LIMIT = 500;
const LECTURE_FILTERS = ['all', 'pending', 'solved'];

const getLectureId = (lecture = {}) =>
  lecture.id ?? lecture._id ?? lecture.lectureId ?? lecture.slug ?? null;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatTimestamp = (value) => {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return null;
  }
};

const CommunityHubPage = () => {
  const { t } = useTranslation();
  const outletContext = useOutletContext() ?? {};
  const {
    recentLectures = [],
    rateLecture,
    refreshLectureRating,
    removeRecentLecture,
    pushToast,
    lecturesLoading,
  } = outletContext;

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [submittingMap, setSubmittingMap] = useState({});
  const [commentRatings, setCommentRatings] = useState({});
  const [filter, setFilter] = useState('all');

  const normalizedLectures = useMemo(() => {
    if (!Array.isArray(recentLectures)) return [];

    return recentLectures
      .map((lecture) => {
        const id = getLectureId(lecture);
        if (!id) return null;
        return {
          id,
          title: lecture.title ?? lecture.name ?? t('communityHub.lecture.fallbackTitle'),
          subject:
            lecture.subject ??
            lecture.exam ??
            lecture.category ??
            (Array.isArray(lecture.tags) && lecture.tags.length ? lecture.tags[0] : null) ??
            t('communityHub.lecture.fallbackSubject'),
          duration: toNumber(lecture.duration ?? lecture.durationMinutes ?? lecture.length),
          thumbnail: lecture.thumbnail ?? lecture.thumbnailUrl ?? lecture.poster ?? null,
          viewedAt: lecture.viewedAt ?? lecture.lastViewedAt ?? lecture.updatedAt ?? null,
          ratingAverage:
            typeof lecture.ratingAverage === 'number' && Number.isFinite(lecture.ratingAverage)
              ? lecture.ratingAverage
              : null,
          ratingCount:
            typeof lecture.ratingCount === 'number' && Number.isFinite(lecture.ratingCount)
              ? lecture.ratingCount
              : 0,
          myRating:
            typeof lecture.myRating === 'number' && Number.isFinite(lecture.myRating)
              ? lecture.myRating
              : null,
        };
      })
      .filter(Boolean);
  }, [recentLectures, t]);

  const lectureCommentsMap = useMemo(() => {
    const map = new Map();
    comments.forEach((comment) => {
      const lectureKey =
        (comment.lectureId && typeof comment.lectureId === 'object'
          ? comment.lectureId._id ?? comment.lectureId.id ?? comment.lectureId
          : comment.lectureId) ?? null;
      if (!lectureKey) return;
      if (!map.has(lectureKey)) {
        map.set(lectureKey, []);
      }
      map.get(lectureKey).push(comment);
    });
    return map;
  }, [comments]);

  const decoratedLectures = useMemo(() => {
    return normalizedLectures.map((lecture) => {
      const lectureComments = lectureCommentsMap.get(lecture.id) ?? [];
      const hasComments = lectureComments.length > 0;
      const allSolved =
        hasComments &&
        lectureComments.every((comment) => (comment.status ?? 'pending') === 'solved');
      const status = allSolved ? 'solved' : 'pending';

      return {
        ...lecture,
        status,
        commentCount: lectureComments.length,
      };
    });
  }, [lectureCommentsMap, normalizedLectures]);

  const stats = useMemo(() => {
    const total = decoratedLectures.length;
    const pending = decoratedLectures.filter((lecture) => lecture.status === 'pending').length;
    const solved = decoratedLectures.filter((lecture) => lecture.status === 'solved').length;
    return { total, pending, solved };
  }, [decoratedLectures]);

  const filteredLectures = useMemo(() => {
    if (filter === 'all') {
      return decoratedLectures;
    }
    return decoratedLectures.filter((lecture) => lecture.status === filter);
  }, [decoratedLectures, filter]);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const { comments: fetchedComments } = await fetchComments();
      setComments(Array.isArray(fetchedComments) ? fetchedComments : []);
      setCommentsError(null);
    } catch (error) {
      const message = error.response?.data?.message ?? t('communityHub.errors.loadComments');
      setCommentsError(message);
      if (pushToast) {
        pushToast(message, 'danger');
      }
    } finally {
      setLoadingComments(false);
    }
  }, [pushToast, t]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    if (!normalizedLectures.length) return;
    setCommentRatings((prev) => {
      let changed = false;
      const next = { ...prev };
      normalizedLectures.forEach((lecture) => {
        const rating = lecture.myRating ?? null;
        if (
          rating &&
          (!Object.prototype.hasOwnProperty.call(prev, lecture.id) || prev[lecture.id] !== rating)
        ) {
          next[lecture.id] = rating;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [normalizedLectures]);

  const handleRatingSelect = useCallback(
    async (lectureId, value) => {
      if (!lectureId || typeof value !== 'number' || value < 1 || value > 5) return;
      const previousValue = commentRatings[lectureId] ?? null;
      setCommentRatings((prev) => ({ ...prev, [lectureId]: value }));

      if (!rateLecture) return;
      const result = await rateLecture(lectureId, value);
      if (!result?.success) {
        setCommentRatings((prev) => ({ ...prev, [lectureId]: previousValue ?? null }));
        if (refreshLectureRating) {
          refreshLectureRating(lectureId);
        }
      } else if (result?.data?.rating) {
        setCommentRatings((prev) => ({ ...prev, [lectureId]: result.data.rating }));
      }
    },
    [commentRatings, rateLecture, refreshLectureRating]
  );

  const handleDraftChange = useCallback((lectureId, value) => {
    setCommentDrafts((prev) => ({
      ...prev,
      [lectureId]: value.slice(0, COMMENT_CHAR_LIMIT),
    }));
  }, []);

  const handleSubmit = useCallback(
    async (lectureId) => {
      const draft = commentDrafts[lectureId] ?? '';
      const trimmed = draft.trim();
      if (!trimmed) {
        if (pushToast) {
          pushToast(t('communityHub.validation.commentRequired'), 'warning');
        }
        return;
      }

      setSubmittingMap((prev) => ({ ...prev, [lectureId]: true }));
      try {
        const ratingValue = commentRatings[lectureId];
        const payload = {
          lectureId,
          content: trimmed,
        };
        if (typeof ratingValue === 'number' && ratingValue >= 1 && ratingValue <= 5) {
          payload.rating = ratingValue;
        }

        const { comment } = await createCommentEntry(payload);
        if (comment) {
          setComments((prev) => {
            const filtered = prev.filter((item) => item._id !== comment._id);
            return [comment, ...filtered];
          });
          setCommentDrafts((prev) => ({ ...prev, [lectureId]: '' }));
          if (typeof comment.rating === 'number') {
            setCommentRatings((prev) => ({ ...prev, [lectureId]: comment.rating }));
            if (refreshLectureRating) {
              refreshLectureRating(lectureId);
            }
          }
          if (pushToast) {
            pushToast(t('communityHub.toast.commentSubmitted'), 'success');
          }
        }
      } catch (error) {
        const message = error.response?.data?.message ?? t('communityHub.errors.submitComment');
        setCommentsError(message);
        if (pushToast) {
          pushToast(message, 'danger');
        }
      } finally {
        setSubmittingMap((prev) => {
          const { [lectureId]: _omit, ...rest } = prev;
          return rest;
        });
      }
    },
    [commentDrafts, commentRatings, pushToast, refreshLectureRating, t]
  );

  const handleRefreshClick = useCallback(() => {
    if (!loadingComments) {
      loadComments();
    }
  }, [loadComments, loadingComments]);

  const handleFilterChange = useCallback((value) => {
    setFilter(value);
  }, []);

  const renderRatingStars = (lecture) => {
    const selectedRating = commentRatings[lecture.id] ?? lecture.myRating ?? 0;
    return (
      <div
        className={styles.ratingStars}
        role="radiogroup"
        aria-label={t('communityHub.lectures.rateAria', { title: lecture.title })}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={`${styles.ratingStar} ${
              selectedRating >= value ? styles.ratingStarActive : ''
            }`}
            onClick={() => handleRatingSelect(lecture.id, value)}
            aria-label={t('communityHub.lectures.starAria', { count: value })}
            aria-pressed={selectedRating === value}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const renderCommentList = (lectureId) => {
    const lectureComments = lectureCommentsMap.get(lectureId) ?? [];
    if (!lectureComments.length) {
      return <p className={styles.commentEmpty}>{t('communityHub.comments.empty')}</p>;
    }

    return (
      <ul className={styles.commentList}>
        {lectureComments.map((comment) => {
          const createdAt = formatTimestamp(comment.createdAt);
          const repliedAt = formatTimestamp(comment.repliedAt);
          const ratingValue =
            typeof comment.rating === 'number' && Number.isFinite(comment.rating)
              ? comment.rating
              : null;
          const statusKey = comment.status ?? 'default';

          return (
            <li key={comment._id ?? `${lectureId}-${createdAt}`} className={styles.commentItem}>
              <header className={styles.commentMeta}>
                <span
                  className={`${styles.statusBadge} ${
                    styles[`status${statusKey.charAt(0).toUpperCase()}${statusKey.slice(1)}`] ?? ''
                  }`}
                >
                  {t(`communityHub.comments.status.${statusKey}`, {
                    defaultValue: t('communityHub.comments.status.default'),
                  })}
                </span>
                {createdAt ? <time dateTime={createdAt}>{createdAt}</time> : null}
              </header>

              {ratingValue ? (
                <div
                  className={styles.commentRating}
                  aria-label={t('communityHub.comments.ratingLabel', { rating: ratingValue })}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <span
                      key={value}
                      className={`${styles.commentRatingStar} ${
                        ratingValue >= value ? styles.commentRatingStarActive : ''
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              ) : null}

              <p className={styles.commentBody}>{comment.content}</p>

              {comment.replyContent ? (
                <div className={styles.commentReply}>
                  <span className={styles.commentReplyLabel}>{t('communityHub.comments.replyLabel')}</span>
                  <p>{comment.replyContent}</p>
                  {repliedAt ? <time dateTime={repliedAt}>{repliedAt}</time> : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  };

  if (!lecturesLoading && !normalizedLectures.length) {
    return (
      <section className={styles.page}>
        <header className={styles.hero}>
          <span className={styles.heroEyebrow}>{t('communityHub.hero.eyebrow')}</span>
          <h1 className={styles.heroTitle}>{t('communityHub.hero.title')}</h1>
          <p className={styles.heroSubtitle}>{t('communityHub.hero.subtitle')}</p>
        </header>

        <div className={styles.emptyState}>
          <h2>{t('communityHub.empty.title')}</h2>
          <p>{t('communityHub.empty.description')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.heroEyebrow}>{t('communityHub.hero.eyebrow')}</span>
          <h1 className={styles.heroTitle}>{t('communityHub.hero.title')}</h1>
          <p className={styles.heroSubtitle}>{t('communityHub.hero.subtitle')}</p>
        </div>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={handleRefreshClick}
          disabled={loadingComments}
        >
          {loadingComments
            ? t('communityHub.actions.refreshing')
            : t('communityHub.actions.refresh')}
        </button>
      </header>

      {commentsError ? <div className={styles.errorBanner}>{commentsError}</div> : null}

      <div className={styles.toolbar}>
        <div
          className={styles.filterGroup}
          role="tablist"
          aria-label={t('communityHub.filters.label')}
        >
          {LECTURE_FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              className={`${styles.filterButton} ${
                filter === value ? styles.filterButtonActive : ''
              }`}
              onClick={() => handleFilterChange(value)}
            >
              <span>{t(`communityHub.filters.${value}`)}</span>
              <span className={styles.filterBadge}>
                {value === 'all'
                  ? stats.total
                  : value === 'pending'
                  ? stats.pending
                  : stats.solved}
              </span>
            </button>
          ))}
        </div>
      </div>

      {!filteredLectures.length ? (
        <div className={styles.filterEmpty}>
          <h2>{t('communityHub.filters.emptyTitle')}</h2>
          <p>{t('communityHub.filters.emptyDescription')}</p>
        </div>
      ) : (
        <div
          className={styles.lectureScrollArea}
          tabIndex={0}
          aria-label={t('communityHub.lectures.scrollAria')}
        >
          <div className={styles.lectureList}>
            {filteredLectures.map((lecture) => {
              const draft = commentDrafts[lecture.id] ?? '';
              const remainingCharacters = Math.max(0, COMMENT_CHAR_LIMIT - draft.length);
              const isSubmitting = Boolean(submittingMap[lecture.id]);
              const selectedRating = commentRatings[lecture.id] ?? lecture.myRating ?? 0;
              const viewedAt = formatTimestamp(lecture.viewedAt);
              const ratingAverageLabel = lecture.ratingAverage
                ? t('communityHub.lectures.ratingAverage', {
                    rating: lecture.ratingAverage.toFixed(1),
                  })
                : t('communityHub.lectures.ratingNone');
              const ratingCountLabel = lecture.ratingCount
                ? t('communityHub.lectures.ratingCount', { count: lecture.ratingCount })
                : t('communityHub.lectures.ratingCountZero');

              return (
                <article key={lecture.id} className={styles.lectureCard}>
                  <div className={styles.lectureHeader}>
                    <div className={styles.lectureThumbnail}>
                      {lecture.thumbnail ? (
                        <img
                          src={lecture.thumbnail}
                          alt={t('communityHub.lecture.thumbnailAlt', { title: lecture.title })}
                          loading="lazy"
                        />
                      ) : (
                        <span aria-hidden="true" className={styles.thumbnailFallback}>
                          {lecture.title.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className={styles.lectureInfo}>
                      <h2>{lecture.title}</h2>
                      <p className={styles.lectureMeta}>
                        <span>{lecture.subject}</span>
                        {lecture.duration ? (
                          <span>· {t('communityHub.lecture.duration', { minutes: lecture.duration })}</span>
                        ) : null}
                      </p>
                      {viewedAt ? (
                        <p className={styles.lectureViewed}>
                          {t('communityHub.lecture.viewed', { timestamp: viewedAt })}
                        </p>
                      ) : null}
                    </div>

                    <div className={styles.lectureRating}>
                      <span className={styles.ratingLabel}>{t('communityHub.lectures.ratingLabel')}</span>
                      {renderRatingStars(lecture)}
                      <p className={styles.ratingSummary}>
                        <span>{ratingAverageLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ratingCountLabel}</span>
                      </p>
                      {selectedRating ? (
                        <span className={styles.myRatingBadge}>
                          {t('communityHub.lectures.yourRating', { rating: selectedRating })}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className={styles.lectureActions}>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => removeRecentLecture?.(lecture.id)}
                    >
                      {t('communityHub.lectures.remove')}
                    </button>
                  </div>

                  <div className={styles.commentComposer}>
                    <label htmlFor={`comment-${lecture.id}`} className={styles.commentLabel}>
                      {t('communityHub.commentForm.label')}
                    </label>
                    <textarea
                      id={`comment-${lecture.id}`}
                      name={`comment-${lecture.id}`}
                      value={draft}
                      onChange={(event) => handleDraftChange(lecture.id, event.target.value)}
                      placeholder={t('communityHub.commentForm.placeholder')}
                      rows={4}
                      maxLength={COMMENT_CHAR_LIMIT}
                      disabled={isSubmitting}
                    />
                    <div className={styles.commentFooter}>
                      <span className={styles.charCount}>
                        {t('communityHub.commentForm.limit', { count: remainingCharacters })}
                      </span>
                      <button
                        type="button"
                        className={styles.submitButton}
                        onClick={() => handleSubmit(lecture.id)}
                        disabled={isSubmitting || !draft.trim()}
                      >
                        {isSubmitting
                          ? t('communityHub.commentForm.submitting')
                          : t('communityHub.commentForm.cta')}
                      </button>
                    </div>
                  </div>

                  <section className={styles.commentSection} aria-live="polite">
                    <h3>{t('communityHub.comments.title')}</h3>
                    {renderCommentList(lecture.id)}
                  </section>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default CommunityHubPage;
