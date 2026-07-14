import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh on 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post('http://127.0.0.1:8000/api/token/refresh', {
            refresh: refreshToken,
          });
          const newAccess = res.data.access;
          localStorage.setItem('access_token', newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return API(originalRequest);
        } catch (refreshError) {
          // If refresh token is expired or invalid, log out
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoint services
export const authAPI = {
  register: (data) => API.post('register', data),
  login: (data) => API.post('login', data),
  logout: (refreshToken) => API.post('logout', { refresh: refreshToken }),
  getProfile: () => API.get('profile'),
  updateProfile: (data) => API.put('profile', data),
  changePassword: (data) => API.post('change-password', data),
  forgotPassword: (data) => API.post('forgot-password', data),
};

// Nutrition Endpoint services
export const nutritionAPI = {
  calculateGoals: (data) => API.post('nutrition/calculate', data),
  getMeals: (date) => API.get(`meals${date ? `?date=${date}` : ''}`),
  addMeal: (data) => API.post('meals', data),
  updateMeal: (id, data) => API.put(`meals/${id}`, data),
  deleteMeal: (id) => API.delete(`meals/${id}`),
  searchFoods: (query) => API.get(`foods?search=${query}`),
  addFood: (data) => API.post('foods', data),
};

// Workout Endpoint services
export const workoutAPI = {
  getWorkouts: (date) => API.get(`workouts${date ? `?date=${date}` : ''}`),
  addWorkout: (data) => API.post('workouts', data),
  updateWorkout: (id, data) => API.put(`workouts/${id}`, data),
  deleteWorkout: (id) => API.delete(`workouts/${id}`),
  getExercises: (category, search) => {
    let url = 'exercises';
    const params = [];
    if (category) params.push(`category=${category}`);
    if (search) params.push(`search=${search}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return API.get(url);
  },
  getWorkoutPlans: () => API.get('workout-plans'),
  addWorkoutPlan: (data) => API.post('workout-plans', data),
  updateWorkoutPlan: (id, data) => API.put(`workout-plans/${id}`, data),
  deleteWorkoutPlan: (id) => API.delete(`workout-plans/${id}`),
  getStrengthHistory: (exerciseId) => API.get(`workouts/strength-history?exercise_id=${exerciseId}`),
};

// Dashboard Endpoint services
export const dashboardAPI = {
  getDashboardData: (date) => API.get(`dashboard${date ? `?date=${date}` : ''}`),
};

// Reports Endpoint services
export const reportsAPI = {
  getDailyReport: (date) => API.get(`reports/daily${date ? `?date=${date}` : ''}`),
  getWeeklyReport: (date) => API.get(`reports/weekly${date ? `?date=${date}` : ''}`),
  getMonthlyReport: (date) => API.get(`reports/monthly${date ? `?date=${date}` : ''}`),
  getProgress: () => API.get('progress'),
  logProgress: (data) => API.post('progress', data),
  downloadPdf: (type, date) => {
    return API.get(`reports/pdf?type=${type}&date=${date}`, { responseType: 'blob' });
  },
};
