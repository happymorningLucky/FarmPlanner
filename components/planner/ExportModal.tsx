"use client"

import { useState, useRef } from "react"
import { FiX, FiDownload } from "react-icons/fi"
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from "date-fns"
import { th } from "date-fns/locale"
import { QRCodeCanvas } from "qrcode.react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import styles from "./ExportModal.module.css"

type Task = any

type ExportModalProps = {
  isOpen: boolean
  onClose: () => void
  tasks: Task[]
}

export default function ExportModal({ isOpen, onClose, tasks }: ExportModalProps) {
  const [startMonth, setStartMonth] = useState(format(new Date(), "yyyy-MM"))
  const [endMonth, setEndMonth] = useState(format(new Date(), "yyyy-MM"))
  const [loading, setLoading] = useState(false)
  const [excludedTaskIds, setExcludedTaskIds] = useState<string[]>([])
  const exportRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  // Filter tasks based on selected range
  const start = startOfMonth(new Date(startMonth))
  const end = endOfMonth(new Date(endMonth))
  
  const filteredTasks = tasks.filter(t => {
    const taskDate = parseISO(t.date)
    return isWithinInterval(taskDate, { start, end })
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const toggleTask = (id: string) => {
    setExcludedTaskIds(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    )
  }

  const selectAll = () => setExcludedTaskIds([])
  const deselectAll = () => setExcludedTaskIds(filteredTasks.map(t => t.id))

  const tasksToExport = filteredTasks.filter(t => !excludedTaskIds.includes(t.id))

  const handleExport = async () => {
    if (!exportRef.current) return
    setLoading(true)
    
    try {
      // Temporarily show the export container to capture it
      exportRef.current.style.display = "block"
      
      const canvas = await html2canvas(exportRef.current, { scale: 2 } as any)
      const imgData = canvas.toDataURL("image/png")
      
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Farm_Plan_${startMonth}_to_${endMonth}.pdf`)
      
      exportRef.current.style.display = "none"
      onClose()
    } catch (error) {
      console.error("Export failed", error)
      alert("เกิดข้อผิดพลาดในการ Export")
    } finally {
      setLoading(false)
    }
  }

  // The URL to point the QR Code to (could be the actual deployed URL)
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://farm-planner.app"

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Export แผนงาน (PDF)</h2>
          <button onClick={onClose} className={styles.closeBtn}><FiX size={24} /></button>
        </div>
        
        <div className={styles.body}>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.label}>ตั้งแต่เดือน</label>
              <input type="month" className={styles.input} value={startMonth} onChange={e => setStartMonth(e.target.value)} />
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.label}>ถึงเดือน</label>
              <input type="month" className={styles.input} value={endMonth} onChange={e => setEndMonth(e.target.value)} />
            </div>
          </div>
          
          <div style={{ marginTop: "1rem", borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h3 style={{ fontSize: "1rem", margin: 0 }}>เลือกงานที่ต้องการ Export</h3>
              <div>
                <button onClick={selectAll} style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontSize: "0.85rem", marginRight: "0.5rem" }}>เลือกทั้งหมด</button>
                <button onClick={deselectAll} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "0.85rem" }}>ไม่เลือกทั้งหมด</button>
              </div>
            </div>
            <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", backgroundColor: "#fafafa" }}>
              {filteredTasks.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>ไม่มีงานในช่วงเดือนนี้</div>
              ) : (
                filteredTasks.map(task => (
                  <label key={task.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderBottom: "1px solid var(--color-border)", cursor: "pointer", backgroundColor: excludedTaskIds.includes(task.id) ? "#f9f9f9" : "white" }}>
                    <input 
                      type="checkbox" 
                      checked={!excludedTaskIds.includes(task.id)} 
                      onChange={() => toggleTask(task.id)} 
                      style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: excludedTaskIds.includes(task.id) ? "var(--color-text-muted)" : "var(--color-text-main)" }}>
                        {task.icon} {task.title} {task.plot ? `(${task.plot})` : ""}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        {format(parseISO(task.date), "dd MMM yyyy", { locale: th })} {task.endDate ? `- ${format(parseISO(task.endDate), "dd MMM yyyy", { locale: th })}` : ""}
                      </div>
                    </div>
                    <span style={{ 
                      padding: "2px 6px", 
                      borderRadius: "4px", 
                      fontSize: "11px", 
                      backgroundColor: task.status === "ACTIVATED" ? "#e8f5e9" : "#fff3e0",
                      color: task.status === "ACTIVATED" ? "#2e7d32" : "#e65100"
                    }}>
                      {task.status === "ACTIVATED" ? "เสร็จสิ้น" : "รอทำ"}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelBtn} disabled={loading}>ยกเลิก</button>
          <button onClick={handleExport} className={styles.exportBtn} disabled={loading || tasksToExport.length === 0}>
            <FiDownload /> {loading ? "กำลังสร้าง PDF..." : `Export PDF (${tasksToExport.length} งาน)`}
          </button>
        </div>
      </div>

      {/* Hidden container to capture as PDF */}
      <div ref={exportRef} style={{ display: "none", position: "absolute", left: "-9999px", top: 0, width: "800px", padding: "40px", backgroundColor: "white", color: "black", fontFamily: "'Prompt', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "2px solid #8e44ad", paddingBottom: "20px" }}>
          <div>
            <h1 style={{ color: "#8e44ad", margin: 0 }}>Farm Planner (บันทึก GAP)</h1>
            <p style={{ margin: "5px 0 0 0", fontSize: "16px", color: "#666" }}>
              แผนงานตั้งแต่: {format(start, "MMMM yyyy", { locale: th })} ถึง {format(end, "MMMM yyyy", { locale: th })}
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <QRCodeCanvas value={`${appUrl}/planner`} size={100} />
            <p style={{ fontSize: "12px", marginTop: "5px" }}>สแกนเพื่อเข้าสู่ระบบ</p>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f3f4f6", textAlign: "left" }}>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>วันที่</th>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>ชื่องาน</th>
              <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {tasksToExport.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "#666" }}>ไม่มีงานที่เลือก</td>
              </tr>
            ) : (
              tasksToExport.map(task => (
                <tr key={task.id}>
                  <td style={{ padding: "10px", borderBottom: "1px solid #eee", verticalAlign: "top" }}>
                    {format(parseISO(task.date), "dd MMM yy", { locale: th })}
                    {task.endDate && (
                      <div><small style={{ color: "#666" }}>ถึง {format(parseISO(task.endDate), "dd MMM yy", { locale: th })}</small></div>
                    )}
                  </td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #eee", verticalAlign: "top" }}>{task.icon} {task.title} {task.plot ? `(${task.plot})` : ""}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #eee", verticalAlign: "top" }}>
                    <span style={{ 
                      padding: "4px 8px", 
                      borderRadius: "4px", 
                      fontSize: "12px", 
                      backgroundColor: task.status === "ACTIVATED" ? "#e8f5e9" : "#fff3e0",
                      color: task.status === "ACTIVATED" ? "#2e7d32" : "#e65100"
                    }}>
                      {task.status === "ACTIVATED" ? "เสร็จสิ้น" : "รอทำ"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

