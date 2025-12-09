import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Dashboard(){
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const location = useLocation()
  const nav = useNavigate()

  useEffect(()=>{
    const t = localStorage.getItem('token')
    const u = localStorage.getItem('user')
    if(!t){
      nav('/login')
      return
    }
    setToken(t)
    try{
      setUser(u ? JSON.parse(u) : null)
    }catch(e){
      setUser(null)
    }
  }, [])

  const logout = ()=>{
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    nav('/login')
  }

  return (
    <div style={{maxWidth:1024, margin:'0 auto', padding:'2rem'}}>
      <h1 style={{fontSize:22, fontWeight:600, marginBottom:12}}>Dashboard</h1>
      {location?.state?.welcome && (
        <div className="welcome-banner">
          <div className="welcome-avatar">{user && user.name ? (user.name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase()) : 'US'}</div>
          <div className="welcome-content">
            <div className="welcome-title">Welcome{user && user.name ? `, ${user.name}` : ''}!</div>
            <div className="welcome-sub">Your account was created successfully. We've signed you in and redirected you here.</div>
          </div>
        </div>
      )}
      <div style={{display:'grid', gridTemplateColumns:'1fr', gap:16}}>
        <div style={{background:'#fff', border:'1px solid #e6e6e6', padding:16, borderRadius:8}}>
          <h2 style={{fontSize:16, fontWeight:500, marginBottom:8}}>Profile</h2>
          {user ? (
            <div style={{fontSize:14, color:'#374151'}}>
              <div><strong>Name:</strong> {user.name}</div>
              <div><strong>Email:</strong> {user.email}</div>
            </div>
          ) : (
            <div style={{fontSize:14, color:'#6b7280'}}>No user information available.</div>
          )}
        </div>

        <div style={{background:'#fff', border:'1px solid #e6e6e6', padding:16, borderRadius:8}}>
          <h2 style={{fontSize:16, fontWeight:500, marginBottom:8}}>Session</h2>
          <div style={{fontSize:14, color:'#374151'}}>
            <div><strong>Token:</strong></div>
            <div style={{wordBreak:'break-all', fontSize:12, color:'#6b7280', marginTop:8}}>{token}</div>
          </div>
          <div style={{marginTop:12}}>
            <button onClick={logout} style={{padding:'8px 12px', background:'#dc2626', color:'white', borderRadius:6, border:'none'}}>Logout</button>
          </div>
        </div>
      </div>
    </div>
  )
}
