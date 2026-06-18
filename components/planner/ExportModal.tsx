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
  const exportRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  // Filter tasks based on selected range
  const start = startOfMonth(new Date(startMonth))
  const end = endOfMonth(new Date(endMonth))
  
  const filteredTasks = tasks.filter(t => {
    const taskDate = parseISO(t.date)
    return isWithinInterval(taskDate, { start, end })
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const handleExport = async () => {
    if (!exportRef.current) return
    setLoading(true)
    
    try {
      // Temporarily show the export container to capture it
      exportRef.current.style.display = "block"
      
      const canvas = await html2canvas(exportRef.current, { scale: 2 })
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
          <div className={styles.formGroup}>
            <label className={styles.label}>ตั้งแต่เดือน</label>
            <input type="month" className={styles.input} value={startMonth} onChange={e => setStartMonth(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>ถึงเดือน</label>
            <input type="month" className={styles.input} value={endMonth} onChange={e => setEndMonth(e.target.value)} />
          </div>
        </div>
        
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelBtn} disabled={loading}>ยกเลิก</button>
          <button onClick={handleExport} className={styles.exportBtn} disabled={loading}>
            <FiDownload /> {loading ? "กำลังสร้าง PDF..." : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Hidden container to capture as PDF */}
      <div ref={exportRef} style={{ display: "none", position: "absolute", left: "-9999px", top: 0, width: "800px", padding: "40px", backgroundColor: "white", color: "black", fontFamily: "'Prompt', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "2px solid #8e44ad", paddingBottom: "20px" }}>
          <div>
            <h1 style={{ color: "#8e44ad", margin: 0 }}>Farm Planner</h1>
            <p style={{ margin: "5px 0 0 0", fontSize: "16px", color: "#666" }}>
              แผนงานตั้งแต่: {format(start, "MMMM yyyy", { locale: th })} ถึง {format(end, "MMMM yyyy", { locale: th })}
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <QRCodeCanvas value={`${appUrl}/planner`} size={100} />
            <p style={{ fontSize: "12px", marginTop: "5px" }}>สแกนเพื่อดูในมือถือ</p>
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
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "#666" }}>ไม่มีงานในช่วงเดือนนี้</td>
              </tr>
            ) : (
              filteredTasks.map(task => (
                <tr key={task.id}>
                  <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{format(parseISO(task.date), "dd MMM yyyy", { locale: th })}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{task.icon} {task.title} {task.plot ? `(${task.plot})` : ""}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
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
