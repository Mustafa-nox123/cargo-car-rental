import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import './vehicles.css'

export default function Vehicles(){
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [branches, setBranches] = useState([])
  const [filters, setFilters] = useState({ vehicle_type_id:'', branch_id:'', start_date:'', end_date:'' })
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(()=>{
    // load vehicle types and branches for filter selects if available
    api.get('/vehicle-types').then(r=>setVehicleTypes(r.data)).catch(()=>{})
    api.get('/branches').then(r=>setBranches(r.data)).catch(()=>{})
  }, [])

  const buildQuery = () => {
    const params = new URLSearchParams()
    if(filters.vehicle_type_id) params.set('vehicle_type_id', filters.vehicle_type_id)
    if(filters.branch_id) params.set('branch_id', filters.branch_id)
    if(filters.start_date) params.set('start_date', filters.start_date)
    if(filters.end_date) params.set('end_date', filters.end_date)
    const s = params.toString()
    return s ? `?${s}` : ''
  }

  const fetchVehicles = async () => {
    setError('')
    setLoading(true)
    setVehicles([])
    try{
      const q = buildQuery()
      const res = await api.get(`/vehicles/available${q}`)
      setVehicles(res.data || [])
    }catch(err){
      setError(err?.response?.data?.error || err?.message || 'Failed to fetch vehicles')
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{ // initial fetch
    fetchVehicles()
  }, [])

  const onChange = e => {
    const { name, value } = e.target
    setFilters(f => ({ ...f, [name]: value }))
  }

  const onSubmit = e => {
    e.preventDefault()
    // basic validation: dates
    if(filters.start_date && filters.end_date && filters.start_date > filters.end_date){
      setError('Start date must be before or equal to end date.')
      return
    }
    fetchVehicles()
  }

  const reset = () => { setFilters({ vehicle_type_id:'', branch_id:'', start_date:'', end_date:'' }); setVehicles([]); setError('') }

  return (
    <div className="vehicles-page">
      <h1>Available Vehicles</h1>

      <form className="filters" onSubmit={onSubmit}>
        <div className="field">
          <label>Vehicle type</label>
          <select name="vehicle_type_id" value={filters.vehicle_type_id} onChange={onChange}>
            <option value="">All types</option>
            {vehicleTypes && vehicleTypes.map(t => (
              <option key={t.vehicle_type_id} value={t.vehicle_type_id}>{t.type_name} ({t.daily_rate})</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Branch</label>
          <select name="branch_id" value={filters.branch_id} onChange={onChange}>
            <option value="">All branches</option>
            {branches && branches.map(b => (
              <option key={b.branch_id} value={b.branch_id}>{b.branch_name} — {b.city}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Start date</label>
          <input name="start_date" type="date" value={filters.start_date} onChange={onChange} />
        </div>

        <div className="field">
          <label>End date</label>
          <input name="end_date" type="date" value={filters.end_date} onChange={onChange} />
        </div>

        <div className="actions">
          <button type="submit" disabled={loading}>Search</button>
          <button type="button" onClick={reset}>Reset</button>
        </div>
      </form>

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Loading…</div>}

      <div className="results">
        {(!vehicles || vehicles.length === 0) && !loading && <div className="empty">No vehicles found.</div>}
        {vehicles.map(v => (
          <div className="card" key={v.vehicle_id}>
            <div className="card-title">{v.make} {v.model} — {v.registration_no}</div>
            <div className="card-body">
              <div>Type: {v.type_name}</div>
              <div>Daily rate: {v.daily_rate}</div>
              <div>Branch: {v.branch_name} ({v.city})</div>
              <div>Status: {v.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
