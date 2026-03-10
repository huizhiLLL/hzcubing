import axios from 'axios'

// API base URL - can be overridden via environment variable
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response
      if (status === 401) {
        // Token expired or invalid - clear auth
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        window.location.reload()
      }
      return Promise.reject(data || error)
    }
    return Promise.reject(error)
  }
)

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me')
}

// User APIs
export const userAPI = {
  getById: (userId) => api.get(`/users/${userId}`),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getAll: (params) => api.get('/users', { params })
}

// Record APIs
export const recordAPI = {
  getAll: (params) => api.get('/records', { params }),
  getUserRecords: (userId, params) => api.get(`/records/user/${userId}`, { params }),
  getUserBest: (userId, params) => api.get(`/records/user/${userId}/best`, { params }),
  getUserHistory: (userId, params) => api.get(`/records/user/${userId}/history`, { params }),
  getBest: (params) => api.get('/records/best', { params }),
  getRecentBreaks: (params) => api.get('/records/recent-breaks', { params }),
  create: (data) => api.post('/records', data),
  update: (id, data) => api.put(`/records/${id}`, data),
  delete: (id) => api.delete(`/records/${id}`)
}

export const memeEventAPI = {
  getAll: () => api.get('/meme-events'),
  getMine: () => api.get('/meme-events/mine'),
  create: (data) => api.post('/meme-events', data),
  update: (eventCode, data) => api.put(`/meme-events/${eventCode}`, data)
}

export default {
  auth: authAPI,
  user: userAPI,
  record: recordAPI,
  memeEvent: memeEventAPI
}
