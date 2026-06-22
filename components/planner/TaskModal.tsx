"use client"

import { useState, useEffect } from "react"
import { FiX } from "react-icons/fi"
import { format } from "date-fns"
import styles from "./TaskModal.module.css"

type Task = any // Use specific type in real app
type Inventory = { id: string, name: string, type: string, quantity: number, usageRate?: number, unit?: string, usageUnit?: string, conversionRate?: number }

type TaskModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (taskData: any) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  selectedDate: Date | null
  existingTask?: Task | null
}

const ICONS = ["💧", "✂️", "🌸", "🚜", "🌱", "🐛", "🧪", "📦", "📝"]
const COLORS = ["#8e44ad", "#1abc9c", "#e74c3c", "#3498db", "#2ecc71"]

export default function TaskModal({ isOpen, onClose, onSave, onDelete, selectedDate, existingTask }: TaskModalProps) {
  const [title, setTitle] = useState("")
  const [plot, setPlot] = useState("")
  const [icon, setIcon] = useState("📝")
  const [color, setColor] = useState("#8e44ad")
  const [status, setStatus] = useState("WAITING")
  const [multiplier, setMultiplier] = useState<string>("")
  const [usages, setUsages] = useState<{ inventoryId: string, quantity: string }[]>([])
  const [inventories, setInventories] = useState<Inventory[]>([])
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"view" | "edit">("edit")

  useEffect(() => {
    if (isOpen) {
      // Fetch inventories
      fetch("/api/inventory").then(res => res.json()).then(data => {
        if (Array.isArray(data)) {
          setInventories(data)
          if (existingTask) {
            setMode("view")
            setTitle(existingTask.title)
            setPlot(existingTask.plot || "")
            setIcon(existingTask.icon)
            setColor(existingTask.color)
            setStatus(existingTask.status)
            setMultiplier(existingTask.waterVolume ? String(existingTask.waterVolume) : "")
            if (existingTask.usages && existingTask.usages.length > 0) {
              setUsages(existingTask.usages.map((u: any) => {
                const inv = data.find((i: any) => i.id === u.inventoryId)
                const conv = inv?.conversionRate || 1
                return { 
                  inventoryId: u.inventoryId, 
                  quantity: String(u.quantity / conv) 
                }
              }))
            } else {
              setUsages([])
            }
          } else {
            setMode("edit")
            setTitle("")
            setPlot("")
            setIcon("📝")
            setColor("#8e44ad")
            setStatus("WAITING")
            setMultiplier("")
            setUsages([])
          }
        }
      }).catch(e => console.log(e))
    }
  }, [isOpen, existingTask])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({
        id: existingTask?.id,
        title,
        date: existingTask ? existingTask.date : selectedDate?.toISOString(),
        icon,
        color,
        plot,
        status,
        waterVolume: multiplier ? parseFloat(multiplier) : null,
        usages: usages.filter(u => u.inventoryId && u.quantity).map(u => {
          const inv = inventories.find(i => i.id === u.inventoryId)
          const conv = inv?.conversionRate || 1
          return { ...u, quantity: parseFloat(u.quantity) * conv }
        })
      })
      setLoading(false)
      onClose()
    } catch (error: any) {
      setLoading(false)
      // Error is already alerted by the parent
    }
  }

  const handleClearWarning = async () => {
    if (!existingTask) return
    setLoading(true)
    try {
      await fetch(`/api/tasks/${existingTask.id}/acknowledge`, { method: "POST" })
      alert("รับทราบการแจ้งเตือนแล้ว")
      window.location.reload()
    } catch (e) {
      console.error(e)
      alert("เกิดข้อผิดพลาดในการเคลียร์แจ้งเตือน")
    } finally {
      setLoading(false)
    }
  }

  const hasWarning = existingTask?.status === "WAITING" && usages.some(u => {
    const inv = inventories.find(i => i.id === u.inventoryId)
    if (!inv || !u.quantity) return false
    const reqQty = parseFloat(u.quantity) * (inv.conversionRate || 1)
    return reqQty > inv.quantity
  })

  const handleDelete = async () => {
    if (existingTask && onDelete) {
      if (confirm("ต้องการลบงานนี้หรือไม่?")) {
        setLoading(true)
        await onDelete(existingTask.id)
        setLoading(false)
        onClose()
      }
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{existingTask ? "แก้ไขงาน" : "เพิ่มงานใหม่"}</h2>
          <button onClick={onClose} className={styles.closeBtn}><FiX size={24} /></button>
        </div>
        
        {mode === "view" && existingTask ? (
          <div>
            <div className={styles.body}>
              <div className={styles.formGroup}>
                <span className={styles.label}>วันที่:</span>
                <div>{format(new Date(existingTask.date), "dd/MM/yyyy")}</div>
              </div>
              <div className={styles.formGroup}>
                <span className={styles.label}>ชื่องาน:</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>{existingTask.icon}</span>
                  <span style={{ fontWeight: 700, color: existingTask.color }}>{existingTask.title}</span>
                </div>
              </div>
              {existingTask.plot && (
                <div className={styles.formGroup}>
                  <span className={styles.label}>แปลง:</span>
                  <div>{existingTask.plot}</div>
                </div>
              )}
              <div className={styles.formGroup}>
                <span className={styles.label}>สถานะ:</span>
                <div>{existingTask.status === "ACTIVATED" ? "เสร็จสิ้น (Activated)" : "รอดำเนินการ (Waiting)"}</div>
              </div>
              {(existingTask.title.includes("พ่น") || existingTask.title.includes("ใส่")) && (
                <div className={styles.formGroup}>
                  <span className={styles.label}>{existingTask.title.includes("พ่น") ? "จำนวนถังที่ใช้:" : "จำนวนต้น:"}</span>
                  <div>{existingTask.waterVolume || "-"} {existingTask.title.includes("พ่น") ? "ถัง (200L)" : "ต้น"}</div>
                </div>
              )}
              {existingTask.usages && existingTask.usages.length > 0 && (
                <div className={styles.formGroup}>
                  <span className={styles.label}>พัสดุที่ใช้:</span>
                  <div>
                    {existingTask.usages.map((u: any, idx: number) => (
                      <div key={idx}>- {u.inventory?.name || "ไม่ทราบชื่อ"} (จำนวน {u.quantity} {u.inventory?.usageUnit || ""})</div>
                    ))}
                  </div>
                </div>
              )}
              <div className={styles.formGroup}>
                <span className={styles.label}>ผู้สร้าง:</span>
                <div>{existingTask.creator?.username || "-"}</div>
              </div>
              <div className={styles.formGroup}>
                <span className={styles.label}>ผู้แก้ไขล่าสุด:</span>
                <div>{existingTask.updater?.username || "-"}</div>
              </div>
            </div>
            <div className={styles.footer}>
              <button type="button" onClick={onClose} className={styles.cancelBtn}>ปิด</button>
              <button type="button" onClick={() => setMode("edit")} className={styles.saveBtn}>แก้ไขงาน</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.body}>
              {selectedDate && !existingTask && (
                <div className={styles.formGroup}>
                  <span className={styles.label}>วันที่: {format(selectedDate, "dd/MM/yyyy")}</span>
                </div>
              )}
              
              <div className={styles.formGroup}>
                <label className={styles.label}>ชื่องาน *</label>
                <input required className={styles.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="เช่น พ่นยาแปลง A" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>แปลง (Plot)</label>
                <input className={styles.input} value={plot} onChange={e => setPlot(e.target.value)} placeholder="เช่น แปลง A" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>สถานะ</label>
                <select className={styles.select} value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="WAITING">รอดำเนินการ (Waiting)</option>
                  <option value="ACTIVATED">เสร็จสิ้น (Activated)</option>
                </select>
              </div>

              {(title.includes("พ่น") || title.includes("ใส่")) && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>{title.includes("พ่น") ? "จำนวนถัง (200 ลิตร/ถัง)" : "จำนวนต้น"}</label>
                  <input type="number" step="0.01" className={styles.input} value={multiplier} onChange={e => setMultiplier(e.target.value)} placeholder={title.includes("พ่น") ? "เช่น 12" : "เช่น 100"} />
                </div>
              )}



              <div className={styles.formGroup}>
                <label className={styles.label}>ไอคอน (สัญลักษณ์)</label>
                <div className={styles.iconGrid}>
                  {ICONS.map(i => (
                    <button type="button" key={i} className={`${styles.iconBtn} ${icon === i ? styles.iconBtnActive : ""}`} onClick={() => setIcon(i)}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>สีของงาน</label>
                <div className={styles.colorGrid}>
                  {COLORS.map(c => (
                    <button type="button" key={c} className={`${styles.colorBtn} ${color === c ? styles.colorBtnActive : ""}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>รายการพัสดุ (ปุ๋ย/ยา) ที่จะใช้ หรือ ตัดสต๊อก</label>
                {usages.map((usage, idx) => {
                  const selectedInv = inventories.find(i => i.id === usage.inventoryId)
                  let recommended = null
                  if (selectedInv && selectedInv.usageRate) {
                    recommended = selectedInv.usageRate
                  }
                  
                  let warningMessage = null
                  if (selectedInv && usage.quantity) {
                    const reqQty = parseFloat(usage.quantity)
                    let invQty = selectedInv.quantity
                    if (existingTask && existingTask.status === "ACTIVATED") {
                      const prevUsage = existingTask.usages?.find((u: any) => u.inventoryId === usage.inventoryId)
                      if (prevUsage) {
                        invQty += prevUsage.quantity
                      }
                    }
                    const availableQty = selectedInv.conversionRate ? invQty / selectedInv.conversionRate : invQty
                    if (reqQty > availableQty) {
                      const diff = reqQty - availableQty
                      warningMessage = `⚠️ สต๊อกไม่พอ ขาดอีก ${parseFloat(diff.toFixed(2))} ${selectedInv.unit || selectedInv.usageUnit || ""}`
                    }
                  }
                  
                  return (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "1px dashed var(--color-border)" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <select 
                          className={styles.select} 
                          value={usage.inventoryId} 
                            onChange={e => {
                              const newUsages = [...usages]
                              newUsages[idx].inventoryId = e.target.value
                              newUsages[idx].quantity = "" // รีเซ็ตเป็นค่าว่าง
                              setUsages(newUsages)
                            }}
                          style={{ flex: 1 }}
                        >
                          <option value="">-- กรุณาเลือก --</option>
                          {inventories.map(inv => (
                            <option key={inv.id} value={inv.id}>{inv.name} (คงเหลือ {inv.conversionRate ? parseFloat((inv.quantity / inv.conversionRate).toFixed(2)) + ' ' + (inv.unit||'') : inv.quantity + ' ' + (inv.unit || inv.usageUnit || '')})</option>
                          ))}
                        </select>
                        {usage.inventoryId && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <input 
                              type="number" 
                              step="0.01" 
                              placeholder="ปริมาณ"
                              className={styles.input} 
                              value={usage.quantity} 
                              onChange={e => {
                                const newUsages = [...usages]
                                newUsages[idx].quantity = e.target.value
                                setUsages(newUsages)
                              }} 
                              style={{ width: "80px", flexShrink: 0 }}
                            />
                            <span style={{ fontSize: "0.9rem", color: "var(--color-text-main)" }}>{selectedInv?.unit || selectedInv?.usageUnit}</span>
                          </div>
                        )}
                        <button 
                          type="button" 
                          onClick={() => {
                            const newUsages = usages.filter((_, i) => i !== idx)
                            setUsages(newUsages)
                          }}
                          style={{ color: "red", background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", padding: "0 0.5rem" }}
                        >
                          <FiX />
                        </button>
                      </div>
                      {recommended !== null && (
                        <div style={{ fontSize: "0.85rem", color: "var(--color-primary)", alignSelf: "flex-end", marginRight: "3rem" }}>
                          💡 อัตราแนะนำ: {recommended.toFixed(2)} {selectedInv?.usageUnit || "หน่วย"}{selectedInv?.type === "FERTILIZER" ? " / ต้น" : " ต่อน้ำ 200 ลิตร"}
                        </div>
                      )}
                      {warningMessage && (
                        <div style={{ fontSize: "0.85rem", color: "var(--color-danger)", alignSelf: "flex-end", marginRight: "3rem", fontWeight: "bold" }}>
                          {warningMessage}
                        </div>
                      )}
                    </div>
                  )
                })}
                <button 
                  type="button" 
                  onClick={() => setUsages([...usages, { inventoryId: "", quantity: "" }])}
                  style={{ padding: "0.5rem", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer", width: "100%", background: "transparent", color: "var(--color-primary)" }}
                >
                  + เพิ่มพัสดุ
                </button>
              </div>
            </div>
            
            <div className={styles.footer}>
              {existingTask && hasWarning && !existingTask.isWarningAcknowledged && (
                <button type="button" onClick={handleClearWarning} className={styles.saveBtn} style={{ background: "#f39c12", color: "white" }} disabled={loading}>Clear แจ้งเตือน</button>
              )}
              {existingTask && (
                <button type="button" onClick={handleDelete} className={styles.deleteBtn} disabled={loading}>ลบงาน</button>
              )}
              <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={loading}>ยกเลิก</button>
              <button type="submit" className={styles.saveBtn} disabled={loading}>บันทึก</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
