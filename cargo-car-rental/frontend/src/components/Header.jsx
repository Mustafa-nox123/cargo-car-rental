import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Header(){
  const [loggedIn, setLoggedIn] = useState(false)
  const [userName, setUserName] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()

  const readUser = () => {
    // prefer explicit user object in localStorage
    const u = localStorage.getItem('user')
    if(u){
      try { const parsed = JSON.parse(u); if(parsed && (parsed.name || parsed.fullname || parsed.email)) return parsed }
      catch(e){}
    }
    // fallback: try to decode user JWT and read a name/email claim
    const t = localStorage.getItem('token')
    if(t){
      try{
        const parts = t.split('.')
        if(parts.length >= 2){
          const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
          const json = decodeURIComponent(atob(payload).split('').map(c=> '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
          const obj = JSON.parse(json)
          return obj
        }
      }catch(e){}
    }
    // if no user token, try admin token
    const at = localStorage.getItem('admin_token')
    if(at){
      try{
        const parts = at.split('.')
        if(parts.length >= 2){
          const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
          const json = decodeURIComponent(atob(payload).split('').map(c=> '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
          const obj = JSON.parse(json)
          return obj
        }
      }catch(e){}
    }
    return null
  }

  const dropdownRef = useRef(null)
  const [open, setOpen] = useState(false)

  useEffect(()=>{
    const update = () => {
      const hasUserToken = !!localStorage.getItem('token')
      const hasAdminToken = !!localStorage.getItem('admin_token')
      const anyLogged = hasUserToken || hasAdminToken
      setLoggedIn(anyLogged)
      setIsAdmin(!!hasAdminToken)
      const u = readUser()
      setUserName(u ? (u.name || u.fullname || u.email) : null)
    }
    update()

    const handler = () => update()
    const onDocClick = e => {
      if(dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('authChanged', handler)
    window.addEventListener('adminAuthChanged', handler)
    window.addEventListener('storage', handler)
    document.addEventListener('click', onDocClick)
    return ()=>{
      window.removeEventListener('authChanged', handler)
      window.removeEventListener('adminAuthChanged', handler)
      window.removeEventListener('storage', handler)
      document.removeEventListener('click', onDocClick)
    }
  }, [])

  const logout = ()=>{
    const isAdmin = !!localStorage.getItem('admin_token')
    if(isAdmin){
      localStorage.removeItem('admin_token')
      setLoggedIn(false)
      setUserName(null)
      try { window.dispatchEvent(new Event('adminAuthChanged')) } catch(e){}
      navigate('/admin/login')
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setLoggedIn(false)
      setUserName(null)
      try { window.dispatchEvent(new Event('authChanged')) } catch(e){}
      navigate('/login')
    }
  }

  const initials = (name) => {
    if(!name) return ''
    const parts = name.split(' ').filter(Boolean)
    if(parts.length === 1) return parts[0].slice(0,2).toUpperCase()
    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
  }

  return (
    <header style={{background:'#fff', borderBottom:'1px solid #e6e6e6'}}>
      <div style={{maxWidth:1024, margin:'0 auto', padding:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <Link to="/" style={{fontWeight:700, color:'#111827'}}>CarGo</Link>
        <nav style={{display:'flex', gap:12, alignItems:'center'}}>
          <Link to="/branches" style={{fontSize:14, color:'#374151'}}>Branches</Link>
          <Link to="/vehicles" style={{fontSize:14, color:'#374151'}}>Vehicles</Link>
          {loggedIn ? (
            <div style={{display:'flex', gap:12, alignItems:'center'}} ref={dropdownRef} className="dropdown">
              {/* Dashboard link switches for admin vs normal user */}
              {isAdmin ? (
                <>
                  <Link to="/admin/dashboard" style={{fontSize:14, color:'#374151'}}>Admin</Link>
                  <span style={{marginLeft:6, background:'#f97316', color:'#fff', padding:'2px 6px', borderRadius:6, fontSize:12}}>ADMIN</span>
                </>
              ) : (
                <Link to="/dashboard" style={{fontSize:14, color:'#374151'}}>Dashboard</Link>
              )}
              {/* greet text hidden on small screens, avatar + dropdown */}
              {userName && <span style={{fontSize:14, color:'#374151', marginLeft:6, display:'none'}} className="hide-sm">Hello, {userName}</span>}
              <button className="avatar-btn" onClick={() => setOpen(o => !o)} aria-haspopup="true" aria-expanded={open} title={userName || 'Profile'}>
                {initials(userName)}
              </button>
              {open && (
                <div className="dropdown-menu">
                  {isAdmin ? (
                    <>
                      <Link to="/admin/dashboard">Admin Dashboard</Link>
                      <Link to="/dashboard">Profile</Link>
                    </>
                  ) : (
                    <Link to="/dashboard">Profile</Link>
                  )}
                  <button onClick={logout}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" style={{fontSize:14, color:'#374151'}}>Login</Link>
              <Link to="/register" style={{fontSize:14, color:'#2563eb'}}>Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
