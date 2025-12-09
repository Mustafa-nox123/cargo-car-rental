import React, { useEffect, useState } from 'react'
import adminApi from '../lib/adminApi'

export default function AdminReservations(){
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('ALL')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminApi.get('/api/admin/reservations')
      console.log('Reservations response:', res.data)
      setReservations(res.data || [])
    } catch(e) {
      console.error('Load error:', e)
      setError(`Failed to load reservations: ${e?.response?.data?.error || e?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (reservationId, newStatus) => {
    if (!confirm(`Change status to ${newStatus}?`)) return
    try {
      await adminApi.put(`/api/admin/reservations/${reservationId}`, { status: newStatus })
      await load()
    } catch(e) {
      console.error('Update error:', e)
      setError(`Failed to update: ${e?.response?.data?.error || e?.message || 'Unknown error'}`)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'BOOKED': return { bg: '#dbeafe', color: '#1e40af' }
      case 'CONVERTED': return { bg: '#d1fae5', color: '#065f46' }
      case 'CANCELLED': return { bg: '#fee2e2', color: '#991b1b' }
      case 'COMPLETED': return { bg: '#e0e7ff', color: '#3730a3' }
      default: return { bg: '#f3f4f6', color: '#374151' }
    }
  }

  const filteredReservations = filter === 'ALL' 
    ? reservations 
    : reservations.filter(r => r.status === filter)

  const stats = {
    total: reservations.length,
    booked: reservations.filter(r => r.status === 'BOOKED').length,
    converted: reservations.filter(r => r.status === 'CONVERTED').length,
    cancelled: reservations.filter(r => r.status === 'CANCELLED').length,
  }

  return (
    <div style={{maxWidth:1200, margin:'0 auto', padding:24}}>
      <h1 style={{fontSize:20, fontWeight:600, marginBottom:16}}>All Reservations</h1>

      {error && (
        <div style={{background:'#fef2f2', border:'1px solid #fecaca', color:'#991b1b', padding:'12px 16px', borderRadius:8, marginBottom:12}}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div style={{display:'flex', gap:12, marginBottom:16, flexWrap:'wrap'}}>
        <div style={{background:'#fff', border:'1px solid #e6e6e6', padding:'12px 20px', borderRadius:8, minWidth:120}}>
          <div style={{fontSize:24, fontWeight:700, color:'#111827'}}>{stats.total}</div>
          <div style={{fontSize:12, color:'#6b7280'}}>Total</div>
        </div>
        <div style={{background:'#dbeafe', border:'1px solid #93c5fd', padding:'12px 20px', borderRadius:8, minWidth:120}}>
          <div style={{fontSize:24, fontWeight:700, color:'#1e40af'}}>{stats.booked}</div>
          <div style={{fontSize:12, color:'#1e40af'}}>Booked</div>
        </div>
        <div style={{background:'#d1fae5', border:'1px solid #6ee7b7', padding:'12px 20px', borderRadius:8, minWidth:120}}>
          <div style={{fontSize:24, fontWeight:700, color:'#065f46'}}>{stats.converted}</div>
          <div style={{fontSize:12, color:'#065f46'}}>Converted</div>
        </div>
        <div style={{background:'#fee2e2', border:'1px solid #fecaca', padding:'12px 20px', borderRadius:8, minWidth:120}}>
          <div style={{fontSize:24, fontWeight:700, color:'#991b1b'}}>{stats.cancelled}</div>
          <div style={{fontSize:12, color:'#991b1b'}}>Cancelled</div>
        </div>
      </div>

      {/* Filter & Refresh */}
      <div style={{display:'flex', gap:8, marginBottom:16, alignItems:'center'}}>
        <select 
          value={filter} 
          onChange={e => setFilter(e.target.value)}
          style={{padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:6, fontSize:14}}
        >
          <option value="ALL">All Status</option>
          <option value="BOOKED">Booked</option>
          <option value="CONVERTED">Converted</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <button 
          onClick={load} 
          style={{padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:6, background:'#fff', cursor:'pointer'}}
        >
          🔄 Refresh
        </button>
        <span style={{fontSize:13, color:'#6b7280', marginLeft:8}}>
          Showing {filteredReservations.length} reservation(s)
        </span>
      </div>

      {/* Table */}
      <div style={{background:'#fff', border:'1px solid #e6e6e6', borderRadius:8, overflow:'hidden'}}>
        {loading ? (
          <div style={{padding:24, textAlign:'center', color:'#6b7280'}}>Loading...</div>
        ) : filteredReservations.length === 0 ? (
          <div style={{padding:24, textAlign:'center', color:'#6b7280'}}>No reservations found.</div>
        ) : (
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
            <thead>
              <tr style={{background:'#f9fafb', borderBottom:'1px solid #e6e6e6'}}>
                <th style={{padding:'12px 16px', textAlign:'left', fontWeight:600, color:'#374151'}}>ID</th>
                <th style={{padding:'12px 16px', textAlign:'left', fontWeight:600, color:'#374151'}}>Customer</th>
                <th style={{padding:'12px 16px', textAlign:'left', fontWeight:600, color:'#374151'}}>Vehicle</th>
                <th style={{padding:'12px 16px', textAlign:'left', fontWeight:600, color:'#374151'}}>Dates</th>
                <th style={{padding:'12px 16px', textAlign:'left', fontWeight:600, color:'#374151'}}>Pickup</th>
                <th style={{padding:'12px 16px', textAlign:'left', fontWeight:600, color:'#374151'}}>Drop-off</th>
                <th style={{padding:'12px 16px', textAlign:'left', fontWeight:600, color:'#374151'}}>Status</th>
                <th style={{padding:'12px 16px', textAlign:'left', fontWeight:600, color:'#374151'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map(r => {
                const statusStyle = getStatusColor(r.status)
                return (
                  <tr key={r.reservation_id} style={{borderBottom:'1px solid #f3f4f6'}}>
                    <td style={{padding:'12px 16px', color:'#6b7280'}}>#{r.reservation_id}</td>
                    <td style={{padding:'12px 16px'}}>
                      <div style={{fontWeight:500}}>{r.customer_name}</div>
                      <div style={{fontSize:12, color:'#6b7280'}}>{r.customer_email}</div>
                    </td>
                    <td style={{padding:'12px 16px'}}>
                      <div style={{fontWeight:500}}>{r.make} {r.model}</div>
                      <div style={{fontSize:12, color:'#6b7280'}}>{r.registration_no}</div>
                    </td>
                    <td style={{padding:'12px 16px'}}>
                      <div>{formatDate(r.start_date)}</div>
                      <div style={{fontSize:12, color:'#6b7280'}}>to {formatDate(r.end_date)}</div>
                    </td>
                    <td style={{padding:'12px 16px', fontSize:13}}>{r.pickup_branch}</td>
                    <td style={{padding:'12px 16px', fontSize:13}}>{r.dropoff_branch}</td>
                    <td style={{padding:'12px 16px'}}>
                      <span style={{
                        display:'inline-block',
                        padding:'4px 10px',
                        borderRadius:20,
                        fontSize:12,
                        fontWeight:500,
                        background: statusStyle.bg,
                        color: statusStyle.color
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{padding:'12px 16px'}}>
                      <select
                        value={r.status}
                        onChange={e => updateStatus(r.reservation_id, e.target.value)}
                        style={{padding:'6px 8px', fontSize:12, border:'1px solid #d1d5db', borderRadius:4}}
                      >
                        <option value="BOOKED">BOOKED</option>
                        <option value="CONVERTED">CONVERTED</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
