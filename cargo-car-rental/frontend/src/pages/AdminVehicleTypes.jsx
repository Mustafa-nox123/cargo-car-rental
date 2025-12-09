import React, { useEffect, useState } from 'react'
import adminApi from '../lib/adminApi'

export default function AdminVehicleTypes(){
  const [types,setTypes] = useState([])
  const [loading,setLoading] = useState(false)
  const [editing,setEditing] = useState(null)
  const [form,setForm] = useState({ type_name:'', daily_rate:'', description:'' })

  const load = async () => {
    setLoading(true)
    try{
      const res = await adminApi.get('/api/vehicle-types')
      setTypes(res.data || [])
    }catch(e){ console.error(e) } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  const startEdit = t => { setEditing(t.vehicle_type_id); setForm({ type_name:t.type_name, daily_rate:t.daily_rate, description:t.description || '' }) }
  const reset = () => { setEditing(null); setForm({ type_name:'', daily_rate:'', description:'' }) }

  const save = async () => {
    try{
      if(editing) await adminApi.put(`/api/vehicle-types/${editing}`, form)
      else await adminApi.post('/api/vehicle-types', form)
      await load(); reset()
    }catch(e){ console.error(e) }
  }

  const remove = async (id) => { if(!confirm('Delete this type?')) return; try{ await adminApi.delete(`/api/vehicle-types/${id}`); await load() }catch(e){ console.error(e) } }

  return (
    <div style={{maxWidth:800, margin:'0 auto', padding:24}}>
      <h1 style={{fontSize:20, fontWeight:600}}>Vehicle Types</h1>
      <div style={{display:'flex', gap:16, marginTop:12}}>
        <div style={{flex:1}}>
          <div style={{background:'#fff', padding:12, borderRadius:8, border:'1px solid #e6e6e6'}}>
            <h3>{editing ? 'Edit Type' : 'Create Type'}</h3>
            <input placeholder="Type name" value={form.type_name} onChange={e=>setForm({...form, type_name:e.target.value})} style={{width:'100%', padding:8, marginBottom:8}} />
            <input placeholder="Daily rate" type="number" value={form.daily_rate} onChange={e=>setForm({...form, daily_rate:e.target.value})} style={{width:'100%', padding:8, marginBottom:8}} />
            <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} style={{width:'100%', padding:8, marginBottom:8}} />
            <div style={{display:'flex', gap:8}}>
              <button onClick={save} style={{background:'#059669', color:'#fff', padding:'8px 12px', border:'none', borderRadius:6}}>{editing ? 'Save' : 'Create'}</button>
              <button onClick={reset} style={{padding:'8px 12px'}}>Reset</button>
            </div>
          </div>
        </div>

        <div style={{flex:1.2}}>
          <div style={{background:'#fff', padding:12, borderRadius:8, border:'1px solid #e6e6e6'}}>
            <h3>Existing types</h3>
            {loading ? <div>Loading...</div> : (
              <ul style={{listStyle:'none', padding:0}}>
                {types.map(t=> (
                  <li key={t.vehicle_type_id} style={{padding:8, borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontWeight:600}}>{t.type_name} — ${t.daily_rate}</div>
                      <div style={{fontSize:12, color:'#6b7280'}}>{t.description}</div>
                    </div>
                    <div style={{display:'flex', gap:8}}>
                      <button onClick={()=>startEdit(t)} style={{padding:'6px 8px'}}>Edit</button>
                      <button onClick={()=>remove(t.vehicle_type_id)} style={{padding:'6px 8px', background:'#dc2626', color:'#fff', border:'none', borderRadius:6}}>Delete</button>
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
