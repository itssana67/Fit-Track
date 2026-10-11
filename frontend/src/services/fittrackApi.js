// One function per backend endpoint, grouped by feature.
// Pages call these instead of writing Axios calls themselves.
import api from './api';

const data = (request) => request.then((response) => response.data);

export const authApi = {
  register: (payload) => data(api.post('/auth/register', payload)),
  login: (payload) => data(api.post('/auth/login', payload)),
  me: () => data(api.get('/auth/me')),
  logout: () => data(api.post('/auth/logout')),
};

export const userApi = {
  updateProfile: (payload) => data(api.put('/users/me', payload)),
  changePassword: (payload) => data(api.put('/users/me/password', payload)),
};

export const dashboardApi = {
  get: (today) => data(api.get('/dashboard', { params: { today } })),
};

export const workoutApi = {
  list: (params) => data(api.get('/workouts', { params })),
  get: (id) => data(api.get(`/workouts/${id}`)),
  create: (payload) => data(api.post('/workouts', payload)),
  update: (id, payload) => data(api.put(`/workouts/${id}`, payload)),
  setCompleted: (id, completed) => data(api.patch(`/workouts/${id}/complete`, { completed })),
  remove: (id) => data(api.delete(`/workouts/${id}`)),
  addExercise: (id, payload) => data(api.post(`/workouts/${id}/exercises`, payload)),
  removeExercise: (id, entryId) => data(api.delete(`/workouts/${id}/exercises/${entryId}`)),
};

export const mealApi = {
  list: (params) => data(api.get('/meals', { params })),
  summary: (date) => data(api.get('/meals/summary', { params: { date } })),
  create: (payload) => data(api.post('/meals', payload)),
  update: (id, payload) => data(api.put(`/meals/${id}`, payload)),
  remove: (id) => data(api.delete(`/meals/${id}`)),
};

export const progressApi = {
  list: () => data(api.get('/progress')),
  create: (payload) => data(api.post('/progress', payload)),
  update: (id, payload) => data(api.put(`/progress/${id}`, payload)),
  remove: (id) => data(api.delete(`/progress/${id}`)),
};

export const goalApi = {
  list: (params) => data(api.get('/goals', { params })),
  create: (payload) => data(api.post('/goals', payload)),
  update: (id, payload) => data(api.put(`/goals/${id}`, payload)),
  remove: (id) => data(api.delete(`/goals/${id}`)),
};

export const exerciseApi = {
  list: (params) => data(api.get('/exercises', { params })),
};

export const recommendationApi = {
  get: () => data(api.get('/recommendations')),
};

export const achievementApi = {
  list: () => data(api.get('/achievements')),
};
