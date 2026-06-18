"use client"

import { useState, useEffect } from "react"
import { FiCloudDrizzle, FiDatabase, FiPackage, FiTrash2, FiEdit2, FiPlus, FiSave, FiX } from "react-icons/fi"
import { format, parseISO } from "date-fns"
import { th } from "date-fns/locale"
import styles from "./dashboard.module.css"

type Inventory = { id: string, name: string, quantity: number, type: string, usageRate?: number, unit?: string, usageUnit?: string, conversionRate?: number }

type DashboardAClientProps = {
  inventories: Inventory[]
  mockIoT: {
    soilMoisture: number
    phLevel: string
    nitrogen: number
    phosphorus: number
    potassium: number
  }
}

export default function DashboardAClient({ inventories: initialInventories, mockIoT }: DashboardAClientProps) {
  const [weather, setWeather] = useState<any>(null)
  const [locationInput, setLocationInput] = useState("")
  const [coords, setCoords] = useState({ lat: 13.75, lon: 100.51 })

  useEffect(() => {
    const saved = localStorage.getItem("farm_location")
    if (saved) {
      setLocationInput(saved)
      parseLocation(saved, false)
    }
  }, [])

  const parseLocation = (input: string, save: boolean = true) => {
    let lat = 13.75
    let lon = 100.51
    let isValid = false
    let finalInput = input

    if (input.trim() === "สวนสุขจันท์" || input.trim() === "อีแงว") {
      lat = 12.464706
      lon = 102.267660
      isValid = true
    } else if (input.trim() === "คลองหิน") {
      lat = 12.449157
      lon = 102.246243
      isValid = true
    } else if (input.includes(",")) {
      const parts = input.split(",")
      const pLat = parseFloat(parts[0].trim())
      const pLon = parseFloat(parts[1].trim())
      if (!isNaN(pLat) && !isNaN(pLon)) {
        lat = pLat
        lon = pLon
        isValid = true
      }
    }

    if (!isValid && input.trim() !== "") {
      alert("พิกัดไม่ถูกต้อง ระบบจะใช้พิกัด 'คลองหิน' แทน")
      lat = 12.449157
      lon = 102.246243
      finalInput = "คลองหิน"
      setLocationInput("คลองหิน")
    }

    setCoords({ lat, lon })
    if (save && input.trim() !== "") localStorage.setItem("farm_location", finalInput)
  }
  // Real-time IoT State
  const [iot, setIot] = useState({
    soilMoisture: mockIoT.soilMoisture,
    phLevel: parseFloat(mockIoT.phLevel),
    nitrogen: mockIoT.nitrogen,
    phosphorus: mockIoT.phosphorus,
    potassium: mockIoT.potassium,
    airTemp: 32.5,
    airHumidity: 70.0,
    waterEc: 1.2,
    soilEc: 0.8
  })
  
  // Inventory SPA State
  const [inventories, setInventories] = useState<Inventory[]>(initialInventories)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState<{name: string, type: string, quantity: number | string, usageRate: number | string, unit: string, usageUnit: string, conversionRate: number | string}>({ name: "", type: "FERTILIZER", quantity: "", usageRate: "", unit: "", usageUnit: "", conversionRate: "" })

  // User Management State
  const [users, setUsers] = useState<any[]>([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [userForm, setUserForm] = useState({ username: "", role: "USER", color: "#800080" })

  // Calculate VPD
  const svp = 0.61078 * Math.exp((17.27 * iot.airTemp) / (iot.airTemp + 237.3))
  const vpd = svp * (1 - (iot.airHumidity / 100))

  useEffect(() => {
    // Fetch 7-day weather
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,relative_humidity_2m_mean,precipitation_probability_max&timezone=auto&forecast_days=7`)
        const data = await res.json()
        
        if (data.error) {
          alert("พิกัดไม่ถูกต้อง หรือไม่สามารถดึงข้อมูลสภาพอากาศได้")
          return
        }

        const formatted = data.daily.time.map((t: string, i: number) => ({
          date: t,
          temp: data.daily.temperature_2m_max[i],
          humidity: data.daily.relative_humidity_2m_mean[i],
          rainProb: data.daily.precipitation_probability_max[i]
        }))
        setWeather(formatted)
      } catch (err) {
        console.error("Failed to fetch weather", err)
      }
    }
    fetchWeather()
  }, [coords])

  // Simulate Real-time data every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIot(prev => ({
        soilMoisture: Math.max(0, Math.min(100, prev.soilMoisture + (Math.random() * 2 - 1))),
        phLevel: Math.max(0, Math.min(14, prev.phLevel + (Math.random() * 0.2 - 0.1))),
        nitrogen: Math.max(0, prev.nitrogen + Math.floor(Math.random() * 3 - 1)),
        phosphorus: Math.max(0, prev.phosphorus + Math.floor(Math.random() * 3 - 1)),
        potassium: Math.max(0, prev.potassium + Math.floor(Math.random() * 3 - 1)),
        airTemp: Math.max(20, Math.min(45, prev.airTemp + (Math.random() * 0.6 - 0.3))),
        airHumidity: Math.max(30, Math.min(100, prev.airHumidity + (Math.random() * 2 - 1))),
        waterEc: Math.max(0, prev.waterEc + (Math.random() * 0.1 - 0.05)),
        soilEc: Math.max(0, prev.soilEc + (Math.random() * 0.1 - 0.05))
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const reloadInventory = async () => {
    const res = await fetch("/api/inventory")
    if (res.ok) {
      const data = await res.json()
      setInventories(data)
    }
  }

  const loadUsers = async () => {
    const res = await fetch("/api/users")
    if (res.ok) {
      setUsers(await res.json())
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userForm)
    })
    if (res.ok) {
      setUserForm({ username: "", role: "USER", color: "#800080" })
      setShowAddUser(false)
      await loadUsers()
    } else {
      const data = await res.json()
      alert(data.error || "เกิดข้อผิดพลาดในการเพิ่มผู้ใช้")
    }
    setLoading(false)
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("ต้องการลบผู้ใช้งานนี้หรือไม่?")) return
    setLoading(true)
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
    if (res.ok) {
      await loadUsers()
    } else {
      const data = await res.json()
      alert(data.error || "เกิดข้อผิดพลาดในการลบ")
    }
    setLoading(false)
  }

  const handleResetPassword = async (id: string) => {
    if (!confirm("ต้องการรีเซ็ตรหัสผ่านของผู้ใช้งานนี้ให้เป็น '1234' หรือไม่?")) return
    setLoading(true)
    const res = await fetch(`/api/users/${id}/reset-password`, { method: "POST" })
    if (res.ok) {
      alert("รีเซ็ตรหัสผ่านสำเร็จ (รหัสผ่านใหม่คือ 1234)")
    } else {
      const data = await res.json()
      alert(data.error || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน")
    }
    setLoading(false)
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      setForm({ name: "", type: "FERTILIZER", quantity: "", usageRate: "", unit: "", usageUnit: "", conversionRate: "" })
      setShowAddForm(false)
      await reloadInventory()
    } else {
      alert("เกิดข้อผิดพลาดในการเพิ่มพัสดุ")
    }
    setLoading(false)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    setLoading(true)
    const res = await fetch(`/api/inventory/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      setEditingId(null)
      await reloadInventory()
    } else {
      alert("เกิดข้อผิดพลาดในการแก้ไข")
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบพัสดุนี้หรือไม่?")) return
    setLoading(true)
    const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" })
    if (res.ok) {
      await reloadInventory()
    } else {
      const data = await res.json()
      alert(data.error || "เกิดข้อผิดพลาดในการลบ")
    }
    setLoading(false)
  }

  const startEdit = (inv: Inventory) => {
    setEditingId(inv.id)
    setForm({ name: inv.name, type: inv.type, quantity: "", usageRate: inv.usageRate || "", unit: inv.unit || "", usageUnit: inv.usageUnit || "", conversionRate: inv.conversionRate || "" })
    setShowAddForm(false)
  }

  return (
    <div className={styles.container}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 className={styles.title} style={{ marginBottom: 0 }}>แดชบอร์ดผู้ดูแลระบบ</h1>
        <button 
          onClick={() => alert("ระบบรายรับ-รายจ่ายอยู่ระหว่างการพัฒนา รอเชื่อมต่อในอนาคต")}
          style={{ padding: "0.5rem 1rem", background: "#f59e0b", color: "white", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "bold", boxShadow: "var(--shadow-sm)" }}
        >
          💰 ระบบรายรับ-รายจ่าย
        </button>
      </div>
      <div className={styles.grid}>
        {/* IoT Data (Real-time) */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <FiDatabase /> ข้อมูลเซ็นเซอร์ (Real-time)
          </div>
          <div className={styles.iotGrid}>
            <div className={styles.iotItem}>
              <div className={styles.iotLabel}>อุณหภูมิอากาศ</div>
              <div className={styles.iotValue}>{iot.airTemp.toFixed(1)}°C</div>
            </div>
            <div className={styles.iotItem}>
              <div className={styles.iotLabel}>ความชื้นสัมพัทธ์</div>
              <div className={styles.iotValue}>{iot.airHumidity.toFixed(1)}%</div>
            </div>
            <div className={styles.iotItem} style={{ backgroundColor: "#e8f4fd" }}>
              <div className={styles.iotLabel}>VPD</div>
              <div className={styles.iotValue} style={{ color: "var(--color-primary)" }}>{vpd.toFixed(2)} kPa</div>
            </div>
            <div className={styles.iotItem}>
              <div className={styles.iotLabel}>ความชื้นในดิน</div>
              <div className={styles.iotValue}>{iot.soilMoisture.toFixed(1)}%</div>
            </div>
            <div className={styles.iotItem}>
              <div className={styles.iotLabel}>ค่า pH ดิน</div>
              <div className={styles.iotValue}>{iot.phLevel.toFixed(2)}</div>
            </div>
            <div className={styles.iotItem}>
              <div className={styles.iotLabel}>EC น้ำ</div>
              <div className={styles.iotValue}>{iot.waterEc.toFixed(2)} mS/cm</div>
            </div>
            <div className={styles.iotItem}>
              <div className={styles.iotLabel}>EC ดิน</div>
              <div className={styles.iotValue}>{iot.soilEc.toFixed(2)} mS/cm</div>
            </div>
            <div className={styles.iotItem}>
              <div className={styles.iotLabel}>N (ไนโตรเจน)</div>
              <div className={styles.iotValue}>{Math.round(iot.nitrogen)}</div>
            </div>
            <div className={styles.iotItem}>
              <div className={styles.iotLabel}>P (ฟอสฟอรัส)</div>
              <div className={styles.iotValue}>{Math.round(iot.phosphorus)}</div>
            </div>
            <div className={styles.iotItem}>
              <div className={styles.iotLabel}>K (โพแทสเซียม)</div>
              <div className={styles.iotValue}>{Math.round(iot.potassium)}</div>
            </div>
          </div>
        </div>

        {/* 7 Day Weather */}
        <div className={styles.card}>
          <div className={styles.cardTitle} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <span><FiCloudDrizzle /> พยากรณ์อากาศ 7 วันล่วงหน้า</span>
            <input 
              type="text" 
              placeholder="ละติจูด,ลองติจูด หรือ ชื่อสวน" 
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onBlur={(e) => parseLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && parseLocation(locationInput)}
              style={{ padding: "0.3rem 0.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", fontSize: "0.85rem", width: "180px", fontWeight: "normal" }}
            />
          </div>
          <div className={styles.weatherList}>
            {weather ? weather.map((w: any) => (
              <div key={w.date} className={styles.weatherItem}>
                <div className={styles.weatherDate}>
                  {format(parseISO(w.date), "dd MMM yy", { locale: th })}
                </div>
                <div className={styles.weatherDetails}>
                  <span>{w.temp}°C</span>
                  <span>💧 {w.humidity}%</span>
                  {w.rainProb > 50 ? (
                    <span className={styles.weatherDanger}>⛈️ {w.rainProb}%</span>
                  ) : (
                    <span>☁️ {w.rainProb}%</span>
                  )}
                </div>
              </div>
            )) : <p>Loading weather...</p>}
          </div>
        </div>

        {/* Inventory SPA */}
        <div className={styles.card} style={{ gridColumn: "1 / -1" }}>
          <div className={styles.cardTitle} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><FiPackage /> จัดการสต็อกปุ๋ย/ยา</div>
            {!showAddForm && !editingId && (
              <button 
                onClick={() => { setShowAddForm(true); setForm({ name: "", type: "FERTILIZER", quantity: "", usageRate: "", unit: "", usageUnit: "", conversionRate: "" }) }}
                style={{ padding: "0.4rem 0.8rem", background: "var(--color-primary)", color: "white", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
              >
                <FiPlus /> เพิ่มพัสดุ
              </button>
            )}
          </div>

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleAddSubmit} style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "var(--radius-md)", marginBottom: "1rem", display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem", fontWeight: 700 }}>ชื่อพัสดุ</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem", fontWeight: 700 }}>ประเภท</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}>
                  <option value="FERTILIZER">ปุ๋ย (🌱)</option>
                  <option value="CHEMICAL">ยา/สารเคมี (🧪)</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem", fontWeight: 700 }}>จำนวนรับเข้า</label>
                <input type="number" step="0.01" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} style={{ width: "90px", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem", fontWeight: 700 }}>หน่วยรับเข้า</label>
                <input type="text" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="เช่น ขวด" style={{ width: "80px", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem", fontWeight: 700 }}>1 หน่วยใหญ่มี</label>
                <input type="number" step="0.01" value={form.conversionRate} onChange={e => setForm({ ...form, conversionRate: e.target.value })} placeholder="เช่น 1000" style={{ width: "80px", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem", fontWeight: 700 }}>หน่วยที่ใช้</label>
                <input type="text" value={form.usageUnit} onChange={e => setForm({ ...form, usageUnit: e.target.value })} placeholder="เช่น c.c." style={{ width: "80px", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem", fontWeight: 700 }}>{form.type === "FERTILIZER" ? "อัตราการใช้ (ต่อต้น)" : "อัตราการใช้ (ต่อ 200L)"}</label>
                <input type="number" step="0.01" value={form.usageRate} onChange={e => setForm({ ...form, usageRate: e.target.value })} style={{ width: "100px", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #ccc", borderRadius: "4px", background: "white", cursor: "pointer" }} disabled={loading}>ยกเลิก</button>
                <button type="submit" style={{ padding: "0.5rem 1rem", border: "none", borderRadius: "4px", background: "var(--color-secondary)", color: "white", cursor: "pointer" }} disabled={loading}>บันทึก</button>
              </div>
            </form>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {/* หมวดหมู่ปุ๋ย */}
            <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "1rem", color: "var(--color-text-main)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>🌱 รายการปุ๋ย</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {inventories.filter(inv => inv.type === "FERTILIZER").map(inv => (
                  <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: inv.quantity < 10 ? "#fff5f5" : "white" }}>
                    {editingId === inv.id ? (
                      <form onSubmit={handleEditSubmit} style={{ display: "flex", gap: "0.5rem", flex: 1, alignItems: "center", flexWrap: "wrap" }}>
                        <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ flex: 1, padding: "0.4rem", borderRadius: "4px", border: "1px solid #ccc", minWidth: "100px" }} />
                        <span style={{fontSize: "0.8rem"}}>ซื้อเพิ่ม:</span>
                        <input type="number" step="0.01" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="จำนวน" style={{ width: "80px", padding: "0.4rem", borderRadius: "4px", border: "1px solid #ccc" }} />
                        <span style={{fontSize: "0.8rem", color: "var(--color-text-muted)"}}>{inv.unit || 'หน่วย'}</span>
                        <button type="submit" style={{ padding: "0.4rem", background: "var(--color-secondary)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}><FiSave /></button>
                        <button type="button" onClick={() => setEditingId(null)} style={{ padding: "0.4rem", background: "#e2e8f0", border: "none", borderRadius: "4px", cursor: "pointer" }}><FiX /></button>
                      </form>
                    ) : (
                      <>
                        <strong style={{ fontSize: "1rem", flex: 1 }}>{inv.name}</strong>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          {inv.usageRate ? <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>อัตราใช้: {inv.usageRate} {inv.usageUnit || ""}/ต้น</span> : null}
                          <span style={{ color: inv.quantity < 10 ? "var(--color-danger)" : "inherit", fontWeight: inv.quantity < 10 ? 700 : 400, fontSize: "0.9rem" }}>
                            {inv.conversionRate ? (
                              `เหลือ: ${parseFloat((inv.quantity / inv.conversionRate).toFixed(2))} ${inv.unit} (${inv.quantity.toLocaleString()} ${inv.usageUnit})`
                            ) : (
                              `เหลือ: ${inv.quantity} ${inv.unit || inv.usageUnit || ""}`
                            )}
                          </span>
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            <button onClick={() => startEdit(inv)} style={{ padding: "0.3rem", background: "var(--color-primary)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}><FiEdit2 size={12} /></button>
                            <button onClick={() => handleDelete(inv.id)} style={{ padding: "0.3rem", background: "var(--color-danger)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}><FiTrash2 size={12} /></button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {inventories.filter(inv => inv.type === "FERTILIZER").length === 0 && <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>ไม่มีรายการปุ๋ย</p>}
              </div>
            </div>

            {/* หมวดหมู่ยา/สารเคมี */}
            <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "1rem", color: "var(--color-text-main)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>🧪 รายการยา/สารเคมี</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {inventories.filter(inv => inv.type === "CHEMICAL").map(inv => (
                  <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: inv.quantity < 10 ? "#fff5f5" : "white" }}>
                    {editingId === inv.id ? (
                      <form onSubmit={handleEditSubmit} style={{ display: "flex", gap: "0.5rem", flex: 1, alignItems: "center", flexWrap: "wrap" }}>
                        <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ flex: 1, padding: "0.4rem", borderRadius: "4px", border: "1px solid #ccc", minWidth: "100px" }} />
                        <span style={{fontSize: "0.8rem"}}>ซื้อเพิ่ม:</span>
                        <input type="number" step="0.01" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="จำนวน" style={{ width: "80px", padding: "0.4rem", borderRadius: "4px", border: "1px solid #ccc" }} />
                        <span style={{fontSize: "0.8rem", color: "var(--color-text-muted)"}}>{inv.unit || 'หน่วย'}</span>
                        <button type="submit" style={{ padding: "0.4rem", background: "var(--color-secondary)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}><FiSave /></button>
                        <button type="button" onClick={() => setEditingId(null)} style={{ padding: "0.4rem", background: "#e2e8f0", border: "none", borderRadius: "4px", cursor: "pointer" }}><FiX /></button>
                      </form>
                    ) : (
                      <>
                        <strong style={{ fontSize: "1rem", flex: 1 }}>{inv.name}</strong>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          {inv.usageRate ? <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>อัตราใช้: {inv.usageRate} {inv.usageUnit || ""}/200L</span> : null}
                          <span style={{ color: inv.quantity < 10 ? "var(--color-danger)" : "inherit", fontWeight: inv.quantity < 10 ? 700 : 400, fontSize: "0.9rem" }}>
                            {inv.conversionRate ? (
                              `เหลือ: ${parseFloat((inv.quantity / inv.conversionRate).toFixed(2))} ${inv.unit} (${inv.quantity.toLocaleString()} ${inv.usageUnit})`
                            ) : (
                              `เหลือ: ${inv.quantity} ${inv.unit || inv.usageUnit || ""}`
                            )}
                          </span>
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            <button onClick={() => startEdit(inv)} style={{ padding: "0.3rem", background: "var(--color-primary)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}><FiEdit2 size={12} /></button>
                            <button onClick={() => handleDelete(inv.id)} style={{ padding: "0.3rem", background: "var(--color-danger)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}><FiTrash2 size={12} /></button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {inventories.filter(inv => inv.type === "CHEMICAL").length === 0 && <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>ไม่มีรายการยา/สารเคมี</p>}
              </div>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className={styles.card}>
          <div className={styles.cardTitle} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>👥 จัดการผู้ใช้งาน</div>
            {!showAddUser && (
              <button 
                onClick={() => setShowAddUser(true)}
                style={{ padding: "0.4rem 0.8rem", background: "var(--color-primary)", color: "white", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
              >
                <FiPlus /> เพิ่มผู้ใช้
              </button>
            )}
          </div>

          {showAddUser && (
            <form onSubmit={handleAddUser} style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "var(--radius-md)", marginBottom: "1rem", display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem", fontWeight: 700 }}>ชื่อผู้ใช้ (Username)</label>
                <input required value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem", fontWeight: 700 }}>ระดับ (Role)</label>
                <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "0.25rem", fontWeight: 700 }}>สีประจำตัว</label>
                <input type="color" value={userForm.color} onChange={e => setUserForm({ ...userForm, color: e.target.value })} style={{ width: "50px", height: "35px", padding: "0", borderRadius: "4px", border: "1px solid #ccc" }} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" onClick={() => setShowAddUser(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #ccc", borderRadius: "4px", background: "white", cursor: "pointer" }} disabled={loading}>ยกเลิก</button>
                <button type="submit" style={{ padding: "0.5rem 1rem", border: "none", borderRadius: "4px", background: "var(--color-secondary)", color: "white", cursor: "pointer" }} disabled={loading}>บันทึก (รหัสผ่าน 1234)</button>
              </div>
            </form>
          )}

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>ชื่อผู้ใช้</th>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1" }}>ระดับ</th>
                  <th style={{ padding: "0.75rem", borderBottom: "1px solid #cbd5e1", textAlign: "center" }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: u.color }}></div>
                      {u.username}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold", background: u.role === "ADMIN" ? "#fee2e2" : "#e0e7ff", color: u.role === "ADMIN" ? "#991b1b" : "#3730a3" }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "center" }}>
                      <button onClick={() => handleResetPassword(u.id)} style={{ padding: "0.3rem 0.6rem", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer", marginRight: "0.5rem", fontSize: "0.8rem" }}>รีเซ็ตรหัสผ่าน</button>
                      <button onClick={() => handleDeleteUser(u.id)} style={{ padding: "0.3rem 0.6rem", background: "var(--color-danger)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }} disabled={u.username === "admin"}><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
