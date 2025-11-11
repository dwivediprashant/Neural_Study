export const formatProgressLabel = (progress, t) => {
  if (!progress) return null;
  const { total = 0, success = 0, failed = 0 } = progress;
  if (!total) return null;
  if (success === total) {
    return t ? t('downloads.progress.cachedOffline') : 'Cached offline';
  }
  const failedSuffix = failed
    ? (t ? t('downloads.progress.failedSuffix', { count: failed }) : ` • ${failed} failed`)
    : '';
  if (t) {
    return `${t('downloads.progress.caching', { success, total })}${failedSuffix}`;
  }
  return `Caching ${success}/${total}${failedSuffix}`;
};

export const createModuleKey = (module, index = 0) => {
  if (!module) return `module-${index}`;
  if (module._id) return module._id;
  if (module.id) return module.id;
  if (typeof module.order !== 'undefined' && module.order !== null) {
    return `order-${module.order}`;
  }
  if (module.name) {
    return `${module.name.toLowerCase().replace(/\s+/g, '-')}-${index}`;
  }
  return `module-${index}`;
};

export const makeModuleProgressKey = (courseId, moduleId) =>
  `${courseId ?? ''}::module:${moduleId ?? ''}`;

export const makeCourseProgressKey = (courseId) => `course:${courseId ?? ''}`;

export const makeLectureProgressKey = (lectureId) => `lecture:${lectureId ?? ''}`;
