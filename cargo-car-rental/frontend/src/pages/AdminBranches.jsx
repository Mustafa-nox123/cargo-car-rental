import React, { useEffect, useState } from 'react'
import adminApi from '../lib/adminApi'

export default function AdminBranches(){
  const [branches,setBranches] = useState([])
  const [loading,setLoading] = useState(false)
  const [editing,setEditing] = useState(null)
  const [form,setForm] = useState({ branch_name:'', city:'', address_line:'', phone_no:'' })

  const load = async () => {
    setLoading(true)
    try{
      const res = await adminApi.get('/api/branches')
      setBranches(res.data || [])
    }catch(e){
      console.error(e)
    }finally{ setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  const startEdit = (b) => { setEditing(b.branch_id); setForm({ branch_name:b.branch_name, city:b.city, address_line:b.address_line, phone_no:b.phone_no }) }
  const reset = () => { setEditing(null); setForm({ branch_name:'', city:'', address_line:'', phone_no:'' }) }

  const save = async () => {
    try{
      if(editing){
        await adminApi.put(`/api/branches/${editing}`, form)
      } else {
        await adminApi.post('/api/branches', form)
      }
      await load(); reset()
    }catch(e){ console.error(e) }
  }

  const remove = async (id) => {
    if(!confirm('Delete this branch?')) return
    try{ await adminApi.delete(`/api/branches/${id}`); await load() }catch(e){ console.error(e) }
  }

  return (
    <div style={{maxWidth:1000, margin:'0 auto', padding:24}}>
      <h1 style={{fontSize:20, fontWeight:600}}>Branches</h1>
      <div style={{display:'flex', gap:16, marginTop:12}}>
        <div style={{flex:1}}>
          <div style={{background:'#fff', padding:12, borderRadius:8, border:'1px solid #e6e6e6'}}>
            <h3 style={{marginBottom:8}}>{editing ? 'Edit Branch' : 'Create Branch'}</h3>
            <input placeholder="Branch name" value={form.branch_name} onChange={e=>setForm({...form, branch_name:e.target.value})} style={{width:'100%', padding:8, marginBottom:8}} />
            <input placeholder="City" value={form.city} onChange={e=>setForm({...form, city:e.target.value})} style={{width:'100%', padding:8, marginBottom:8}} />
            <input placeholder="Address" value={form.address_line} onChange={e=>setForm({...form, address_line:e.target.value})} style={{width:'100%', padding:8, marginBottom:8}} />
            <input placeholder="Phone" value={form.phone_no} onChange={e=>setForm({...form, phone_no:e.target.value})} style={{width:'100%', padding:8, marginBottom:8}} />
            <div style={{display:'flex', gap:8}}>
              <button onClick={save} style={{background:'#059669', color:'#fff', padding:'8px 12px', border:'none', borderRadius:6}}>{editing ? 'Save' : 'Create'}</button>
              <button onClick={reset} style={{padding:'8px 12px'}}>Reset</button>
            </div>
          </div>
        </div>

        <div style={{flex:1}}>
          <div style={{background:'#fff', padding:12, borderRadius:8, border:'1px solid #e6e6e6'}}>
            <h3 style={{marginBottom:8}}>Existing branches</h3>
            {loading ? <div>Loading...</div> : (
              <ul style={{listStyle:'none', padding:0}}>
                {branches.map(b=> (
                  <li key={b.branch_id} style={{padding:8, borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontWeight:600}}>{b.branch_name} — {b.city}</div>
                      <div style={{fontSize:12, color:'#6b7280'}}>{b.address_line} • {b.phone_no}</div>
                    </div>
                    <div style={{display:'flex', gap:8}}>
                      <button onClick={()=>startEdit(b)} style={{padding:'6px 8px'}}>Edit</button>
                      <button onClick={()=>remove(b.branch_id)} style={{padding:'6px 8px', background:'#dc2626', color:'#fff', border:'none', borderRadius:6}}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
