import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { fetchComments, resolveCommentEntry } from '../../api/client.js';
import styles from './TeacherDoubtsPage.module.css';

const CHAR_LIMIT = 600;
const FILTERS = ['all', 'pending', 'solved'];

const getLectureTitle = (lecture, t) => {
  if (!lecture) return t('communityHub.lecture.fallbackTitle');
  return lecture.title ?? lecture.name ?? t('communityHub.lecture.fallbackTitle');
};

const getLectureSubject = (lecture, t) => {
  if (!lecture) return t('communityHub.lecture.fallbackSubject');
  return (
    lecture.subject ??
    lecture.exam ??
    lecture.category ??
    (Array.isArray(lecture.tags) && lecture.tags.length ? lecture.tags[0] : null) ??
    t('communityHub.lecture.fallbackSubject')
  );
};

const formatTimestamp = (value) => {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return null;
  }
};

const TeacherDoubtsPage = () => {
  const { t } = useTranslation();
  const outletContext = useOutletContext() ?? {};
  const { pushToast, refreshLectureRating } = outletContext;

  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyBusyMap, setReplyBusyMap] = useState({});

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const { comments: fetched } = await fetchComments(params);
      const safeList = Array.isArray(fetched) ? fetched : [];
      setComments(safeList);
      setReplyDrafts(() => {
        const next = {};
        safeList.forEach((item) => {
          next[item._id] = item.replyContent ?? '';
        });
        return next;
      });
      setErrorMessage(null);
    } catch (error) {
      const message = error.response?.data?.message ?? t('teacher.doubts.toast.loadFailed');
      setErrorMessage(message);
      if (pushToast) {
        pushToast(message, 'danger');
      }
    } finally {
      setLoading(false);
    }
  }, [filter, pushToast, t]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleFilterChange = useCallback((value) => {
    setFilter(value);
  }, []);

  const handleDraftChange = useCallback((commentId, value) => {
    setReplyDrafts((prev) => ({
      ...prev,
      [commentId]: value.slice(0, CHAR_LIMIT),
    }));
  }, []);

  const handleRefresh = useCallback(() => {
    if (!loading) {
      loadComments();
    }
  }, [loadComments, loading]);

  const handleReplySubmit = useCallback(
    async (commentId) => {
      const draft = replyDrafts[commentId] ?? '';
      const trimmed = draft.trim();
      if (!trimmed) {
        if (pushToast) {
          pushToast(t('teacher.doubts.validation.replyRequired'), 'warning');
        }
        return;
      }

      setReplyBusyMap((prev) => ({ ...prev, [commentId]: true }));
      try {
        const { comment } = await resolveCommentEntry(commentId, {
          replyContent: trimmed,
        });

        if (comment) {
          setComments((prev) =>
            prev.map((item) => (item._id === comment._id ? comment : item))
          );
          setReplyDrafts((prev) => ({ ...prev, [commentId]: comment.replyContent ?? '' }));
          if (comment.lectureId?._id && refreshLectureRating) {
            refreshLectureRating(comment.lectureId._id);
          }
          if (pushToast) {
            pushToast(t('teacher.doubts.toast.replySaved'), 'success');
          }
        }
      } catch (error) {
        const message = error.response?.data?.message ?? t('teacher.doubts.toast.replyFailed');
        if (pushToast) {
          pushToast(message, 'danger');
        }
      } finally {
        setReplyBusyMap((prev) => {
          const { [commentId]: _omit, ...rest } = prev;
          return rest;
        });
      }
    },
    [pushToast, refreshLectureRating, replyDrafts, t]
  );

  const filteredComments = useMemo(() => {
    if (filter === 'all') return comments;
    return comments.filter((comment) => comment.status === filter);
  }, [comments, filter]);

  const stats = useMemo(() => {
    const total = comments.length;
    const pending = comments.filter((comment) => comment.status === 'pending').length;
    const solved = comments.filter((comment) => comment.status === 'solved').length;
    return { total, pending, solved };
  }, [comments]);

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.heroEyebrow}>{t('teacher.doubts.eyebrow')}</span>
          <h1 className={styles.heroTitle}>{t('teacher.doubts.title')}</h1>
          <p className={styles.heroSubtitle}>{t('teacher.doubts.subtitle')}</p>
        </div>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? t('teacher.doubts.actions.refreshing') : t('teacher.doubts.actions.refresh')}
        </button>
      </header>

      {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}

      <div className={styles.toolbar}>
        <div
          className={styles.filterGroup}
          role="tablist"
          aria-label={t('teacher.doubts.filtersLabel')}
        >
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              className={`${styles.filterButton} ${filter === value ? styles.filterButtonActive : ''}`}
              onClick={() => handleFilterChange(value)}
              data-count={stats[value] ?? stats.total}
            >
              <span>{t(`teacher.doubts.filters.${value}`)}</span>
              <span className={styles.filterBadge}>
                {value === 'all' ? stats.total : value === 'pending' ? stats.pending : stats.solved}
              </span>
            </button>
          ))}
        </div>
      </div>

      {!filteredComments.length ? (
        <div className={styles.emptyState}>
          <h2>{t('teacher.doubts.empty.title')}</h2>
          <p>{t('teacher.doubts.empty.description')}</p>
        </div>
      ) : (
        <div className={styles.commentScrollArea} tabIndex={0}>
          <ul className={styles.commentList}>
            {filteredComments.map((comment) => {
              const commentId = comment._id;
              const lecture = comment.lectureId;
              const student = comment.studentId;
              const createdAt = formatTimestamp(comment.createdAt);
              const replyUpdatedAt = formatTimestamp(comment.repliedAt);
              const isPending = comment.status !== 'solved';
              const draft = replyDrafts[commentId] ?? '';
              const remainingChars = Math.max(0, CHAR_LIMIT - draft.length);
              const isBusy = Boolean(replyBusyMap[commentId]);
              const ratingValue =
                typeof comment.rating === 'number' && Number.isFinite(comment.rating)
                  ? comment.rating
                  : null;

              return (
                <li key={commentId} className={styles.commentCard}>
                  <header className={styles.cardTop}>
                    <div className={styles.metaGroup}>
                      <span
                        className={`${styles.statusBadge} ${
                          isPending ? styles.statusPending : styles.statusSolved
                        }`}
                      >
                        {t(`teacher.doubts.status.${comment.status}`)}
                      </span>
                      {createdAt ? (
                        <time dateTime={createdAt}>
                          {t('teacher.doubts.list.posted', { timestamp: createdAt })}
                        </time>
                      ) : null}
                    </div>

                    <div className={styles.statGroup}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>{t('teacher.doubts.list.student')}</span>
                        <span className={styles.statValue}>{student?.name ?? '—'}</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>{t('teacher.doubts.list.lecture')}</span>
                        <span className={styles.statValue}>{getLectureTitle(lecture, t)}</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>{t('teacher.doubts.list.rating')}</span>
                        <span className={styles.statValue}>
                          {ratingValue ? `${ratingValue.toFixed(1)}★` : t('teacher.doubts.list.noRating')}
                        </span>
                      </div>
                    </div>
                  </header>

                  <div className={styles.bodySection}>
                    <div className={styles.commentBlock}>
                      <span className={styles.blockLabel}>{t('teacher.doubts.list.commentLabel')}</span>
                      <p>{comment.content}</p>
                      <p className={styles.lectureSubject}>{getLectureSubject(lecture, t)}</p>
                    </div>

                    <div className={styles.replyBlock}>
                      <label htmlFor={`reply-${commentId}`} className={styles.blockLabel}>
                        {t('teacher.doubts.list.replyLabel')}
                      </label>
                      <textarea
                        id={`reply-${commentId}`}
                        name={`reply-${commentId}`}
                        value={draft}
                        onChange={(event) => handleDraftChange(commentId, event.target.value)}
                        placeholder={t('teacher.doubts.list.replyPlaceholder')}
                        disabled={isBusy || !isPending}
                        rows={4}
                        maxLength={CHAR_LIMIT}
                      />
                      <div className={styles.replyFooter}>
                        <span className={styles.charCount}>
                          {t('teacher.doubts.list.charCount', { count: remainingChars })}
                        </span>
                        <button
                          type="button"
                          className={styles.replyButton}
                          onClick={() => handleReplySubmit(commentId)}
                          disabled={isBusy || !isPending || !draft.trim()}
                        >
                          {isBusy
                            ? t('teacher.doubts.actions.replying')
                            : t('teacher.doubts.actions.reply')}
                        </button>
                      </div>
                      {comment.replyContent && !isPending ? (
                        <p className={styles.replyTimestamp}>
                          {replyUpdatedAt
                            ? t('teacher.doubts.list.replied', { timestamp: replyUpdatedAt })
                            : null}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
};

export default TeacherDoubtsPage;
