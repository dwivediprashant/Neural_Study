import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  listDownloads,
  saveCourseOffline,
  removeCourseOffline,
  saveModuleOffline,
  removeModuleOffline,
  saveLectureOffline,
  removeLectureOffline,
} from '../services/downloadManager';
import { makeCourseProgressKey, makeLectureProgressKey, makeModuleProgressKey } from '../utils/downloads';

const useDownloadsManager = () => {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastDownloadError, setLastDownloadError] = useState(null);
  const [pendingKeys, setPendingKeys] = useState(() => new Set());
  const [progressMap, setProgressMap] = useState(() => new Map());
  const abortControllers = useRef(new Map());

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const records = await listDownloads();
      setDownloads(records);
    } catch (err) {
      setError(err?.message || 'Unable to load downloads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveCourse = useCallback(
    async (course) => {
      let succeeded = false;
      const key = makeCourseProgressKey(course._id);
      const nextPending = new Set(pendingKeys);
      nextPending.add(key);
      setPendingKeys(nextPending);
      const abortController = new AbortController();
      abortControllers.current.set(key, abortController);
      setProgressMap((prev) => {
        const next = new Map(prev);
        next.set(key, { total: 0, completed: 0, success: 0, failed: 0 });
        return next;
      });
      try {
        await saveCourseOffline(course, {
          signal: abortController.signal,
          onProgress: (progress) => {
            setProgressMap((prev) => {
              const next = new Map(prev);
              next.set(key, progress);
              return next;
            });
          },
        });
        await refresh();
        succeeded = true;
      } catch (err) {
        const message = err?.message || 'Failed to save course for offline use';
        setError(message);
        setLastDownloadError(message);
      } finally {
        abortControllers.current.delete(key);
        setPendingKeys((prev) => {
          const updated = new Set(prev);
          updated.delete(key);
          return updated;
        });
        setProgressMap((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      }
      return succeeded;
    },
    [pendingKeys, refresh]
  );

  const removeCourse = useCallback(
    async (courseId) => {
      let succeeded = false;
      const key = makeCourseProgressKey(courseId);
      const nextPending = new Set(pendingKeys);
      nextPending.add(key);
      setPendingKeys(nextPending);
      const abortController = abortControllers.current.get(key);
      abortController?.abort();
      try {
        await removeCourseOffline(courseId);
        await refresh();
        succeeded = true;
      } catch (err) {
        const message = err?.message || 'Failed to remove offline content';
        setError(message);
        setLastDownloadError(message);
      } finally {
        abortControllers.current.delete(key);
        setPendingKeys((prev) => {
          const updated = new Set(prev);
          updated.delete(key);
          return updated;
        });
        setProgressMap((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      }
      return succeeded;
    },
    [pendingKeys, refresh]
  );

  const saveModule = useCallback(
    async (course, module, moduleKey) => {
      let succeeded = false;
      const key = makeModuleProgressKey(course._id, moduleKey);
      const nextPending = new Set(pendingKeys);
      nextPending.add(key);
      setPendingKeys(nextPending);
      const abortController = new AbortController();
      abortControllers.current.set(key, abortController);
      setProgressMap((prev) => {
        const next = new Map(prev);
        next.set(key, { total: 0, completed: 0, success: 0, failed: 0 });
        return next;
      });
      try {
        await saveModuleOffline(course, module, {
          signal: abortController.signal,
          onProgress: (progress) => {
            setProgressMap((prev) => {
              const next = new Map(prev);
              next.set(key, progress);
              return next;
            });
          },
        });
        await refresh();
        succeeded = true;
      } catch (err) {
        const message = err?.message || 'Failed to save module offline';
        setError(message);
        setLastDownloadError(message);
      } finally {
        abortControllers.current.delete(key);
        setPendingKeys((prev) => {
          const updated = new Set(prev);
          updated.delete(key);
          return updated;
        });
        setProgressMap((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      }
      return succeeded;
    },
    [pendingKeys, refresh]
  );

  const removeModule = useCallback(
    async (course, module, moduleKey) => {
      let succeeded = false;
      const key = makeModuleProgressKey(course._id, moduleKey);
      const nextPending = new Set(pendingKeys);
      nextPending.add(key);
      setPendingKeys(nextPending);
      const abortController = abortControllers.current.get(key);
      abortController?.abort();
      try {
        await removeModuleOffline(course._id, module);
        await refresh();
        succeeded = true;
      } catch (err) {
        const message = err?.message || 'Failed to remove module content';
        setError(message);
        setLastDownloadError(message);
      } finally {
        abortControllers.current.delete(key);
        setPendingKeys((prev) => {
          const updated = new Set(prev);
          updated.delete(key);
          return updated;
        });
        setProgressMap((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      }
      return succeeded;
    },
    [pendingKeys, refresh]
  );

  const saveLecture = useCallback(
    async (lecture) => {
      const lectureId = lecture?._id || lecture?.id;
      if (!lectureId) {
        return false;
      }

      let succeeded = false;
      const key = makeLectureProgressKey(lectureId);
      const nextPending = new Set(pendingKeys);
      nextPending.add(key);
      setPendingKeys(nextPending);
      const abortController = new AbortController();
      abortControllers.current.set(key, abortController);
      setProgressMap((prev) => {
        const next = new Map(prev);
        next.set(key, { total: 0, completed: 0, success: 0, failed: 0 });
        return next;
      });

      try {
        await saveLectureOffline(lecture, {
          signal: abortController.signal,
          onProgress: (progress) => {
            setProgressMap((prev) => {
              const next = new Map(prev);
              next.set(key, progress);
              return next;
            });
          },
        });
        await refresh();
        succeeded = true;
      } catch (err) {
        const message = err?.message || 'Failed to save lecture offline';
        setError(message);
        setLastDownloadError(message);
      } finally {
        abortControllers.current.delete(key);
        setPendingKeys((prev) => {
          const updated = new Set(prev);
          updated.delete(key);
          return updated;
        });
        setProgressMap((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      }

      return succeeded;
    },
    [pendingKeys, refresh]
  );

  const removeLecture = useCallback(
    async (lectureId) => {
      if (!lectureId) {
        return false;
      }

      let succeeded = false;
      const key = makeLectureProgressKey(lectureId);
      const nextPending = new Set(pendingKeys);
      nextPending.add(key);
      setPendingKeys(nextPending);
      const abortController = abortControllers.current.get(key);
      abortController?.abort();

      try {
        await removeLectureOffline(lectureId);
        await refresh();
        succeeded = true;
      } catch (err) {
        const message = err?.message || 'Failed to remove lecture download';
        setError(message);
        setLastDownloadError(message);
      } finally {
        abortControllers.current.delete(key);
        setPendingKeys((prev) => {
          const updated = new Set(prev);
          updated.delete(key);
          return updated;
        });
        setProgressMap((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      }

      return succeeded;
    },
    [pendingKeys, refresh]
  );

  const pendingCourseIds = useMemo(() => {
    const ids = new Set();
    pendingKeys.forEach((key) => {
      if (key.startsWith('course:')) {
        ids.add(key.slice('course:'.length));
      }
    });
    return ids;
  }, [pendingKeys]);

  const pendingLectureIds = useMemo(() => {
    const ids = new Set();
    pendingKeys.forEach((key) => {
      if (key.startsWith('lecture:')) {
        ids.add(key.slice('lecture:'.length));
      }
    });
    return ids;
  }, [pendingKeys]);

  const pendingKeySet = useMemo(() => new Set(pendingKeys), [pendingKeys]);
  const progress = useMemo(() => new Map(progressMap), [progressMap]);

  return {
    downloads,
    loading,
    error,
    refresh,
    saveCourse,
    removeCourse,
    saveModule,
    removeModule,
    saveLecture,
    removeLecture,
    pendingCourseIds,
    pendingLectureIds,
    pendingKeySet,
    progress,
    lastDownloadError,
    clearLastDownloadError: () => setLastDownloadError(null),
  };
};

export default useDownloadsManager;
