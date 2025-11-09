import {
  upsertDownloadRecord,
  deleteDownloadRecord,
  getDownloads,
  getDownloadRecord,
} from '../storage/localDb';

const CACHE_NAME = 'neural-study-assets-v1';

const safeWindow = typeof window !== 'undefined' ? window : undefined;

export const getCourseAssets = (course) => {
  const assets = new Set();
  course.modules?.forEach((module) => {
    module.lessons?.forEach((lesson) => {
      if (lesson.assetUrl) {
        assets.add(lesson.assetUrl);
      }
    });
  });
  return Array.from(assets);
};

export const getModuleAssets = (module) => {
  const assets = new Set();
  module?.lessons?.forEach((lesson) => {
    if (lesson.assetUrl) {
      assets.add(lesson.assetUrl);
    }
  });
  return Array.from(assets);
};

export const getLectureAssets = (lecture) => {
  const assets = new Set();
  if (lecture?.resourceUrl) {
    assets.add(lecture.resourceUrl);
  }
  (lecture?.assets ?? []).forEach((asset) => {
    if (asset) assets.add(asset);
  });
  return Array.from(assets);
};

const cacheAssetsSequentially = async (assetUrls = [], { onProgress, signal } = {}) => {
  if (!safeWindow || !safeWindow.caches) {
    return { cached: [], failed: assetUrls.slice() };
  }

  const cache = await safeWindow.caches.open(CACHE_NAME);
  const cached = [];
  const failed = [];
  const total = assetUrls.length;

  const reportProgress = () => {
    onProgress?.({
      total,
      completed: cached.length + failed.length,
      success: cached.length,
      failed: failed.length,
    });
  };

  reportProgress();

  for (const url of assetUrls) {
    try {
      if (signal?.aborted) {
        throw new DOMException('Download aborted', 'AbortError');
      }

      const response = await fetch(url, { signal, mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Failed to fetch asset: ${response.status}`);
      }

      await cache.put(url, response.clone());
      cached.push(url);
    } catch (error) {
      console.warn('[downloadManager] Failed to cache asset', url, error);
      failed.push(url);
    } finally {
      reportProgress();
    }
  }

  return { cached, failed };
};

const removeCachedAssets = async (assetUrls = []) => {
  if (!safeWindow || !safeWindow.caches) {
    return;
  }
  const cache = await safeWindow.caches.open(CACHE_NAME);
  await Promise.all(assetUrls.map((url) => cache.delete(url)));
};

export const saveCourseOffline = async (course, options = {}) => {
  const { onProgress, signal } = options;
  const assets = getCourseAssets(course);
  const total = assets.length;

  onProgress?.({ total, completed: 0, success: 0, failed: 0 });

  if (!total) {
    const record = {
      id: course._id,
      type: 'course',
      title: course.title,
      exam: course.exam,
      language: course.language,
      moduleCount: course.modules?.length || 0,
      totalSizeMB: course.totalSizeMB || 0,
      assets,
      cachedAssets: [],
      failedAssets: [],
      savedAt: new Date().toISOString(),
    };
    await upsertDownloadRecord(record);
    onProgress?.({ total, completed: 0, success: 0, failed: 0 });
    return record;
  }

  const { cached, failed } = await cacheAssetsSequentially(assets, { onProgress, signal });

  const record = {
    id: course._id,
    type: 'course',
    title: course.title,
    exam: course.exam,
    language: course.language,
    moduleCount: course.modules?.length || 0,
    totalSizeMB: course.totalSizeMB || 0,
    assets,
    cachedAssets: cached,
    failedAssets: failed,
    savedAt: new Date().toISOString(),
  };

  await upsertDownloadRecord(record);
  onProgress?.({ total, completed: cached.length + failed.length, success: cached.length, failed: failed.length });
  return record;
};

export const saveModuleOffline = async (course, module, options = {}) => {
  const { onProgress, signal } = options;
  const moduleAssets = getModuleAssets(module);
  const total = moduleAssets.length;

  onProgress?.({ total, completed: 0, success: 0, failed: 0 });

  if (!total) {
    onProgress?.({ total, completed: 0, success: 0, failed: 0 });
    return null;
  }

  const { cached, failed } = await cacheAssetsSequentially(moduleAssets, { onProgress, signal });

  let record = await getDownloadRecord(course._id);
  if (!record) {
    record = {
      id: course._id,
      type: 'course',
      title: course.title,
      exam: course.exam,
      language: course.language,
      moduleCount: course.modules?.length || 0,
      totalSizeMB: course.totalSizeMB || 0,
      assets: getCourseAssets(course),
      cachedAssets: [],
      failedAssets: [],
      savedAt: new Date().toISOString(),
    };
  }

  const allAssets = new Set(record.assets ?? getCourseAssets(course));
  moduleAssets.forEach((asset) => allAssets.add(asset));

  const cachedAssets = new Set(record.cachedAssets ?? []);
  cached.forEach((asset) => cachedAssets.add(asset));

  const failedAssets = new Set(record.failedAssets ?? []);
  failed.forEach((asset) => failedAssets.add(asset));
  cached.forEach((asset) => failedAssets.delete(asset));

  const updated = {
    ...record,
    type: 'course',
    title: course.title,
    exam: course.exam,
    language: course.language,
    moduleCount: course.modules?.length || record.moduleCount || 0,
    totalSizeMB: course.totalSizeMB || record.totalSizeMB || 0,
    assets: Array.from(allAssets),
    cachedAssets: Array.from(cachedAssets),
    failedAssets: Array.from(failedAssets),
  };

  await upsertDownloadRecord(updated);
  onProgress?.({ total, completed: cached.length + failed.length, success: cached.length, failed: failed.length });
  return updated;
};

export const removeCourseOffline = async (courseId) => {
  const downloads = await getDownloads();
  const record = downloads.find((item) => item.id === courseId);
  if (record) {
    await removeCachedAssets(record.cachedAssets || record.assets || []);
  }
  await deleteDownloadRecord(courseId);
};

export const removeModuleOffline = async (courseId, module) => {
  const moduleAssets = getModuleAssets(module);
  if (!moduleAssets.length) {
    return;
  }

  const record = await getDownloadRecord(courseId);
  if (!record) {
    return;
  }

  await removeCachedAssets(moduleAssets);

  const cachedSet = new Set(record.cachedAssets ?? []);
  moduleAssets.forEach((asset) => cachedSet.delete(asset));

  const failedAssets = (record.failedAssets ?? []).filter((asset) => !moduleAssets.includes(asset));

  const updated = {
    ...record,
    cachedAssets: Array.from(cachedSet),
    failedAssets,
  };

  if (!updated.cachedAssets.length && !updated.failedAssets.length) {
    await deleteDownloadRecord(courseId);
  } else {
    await upsertDownloadRecord(updated);
  }
};

export const listDownloads = async () => getDownloads();

export const saveLectureOffline = async (lecture, options = {}) => {
  const { onProgress, signal } = options;
  const lectureId = lecture?._id ?? lecture?.id;
  if (!lectureId) {
    throw new Error('Lecture ID is required to cache offline');
  }

  const assets = getLectureAssets(lecture);
  const total = assets.length;

  onProgress?.({ total, completed: 0, success: 0, failed: 0 });

  if (!total) {
    const record = {
      id: lectureId,
      type: 'lecture',
      lectureId,
      title: lecture.title,
      exam: lecture.exam,
      subject: lecture.subject,
      language: lecture.language,
      durationMinutes: lecture.durationMinutes,
      thumbnailUrl: lecture.thumbnailUrl,
      resourceUrl: lecture.resourceUrl,
      assets,
      cachedAssets: [],
      failedAssets: [],
      savedAt: new Date().toISOString(),
    };
    await upsertDownloadRecord(record);
    return record;
  }

  const { cached, failed } = await cacheAssetsSequentially(assets, { onProgress, signal });

  const record = {
    id: lectureId,
    type: 'lecture',
    lectureId,
    title: lecture.title,
    exam: lecture.exam,
    subject: lecture.subject,
    language: lecture.language,
    durationMinutes: lecture.durationMinutes,
    thumbnailUrl: lecture.thumbnailUrl,
    resourceUrl: lecture.resourceUrl,
    assets,
    cachedAssets: cached,
    failedAssets: failed,
    savedAt: new Date().toISOString(),
  };

  await upsertDownloadRecord(record);
  onProgress?.({ total, completed: cached.length + failed.length, success: cached.length, failed: failed.length });
  return record;
};

export const removeLectureOffline = async (lectureId) => {
  if (!lectureId) return;
  const record = await getDownloadRecord(lectureId);
  if (record?.cachedAssets?.length) {
    await removeCachedAssets(record.cachedAssets);
  }
  await deleteDownloadRecord(lectureId);
};
