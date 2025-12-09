import React, { createContext, useContext, useEffect, useState } from 'react'

const AdminAuthContext = createContext(null)

export function useAdminAuth(){
  return useContext(AdminAuthContext)
}

export function AdminAuthProvider({ children }){
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('admin_token'))
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    const onStorage = (e) => {
      if(e.key === 'admin_token') setAdminToken(localStorage.getItem('admin_token'))
    }
    window.addEventListener('storage', onStorage)
    return ()=> window.removeEventListener('storage', onStorage)
  }, [])

  const signIn = (token) => {
    localStorage.setItem('admin_token', token)
    setAdminToken(token)
    window.dispatchEvent(new Event('adminAuthChanged'))
  }

  const signOut = ()=>{
    localStorage.removeItem('admin_token')
    setAdminToken(null)
    window.dispatchEvent(new Event('adminAuthChanged'))
  }

  const value = { adminToken, loading, setLoading, signIn, signOut }
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export default AdminAuthContext
