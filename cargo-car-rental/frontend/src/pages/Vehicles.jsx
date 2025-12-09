import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import './vehicles.css'

export default function Vehicles(){
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [branches, setBranches] = useState([])
  const [filters, setFilters] = useState({ vehicle_type_id:'', branch_id:'', start_date:'', end_date:'' })
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const navigate = useNavigate()

  useEffect(()=>{
    // Check if user is logged in
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
    
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
      console.log('Vehicles data:', res.data) // Debug log
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

  const openVehicleModal = (vehicle) => {
    setSelectedVehicle(vehicle)
  }

  const closeModal = () => {
    setSelectedVehicle(null)
  }

  const handleReserve = () => {
    if(!isLoggedIn) {
      navigate('/login')
      return
    }
    // Navigate to reservation page with vehicle data
    navigate('/reservation', { 
      state: { 
        vehicle: selectedVehicle,
        branches: branches
      } 
    })
  }

  // Get full image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null
    // If it already starts with http, return as is
    if (imageUrl.startsWith('http')) return imageUrl
    // Otherwise prepend the server URL
    return `http://localhost:5000${imageUrl}`
  }

  return (
    <div className="vehicles-page">
      <h1>Available Vehicles</h1>

      <form className="filters" onSubmit={onSubmit}>
        <div className="field">
          <label>Vehicle type</label>
          <select name="vehicle_type_id" value={filters.vehicle_type_id} onChange={onChange}>
            <option value="">All types</option>
            {vehicleTypes && vehicleTypes.map(t => (
              <option key={t.vehicle_type_id} value={t.vehicle_type_id}>{t.type_name} (${t.daily_rate}/day)</option>
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
          <div className="card vehicle-card" key={v.vehicle_id} onClick={() => openVehicleModal(v)}>
            <div className="card-image">
              {v.image_url ? (
                <img src={getImageUrl(v.image_url)} alt={`${v.make} ${v.model}`} onError={(e) => { e.target.style.display = 'none' }} />
              ) : (
                <div className="no-image">
                  <span>🚗</span>
                  <span>No Image</span>
                </div>
              )}
            </div>
            <div className="card-title">{v.make} {v.model}</div>
            <div className="card-subtitle">{v.registration_no}</div>
            <div className="card-body">
              <div><span className="label">Type:</span> {v.type_name}</div>
              <div><span className="label">Daily rate:</span> <span className="price">${v.daily_rate}</span></div>
              <div><span className="label">Branch:</span> {v.branch_name} ({v.city})</div>
              <div className="status-badge available">{v.status}</div>
            </div>
            <div className="card-footer">
              <span className="view-details">Click to view details →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            
            <div className="modal-header">
              <div className="modal-image">
                {selectedVehicle.image_url ? (
                  <img src={getImageUrl(selectedVehicle.image_url)} alt={`${selectedVehicle.make} ${selectedVehicle.model}`} />
                ) : (
                  <div className="no-image">
                    <span>🚗</span>
                    <span>No Image</span>
                  </div>
                )}
              </div>
              <h2>{selectedVehicle.make} {selectedVehicle.model}</h2>
              <p className="modal-reg">{selectedVehicle.registration_no}</p>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Vehicle Type</span>
                  <span className="detail-value">{selectedVehicle.type_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Year</span>
                  <span className="detail-value">{selectedVehicle.year_made || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Daily Rate</span>
                  <span className="detail-value price-large">${selectedVehicle.daily_rate}/day</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">
                    <span className="status-badge available">{selectedVehicle.status}</span>
                  </span>
                </div>
                <div className="detail-item full-width">
                  <span className="detail-label">Location</span>
                  <span className="detail-value">{selectedVehicle.branch_name}, {selectedVehicle.city}</span>
                </div>
                {selectedVehicle.type_description && (
                  <div className="detail-item full-width">
                    <span className="detail-label">Description</span>
                    <span className="detail-value">{selectedVehicle.type_description}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Close</button>
              <button className="btn-primary" onClick={handleReserve}>
                {isLoggedIn ? 'Reserve This Vehicle' : 'Login to Reserve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
