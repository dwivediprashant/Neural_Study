import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';

import styles from './TestsRunnerPage.module.css';
import { fetchTestBySlug, submitTestAttempt } from '../api/client';
import { DUMMY_LECTURE_TEST_PAYLOAD } from '../data/dummyLectureTest';

const formatPercent = (value) => `${Math.round(value)}%`;

function TestsRunnerPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const outletContext = useOutletContext() ?? {};
  const { handleTestAttemptRecorded } = outletContext;
  const { t } = useTranslation();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadTest = async () => {
      setLoading(true);

      if (testId === DUMMY_LECTURE_TEST_PAYLOAD.slug) {
        setTest(DUMMY_LECTURE_TEST_PAYLOAD);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        const { test: fetchedTest } = await fetchTestBySlug(testId);
        setTest(fetchedTest ?? null);
        setError(null);
      } catch (err) {
        console.error('Failed to load test', err);
        setError(t('testsRunner.loadError'));
        setTest(null);
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId, t]);

  useEffect(() => {
    if (!loading && !test) {
      navigate('/tests', { replace: true });
    }
  }, [loading, test, navigate]);

  const questions = test?.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const durationLabel = useMemo(() => {
    if (!test) return '15 min';
    if (test.duration) return test.duration;
    if (test.durationMinutes) return `${test.durationMinutes} min`;
    return '15 min';
  }, [test]);

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.stateCard}>{t('testsRunner.loading')}</div>
        </div>
      </section>
    );
  }

  if (!test) {
    return null;
  }

  const handleSelectOption = (questionIndex, optionIndex) => {
    setResponses((prev) => ({ ...prev, [questionIndex]: optionIndex }));
    setError(null);
  };

  const handleNavigateQuestion = (offset) => {
    setCurrentIndex((prev) => {
      const next = prev + offset;
      if (next < 0 || next >= questions.length) {
        return prev;
      }
      return next;
    });
    setError(null);
  };

  const handleSubmit = () => {
    if (questions.some((_, index) => responses[index] === undefined)) {
      setError(t('testsRunner.answerAll'));
      return;
    }

    const detailedResults = questions.map((question, index) => {
      const selectedIndex = responses[index];
      const correct = selectedIndex === question.answerIndex;
      return {
        index: index + 1,
        prompt: question.prompt,
        selectedIndex,
        correctIndex: question.answerIndex,
        correct,
        explanation: question.explanation,
        options: question.options,
      };
    });

    const correctCount = detailedResults.filter((entry) => entry.correct).length;
    const total = questions.length;
    const percent = (correctCount / total) * 100;

    const summary = {
      id: `${test.slug}-${Date.now()}`,
      testId: test.slug,
      title: test.title,
      completedAt: new Date().toISOString(),
      score: correctCount,
      total,
      percent,
      difficulty: test.difficulty,
      duration: durationLabel,
    };

    if (test.slug === DUMMY_LECTURE_TEST_PAYLOAD.slug) {
      setSubmitting(true);
      setTimeout(() => {
        setResult({ summary, details: detailedResults });
        setError(null);
        handleTestAttemptRecorded?.(summary);
        setSubmitting(false);
      }, 350);
      return;
    }

    const payload = {
      userId: 'guest',
      responses: questions.map((_, index) => ({
        questionIndex: index,
        selectedIndex: responses[index],
      })),
      durationMinutes: test.durationMinutes,
    };

    setSubmitting(true);
    submitTestAttempt(test.slug, payload)
      .then(({ attempt }) => {
        const syncedSummary = {
          ...summary,
          id: attempt?.id ?? summary.id,
          testId: attempt?.testId ?? summary.testId,
          title: attempt?.title ?? summary.title,
          completedAt: attempt?.completedAt ?? summary.completedAt,
          score: attempt?.score ?? summary.score,
          total: attempt?.total ?? summary.total,
          percent: attempt?.percent ?? summary.percent,
          difficulty: attempt?.difficulty ?? summary.difficulty,
          duration: attempt?.duration ?? summary.duration,
        };

        setResult({ summary: syncedSummary, details: detailedResults });
        setError(null);
        handleTestAttemptRecorded?.(syncedSummary);
      })
      .catch((err) => {
        console.error('Failed to submit attempt', err);
        setError(t('testsRunner.submitError'));
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const resetTest = () => {
    setResponses({});
    setResult(null);
    setCurrentIndex(0);
    setError(null);
  };

  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <button type="button" className={styles.backLink} onClick={() => navigate('/tests')}>
          {t('testsRunner.back')}
        </button>

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{t('testsRunner.eyebrow')}</p>
            <h1 className={styles.title}>{test.title}</h1>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaBadge}>{durationLabel}</span>
            {test.difficulty ? <span className={styles.metaBadgeNeutral}>{test.difficulty}</span> : null}
            <span className={styles.metaLabel}>
              {t('testsRunner.questionOf', { current: questions.length, total: questions.length })}
            </span>
          </div>
        </header>

        {result ? (
          <div className={styles.resultCard}>
            <div className={styles.resultSummary}>
              <p className={styles.resultLabel}>{t('testsRunner.score')}</p>
              <p className={styles.resultValue}>
                {result.summary.score}/{result.summary.total}
              </p>
              <p className={styles.resultPercent}>{formatPercent(result.summary.percent)}</p>
            </div>
            <div className={styles.resultMeta}>
              <p className={styles.resultMetaLine}>
                {t('testsRunner.difficulty')} · <strong>{result.summary.difficulty}</strong>
              </p>
              <p className={styles.resultMetaLine}>
                {t('testsRunner.duration')} · <strong>{result.summary.duration}</strong>
              </p>
              <p className={styles.resultMetaLine}>
                {t('testsRunner.completedOn')} ·{' '}
                <strong>{new Date(result.summary.completedAt).toLocaleString()}</strong>
              </p>
            </div>
            <div className={styles.resultActions}>
              <button type="button" className={styles.primaryButton} onClick={resetTest}>
                {t('testsRunner.retake')}
              </button>
              <Link to="/profile" className={styles.secondaryLink}>
                {t('testsRunner.viewProfile')}
              </Link>
            </div>
            <div className={styles.resultDetails}>
              <p className={styles.resultDetailsTitle}>{t('testsRunner.questionReview')}</p>
              <ul className={styles.resultList}>
                {result.details.map((entry) => (
                  <li key={entry.index} className={styles.resultItem}>
                    <div className={styles.resultPromptRow}>
                      <span className={styles.resultIndex}>Q{entry.index}</span>
                      <span
                        className={`${styles.resultTag} ${
                          entry.correct ? styles.resultTagCorrect : styles.resultTagIncorrect
                        }`}
                      >
                        {entry.correct ? t('testsRunner.correct') : t('testsRunner.incorrect')}
                      </span>
                    </div>
                    <p className={styles.resultPrompt}>{entry.prompt}</p>
                    <p className={styles.resultAnswer}>
                      <strong>{t('testsRunner.answer')}:</strong> {entry.options[entry.correctIndex]}
                    </p>
                    {entry.selectedIndex !== entry.correctIndex ? (
                      <p className={styles.resultAnswer}>
                        <strong>{t('testsRunner.yourChoice')}:</strong>{' '}
                        {entry.selectedIndex !== undefined
                          ? entry.options[entry.selectedIndex]
                          : t('testsRunner.notAnswered')}
                      </p>
                    ) : null}
                    {entry.explanation ? (
                      <p className={styles.resultExplanation}>{entry.explanation}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className={styles.questionCard}>
            <header className={styles.questionHeader}>
              <p className={styles.questionIndex}>
                {t('testsRunner.questionOf', { current: currentIndex + 1, total: questions.length })}
              </p>
              <h2 className={styles.questionPrompt}>{currentQuestion.prompt}</h2>
            </header>

            <div className={styles.optionsList}>
              {currentQuestion.options.map((option, optionIndex) => {
                const isSelected = responses[currentIndex] === optionIndex;
                return (
                  <button
                    key={option}
                    type="button"
                    className={`${styles.optionButton} ${isSelected ? styles.optionButtonSelected : ''}`}
                    onClick={() => handleSelectOption(currentIndex, optionIndex)}
                  >
                    <span className={styles.optionLabel}>{String.fromCharCode(65 + optionIndex)}</span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>

            {error ? <p className={styles.validation}>{error}</p> : null}

            <div className={styles.controls}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => handleNavigateQuestion(-1)}
                disabled={currentIndex === 0}
              >
                {t('testsRunner.previous')}
              </button>
              {isLastQuestion ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {t('testsRunner.submit')}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => handleNavigateQuestion(1)}
                >
                  {t('testsRunner.next')}
                </button>
              )}
            </div>
          </div>
        )}

        <aside className={styles.progressPanel}>
          <p className={styles.progressTitle}>{t('testsRunner.progress')}</p>
          <div className={styles.progressDots}>
            {questions.map((question, index) => {
              const state = responses[index] !== undefined ? 'answered' : 'pending';
              const isActive = index === currentIndex;
              return (
                <button
                  key={`progress-${index}`}
                  type="button"
                  className={`${styles.progressDot} ${styles[`progressDot_${state}`]} ${
                    isActive ? styles.progressDotActive : ''
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={t('testsRunner.goToQuestion', { index: index + 1 })}
                />
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default TestsRunnerPage;
