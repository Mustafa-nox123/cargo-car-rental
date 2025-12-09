import React from 'react'
import { useAdminAuth } from '../context/AdminAuthContext'

export default function AdminDashboard(){
  const { adminToken, signOut } = useAdminAuth()

  return (
    <div style={{maxWidth:1024, margin:'0 auto', padding:24}}>
      <h1 style={{fontSize:22, fontWeight:600}}>Admin Dashboard</h1>
      <div style={{display:'flex', gap:16, marginTop:12}}>
        <div style={{flex:1}}>
          <div style={{background:'#fff', border:'1px solid #e6e6e6', padding:12, borderRadius:8}}>
            <h2 style={{fontSize:16, fontWeight:500}}>Session</h2>
            <div style={{marginTop:8, fontSize:13, color:'#374151'}}>Token: <div style={{wordBreak:'break-all', fontSize:12, color:'#6b7280', marginTop:6}}>{adminToken}</div></div>
            <div style={{marginTop:12}}>
              <button onClick={signOut} style={{padding:'8px 12px', background:'#dc2626', color:'#fff', border:'none', borderRadius:6}}>Logout</button>
            </div>
          </div>
        </div>

        <div style={{flex:2}}>
          <div style={{background:'#fff', border:'1px solid #e6e6e6', padding:12, borderRadius:8}}>
            <h2 style={{fontSize:16, fontWeight:500}}>Management</h2>
            <div style={{display:'flex', gap:8, marginTop:8}}>
              <a href="/admin/vehicles" style={{padding:'8px 12px', background:'#2563eb', color:'#fff', textDecoration:'none', borderRadius:6}}>Manage Vehicles</a>
              <a href="/admin/branches" style={{padding:'8px 12px', background:'#10b981', color:'#fff', textDecoration:'none', borderRadius:6}}>Manage Branches</a>
              <a href="/admin/vehicle-types" style={{padding:'8px 12px', background:'#f59e0b', color:'#fff', textDecoration:'none', borderRadius:6}}>Manage Vehicle Types</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
