import React, { useEffect, useState } from 'react'
import adminApi from '../lib/adminApi'

export default function AdminVehicles(){
  const [vehicles,setVehicles] = useState([])
  const [types,setTypes] = useState([])
  const [branches,setBranches] = useState([])
  const [loading,setLoading] = useState(false)
  const [editing,setEditing] = useState(null)
  const [form,setForm] = useState({ registration_no:'', make:'', model:'', year_made:'', vehicle_type_id:'', branch_id:'', status:'AVAILABLE', image_url: null })
  const [selectedFile, setSelectedFile] = useState(null)

  const load = async () => {
    setLoading(true)
    try{
      const [vRes, tRes, bRes] = await Promise.all([
        adminApi.get('/api/vehicles/available'),
        adminApi.get('/api/vehicle-types'),
        adminApi.get('/api/branches')
      ])
      setVehicles(vRes.data || [])
      setTypes(tRes.data || [])
      setBranches(bRes.data || [])
    }catch(e){ console.error(e) } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  const startEdit = (v) => { setEditing(v.vehicle_id); setForm({ registration_no:v.registration_no, make:v.make, model:v.model, year_made:v.year_made, vehicle_type_id:v.vehicle_type_id || '', branch_id:v.branch_id || '', status:v.status, image_url: v.image_url || null }) }
  const reset = () => { setEditing(null); setForm({ registration_no:'', make:'', model:'', year_made:'', vehicle_type_id:'', branch_id:'', status:'AVAILABLE' }) }

  const save = async () => {
    try{
      if(editing){
        await adminApi.put(`/api/vehicles/${editing}`, form)
      } else {
        await adminApi.post('/api/vehicles', form)
      }
      await load(); reset()
    }catch(e){ console.error(e) }
  }

  const remove = async (id) => {
    if(!confirm('Delete this vehicle?')) return
    try{ await adminApi.delete(`/api/vehicles/${id}`); await load() }catch(e){ console.error(e) }
  }

  return (
    <div style={{maxWidth:1100, margin:'0 auto', padding:24}}>
      <h1 style={{fontSize:20, fontWeight:600}}>Vehicles</h1>
      <div style={{display:'flex', gap:16, marginTop:12}}>
        <div style={{flex:1}}>
          <div style={{background:'#fff', padding:12, borderRadius:8, border:'1px solid #e6e6e6'}}>
            <h3 style={{marginBottom:8}}>{editing ? 'Edit Vehicle' : 'Create Vehicle'}</h3>
            <input placeholder="Reg. No" value={form.registration_no} onChange={e=>setForm({...form, registration_no:e.target.value})} style={{width:'100%', padding:8, marginBottom:8}} />
            <input placeholder="Make" value={form.make} onChange={e=>setForm({...form, make:e.target.value})} style={{width:'100%', padding:8, marginBottom:8}} />
            <input placeholder="Model" value={form.model} onChange={e=>setForm({...form, model:e.target.value})} style={{width:'100%', padding:8, marginBottom:8}} />
            <input placeholder="Year" value={form.year_made} onChange={e=>setForm({...form, year_made:e.target.value})} style={{width:'100%', padding:8, marginBottom:8}} />
            <select value={form.vehicle_type_id} onChange={e=>setForm({...form, vehicle_type_id:e.target.value})} style={{width:'100%', padding:8, marginBottom:8}}>
              <option value="">Select type</option>
              {types.map(t=> <option key={t.vehicle_type_id} value={t.vehicle_type_id}>{t.type_name}</option>)}
            </select>
            <select value={form.branch_id} onChange={e=>setForm({...form, branch_id:e.target.value})} style={{width:'100%', padding:8, marginBottom:8}}>
              <option value="">Select branch</option>
              {branches.map(b=> <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>)}
            </select>
            <select value={form.status} onChange={e=>setForm({...form, status:e.target.value})} style={{width:'100%', padding:8, marginBottom:8}}>
              <option>AVAILABLE</option>
              <option>RENTED</option>
              <option>MAINTENANCE</option>
            </select>
            <div style={{display:'flex', gap:8}}>
              <button onClick={save} style={{background:'#059669', color:'#fff', padding:'8px 12px', border:'none', borderRadius:6}}>{editing ? 'Save' : 'Create'}</button>
              <button onClick={reset} style={{padding:'8px 12px'}}>Reset</button>
            </div>

            {editing && (
              <div style={{marginTop:12}}>
                <label style={{display:'block', marginBottom:6}}>Vehicle image</label>
                {form.image_url && (
                  <div style={{marginBottom:8}}>
                    <img src={form.image_url} alt="vehicle" style={{width:180, height:120, objectFit:'cover', borderRadius:6, border:'1px solid #e5e7eb'}} />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={e=>setSelectedFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
                <div style={{marginTop:8, display:'flex', gap:8}}>
                  <button onClick={async ()=>{
                    if(!editing){ alert('Please save the vehicle first before uploading an image'); return }
                    if(!selectedFile){ alert('Select a file first'); return }
                    try{
                      const fd = new FormData(); fd.append('image', selectedFile)
                      const res = await adminApi.post(`/api/vehicles/${editing}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                      const url = res.data?.url
                      if(url) setForm(prev=>({...prev, image_url: url}))
                      setSelectedFile(null)
                      await load()
                    }catch(e){ console.error(e); alert('Upload failed') }
                  }} style={{padding:'8px 12px', background:'#2563eb', color:'#fff', border:'none', borderRadius:6}}>Upload</button>
                  {form.image_url && (
                    <button onClick={async ()=>{
                      if(!confirm('Delete image?')) return
                      try{
                        const fname = form.image_url.split('/').pop()
                        await adminApi.delete(`/api/vehicles/${editing}/images/${fname}`)
                        setForm(prev=>({...prev, image_url: null}))
                        await load()
                      }catch(e){ console.error(e); alert('Delete failed') }
                    }} style={{padding:'8px 12px', background:'#dc2626', color:'#fff', border:'none', borderRadius:6}}>Delete image</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{flex:1.5}}>
          <div style={{background:'#fff', padding:12, borderRadius:8, border:'1px solid #e6e6e6'}}>
            <h3 style={{marginBottom:8}}>Existing vehicles</h3>
            {loading ? <div>Loading...</div> : (
              <ul style={{listStyle:'none', padding:0}}>
                {vehicles.map(v=> (
                  <li key={v.vehicle_id} style={{padding:8, borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontWeight:600}}>{v.registration_no} — {v.make} {v.model} ({v.year_made})</div>
                      <div style={{fontSize:12, color:'#6b7280'}}>{v.type_name} • {v.branch_name} • {v.status}</div>
                    </div>
                    <div style={{display:'flex', gap:8}}>
                      <button onClick={()=>startEdit(v)} style={{padding:'6px 8px'}}>Edit</button>
                      <button onClick={()=>remove(v.vehicle_id)} style={{padding:'6px 8px', background:'#dc2626', color:'#fff', border:'none', borderRadius:6}}>Delete</button>
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
