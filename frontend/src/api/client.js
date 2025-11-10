import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 8000,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const registerUser = async (payload) => {
  const { data } = await api.post('/auth/register', payload);
  return data;
};

export const loginUser = async (payload) => {
  const { data } = await api.post('/auth/login', payload);
  return data;
};

export const logoutUser = async () => {
  const { data } = await api.post('/auth/logout');
  return data;
};

export const fetchCurrentUser = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const fetchCourses = async (params = {}) => {
  const { data } = await api.get('/courses', { params });
  return data;
};

export const fetchCourseById = async (courseId) => {
  if (!courseId) throw new Error('Course ID is required');
  const { data } = await api.get(`/courses/${courseId}`);
  return data;
};

export const fetchTests = async (params = {}) => {
  const { data } = await api.get('/tests', { params });
  return data;
};

export const fetchLectures = async (params = {}) => {
  const { data } = await api.get('/lectures', { params });
  return data;
};

export const createLecture = async (payload) => {
  const { data } = await api.post('/lectures', payload);
  return data;
};

export const rateLecture = async (lectureId, rating) => {
  if (!lectureId) throw new Error('Lecture ID is required');
  const { data } = await api.post(`/lectures/${lectureId}/ratings`, { rating });
  return data;
};

export const fetchLectureRatings = async (lectureId) => {
  if (!lectureId) throw new Error('Lecture ID is required');
  const { data } = await api.get(`/lectures/${lectureId}/ratings`);
  return data;
};

export const deleteLecture = async (lectureId) => {
  if (!lectureId) throw new Error('Lecture ID is required');
  const { data } = await api.delete(`/lectures/${lectureId}`);
  return data;
};

export const fetchTestBySlug = async (slug) => {
  if (!slug) throw new Error('Test slug is required');
  const { data } = await api.get(`/tests/${slug}`);
  return data;
};

export const submitTestAttempt = async (slug, payload) => {
  if (!slug) throw new Error('Test slug is required');
  const { data } = await api.post(`/tests/${slug}/attempts`, payload);
  return data;
};

export const fetchTestAttempts = async (params = {}) => {
  const { data } = await api.get('/tests/attempts', { params });
  return data;
};

export default api;
