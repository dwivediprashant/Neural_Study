import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import styles from './AuthPage.module.css';

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student (learn & take tests)' },
  { value: 'teacher', label: 'Teacher (share lectures & resources)' },
];

const AuthPage = ({ onLogin, onRegister, authLoading, authError }) => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });
  const [localError, setLocalError] = useState(null);

  const isSignup = mode === 'signup';
  const title = isSignup ? 'Create your account' : 'Welcome back';
  const cta = isSignup ? 'Sign up' : 'Sign in';

  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'student',
    });
    setLocalError(null);
  }, []);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
    resetForm();
  }, [resetForm]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    setLocalError(null);

    if (!form.email || !form.password || (isSignup && !form.name)) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    const payload = {
      email: form.email.trim(),
      password: form.password,
      ...(isSignup ? { name: form.name.trim(), role: form.role } : {}),
    };

    const handler = isSignup ? onRegister : onLogin;
    const result = await handler(payload);
    if (!result?.success && result?.error) {
      setLocalError(result.error);
    }
  }, [form, isSignup, onLogin, onRegister]);

  const helperText = useMemo(
    () =>
      isSignup
        ? 'Choose your role to unlock the appropriate dashboard.'
        : 'Sign in with the credentials you created earlier.',
    [isSignup]
  );

  const effectiveError = localError || authError;

  const pageClassName = isSignup ? `${styles.page} ${styles.pageSignup}` : styles.page;
  const formColumnClassName = isSignup
    ? `${styles.formColumn} ${styles.formColumnSignup}`
    : styles.formColumn;
  const formCardClassName = isSignup ? `${styles.formCard} ${styles.formCardSignup}` : styles.formCard;
  const formHeaderClassName = isSignup
    ? `${styles.formHeader} ${styles.formHeaderSignup}`
    : styles.formHeader;
  const formClassName = isSignup ? `${styles.form} ${styles.formSignup}` : styles.form;
  const roleGridClassName = isSignup ? `${styles.roleGrid} ${styles.roleGridSignup}` : styles.roleGrid;

  return (
    <section className={pageClassName}>
      <div className={styles.card}>
        <div className={formColumnClassName}>
          <div className={formCardClassName}>
            <header className={formHeaderClassName}>
              <span className={styles.formBadge}>{isSignup ? 'Sign up' : 'Login'}</span>
              <h1 className={styles.formTitle}>{title}</h1>
              <p className={styles.formSubtitle}>{helperText}</p>
            </header>

            <form className={formClassName} onSubmit={handleSubmit}>
              {isSignup ? (
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="name">
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g. Anjali Sharma"
                    value={form.name}
                    onChange={handleInputChange}
                    disabled={authLoading}
                    autoComplete="name"
                    required
                  />
                </div>
              ) : null}

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleInputChange}
                  disabled={authLoading}
                  autoComplete="email"
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={handleInputChange}
                  disabled={authLoading}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  required
                  minLength={6}
                />
              </div>

              {isSignup ? (
                <div className={styles.fieldGroup}>
                  <span className={styles.label}>Role</span>
                  <div className={roleGridClassName}>
                    {ROLE_OPTIONS.map((role) => (
                      <label key={role.value} className={styles.roleOption}>
                        <input
                          type="radio"
                          name="role"
                          value={role.value}
                          checked={form.role === role.value}
                          onChange={handleInputChange}
                          disabled={authLoading}
                        />
                        <span>
                          <strong>{role.label.split(' ')[0]}</strong>
                          <small>{role.label.split(' ').slice(1).join(' ')}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {effectiveError ? <p className={styles.error}>{effectiveError}</p> : null}

              <div className={styles.actionRow}>
                <button type="submit" className={styles.primaryButton} disabled={authLoading}>
                  {authLoading ? 'Please wait…' : cta}
                </button>

                <p className={styles.switcherInline}>
                  {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button type="button" onClick={toggleMode} className={styles.switcherButton}>
                    {isSignup ? 'Sign in' : 'Create one'}
                  </button>
                </p>
              </div>
            </form>

            <p className={styles.formSupport}>
              Need assistance?{' '}
              <Link to="mailto:support@neuralstudy.in">support@neuralstudy.in</Link>
            </p>
          </div>
        </div>

        <aside className={styles.visualColumn} aria-label="Neural Study branding">
          <div className={styles.visualCard}>
            <div className={styles.visualBackdrop} aria-hidden="true" />
            <img src="/logo.svg" alt="Neural Study logo" className={styles.visualLogo} />
            <p className={styles.visualTagline}>Empower learning wherever your students are.</p>
            <div className={styles.visualMeta}>
              <span>Neural Study</span>
              <span>Offline-first platform</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default AuthPage;
