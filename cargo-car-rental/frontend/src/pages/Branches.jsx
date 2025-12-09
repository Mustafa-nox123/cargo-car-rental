import React, { useEffect, useState } from 'react'
import api from '../lib/api'

export default function Branches(){
  const [list,setList] = useState([])
  useEffect(()=>{ api.get('/branches').then(r=>setList(r.data)).catch(()=>{}); }, [])
  return (
    <div>
      <h2 className="text-xl font-medium mb-2">Branches</h2>
      <div className="space-y-3">
        {list.map(b=>(
          <div key={b.branch_id} className="p-3 border rounded bg-white">
            <div className="font-semibold">{b.branch_name} — {b.city}</div>
            <div className="text-sm text-gray-600">{b.address_line || b.address}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
