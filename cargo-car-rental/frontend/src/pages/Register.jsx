import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function Register(){
  const [form, setForm] = useState({
    name:'', email:'', password:'', phone:'', license_no:'', license_expiry:'', address:'', national_id:''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()

  const onChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const submit = async e => {
    e.preventDefault()
    setError('')
    if(!form.name || !form.email || !form.password){
      setError('Name, email and password are required')
      return
    }

    setLoading(true)
    try{
      const payload = { ...form }
      // ensure empty strings become null for optional fields if desired
      if(!payload.license_expiry) payload.license_expiry = null

      const res = await api.post('/auth/register', payload)
      const token = res?.data?.token
      if(!token) throw new Error(res?.data?.error || 'No token returned')

  localStorage.setItem('token', token)
  if(res.data.user) localStorage.setItem('user', JSON.stringify(res.data.user))
  // notify other components (Header) about auth update
  try { window.dispatchEvent(new Event('authChanged')) } catch(e){}
  // redirect with a friendly welcome flag
  nav('/dashboard', { state: { welcome: true } })
    }catch(err){
      const msg = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Registration failed'
      setError(msg)
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem'}}>
      <div className="max-w-md" style={{width:'100%'}}>
        <div className="bg-white shadow-lg rounded" style={{overflow:'hidden'}}>
          <div className="p-4">
            <h2 className="text-2xl font-semibold mb-2">Create account</h2>
            <p className="lead mb-4">Enter your details to register an account.</p>

            {error && <div className="mb-4 text-sm text-red-600 bg-red-100 p-2 rounded">{error}</div>}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="form-label">Full name</label>
                <input name="name" value={form.name} onChange={onChange} className="w-full border px-3 py-2 rounded" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Email</label>
                  <input name="email" type="email" value={form.email} onChange={onChange} className="w-full border px-3 py-2 rounded" required />
                </div>
                <div>
                  <label className="form-label">Password</label>
                  <input name="password" type="password" value={form.password} onChange={onChange} className="w-full border px-3 py-2 rounded" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Phone</label>
                  <input name="phone" value={form.phone} onChange={onChange} className="w-full border px-3 py-2 rounded" />
                </div>
                <div>
                  <label className="form-label">License No.</label>
                  <input name="license_no" value={form.license_no} onChange={onChange} className="w-full border px-3 py-2 rounded" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">License expiry</label>
                  <input name="license_expiry" type="date" value={form.license_expiry} onChange={onChange} className="w-full border px-3 py-2 rounded" />
                </div>
                <div>
                  <label className="form-label">National ID</label>
                  <input name="national_id" value={form.national_id} onChange={onChange} className="w-full border px-3 py-2 rounded" />
                </div>
              </div>

              <div>
                <label className="form-label">Address</label>
                <textarea name="address" value={form.address} onChange={onChange} className="w-full border px-3 py-2 rounded" rows={3} />
              </div>

              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{opacity: loading ? 0.7 : 1}}>
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
                <div className="text-sm text-gray-500">By creating an account you agree to terms.</div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
