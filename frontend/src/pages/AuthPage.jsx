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

  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <div className={styles.formColumn}>
          <header className={styles.header}>
            <p className={styles.heroTagline}>Start learning with our AI-powered offline-first platform.</p>
            <div className={styles.brandMark} aria-hidden="true">
              <span className={styles.brandIcon}>NS</span>
            </div>
            <p className={styles.eyebrow}>Neural Study Portal</p>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{helperText}</p>
          </header>

          <form className={styles.form} onSubmit={handleSubmit}>
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
                <div className={styles.roleGrid}>
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

            <button type="submit" className={styles.primaryButton} disabled={authLoading}>
              {authLoading ? 'Please wait…' : cta}
            </button>

            <p className={styles.switcher}>
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button type="button" onClick={toggleMode} className={styles.switcherButton}>
                {isSignup ? 'Sign in' : 'Create one'}
              </button>
            </p>
          </form>

          <p className={styles.supportText}>
            Need assistance?{' '}
            <Link to="mailto:support@neuralstudy.in">support@neuralstudy.in</Link>
          </p>
        </div>

        <aside className={styles.visualColumn} aria-label="Neural Study branding">
          <div className={styles.visualInner}>
            <img src="/logo.svg" alt="Neural Study logo" className={styles.visualLogo} />
            <h2 className={styles.visualHeadline}>Offline-ready learning. Online polish.</h2>
            <p className={styles.visualSubtext}>
              Download lectures, take tests, and sync progress whenever you reconnect.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default AuthPage;
