import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout.jsx';
import CenteredLoader from './components/CenteredLoader.jsx';
import HomePage from './pages/HomePage.jsx';
import TestsPage from './pages/TestsPage.jsx';
import TestsRunnerPage from './pages/TestsRunnerPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ExploreCoursesPage from './pages/ExploreCoursesPage.jsx';
import CourseDetailPage from './pages/CourseDetailPage.jsx';
import DownloadsPage from './pages/DownloadsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import TeacherLayout from './pages/teacher/TeacherLayout.jsx';
import TeacherProfilePage from './pages/teacher/TeacherProfilePage.jsx';
import TeacherUploadLecturePage from './pages/teacher/TeacherUploadLecturePage.jsx';
import TeacherUploadsPage from './pages/teacher/TeacherUploadsPage.jsx';
import useCourses from './hooks/useCourses.js';
import useDownloadsManager from './hooks/useDownloadsManager.js';
import {
  fetchTestAttempts,
  fetchCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
  fetchLectures,
  createLecture,
  deleteLecture,
  rateLecture as rateLectureApi,
  fetchLectureRatings,
} from './api/client.js';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [testAttempts, setTestAttempts] = useState([]);
  const [testAttemptsLoading, setTestAttemptsLoading] = useState(false);
  const [testAttemptsError, setTestAttemptsError] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [lecturesLoading, setLecturesLoading] = useState(false);
  const [lecturesError, setLecturesError] = useState(null);
  const [recentLectures, setRecentLectures] = useState([]);
  const lectureUploadRef = useRef(null);

  const { courses, loading, error, status, refresh } = useCourses({ userId: currentUser?.id });
  const { t } = useTranslation();
  const {
    downloads,
    loading: downloadsLoading,
    error: downloadsError,
    saveCourse,
    removeCourse,
    saveModule,
    removeModule,
    saveLecture,
    removeLecture,
    pendingCourseIds,
    pendingLectureIds,
    pendingKeySet,
    refresh: refreshDownloads,
    progress,
    lastDownloadError,
    clearLastDownloadError,
  } = useDownloadsManager();

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((message, tone = 'info', duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, tone, duration }]);
  }, []);

  useEffect(() => {
    if (!lastDownloadError) return;
    pushToast(lastDownloadError, 'warning');
    clearLastDownloadError();
  }, [lastDownloadError, pushToast, clearLastDownloadError]);

  const handleSaveCourse = useCallback(
    async (course) => {
      const success = await saveCourse(course);
      if (success) {
        pushToast(
          t('toast.courseCached', { title: course.title ?? t('common.appName') }),
          'success'
        );
      }
      return success;
    },
    [saveCourse, pushToast, t]
  );

  const handleRemoveCourse = useCallback(
    async (courseId) => {
      const success = await removeCourse(courseId);
      if (success) {
        const course = courses.find((item) => item._id === courseId);
        pushToast(
          course
            ? t('toast.courseRemoved', { title: course.title })
            : t('toast.courseRemovedFallback'),
          'info'
        );
      }
      return success;
    },
    [removeCourse, pushToast, courses, t]
  );

  const handleSaveModule = useCallback(
    async (course, module, moduleKey) => {
      const success = await saveModule(course, module, moduleKey);
      if (success) {
        pushToast(t('toast.moduleCached', { module: module.name, course: course.title }), 'success');
      }
      return success;
    },
    [saveModule, pushToast, t]
  );

  const handleRemoveModule = useCallback(
    async (course, module, moduleKey) => {
      const success = await removeModule(course, module, moduleKey);
      if (success) {
        pushToast(t('toast.moduleRemoved', { module: module.name }), 'info');
      }
      return success;
    },
    [removeModule, pushToast, t]
  );

  const handleSaveLectureDownload = useCallback(
    async (lecture) => {
      if (!lecture) return false;
      const title = lecture.title ?? 'Lecture';
      const success = await saveLecture(lecture);
      if (success) {
        pushToast(t('toast.lectureCached', { title }), 'success');
      }
      return success;
    },
    [saveLecture, pushToast, t]
  );

  const handleRemoveLectureDownload = useCallback(
    async (lectureId) => {
      if (!lectureId) return false;
      const success = await removeLecture(lectureId);
      if (success) {
        const lectureRecord =
          lectures.find((item) => item._id === lectureId || item.id === lectureId) ||
          downloads.find((item) => item.id === lectureId);
        const title = lectureRecord?.title;
        pushToast(
          title ? t('toast.lectureRemoved', { title }) : t('toast.lectureRemovedFallback'),
          'info'
        );
      }
      return success;
    },
    [removeLecture, pushToast, lectures, downloads, t]
  );

  const syncLectureRating = useCallback(
    async (lectureId) => {
      if (!lectureId) return;
      try {
        const { average, count, rating } = await fetchLectureRatings(lectureId);
        setLectures((prev) =>
          prev.map((item) =>
            item.id === lectureId || item._id === lectureId
              ? { ...item, ratingAverage: average, ratingCount: count, myRating: rating }
              : item
          )
        );
        setRecentLectures((prev) =>
          prev.map((item) =>
            item.id === lectureId
              ? { ...item, ratingAverage: average, ratingCount: count, myRating: rating }
              : item
          )
        );
      } catch (error) {
        console.warn('Failed to refresh lecture rating', lectureId, error);
      }
    },
    []
  );

  const handleLectureViewed = useCallback(
    (lecture) => {
      if (!lecture) return;

      const id =
        lecture._id ??
        lecture.id ??
        lecture.lectureId ??
        lecture.slug ??
        `recent-${Date.now()}`;
      const title = lecture.title ?? lecture.name ?? 'Untitled lecture';
      const subject =
        lecture.subject ??
        lecture.exam ??
        lecture.category ??
        (Array.isArray(lecture.tags) && lecture.tags.length ? lecture.tags[0] : null) ??
        'General';
      const rawDuration =
        lecture.durationMinutes ??
        lecture.duration ??
        lecture.length ??
        lecture.runtime ??
        lecture.time ??
        null;

      let normalizedDuration = null;
      if (typeof rawDuration === 'number' && Number.isFinite(rawDuration)) {
        normalizedDuration = Math.max(1, Math.round(rawDuration));
      } else if (typeof rawDuration === 'string') {
        const parsed = Number.parseFloat(rawDuration);
        if (!Number.isNaN(parsed)) {
          normalizedDuration = Math.max(1, Math.round(parsed));
        }
      }

      const thumbnail =
        lecture.thumbnailUrl ??
        lecture.thumbnail ??
        lecture.poster ??
        lecture.image ??
        lecture.banner ??
        null;
      const viewedAt =
        lecture.viewedAt ??
        lecture.lastViewedAt ??
        lecture.updatedAt ??
        lecture.completedAt ??
        new Date().toISOString();

      const knownLecture = lectures.find(
        (item) => item.id === id || item._id === id || item.lectureId === id
      );

      const ratingAverage =
        typeof lecture.ratingAverage === 'number'
          ? lecture.ratingAverage
          : typeof knownLecture?.ratingAverage === 'number'
          ? knownLecture.ratingAverage
          : null;
      const ratingCount =
        typeof lecture.ratingCount === 'number'
          ? lecture.ratingCount
          : typeof knownLecture?.ratingCount === 'number'
          ? knownLecture.ratingCount
          : 0;
      const myRating =
        lecture.myRating ??
        knownLecture?.myRating ??
        null;

      const entry = {
        id,
        title,
        subject,
        duration: normalizedDuration,
        thumbnail,
        viewedAt,
        ratingAverage,
        ratingCount,
        myRating,
      };

      setRecentLectures((prev) => {
        const filtered = prev.filter((item) => item.id !== entry.id);
        return [entry, ...filtered].slice(0, 8);
      });
      if ((entry.ratingAverage === null || Number.isNaN(entry.ratingAverage)) && entry.id) {
        syncLectureRating(entry.id);
      }
    },
    [lectures, syncLectureRating]
  );

  const handleLectureRated = useCallback(
    async (lectureId, ratingValue) => {
      if (!lectureId) return { success: false, error: 'Lecture ID is required' };
      try {
        const result = await rateLectureApi(lectureId, ratingValue);
        setLectures((prev) =>
          prev.map((item) =>
            item.id === lectureId || item._id === lectureId
              ? {
                  ...item,
                  ratingAverage: result.average,
                  ratingCount: result.count,
                  myRating: result.rating,
                }
              : item
          )
        );
        setRecentLectures((prev) =>
          prev.map((item) =>
            item.id === lectureId
              ? {
                  ...item,
                  ratingAverage: result.average,
                  ratingCount: result.count,
                  myRating: result.rating,
                }
              : item
          )
        );
        pushToast(t('toast.ratingThanks'), 'success');
        return { success: true, data: result };
      } catch (error) {
        const message = error.response?.data?.message || t('toast.genericDanger');
        pushToast(message, 'danger');
        return { success: false, error: message };
      }
    },
    [pushToast, t]
  );

  const handleSessionExpired = useCallback(() => {
    setCurrentUser(null);
    setTestAttempts([]);
    setRecentLectures([]);
    pushToast(t('toast.sessionExpired'), 'warning');
  }, [pushToast, t]);

  useEffect(() => {
    window.addEventListener('auth:unauthorized', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:unauthorized', handleSessionExpired);
    };
  }, [handleSessionExpired]);

  const refreshCurrentUser = useCallback(async () => {
    setAuthLoading(true);
    try {
      const { user } = await fetchCurrentUser();
      setCurrentUser(user ?? null);
      setAuthError(null);
    } catch (error) {
      if (error.response?.status && error.response.status !== 401) {
        setAuthError('Unable to verify session');
      }
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  const loadTestAttempts = useCallback(async () => {
    if (!currentUser?.id || currentUser.role !== 'student') {
      setTestAttempts([]);
      return;
    }

    setTestAttemptsLoading(true);
    try {
      const { attempts } = await fetchTestAttempts({ limit: 5 });
      setTestAttempts(attempts ?? []);
      setTestAttemptsError(null);
    } catch (error) {
      console.error('Failed to load test attempts:', error);
      setTestAttemptsError('Unable to load recent test attempts');
    } finally {
      setTestAttemptsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.id && currentUser.role === 'student') {
      loadTestAttempts();
    } else {
      setTestAttempts([]);
    }
  }, [currentUser?.id, currentUser?.role, loadTestAttempts]);

  const loadLectures = useCallback(
    async ({ mine = false } = {}) => {
      setLecturesLoading(true);
      try {
        const params = mine ? { mine: true } : {};
        const { lectures: fetchedLectures } = await fetchLectures(params);
        setLectures(fetchedLectures ?? []);
        setLecturesError(null);
      } catch (error) {
        console.error('Failed to load lectures:', error);
        const message = error.response?.data?.message || 'Unable to load lectures';
        setLecturesError(message);
        setLectures([]);
      } finally {
        setLecturesLoading(false);
      }
    },
    []
  );

  const handleLectureCreated = useCallback(
    (lecture) => {
      if (!lecture) return;
      setLectures((prev) => {
        const existing = prev.find((item) => item.id === lecture.id || item._id === lecture.id);
        if (existing) {
          return prev.map((item) => (item.id === lecture.id || item._id === lecture.id ? lecture : item));
        }
        return [lecture, ...prev];
      });
      if (lectureUploadRef.current) {
        lectureUploadRef.current.reset();
      }
    },
    []
  );

  const handleLectureSubmit = useCallback(
    async (payload) => {
      try {
        const { lecture } = await createLecture(payload);
        handleLectureCreated(lecture);
        pushToast(t('toast.lectureUploadSuccess'), 'success');
        return { success: true, lecture };
      } catch (error) {
        const message = error.response?.data?.message || t('toast.genericDanger');
        setLecturesError(message);
        pushToast(message, 'danger');
        return { success: false, error: message };
      }
    },
    [handleLectureCreated, pushToast, t]
  );

  const handleLectureDeleted = useCallback(
    async (lectureId) => {
      if (!lectureId) {
        return { success: false, error: 'Lecture ID is required' };
      }
      try {
        await deleteLecture(lectureId);
        setLectures((prev) => prev.filter((lecture) => lecture.id !== lectureId && lecture._id !== lectureId));
        pushToast(t('toast.lectureRemovedSuccess'), 'info');
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.message || t('toast.genericDanger');
        pushToast(message, 'danger');
        return { success: false, error: message };
      }
    },
    [pushToast, t]
  );

  useEffect(() => {
    if (!currentUser?.role) {
      setLectures([]);
      return;
    }

    if (currentUser.role === 'teacher') {
      loadLectures({ mine: true });
    } else {
      loadLectures();
    }
  }, [currentUser?.role, loadLectures]);

  const handleLogin = useCallback(
    async (credentials) => {
      setAuthLoading(true);
      try {
        const { user } = await loginUser(credentials);
        setCurrentUser(user ?? null);
        setAuthError(null);
        const firstName = user?.name?.split(' ')[0] ?? t('common.appName');
        pushToast(t('toast.welcomeBack', { name: firstName }), 'success');
        if (user?.role === 'student') {
          setTestAttemptsLoading(true);
          try {
            const { attempts } = await fetchTestAttempts({ limit: 5 });
            setTestAttempts(attempts ?? []);
            setTestAttemptsError(null);
          } catch (error) {
            console.error('Failed to load test attempts after login:', error);
            setTestAttemptsError('Unable to load recent test attempts');
          } finally {
            setTestAttemptsLoading(false);
          }
          loadLectures();
        } else if (user?.role === 'teacher') {
          loadLectures({ mine: true });
        }
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.message || t('toast.loginFailed');
        setAuthError(message);
        pushToast(message, 'danger');
        return { success: false, error: message };
      } finally {
        setAuthLoading(false);
      }
    },
    [pushToast]
  );

  const handleRegister = useCallback(
    async (payload) => {
      setAuthLoading(true);
      try {
        const { user } = await registerUser(payload);
        setCurrentUser(user ?? null);
        setAuthError(null);
        pushToast(t('toast.accountCreated'), 'success');
        setTestAttempts([]);
        if (user?.role === 'teacher') {
          loadLectures({ mine: true });
        } else {
          loadLectures();
        }
        return { success: true };
      } catch (error) {
        const message = error.response?.data?.message || t('toast.accountCreateFailed');
        setAuthError(message);
        pushToast(message, 'danger');
        return { success: false, error: message };
      } finally {
        setAuthLoading(false);
      }
    },
    [pushToast]
  );

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
    setCurrentUser(null);
    setTestAttempts([]);
    setLectures([]);
    setRecentLectures([]);
    pushToast(t('toast.signedOut'), 'info');
  }, [pushToast, t]);

  const handleTestAttemptRecorded = useCallback((attemptSummary) => {
    if (!attemptSummary) return;
    setTestAttempts((prev) => {
      const filtered = prev.filter((entry) => entry.id !== attemptSummary.id);
      return [attemptSummary, ...filtered].slice(0, 5);
    });
    pushToast(
      t('toast.testFinished', {
        title: attemptSummary.title ?? attemptSummary.testId,
        percent: Math.round(attemptSummary.percent ?? 0),
      }),
      'success'
    );
  }, [pushToast, t]);

  const combinedStatus = useMemo(
    () => ({
      ...status,
      downloadsLoading,
      lecturesLoading,
      downloadCount: downloads.length,
      lectureCount: lectures.length,
    }),
    [status, downloadsLoading, lecturesLoading, downloads.length, lectures.length]
  );

  const combinedError = error || downloadsError || authError || lecturesError;

  const handleRefresh = useCallback(() => {
    refresh();
    refreshDownloads();
    if (currentUser?.role === 'teacher') {
      loadLectures({ mine: true });
    } else {
      loadLectures();
    }
  }, [refresh, refreshDownloads, currentUser?.role, loadLectures]);

  const outletContext = useMemo(
    () => ({
      currentUser,
      authLoading,
      authError,
      handleLogout,
      handleLogin,
      handleRegister,
      refreshCurrentUser,
      courses,
      loading,
      error,
      status,
      refresh,
      downloads,
      downloadsLoading,
      downloadsError,
      saveCourse: handleSaveCourse,
      removeCourse: handleRemoveCourse,
      saveModule: handleSaveModule,
      removeModule: handleRemoveModule,
      saveLecture: handleSaveLectureDownload,
      removeLecture: handleRemoveLectureDownload,
      pendingDownloadIds: pendingCourseIds,
      pendingLectureIds,
      pendingDownloadKeys: pendingKeySet,
      progress,
      downloadsStats: {
        total: downloads.length,
        sizeMB: downloads.reduce((sum, item) => sum + (item.totalSizeMB || 0), 0),
        assetsCached: downloads.reduce((sum, item) => sum + (item.cachedAssets?.length || 0), 0),
        assetsFailed: downloads.reduce((sum, item) => sum + (item.failedAssets?.length || 0), 0),
        lastUpdated: downloads[0]?.savedAt,
      },
      refreshDownloads,
      toasts,
      dismissToast,
      testAttempts,
      testAttemptsLoading,
      testAttemptsError,
      loadTestAttempts,
      handleTestAttemptRecorded,
      lastDownloadError,
      clearLastDownloadError,
      lectures,
      lecturesLoading,
      lecturesError,
      loadLectures,
      recentLectures,
      registerLectureView: handleLectureViewed,
      rateLecture: handleLectureRated,
      refreshLectureRating: syncLectureRating,
      handleLectureSubmit,
      handleLectureDeleted,
      handleLectureCreated,
      lectureUploadRef,
    }),
    [
      currentUser,
      authLoading,
      authError,
      handleLogout,
      handleLogin,
      handleRegister,
      refreshCurrentUser,
      courses,
      loading,
      error,
      status,
      refresh,
      downloads,
      downloadsLoading,
      downloadsError,
      handleSaveCourse,
      handleRemoveCourse,
      handleSaveModule,
      handleRemoveModule,
      pendingCourseIds,
      pendingKeySet,
      progress,
      refreshDownloads,
      toasts,
      dismissToast,
      testAttempts,
      testAttemptsLoading,
      testAttemptsError,
      loadTestAttempts,
      handleTestAttemptRecorded,
      lastDownloadError,
      clearLastDownloadError,
      lectures,
      lecturesLoading,
      lecturesError,
      loadLectures,
      handleLectureSubmit,
      handleLectureDeleted,
      handleLectureCreated,
      handleLectureViewed,
      handleLectureRated,
      syncLectureRating,
      lectureUploadRef,
      recentLectures,
    ]
  );

  if (authLoading) {
    return <CenteredLoader />;
  }

  if (!currentUser) {
    return (
      <Routes>
        <Route
          path="/auth"
          element={
            <AuthPage
              onLogin={handleLogin}
              onRegister={handleRegister}
              authLoading={authLoading}
              authError={authError}
            />
          }
        />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  if (currentUser.role === 'teacher') {
    return (
      <Routes>
        <Route
          path="/teacher"
          element={
            <TeacherLayout
              status={combinedStatus}
              onRefresh={handleRefresh}
              outletContext={outletContext}
              errorMessage={combinedError}
            />
          }
        >
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<TeacherProfilePage />} />
          <Route path="upload" element={<TeacherUploadLecturePage />} />
          <Route path="uploads" element={<TeacherUploadsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/teacher" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        element={
          <Layout
            status={combinedStatus}
            onRefresh={handleRefresh}
            outletContext={outletContext}
            errorMessage={combinedError}
          />
        }
      >
        <Route index element={<HomePage />} />
        <Route path="courses" element={<ExploreCoursesPage />} />
        <Route path="courses/:courseId" element={<CourseDetailPage />} />
        <Route path="tests" element={<TestsPage />} />
        <Route path="tests/:testId" element={<TestsRunnerPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="downloads" element={<DownloadsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  );
}

export default App;
