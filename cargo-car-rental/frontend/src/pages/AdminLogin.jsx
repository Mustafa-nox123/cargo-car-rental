import React, { useState } from 'react'
import adminApi from '../lib/adminApi'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

export default function AdminLogin(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [error,setError] = useState('')
  const [loading,setLoading] = useState(false)
  const nav = useNavigate()
  const { signIn, setLoading: setAuthLoading } = useAdminAuth()

  const validate = () => {
    if(!email) { setError('Email is required'); return false }
    if(!password) { setError('Password is required'); return false }
    return true
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if(!validate()) return
    setLoading(true)
    setAuthLoading && setAuthLoading(true)
    try{
      const res = await adminApi.post('/api/admin/login', { email, password })
      const token = res?.data?.token
      if(!token) throw new Error(res?.data?.error || 'No token returned')
      signIn(token)
      nav('/admin/dashboard')
    }catch(err){
      const msg = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Login failed'
      setError(msg)
    }finally{
      setLoading(false)
      setAuthLoading && setAuthLoading(false)
    }
  }

  return (
    <div style={{minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem'}}>
      <div style={{width:'100%', maxWidth:420}}>
        <div style={{background:'#fff', border:'1px solid #e6e6e6', borderRadius:8, padding:16}}>
          <h2 style={{fontSize:20, fontWeight:600, marginBottom:8}}>Admin Login</h2>
          <p style={{color:'#6b7280', marginBottom:12}}>Sign in with your administrator credentials.</p>
          {error && <div style={{background:'#fdecea', color:'#8a1f11', padding:8, borderRadius:6, marginBottom:8}}>{error}</div>}
          <form onSubmit={submit}>
            <div style={{marginBottom:8}}>
              <label style={{display:'block', marginBottom:6}}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%', padding:8, border:'1px solid #ccc', borderRadius:6}} required />
            </div>
            <div style={{marginBottom:12}}>
              <label style={{display:'block', marginBottom:6}}>Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%', padding:8, border:'1px solid #ccc', borderRadius:6}} required />
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <button type="submit" disabled={loading} style={{padding:'8px 12px', background:'#2563eb', color:'#fff', border:'none', borderRadius:6}}>{loading ? 'Signing in...' : 'Sign in'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
