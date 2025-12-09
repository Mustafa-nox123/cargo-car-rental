import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import './reservation.css'

export default function Reservation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { vehicle, branches } = location.state || {}
  
  const [user, setUser] = useState(null)
  const [step, setStep] = useState(1) // 1: Form, 2: Success/Receipt
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [pickupBranchId, setPickupBranchId] = useState('')
  const [dropoffBranchId, setDropoffBranchId] = useState('')
  
  // Receipt state
  const [receipt, setReceipt] = useState(null)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    
    // Load user info
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        console.error('Error parsing user data')
      }
    }
    
    // Redirect if no vehicle data
    if (!vehicle) {
      navigate('/vehicles')
      return
    }
    
    // Set default pickup branch to vehicle's current branch
    if (branches && vehicle) {
      const vehicleBranch = branches.find(b => b.branch_name === vehicle.branch_name)
      if (vehicleBranch) {
        setPickupBranchId(vehicleBranch.branch_id.toString())
        setDropoffBranchId(vehicleBranch.branch_id.toString())
      }
    }
    
    // Set default dates (today and tomorrow)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    setStartDate(formatDate(today))
    setEndDate(formatDate(tomorrow))
  }, [vehicle, branches, navigate])

  const formatDate = (date) => {
    return date.toISOString().split('T')[0]
  }

  const calculateDays = () => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays || 1
  }

  const calculateTotal = () => {
    const days = calculateDays()
    const dailyRate = vehicle?.daily_rate || 0
    return (days * dailyRate).toFixed(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!startDate || !endDate) {
      setError('Please select both start and end dates')
      return
    }
    
    if (new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date')
      return
    }
    
    if (new Date(startDate) < new Date(formatDate(new Date()))) {
      setError('Start date cannot be in the past')
      return
    }
    
    if (!pickupBranchId || !dropoffBranchId) {
      setError('Please select pickup and drop-off branches')
      return
    }
    
    setLoading(true)
    
    try {
      // Create reservation
      const res = await api.post('/reservations', {
        vehicle_id: vehicle.vehicle_id,
        pickup_branch_id: parseInt(pickupBranchId),
        dropoff_branch_id: parseInt(dropoffBranchId),
        start_date: startDate,
        end_date: endDate
      })
      
      // Generate receipt data
      const pickupBranch = branches.find(b => b.branch_id === parseInt(pickupBranchId))
      const dropoffBranch = branches.find(b => b.branch_id === parseInt(dropoffBranchId))
      
      setReceipt({
        reservation_id: res.data.reservation_id,
        vehicle: vehicle,
        user: user,
        start_date: startDate,
        end_date: endDate,
        days: calculateDays(),
        daily_rate: vehicle.daily_rate,
        total_amount: calculateTotal(),
        payment_method: paymentMethod,
        pickup_branch: pickupBranch,
        dropoff_branch: dropoffBranch,
        created_at: new Date().toISOString()
      })
      
      setStep(2)
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to create reservation')
    } finally {
      setLoading(false)
    }
  }

  const formatDisplayDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleNewReservation = () => {
    navigate('/vehicles')
  }

  if (!vehicle) {
    return (
      <div className="reservation-page">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="reservation-page">
      {step === 1 ? (
        <>
          <div className="reservation-header">
            <button className="back-btn" onClick={() => navigate('/vehicles')}>
              ← Back to Vehicles
            </button>
            <h1>Complete Your Reservation</h1>
            <p>Fill in the details below to reserve your vehicle</p>
          </div>

          <div className="reservation-container">
            {/* Vehicle Summary Card */}
            <div className="vehicle-summary">
              <div className="summary-header">
                <h2>Vehicle Summary</h2>
              </div>
              {vehicle.image_url && (
                <div className="summary-image">
                  <img src={`http://localhost:5000${vehicle.image_url}`} alt={`${vehicle.make} ${vehicle.model}`} />
                </div>
              )}
              <div className="summary-details">
                <h3>{vehicle.make} {vehicle.model}</h3>
                <p className="reg-no">{vehicle.registration_no}</p>
                <div className="summary-info">
                  <div className="info-row">
                    <span className="info-label">Type</span>
                    <span className="info-value">{vehicle.type_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Year</span>
                    <span className="info-value">{vehicle.year_made || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Location</span>
                    <span className="info-value">{vehicle.branch_name}</span>
                  </div>
                </div>
                <div className="daily-rate-box">
                  <span className="rate-label">Daily Rate</span>
                  <span className="rate-value">${vehicle.daily_rate}</span>
                </div>
              </div>
            </div>

            {/* Reservation Form */}
            <div className="reservation-form-container">
              <form onSubmit={handleSubmit} className="reservation-form">
                {error && <div className="form-error">{error}</div>}
                
                {/* Date Selection */}
                <div className="form-section">
                  <h3>📅 Reservation Period</h3>
                  <div className="date-inputs">
                    <div className="form-group">
                      <label>Start Date</label>
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        min={formatDate(new Date())}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || formatDate(new Date())}
                        required
                      />
                    </div>
                  </div>
                  <div className="duration-display">
                    <span>Duration: </span>
                    <strong>{calculateDays()} day{calculateDays() !== 1 ? 's' : ''}</strong>
                  </div>
                </div>

                {/* Branch Selection */}
                <div className="form-section">
                  <h3>📍 Pickup & Drop-off</h3>
                  <div className="branch-inputs">
                    <div className="form-group">
                      <label>Pickup Branch</label>
                      <select 
                        value={pickupBranchId} 
                        onChange={(e) => setPickupBranchId(e.target.value)}
                        required
                      >
                        <option value="">Select branch</option>
                        {branches && branches.map(b => (
                          <option key={b.branch_id} value={b.branch_id}>
                            {b.branch_name} — {b.city}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Drop-off Branch</label>
                      <select 
                        value={dropoffBranchId} 
                        onChange={(e) => setDropoffBranchId(e.target.value)}
                        required
                      >
                        <option value="">Select branch</option>
                        {branches && branches.map(b => (
                          <option key={b.branch_id} value={b.branch_id}>
                            {b.branch_name} — {b.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="form-section">
                  <h3>💳 Payment Method</h3>
                  <p className="section-note">Payment will be collected at the branch during pickup</p>
                  <div className="payment-options">
                    <label className={`payment-option ${paymentMethod === 'CASH' ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="CASH"
                        checked={paymentMethod === 'CASH'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <div className="option-content">
                        <span className="option-icon">💵</span>
                        <span className="option-label">Cash</span>
                        <span className="option-desc">Pay with cash at pickup</span>
                      </div>
                    </label>
                    <label className={`payment-option ${paymentMethod === 'CARD' ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="CARD"
                        checked={paymentMethod === 'CARD'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <div className="option-content">
                        <span className="option-icon">💳</span>
                        <span className="option-label">Card</span>
                        <span className="option-desc">Pay with card at pickup</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Price Summary */}
                <div className="price-summary">
                  <div className="price-row">
                    <span>Daily Rate</span>
                    <span>${vehicle.daily_rate}</span>
                  </div>
                  <div className="price-row">
                    <span>Number of Days</span>
                    <span>{calculateDays()}</span>
                  </div>
                  <div className="price-row total">
                    <span>Total Amount</span>
                    <span>${calculateTotal()}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="reserve-btn"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : `Reserve Now — $${calculateTotal()}`}
                </button>
              </form>
            </div>
          </div>
        </>
      ) : (
        /* Success / Receipt View */
        <div className="success-container">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h1>Reservation Successful!</h1>
            <p>Your vehicle has been reserved. Please present this receipt at pickup.</p>
          </div>

          <div className="receipt" id="receipt">
            <div className="receipt-header">
              <div className="receipt-logo">CarGo</div>
              <div className="receipt-title">Reservation Receipt</div>
              <div className="receipt-id">#{receipt?.reservation_id}</div>
            </div>

            <div className="receipt-section">
              <h4>Customer Information</h4>
              <div className="receipt-row">
                <span>Name</span>
                <span>{receipt?.user?.name || 'Customer'}</span>
              </div>
              <div className="receipt-row">
                <span>Email</span>
                <span>{receipt?.user?.email || 'N/A'}</span>
              </div>
            </div>

            <div className="receipt-section">
              <h4>Vehicle Details</h4>
              <div className="receipt-row">
                <span>Vehicle</span>
                <span>{receipt?.vehicle?.make} {receipt?.vehicle?.model}</span>
              </div>
              <div className="receipt-row">
                <span>Registration</span>
                <span>{receipt?.vehicle?.registration_no}</span>
              </div>
              <div className="receipt-row">
                <span>Type</span>
                <span>{receipt?.vehicle?.type_name}</span>
              </div>
            </div>

            <div className="receipt-section">
              <h4>Reservation Details</h4>
              <div className="receipt-row">
                <span>Pickup Date</span>
                <span>{formatDisplayDate(receipt?.start_date)}</span>
              </div>
              <div className="receipt-row">
                <span>Return Date</span>
                <span>{formatDisplayDate(receipt?.end_date)}</span>
              </div>
              <div className="receipt-row">
                <span>Duration</span>
                <span>{receipt?.days} day{receipt?.days !== 1 ? 's' : ''}</span>
              </div>
              <div className="receipt-row">
                <span>Pickup Branch</span>
                <span>{receipt?.pickup_branch?.branch_name}, {receipt?.pickup_branch?.city}</span>
              </div>
              <div className="receipt-row">
                <span>Drop-off Branch</span>
                <span>{receipt?.dropoff_branch?.branch_name}, {receipt?.dropoff_branch?.city}</span>
              </div>
            </div>

            <div className="receipt-section">
              <h4>Payment Details</h4>
              <div className="receipt-row">
                <span>Daily Rate</span>
                <span>${receipt?.daily_rate}</span>
              </div>
              <div className="receipt-row">
                <span>Number of Days</span>
                <span>{receipt?.days}</span>
              </div>
              <div className="receipt-row">
                <span>Payment Method</span>
                <span>{receipt?.payment_method === 'CASH' ? 'Cash (at pickup)' : 'Card (at pickup)'}</span>
              </div>
              <div className="receipt-row total">
                <span>Total Amount Due</span>
                <span>${receipt?.total_amount}</span>
              </div>
            </div>

            <div className="receipt-footer">
              <p>Reservation Date: {new Date(receipt?.created_at).toLocaleString()}</p>
              <p className="receipt-note">Please bring a valid ID and driver's license at pickup. Payment will be collected at the branch.</p>
            </div>
          </div>

          <div className="success-actions">
            <button className="btn-secondary" onClick={handlePrint}>
              🖨️ Print Receipt
            </button>
            <button className="btn-primary" onClick={handleNewReservation}>
              Make Another Reservation
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
