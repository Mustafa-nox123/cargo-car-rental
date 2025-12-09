import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Branches from './pages/Branches'
import Vehicles from './pages/Vehicles'
import Reservation from './pages/Reservation'
import AdminDashboard from './pages/AdminDashboard'
import AdminVehicles from './pages/AdminVehicles'
import AdminBranches from './pages/AdminBranches'
import AdminVehicleTypes from './pages/AdminVehicleTypes'
import AdminReservations from './pages/AdminReservations'
import Header from './components/Header'

export default function App(){
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
          <Route path="/dashboard" element={<Dashboard/>} />
          <Route path="/branches" element={<Branches/>} />
          <Route path="/vehicles" element={<Vehicles/>} />
          <Route path="/reservation" element={<Reservation/>} />
          <Route path="/admin/login" element={<Login/>} />
          <Route path="/admin/dashboard" element={<AdminDashboard/>} />
          <Route path="/admin/vehicles" element={<AdminVehicles/>} />
          <Route path="/admin/branches" element={<AdminBranches/>} />
          <Route path="/admin/vehicle-types" element={<AdminVehicleTypes/>} />
          <Route path="/admin/reservations" element={<AdminReservations/>} />
        </Routes>
      </main>
    </div>
  )
}
