import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import CourseCard from '../components/CourseCard.jsx';
import styles from './CoursesPage.module.css';

const CoursesPage = () => {
  const { courses, loading, status } = useOutletContext();
  const { t } = useTranslation();

  return (
    <section className={styles.wrapper} id="courses">
        <header className={styles.headerRow}>
          <div>
            <h2 className={styles.heading}>{t("coursesPage.heading")}</h2>
            <p className={styles.subheading}>{t("coursesPage.subheading")}</p>
          </div>
          <div className={styles.actions}>
            <Link to="/downloads" className={styles.manageLink}>
              {t("coursesPage.manageDownloads")}
            </Link>
          </div>
        </header>

        {status.isOffline && (
          <div className={styles.offlineNotice}>{t("coursesPage.offlineNotice")}</div>
        )}

        {loading && !courses.length ? (
          <div className={styles.grid}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className={styles.skeleton} />
            ))}
          </div>
        ) : null}

        {!loading && !courses.length ? (
          <p className={styles.emptyState}>{t("coursesPage.empty")}</p>
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
