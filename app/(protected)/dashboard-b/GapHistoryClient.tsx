"use client"

import { useState } from "react"
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns"
import { th } from "date-fns/locale"
import { FiCheckCircle, FiSearch, FiCalendar, FiMapPin, FiX } from "react-icons/fi"
import styles from "./dashboardB.module.css"
import PrintButton from "./PrintButton"

export default function GapHistoryClient({ completedTasks }: { completedTasks: any[] }) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [plotSearch, setPlotSearch] = useState("")
  const [keywordSearch, setKeywordSearch] = useState("")

  const filteredTasks = completedTasks.filter(task => {
    // Date filter
    if (startDate && endDate) {
      const taskDate = new Date(task.date)
      const start = startOfDay(parseISO(startDate))
      const end = endOfDay(parseISO(endDate))
      if (!isWithinInterval(taskDate, { start, end })) {
        return false
      }
    } else if (startDate) {
      const taskDate = new Date(task.date)
      const start = startOfDay(parseISO(startDate))
      if (taskDate < start) return false
    } else if (endDate) {
      const taskDate = new Date(task.date)
      const end = endOfDay(parseISO(endDate))
      if (taskDate > end) return false
    }

    // Plot filter
    if (plotSearch) {
      if (!task.plot || !task.plot.toLowerCase().includes(plotSearch.toLowerCase())) {
        return false
      }
    }

    // Keyword filter
    if (keywordSearch) {
      const searchLower = keywordSearch.toLowerCase()
      const titleMatch = task.title.toLowerCase().includes(searchLower)
      const usageMatch = task.usages?.some((u: any) => 
        u.inventory?.name.toLowerCase().includes(searchLower)
      )
      if (!titleMatch && !usageMatch) {
        return false
      }
    }

    return true
  })

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setPlotSearch("")
    setKeywordSearch("")
  }

  const hasFilters = startDate || endDate || plotSearch || keywordSearch

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }} className="print:hidden">
        <div>
          <h1 className={styles.title} style={{ margin: 0 }}>ประวัติการทำงาน (GAP)</h1>
          <p className={styles.subtitle} style={{ margin: 0, marginTop: "0.5rem" }}>สรุปข้อมูลการปฏิบัติงานเพื่อใช้ประกอบการประเมินมาตรฐาน GAP</p>
        </div>
        <PrintButton />
      </div>

      {/* Print-only header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-center mb-2">ประวัติการทำงาน (GAP)</h1>
        {hasFilters && (
          <div className="text-center text-sm text-gray-700 mb-4 border-b pb-2">
            <strong>ตัวกรองที่ใช้งาน: </strong>
            {startDate && endDate && <span>ช่วงวันที่: {format(new Date(startDate), "dd MMM yyyy", { locale: th })} ถึง {format(new Date(endDate), "dd MMM yyyy", { locale: th })} | </span>}
            {startDate && !endDate && <span>ตั้งแต่วันที่: {format(new Date(startDate), "dd MMM yyyy", { locale: th })} | </span>}
            {!startDate && endDate && <span>ถึงวันที่: {format(new Date(endDate), "dd MMM yyyy", { locale: th })} | </span>}
            {plotSearch && <span>แปลง: {plotSearch} | </span>}
            {keywordSearch && <span>ค้นหา: {keywordSearch}</span>}
          </div>
        )}
      </div>

      {/* Filter UI */}
      <div className="print:hidden" style={{ backgroundColor: "var(--color-surface)", padding: "1rem 1.5rem", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--color-border)", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.25rem" }}><FiCalendar /> ตั้งแต่วันที่:</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "0.5rem", backgroundColor: "var(--color-background)", color: "var(--color-text-main)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.25rem" }}><FiCalendar /> ถึงวันที่:</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "0.5rem", backgroundColor: "var(--color-background)", color: "var(--color-text-main)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.25rem" }}><FiMapPin /> ค้นหาแปลง:</label>
          <input type="text" placeholder="ชื่อแปลง..." value={plotSearch} onChange={e => setPlotSearch(e.target.value)} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "0.5rem", backgroundColor: "var(--color-background)", color: "var(--color-text-main)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: "200px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.25rem" }}><FiSearch /> ค้นหาพัสดุ/งาน:</label>
          <input type="text" placeholder="ชื่องาน, ปุ๋ย, ยา..." value={keywordSearch} onChange={e => setKeywordSearch(e.target.value)} style={{ width: "100%", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "0.5rem", backgroundColor: "var(--color-background)", color: "var(--color-text-main)" }} />
        </div>
        {hasFilters && (
          <button onClick={clearFilters} style={{ color: "red", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", background: "none", border: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <FiX /> ล้างตัวกรอง
          </button>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>วันที่ดำเนินการ</th>
              <th>ชื่องาน / กิจกรรม</th>
              <th>แปลง</th>
              <th>พัสดุและปริมาณที่ใช้ (ปุ๋ย/ยา)</th>
              <th>ผู้บันทึก</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  {hasFilters ? "ไม่พบข้อมูลที่ตรงกับตัวกรอง" : "ยังไม่มีประวัติการทำงาน"}
                </td>
              </tr>
            ) : (
              filteredTasks.map((task: any) => (
                <tr key={task.id}>
                  <td>{format(new Date(task.date), "dd MMM yyyy", { locale: th })}</td>
                  <td>
                    <span className={styles.icon}>{task.icon}</span> 
                    {task.title}
                  </td>
                  <td>{task.plot || "-"}</td>
                  <td>
                    {task.usages && task.usages.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: "1.2rem", listStyleType: "circle", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {task.usages.map((u: any, idx: number) => (
                          <li key={idx}>
                            {u.inventory?.name} : <strong>{u.quantity} {u.inventory?.usageUnit || 'หน่วย'}</strong>
                          </li>
                        ))}
                      </ul>
                    ) : "-"}
                  </td>
                  <td>{task.updater?.username || "-"}</td>
                  <td>
                    <span className={styles.statusActivated}>
                      <FiCheckCircle /> เสร็จสิ้น
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  )
}
