import { openDB } from 'idb';

const DB_NAME = 'neural-study';
const DB_VERSION = 4;
const COURSE_STORE = 'courses';
const META_STORE = 'metadata';
const ACTION_QUEUE_STORE = 'actions';
const DOWNLOAD_STORE = 'downloads';

const initDb = async () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(COURSE_STORE)) {
        db.createObjectStore(COURSE_STORE, { keyPath: '_id' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
      if (!db.objectStoreNames.contains(ACTION_QUEUE_STORE)) {
        db.createObjectStore(ACTION_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(DOWNLOAD_STORE)) {
        db.createObjectStore(DOWNLOAD_STORE, { keyPath: 'id' });
      }
    },
  });

export const persistCourses = async (courses = [], lastSyncedAt = new Date().toISOString()) => {
  const db = await initDb();
  const tx = db.transaction([COURSE_STORE, META_STORE], 'readwrite');
  const courseStore = tx.objectStore(COURSE_STORE);
  await courseStore.clear();
  courses.forEach((course) => {
    const record = {
      ...course,
      _id: course?._id ?? course?.id,
    };

    if (!record._id) {
      return;
    }

    courseStore.put(record);
  });
  await tx.objectStore(META_STORE).put(lastSyncedAt, 'lastSync');
  await tx.done;
};

export const getCachedCourses = async () => {
  const db = await initDb();
  return db.transaction(COURSE_STORE).objectStore(COURSE_STORE).getAll();
};

export const getLastSync = async () => {
  const db = await initDb();
  return db.transaction(META_STORE).objectStore(META_STORE).get('lastSync');
};

export const enqueueAction = async (action) => {
  const db = await initDb();
  await db.transaction(ACTION_QUEUE_STORE, 'readwrite').objectStore(ACTION_QUEUE_STORE).add({
    ...action,
    queuedAt: new Date().toISOString(),
  });
};

export const readQueuedActions = async () => {
  const db = await initDb();
  return db.transaction(ACTION_QUEUE_STORE).objectStore(ACTION_QUEUE_STORE).getAll();
};

export const clearQueuedActions = async () => {
  const db = await initDb();
  await db.transaction(ACTION_QUEUE_STORE, 'readwrite').objectStore(ACTION_QUEUE_STORE).clear();
};

export const upsertDownloadRecord = async (record) => {
  const db = await initDb();
  const tx = db.transaction(DOWNLOAD_STORE, 'readwrite');
  const store = tx.objectStore(DOWNLOAD_STORE);
  const existing = await store.get(record.id);
  await store.put({
    ...existing,
    ...record,
    updatedAt: new Date().toISOString(),
  });
  await tx.done;
};

export const getDownloads = async () => {
  const db = await initDb();
  return db.transaction(DOWNLOAD_STORE).objectStore(DOWNLOAD_STORE).getAll();
};

export const getDownloadRecord = async (id) => {
  if (!id) return null;
  const db = await initDb();
  return db.transaction(DOWNLOAD_STORE).objectStore(DOWNLOAD_STORE).get(id);
};

export const deleteDownloadRecord = async (id) => {
  const db = await initDb();
  await db.transaction(DOWNLOAD_STORE, 'readwrite').objectStore(DOWNLOAD_STORE).delete(id);
};
