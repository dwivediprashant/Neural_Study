import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import styles from './AuthPage.module.css';

const ROLE_OPTIONS = ['student', 'teacher'];

const AuthPage = ({ onLogin, onRegister, authLoading, authError }) => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });
  const [localError, setLocalError] = useState(null);
  const { t } = useTranslation();

  const isSignup = mode === 'signup';
  const title = isSignup ? t('auth.createAccount') : t('auth.welcomeBack');
  const cta = isSignup ? t('auth.ctaSignup') : t('auth.ctaLogin');

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
      setLocalError(t('auth.formError'));
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
    () => (isSignup ? t('auth.signupHelper') : t('auth.signinHelper')),
    [isSignup, t]
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
              <span className={styles.formBadge}>{isSignup ? t('auth.signupBadge') : t('auth.loginBadge')}</span>
              <h1 className={styles.formTitle}>{title}</h1>
              <p className={styles.formSubtitle}>{helperText}</p>
            </header>

            <form className={formClassName} onSubmit={handleSubmit}>
              {isSignup ? (
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="name">
                    {t('auth.fullName')}
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder={t('auth.fullNamePlaceholder')}
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
                  {t('auth.email')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={form.email}
                  onChange={handleInputChange}
                  disabled={authLoading}
                  autoComplete="email"
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="password">
                  {t('auth.password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t('auth.passwordPlaceholder')}
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
                  <span className={styles.label}>{t('auth.roleLabel')}</span>
                  <div className={roleGridClassName}>
                    {ROLE_OPTIONS.map((role) => (
                      <label key={role} className={styles.roleOption}>
                        <input
                          type="radio"
                          name="role"
                          value={role}
                          checked={form.role === role}
                          onChange={handleInputChange}
                          disabled={authLoading}
                        />
                        <span>
                          <strong>{t(`auth.${role}Role`)}</strong>
                          <small>{t(`auth.${role}RoleHint`)}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {effectiveError ? <p className={styles.error}>{effectiveError}</p> : null}

              <div className={styles.actionRow}>
                <button type="submit" className={styles.primaryButton} disabled={authLoading}>
                  {authLoading ? t('auth.pleaseWait') : cta}
                </button>

                <p className={styles.switcherInline}>
                  {isSignup ? t('auth.alreadyHaveAccount') : t('auth.promptNoAccount')}{' '}
                  <button type="button" onClick={toggleMode} className={styles.switcherButton}>
                    {isSignup ? t('auth.signin') : t('auth.createOne')}
                  </button>
                </p>
              </div>
            </form>

            <p className={styles.formSupport}>
              {t('auth.needHelp')}{' '}
              <Link to="mailto:support@neuralstudy.in">support@neuralstudy.in</Link>
            </p>
          </div>
        </div>

        <aside className={styles.visualColumn} aria-label={t('auth.visualAria')}>
          <div className={styles.visualCard}>
            <div className={styles.visualBackdrop} aria-hidden="true" />
            <img src="/logo.svg" alt={t('common.logoAlt')} className={styles.visualLogo} />
            <p className={styles.visualTagline}>{t('common.tagline')}</p>
            <div className={styles.visualMeta}>
              <span>{t('common.appName')}</span>
              <span>{t('common.offlinePlatform')}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default AuthPage;
