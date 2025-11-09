import { useEffect, useMemo, useState } from 'react';
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
        setError('Unable to load this test right now.');
        setTest(null);
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId]);

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
          <div className={styles.stateCard}>Loading test…</div>
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
      setError('Please answer every question before submitting.');
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
        setError('Unable to submit your attempt. Please try again.');
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
          ← Back to tests
        </button>

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Quick test</p>
            <h1 className={styles.title}>{test.title}</h1>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaBadge}>{durationLabel}</span>
            {test.difficulty ? <span className={styles.metaBadgeNeutral}>{test.difficulty}</span> : null}
            <span className={styles.metaLabel}>
              {questions.length} question{questions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </header>

        {result ? (
          <div className={styles.resultCard}>
            <div className={styles.resultSummary}>
              <p className={styles.resultLabel}>Score</p>
              <p className={styles.resultValue}>
                {result.summary.score}/{result.summary.total}
              </p>
              <p className={styles.resultPercent}>{formatPercent(result.summary.percent)}</p>
            </div>
            <div className={styles.resultMeta}>
              <p className={styles.resultMetaLine}>
                Difficulty · <strong>{result.summary.difficulty}</strong>
              </p>
              <p className={styles.resultMetaLine}>
                Duration · <strong>{result.summary.duration}</strong>
              </p>
              <p className={styles.resultMetaLine}>
                Completed on ·{' '}
                <strong>{new Date(result.summary.completedAt).toLocaleString()}</strong>
              </p>
            </div>
            <div className={styles.resultActions}>
              <button type="button" className={styles.primaryButton} onClick={resetTest}>
                Retake test
              </button>
              <Link to="/profile" className={styles.secondaryLink}>
                View in profile
              </Link>
            </div>
            <div className={styles.resultDetails}>
              <p className={styles.resultDetailsTitle}>Question review</p>
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
                        {entry.correct ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    <p className={styles.resultPrompt}>{entry.prompt}</p>
                    <p className={styles.resultAnswer}>
                      <strong>Answer:</strong> {entry.options[entry.correctIndex]}
                    </p>
                    {entry.selectedIndex !== entry.correctIndex ? (
                      <p className={styles.resultAnswer}>
                        <strong>Your choice:</strong>{' '}
                        {entry.selectedIndex !== undefined ? entry.options[entry.selectedIndex] : 'Not answered'}
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
          <>
            <div className={styles.questionCard}>
              <header className={styles.questionHeader}>
                <p className={styles.questionIndex}>
                  Question {currentIndex + 1} of {questions.length}
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
                  Previous
                </button>
                {isLastQuestion ? (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    Submit test
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => handleNavigateQuestion(1)}
                  >
                    Next question
                  </button>
                )}
              </div>
            </div>

            <aside className={styles.progressPanel}>
              <p className={styles.progressTitle}>Progress</p>
              <div className={styles.progressDots}>
                {questions.map((question, index) => {
                  const state = responses[index] !== undefined ? 'answered' : 'pending';
                  const isActive = index === currentIndex;
                  return (
                    <button
                      key={`${test.slug}-${index}`}
                      type="button"
                      className={`${styles.progressDot} ${styles[`progressDot_${state}`]} ${
                        isActive ? styles.progressDotActive : ''
                      }`}
                      onClick={() => setCurrentIndex(index)}
                      aria-label={`Go to question ${index + 1}`}
                    />
                  );
                })}
              </div>
            </aside>
          </>
        )}
      </div>
    </section>
  );
}

export default TestsRunnerPage;
