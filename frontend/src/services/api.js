import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper to format error messages
export const formatApiError = (error) => {
  const detail = error?.response?.data?.detail;
  if (detail == null) return 'Something went wrong. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((e) => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e))).filter(Boolean).join(' ');
  }
  if (detail && typeof detail.msg === 'string') return detail.msg;
  return String(detail);
};

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me')
};

// Departments
export const departmentApi = {
  getAll: () => api.get('/departments'),
  get: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  delete: (id) => api.delete(`/departments/${id}`)
};

// Programs
export const programApi = {
  getAll: (params) => api.get('/programs', { params }),
  get: (id) => api.get(`/programs/${id}`),
  create: (data) => api.post('/programs', data),
  delete: (id) => api.delete(`/programs/${id}`)
};

// Students
export const studentApi = {
  getAll: (params) => api.get('/students', { params }),
  get: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  bulkImport: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/students/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/students/${id}`)
};

// Subjects
export const subjectApi = {
  getAll: (params) => api.get('/subjects', { params }),
  create: (data) => api.post('/subjects', data),
  delete: (id) => api.delete(`/subjects/${id}`)
};

// Timetable
export const timetableApi = {
  getAll: (params) => api.get('/timetable', { params }),
  create: (data) => api.post('/timetable', data),
  bulkImport: (formData) => api.post('/timetable/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/timetable/${id}`)
};

// Attendance
export const attendanceApi = {
  getAll: (params) => api.get('/attendance', { params }),
  mark: (data) => api.post('/attendance', data),
  markBulk: (data) => api.post('/attendance/bulk', data),
  getStats: (studentId) => api.get(`/attendance/stats/${studentId}`),
  getDefaulters: (params) => api.get('/attendance/defaulters', { params }),
  checkIn: () => api.post('/attendance/staff/check-in'),
  checkOut: () => api.post('/attendance/staff/check-out'),
  getStaff: (params) => api.get('/attendance/staff', { params })
};

// Electives
export const electiveApi = {
  getAll: (params) => api.get('/electives', { params }),
  create: (data) => api.post('/electives', data)
};

// Batches
export const batchApi = {
  getAll: (params) => api.get('/batches', { params }),
  create: (data) => api.post('/batches', data),
  addStudent: (batchId, studentId) => api.post(`/batches/${batchId}/students/${studentId}`),
  removeStudent: (batchId, studentId) => api.delete(`/batches/${batchId}/students/${studentId}`)
};

// Users
export const userApi = {
  getAll: (params) => api.get('/users', { params }),
  updateRole: (userId, role) => api.put(`/users/${userId}/role?role=${role}`)
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats')
};

export default api;
