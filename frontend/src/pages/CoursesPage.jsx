import { useOutletContext, Link } from 'react-router-dom';

import CourseCard from '../components/CourseCard.jsx';
import styles from './CoursesPage.module.css';

const CoursesPage = () => {
  const { courses, loading, status } = useOutletContext();

  return (
    <section className={styles.wrapper} id="courses">
        <header className={styles.headerRow}>
          <div>
            <h2 className={styles.heading}>Available courses</h2>
            <p className={styles.subheading}>
              Download compressed lessons, notes, and quizzes for offline study.
            </p>
          </div>
          <div className={styles.actions}>
            <Link to="/downloads" className={styles.manageLink}>
              Manage downloads
            </Link>
          </div>
        </header>

        {status.isOffline && (
          <div className={styles.offlineNotice}>
            You are offline. Viewing locally cached courses.
          </div>
        )}

        {loading && !courses.length ? (
          <div className={styles.grid}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className={styles.skeleton} />
            ))}
          </div>
        ) : null}

        {!loading && !courses.length ? (
          <p className={styles.emptyState}>No courses available yet. Check back soon.</p>
        ) : null}

        {courses.length ? (
          <div className={styles.grid}>
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        ) : null}
    </section>
  );
};

export default CoursesPage;
