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
          {filtered.map((lecture) => (
            <li key={lecture.id ?? lecture._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.cardEyebrow}>{lecture.exam ?? 'GENERAL'}</p>
                  <h2 className={styles.cardTitle}>{lecture.title}</h2>
                </div>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => handleDelete(lecture.id ?? lecture._id)}
                >
                  Remove
                </button>
              </div>
              {lecture.description ? <p className={styles.cardDescription}>{lecture.description}</p> : null}
              <div className={styles.metaRow}>
                {lecture.durationMinutes ? <span>{lecture.durationMinutes} mins</span> : null}
                {lecture.language ? <span>{lecture.language}</span> : null}
                {lecture.subject ? <span>{lecture.subject}</span> : null}
                <span>
                  Published {new Date(lecture.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
              {lecture.tags?.length ? (
                <ul className={styles.tagList}>
                  {lecture.tags.map((tag) => (
                    <li key={tag}>#{tag}</li>
                  ))}
                </ul>
              ) : null}
              <footer className={styles.cardFooter}>
                {lecture.resourceUrl ? (
                  <a href={lecture.resourceUrl} target="_blank" rel="noreferrer" className={styles.linkButton}>
                    View resource
                  </a>
                ) : null}
                {lecture.thumbnailUrl ? (
                  <a href={lecture.thumbnailUrl} target="_blank" rel="noreferrer" className={styles.linkButton}>
                    View thumbnail
                  </a>
                ) : null}
              </footer>
            </li>
          ))}
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
