import React, { useState } from 'react'
import api from '../lib/api'
import adminApi from '../lib/adminApi'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

export default function Login(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [asAdmin,setAsAdmin] = useState(false)
  const [error,setError] = useState('')
  const [loading,setLoading] = useState(false)
  const nav = useNavigate()
  const location = useLocation()
  const isAdminPath = location.pathname.startsWith('/admin')
  const adminAuth = useAdminAuth()

  const submit = async e => {
    e.preventDefault()
    setError('')

    if(!email || !password){
      setError('Please enter email and password')
      return
    }

    setLoading(true)
    try {
      // decide admin vs customer login based on current path or the "Login as admin" checkbox
      const isAdmin = isAdminPath || asAdmin
      if(isAdmin){
        const res = await adminApi.post('/api/admin/login', { email, password })
        const token = res?.data?.token
        if(!token) throw new Error(res?.data?.error || 'No token returned')
        // store admin token via AdminAuthContext if available, otherwise fallback
        if(adminAuth && adminAuth.signIn) adminAuth.signIn(token)
        else localStorage.setItem('admin_token', token)
        nav('/admin/dashboard')
      } else {
        // use centralized axios instance (reads VITE_API_URL)
        const res = await api.post('/auth/login', { email, password })
        const token = res?.data?.token
        if(!token) throw new Error(res?.data?.error || 'No token returned')
        localStorage.setItem('token', token)
        // optional: store user if returned
        if(res.data.user) localStorage.setItem('user', JSON.stringify(res.data.user))
        // notify header/other components
        try { window.dispatchEvent(new Event('authChanged')) } catch(e){}
        nav('/dashboard')
      }
    } catch (err) {
      // prefer server-provided message
      const msg = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight: '70vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', backgroundImage:'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("/1.png")', backgroundSize:'cover', backgroundPosition:'center'}}>
      <div style={{width:'100%', maxWidth: '480px'}}>
        <div style={{background:'#fff', boxShadow:'0 6px 18px rgba(15,23,42,0.08)', borderRadius:12, overflow:'hidden'}}>
          <div style={{padding:'1.25rem'}}>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome back</h2>
            <p className="text-sm text-gray-500 mb-4">Sign in to manage reservations and rentals</p>

            {error && (
              <div className="mb-4 text-sm text-red-700 bg-red-100 p-2 rounded">{error}</div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e=>setEmail(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className={`px-4 py-2 rounded text-white ${loading ? 'bg-gray-500' : 'bg-blue-600'}`}
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
                <a href="/" className="text-sm text-gray-500 hover:underline">Forgot password?</a>
              </div>

              <div style={{marginTop:6}} className="flex items-center">
                <input id="asAdmin" type="checkbox" checked={asAdmin} onChange={e=>setAsAdmin(e.target.checked)} />
                <label htmlFor="asAdmin" style={{marginLeft:8, fontSize:13, color:'#374151'}}>Login as admin</label>
              </div>
            </form>
          </div>
          <div style={{background:'#fbfbfb', padding:'0.85rem', textAlign:'center', fontSize:13, color:'#6b7280'}}>New here? Create an account via the API or register page.</div>
        </div>
      </div>
    </div>
  )
}
