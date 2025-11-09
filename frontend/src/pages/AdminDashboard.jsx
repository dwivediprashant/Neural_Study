import styles from './AdminDashboard.module.css';

const AdminDashboard = ({ user, onLogout }) => {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Team Control Center</p>
          <h1 className={styles.title}>Welcome, {user?.name ?? 'Admin'}</h1>
          <p className={styles.subtitle}>
            Manage courses, publish new lectures, and keep students synced. This workspace is only visible to
            instructor and admin accounts.
          </p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton} onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        <article className={styles.card}>
          <h2>Upload lecture</h2>
          <p>Publish new videos, notes, or practice packs for your batches.</p>
          <button type="button">Go to uploader</button>
        </article>

        <article className={styles.card}>
          <h2>Course catalogue</h2>
          <p>Review the student-facing catalogue and control visibility or pricing.</p>
          <button type="button">Manage catalogue</button>
        </article>

        <article className={styles.card}>
          <h2>Student analytics</h2>
          <p>Track performance trends, download engagement, and completion rates.</p>
          <button type="button">View analytics</button>
        </article>
      </div>

      <p className={styles.footerNote}>Full instructor tooling coming next — this is a placeholder landing page.</p>
    </section>
  );
};

export default AdminDashboard;
