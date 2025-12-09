import axios from 'axios'

// Admin API base: prefer VITE_API_URL (stripped of trailing /api), otherwise default to backend port 5000
const ADMIN_API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000'

const adminApi = axios.create({
  baseURL: ADMIN_API_BASE,
  headers: { 'Content-Type': 'application/json' }
})

// Debug: print resolved base URL at runtime to help diagnose network issues
try {
  // eslint-disable-next-line no-console
  console.log('adminApi baseURL ->', ADMIN_API_BASE)
} catch (e) {}

adminApi.interceptors.request.use(cfg => {
  const token = localStorage.getItem('admin_token')
  if(token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export default adminApi
