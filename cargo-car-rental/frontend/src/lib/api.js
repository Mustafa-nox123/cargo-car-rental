import axios from 'axios'

// Default to backend URL during development to avoid accidental requests to the Vite server.
// You can override this by creating `frontend/.env` with `VITE_API_URL=http://localhost:5000/api`
// Some setups run the backend on port 5000; default to 5000 so the frontend targets that backend.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if(token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export default api
