import React, { useEffect, useState } from 'react'
import adminApi from '../lib/adminApi'
import api from '../lib/api'

export default function AdminVehicles(){
  const [vehicles,setVehicles] = useState([])
  const [types,setTypes] = useState([])
  const [branches,setBranches] = useState([])
  const [loading,setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editing,setEditing] = useState(null)
  const [form,setForm] = useState({ registration_no:'', make:'', model:'', year_made:'', vehicle_type_id:'', branch_id:'', status:'AVAILABLE', image_url: null })
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try{
      const [vRes, tRes, bRes] = await Promise.all([
        adminApi.get('/api/vehicles/available'),
        api.get('/vehicle-types'),
        api.get('/branches')
      ])
      
      console.log('Vehicles response:', vRes.data)
      console.log('Types response:', tRes.data)
      console.log('Branches response:', bRes.data)
      
      setVehicles(vRes.data || [])
      setTypes(tRes.data || [])
      setBranches(bRes.data || [])
      
      if ((!tRes.data || tRes.data.length === 0) && (!bRes.data || bRes.data.length === 0)) {
        setError('No vehicle types or branches found. Please add them first in the Vehicle Types and Branches pages.')
      } else if (!tRes.data || tRes.data.length === 0) {
        setError('No vehicle types found. Please add vehicle types first.')
      } else if (!bRes.data || bRes.data.length === 0) {
        setError('No branches found. Please add branches first.')
      }
    }catch(e){ 
      console.error('Load error:', e)
      setError(`Failed to load data: ${e?.response?.data?.error || e?.message || 'Unknown error'}`)
    } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null
    setSelectedFile(file)
    
    // Create preview
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }

  const uploadImage = async (vehicleId) => {
    if (!selectedFile) return null
    try {
      const fd = new FormData()
      fd.append('image', selectedFile)
      const res = await adminApi.post(`/api/vehicles/${vehicleId}/images`, fd, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      })
      return res.data?.url || null
    } catch(e) {
      console.error('Upload error:', e)
      return null
    }
  }

  const startEdit = (v) => { 
    const vehicleType = types.find(t => t.type_name === v.type_name)
    const branch = branches.find(b => b.branch_name === v.branch_name)
    
    setEditing(v.vehicle_id)
    setForm({ 
      registration_no: v.registration_no, 
      make: v.make, 
      model: v.model, 
      year_made: v.year_made, 
      vehicle_type_id: vehicleType?.vehicle_type_id || v.vehicle_type_id || '', 
      branch_id: branch?.branch_id || v.branch_id || '', 
      status: v.status, 
      image_url: v.image_url || null 
    })
    setSelectedFile(null)
    setImagePreview(null)
  }
  
  const reset = () => { 
    setEditing(null)
    setForm({ registration_no:'', make:'', model:'', year_made:'', vehicle_type_id:'', branch_id:'', status:'AVAILABLE', image_url: null })
    setSelectedFile(null)
    setImagePreview(null)
  }

  const save = async () => {
    if (!form.vehicle_type_id || !form.branch_id) {
      setError('Please select both vehicle type and branch')
      return
    }
    try{
      setError('')
      if(editing){
        await adminApi.put(`/api/vehicles/${editing}`, form)
        // Upload image if selected
        if (selectedFile) {
          await uploadImage(editing)
        }
      } else {
        // Create vehicle first
        const res = await adminApi.post('/api/vehicles', form)
        const newVehicleId = res.data?.vehicleId
        
        // Then upload image if selected
        if (selectedFile && newVehicleId) {
          await uploadImage(newVehicleId)
        }
      }
      await load()
      reset()
    }catch(e){ 
      console.error('Save error:', e)
      setError(`Failed to save: ${e?.response?.data?.error || e?.message || 'Unknown error'}`)
    }
  }

  const remove = async (id) => {
    if(!confirm('Delete this vehicle?')) return
    try{ 
      await adminApi.delete(`/api/vehicles/${id}`)
      await load() 
    }catch(e){ 
      console.error('Delete error:', e)
      setError(`Failed to delete: ${e?.response?.data?.error || e?.message || 'Unknown error'}`)
    }
  }

  const deleteImage = async () => {
    if (!confirm('Delete image?')) return
    try {
      const fname = form.image_url.split('/').pop()
      await adminApi.delete(`/api/vehicles/${editing}/images/${fname}`)
      setForm(prev => ({...prev, image_url: null}))
      await load()
    } catch(e) {
      console.error(e)
      alert('Delete failed')
    }
  }

  return (
    <div style={{maxWidth:1100, margin:'0 auto', padding:24}}>
      <h1 style={{fontSize:20, fontWeight:600}}>Vehicles</h1>
      
      {error && (
        <div style={{background:'#fef2f2', border:'1px solid #fecaca', color:'#991b1b', padding:'12px 16px', borderRadius:8, marginTop:12, marginBottom:12}}>
          {error}
        </div>
      )}
      
      <div style={{display:'flex', gap:16, marginTop:12}}>
        <div style={{flex:1}}>
          <div style={{background:'#fff', padding:12, borderRadius:8, border:'1px solid #e6e6e6'}}>
            <h3 style={{marginBottom:8}}>{editing ? 'Edit Vehicle' : 'Create Vehicle'}</h3>
            <input placeholder="Reg. No" value={form.registration_no} onChange={e=>setForm({...form, registration_no:e.target.value})} style={{width:'100%', padding:8, marginBottom:8, border:'1px solid #d1d5db', borderRadius:4}} />
            <input placeholder="Make" value={form.make} onChange={e=>setForm({...form, make:e.target.value})} style={{width:'100%', padding:8, marginBottom:8, border:'1px solid #d1d5db', borderRadius:4}} />
            <input placeholder="Model" value={form.model} onChange={e=>setForm({...form, model:e.target.value})} style={{width:'100%', padding:8, marginBottom:8, border:'1px solid #d1d5db', borderRadius:4}} />
            <input placeholder="Year" value={form.year_made} onChange={e=>setForm({...form, year_made:e.target.value})} style={{width:'100%', padding:8, marginBottom:8, border:'1px solid #d1d5db', borderRadius:4}} />
            
            <div style={{marginBottom:8}}>
              <label style={{display:'block', fontSize:12, color:'#6b7280', marginBottom:4}}>Vehicle Type *</label>
              <select value={form.vehicle_type_id} onChange={e=>setForm({...form, vehicle_type_id:e.target.value})} style={{width:'100%', padding:8, border:'1px solid #d1d5db', borderRadius:4, background: types.length === 0 ? '#fee2e2' : '#fff'}}>
                <option value="">Select type {types.length === 0 ? '(No types available!)' : `(${types.length} available)`}</option>
                {types.map(t=> <option key={t.vehicle_type_id} value={t.vehicle_type_id}>{t.type_name} - ${t.daily_rate}/day</option>)}
              </select>
            </div>
            
            <div style={{marginBottom:8}}>
              <label style={{display:'block', fontSize:12, color:'#6b7280', marginBottom:4}}>Branch *</label>
              <select value={form.branch_id} onChange={e=>setForm({...form, branch_id:e.target.value})} style={{width:'100%', padding:8, border:'1px solid #d1d5db', borderRadius:4, background: branches.length === 0 ? '#fee2e2' : '#fff'}}>
                <option value="">Select branch {branches.length === 0 ? '(No branches available!)' : `(${branches.length} available)`}</option>
                {branches.map(b=> <option key={b.branch_id} value={b.branch_id}>{b.branch_name} — {b.city}</option>)}
              </select>
            </div>
            
            <select value={form.status} onChange={e=>setForm({...form, status:e.target.value})} style={{width:'100%', padding:8, marginBottom:8, border:'1px solid #d1d5db', borderRadius:4}}>
              <option>AVAILABLE</option>
              <option>RENTED</option>
              <option>MAINTENANCE</option>
            </select>

            {/* Image Upload Section - Available for both Create and Edit */}
            <div style={{marginBottom:12, padding:12, background:'#f9fafb', borderRadius:6, border:'1px solid #e5e7eb'}}>
              <label style={{display:'block', fontSize:12, color:'#6b7280', marginBottom:8, fontWeight:500}}>Vehicle Image</label>
              
              {/* Show existing image if editing and has image */}
              {editing && form.image_url && !imagePreview && (
                <div style={{marginBottom:8}}>
                  <img src={`http://localhost:5000${form.image_url}`} alt="vehicle" style={{width:'100%', maxWidth:200, height:120, objectFit:'cover', borderRadius:6, border:'1px solid #e5e7eb'}} />
                  <button onClick={deleteImage} style={{display:'block', marginTop:6, padding:'4px 8px', background:'#dc2626', color:'#fff', border:'none', borderRadius:4, fontSize:12, cursor:'pointer'}}>Remove Image</button>
                </div>
              )}
              
              {/* Show preview of selected image */}
              {imagePreview && (
                <div style={{marginBottom:8}}>
                  <img src={imagePreview} alt="preview" style={{width:'100%', maxWidth:200, height:120, objectFit:'cover', borderRadius:6, border:'1px solid #e5e7eb'}} />
                  <div style={{fontSize:11, color:'#059669', marginTop:4}}>✓ New image selected</div>
                </div>
              )}
              
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileSelect}
                style={{fontSize:13}}
              />
              <div style={{fontSize:11, color:'#6b7280', marginTop:4}}>
                {editing ? 'Select a new image to replace the current one' : 'Image will be uploaded when you click Create'}
              </div>
            </div>

            <div style={{display:'flex', gap:8}}>
              <button onClick={save} disabled={types.length === 0 || branches.length === 0} style={{background: (types.length === 0 || branches.length === 0) ? '#9ca3af' : '#059669', color:'#fff', padding:'8px 12px', border:'none', borderRadius:6, cursor: (types.length === 0 || branches.length === 0) ? 'not-allowed' : 'pointer'}}>{editing ? 'Save' : 'Create'}</button>
              <button onClick={reset} style={{padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:6, background:'#fff'}}>Reset</button>
              <button onClick={load} style={{padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:6, background:'#fff'}}>🔄 Refresh</button>
            </div>
          </div>
        </div>

        <div style={{flex:1.5}}>
          <div style={{background:'#fff', padding:12, borderRadius:8, border:'1px solid #e6e6e6'}}>
            <h3 style={{marginBottom:8}}>Existing vehicles ({vehicles.length})</h3>
            {loading ? <div>Loading...</div> : vehicles.length === 0 ? (
              <div style={{color:'#6b7280', padding:16, textAlign:'center'}}>No vehicles yet. Create one using the form.</div>
            ) : (
              <ul style={{listStyle:'none', padding:0}}>
                {vehicles.map(v=> (
                  <li key={v.vehicle_id} style={{padding:8, borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{display:'flex', gap:10, alignItems:'center'}}>
                      {v.image_url && (
                        <img src={`http://localhost:5000${v.image_url}`} alt="" style={{width:50, height:35, objectFit:'cover', borderRadius:4, border:'1px solid #e5e7eb'}} />
                      )}
                      <div>
                        <div style={{fontWeight:600}}>{v.registration_no} — {v.make} {v.model} ({v.year_made})</div>
                        <div style={{fontSize:12, color:'#6b7280'}}>{v.type_name} • {v.branch_name} • {v.status}</div>
                      </div>
                    </div>
                    <div style={{display:'flex', gap:8}}>
                      <button onClick={()=>startEdit(v)} style={{padding:'6px 8px', border:'1px solid #d1d5db', borderRadius:4, background:'#fff'}}>Edit</button>
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
