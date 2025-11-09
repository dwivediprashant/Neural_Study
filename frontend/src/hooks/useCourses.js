import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchCourses } from '../api/client';
import {
  persistCourses,
  getCachedCourses,
  getLastSync,
} from '../storage/localDb';

const formatError = (error) => {
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (error.response?.data?.message) return error.response.data.message;
  return error.message || 'Unable to load courses.';
};

const useCourses = (options = {}) => {
  const { userId } = options;
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const hydrateFromCache = useCallback(async () => {
    const [cachedCourses, cachedSync] = await Promise.all([
      getCachedCourses(),
      getLastSync(),
    ]);
    if (cachedCourses?.length) {
      setCourses(cachedCourses);
    }
    if (cachedSync) {
      setLastSync(cachedSync);
    }
  }, []);

  const fetchLatest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = userId ? { userId } : undefined;
      const data = await fetchCourses(params);
      const resolvedCourses = data?.courses ?? [];
      const syncTimestamp = new Date().toISOString();

      setCourses(resolvedCourses);
      setLastSync(syncTimestamp);
      await persistCourses(resolvedCourses, syncTimestamp);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    hydrateFromCache();
  }, [hydrateFromCache]);

  useEffect(() => {
    if (!isOffline) {
      fetchLatest();
    }
  }, [isOffline, fetchLatest]);

  const status = useMemo(
    () => ({
      isOffline,
      lastSync,
      loading,
    }),
    [isOffline, lastSync, loading]
  );

  return {
    courses,
    loading,
    error,
    status,
    refresh: fetchLatest,
  };
};

export default useCourses;
