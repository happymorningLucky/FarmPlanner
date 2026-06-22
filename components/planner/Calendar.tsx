"use client"

import { useState, useEffect } from "react"
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO,
  isBefore,
  startOfToday
} from "date-fns"
import { th } from "date-fns/locale"
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"
import styles from "./Calendar.module.css"

type Task = {
  id: string
  title: string
  date: string
  status: string
  icon: string
  color: string
  plot: string | null
  updater?: { color: string } | null
  overdueDays?: number | null
}

type WeatherData = {
  time: string[]
  temperature_2m_max: number[]
  relative_humidity_2m_mean: number[]
  precipitation_probability_max: number[]
}

import TaskModal from "./TaskModal"
import ExportModal from "./ExportModal"
import { FiDownload } from "react-icons/fi"

type CalendarProps = {
  initialTasks: Task[]
  issues?: any[]
}

export default function Calendar({ initialTasks, issues = [] }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [locationInput, setLocationInput] = useState("")
  const [coords, setCoords] = useState({ lat: 13.75, lon: 100.51 })
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null)

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
  const [overdueAlerts, setOverdueAlerts] = useState<Task[]>([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  
  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // Fetch Weather
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,relative_humidity_2m_mean,precipitation_probability_max&timezone=auto&forecast_days=14&past_days=31`)
        const data = await res.json()
        if (data.error) {
          alert("พิกัดไม่ถูกต้อง หรือไม่สามารถดึงข้อมูลสภาพอากาศได้")
          return
        }
        setWeatherData(data.daily)
      } catch (err) {
        console.error("Failed to fetch weather", err)
      }
    }
    fetchWeather()
  }, [coords])

  // Check Overdue Tasks on Load
  useEffect(() => {
    const today = startOfToday()
    const overdue = tasks.filter(t => {
      const taskDate = parseISO(t.date)
      return t.status === "WAITING" && isBefore(taskDate, today)
    })

    if (overdue.length > 0) {
      setOverdueAlerts(overdue)
      
      // Check if we already alerted today
      const todayStr = format(today, 'yyyy-MM-dd')
      const lastAlert = localStorage.getItem('lastOverdueAlertDate')
      
      if (lastAlert !== todayStr) {
        localStorage.setItem('lastOverdueAlertDate', todayStr)
        setTimeout(() => {
          alert(`คุณมีงานที่ค้างจากวันก่อนหน้าจำนวน ${overdue.length} งาน พื้นหลังของงานจะเปลี่ยนเป็นสีส้ม กรุณาคลิกที่งานในปฏิทินเพื่อจัดการหรืออัปเดตสถานะ`)
        }, 500)
      }
    }
  }, [tasks])

  const handleSaveTask = async (taskData: any) => {
    const method = taskData.id ? "PUT" : "POST"
    const url = taskData.id ? `/api/tasks/${taskData.id}` : "/api/tasks"
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData)
    })
    
    if (res.ok) {
      const newTasksRes = await fetch("/api/tasks")
      if (newTasksRes.ok) {
        const data = await newTasksRes.json()
        setTasks(data)
      }
    } else {
      const errorData = await res.json().catch(() => null)
      const errorMessage = errorData?.error || "เกิดข้อผิดพลาดในการบันทึก"
      alert(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const handleDeleteTask = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    if (res.ok) {
      setTasks(tasks.filter(t => t.id !== id))
    } else {
      alert("เกิดข้อผิดพลาดในการลบ")
    }
  }

  const openNewTaskModal = (date: Date) => {
    setSelectedDate(date)
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const openEditTaskModal = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTask(task)
    setSelectedDate(null)
    setIsModalOpen(true)
  }

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const renderHeader = () => {
    return (
      <div className={styles.header}>
        <div className={styles.monthNav}>
          <button onClick={prevMonth} className={styles.navBtn}><FiChevronLeft size={24} /></button>
          <div className={styles.currentMonth}>
            {format(currentMonth, "MMMM yyyy", { locale: th })}
          </div>
          <button onClick={nextMonth} className={styles.navBtn}><FiChevronRight size={24} /></button>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <input 
            type="text" 
            placeholder="ละติจูด,ลองติจูด หรือ ชื่อสวน" 
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onBlur={(e) => parseLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && parseLocation(locationInput)}
            style={{ padding: "0.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", width: "200px" }}
          />
        </div>
      </div>
    )
  }

  const renderDays = () => {
    const days = []
    const dateFormat = "EEE"
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 0 })

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className={styles.weekday} key={i}>
          {format(addDays(startDate, i), dateFormat, { locale: th })}
        </div>
      )
    }
    return <div className={styles.grid} style={{ marginBottom: "0.5rem" }}>{days}</div>
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ""

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d")
        const cloneDay = day
        const isToday = isSameDay(day, new Date())
        const isCurrentMonth = isSameMonth(day, monthStart)
        const isPastDay = isBefore(day, startOfToday())
        
        const dayStr = format(day, "yyyy-MM-dd")
        let weatherIdx = -1
        if (weatherData) {
          weatherIdx = weatherData.time.indexOf(dayStr)
        }

        const dayTasks = tasks.filter(t => isSameDay(parseISO(t.date), cloneDay))

        let cellClasses = styles.dayCell
        if (!isCurrentMonth) cellClasses += ` ${styles.dayCellDisabled}`
        if (isToday) cellClasses += ` ${styles.dayCellToday}`
        if (isPastDay) cellClasses += ` ${styles.dayCellPast}`

        days.push(
          <div
            className={cellClasses}
            key={day.toString()}
            onClick={() => openNewTaskModal(cloneDay)}
          >
            <div className={styles.dayHeader}>
              <span className={`${styles.dateNum} ${isToday ? styles.dateNumToday : ""}`}>{formattedDate}</span>
              {weatherIdx !== -1 && (
                <div className={styles.weatherInfo}>
                  <span>{weatherData!.temperature_2m_max[weatherIdx]}°C</span>
                  <span>💧 {weatherData!.relative_humidity_2m_mean[weatherIdx]}%</span>
                  {weatherData!.precipitation_probability_max[weatherIdx] > 50 && (
                    <span className={styles.weatherDanger}>⛈️ {weatherData!.precipitation_probability_max[weatherIdx]}%</span>
                  )}
                </div>
              )}
            </div>
            
            <div className={styles.taskList}>
              {dayTasks.map(t => {
                const taskDate = parseISO(t.date)
                const isOverdue = t.status === "WAITING" && isBefore(taskDate, startOfToday())
                const bgColor = isOverdue ? "#f97316" : t.color
                
                return (
                  <div 
                    key={t.id} 
                    className={`${styles.taskItem} ${t.status === "ACTIVATED" ? styles.taskCompleted : ""}`}
                    style={{ backgroundColor: bgColor }}
                    onClick={(e) => openEditTaskModal(t, e)}
                  >
                    <span className={styles.taskIcon}>{t.icon}</span>
                    <span style={{ flexGrow: 1 }}>
                      {t.title}
                      {t.status === "ACTIVATED" && t.overdueDays && t.overdueDays > 0 ? ` (*เกิน ${t.overdueDays} วัน)` : ""}
                    </span>
                    {t.updater?.color && (
                      <div className={styles.taskUserDot} style={{ backgroundColor: t.updater.color }}></div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(<div className={styles.grid} key={day.toString()}>{days}</div>)
      days = []
    }
    return <div className={styles.calendarBody}>{rows}</div>
  }

  const currentMonthNum = currentMonth.getMonth() + 1
  const currentMonthIssues = issues.filter(issue => {
    if (issue.startMonth <= issue.endMonth) {
      return currentMonthNum >= issue.startMonth && currentMonthNum <= issue.endMonth
    } else {
      return currentMonthNum >= issue.startMonth || currentMonthNum <= issue.endMonth
    }
  })

  return (
    <div className={styles.calendarContainer}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ color: "var(--color-primary)", margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>ปฏิทินแผนงาน</h1>
          <p style={{ margin: 0, marginTop: "0.5rem", color: "var(--color-text-muted)" }}>แผนการทำงานและติดตามสภาพอากาศ</p>
        </div>
        <button 
          onClick={() => setIsExportModalOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: "var(--color-primary)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-md)",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          <FiDownload /> Export PDF
        </button>
      </div>

      {currentMonthIssues.length > 0 && (
        <div className={styles.amuletGrid}>
          {currentMonthIssues.map((issue, idx) => {
            const assigneeNames = issue.assignees?.map((a: any) => a.username).join(", ") || "ไม่ระบุ"
            const isExpanded = expandedIssue === idx
            
            return (
              <div 
                key={idx} 
                className={`${styles.amuletCard} ${isExpanded ? styles.amuletCardExpanded : ''}`}
                onClick={() => !isExpanded && setExpandedIssue(idx)}
                style={{ cursor: isExpanded ? "default" : "pointer" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div className={styles.amuletTitle} title={issue.problem} style={{ margin: isExpanded ? "0 0 0.5rem 0" : "0", flex: 1, wordBreak: "break-word", overflowWrap: "break-word" }}>
                    ⚠️ {isExpanded ? 'เฝ้าระวัง: ' : ''}{issue.problem}
                  </div>
                  {isExpanded && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setExpandedIssue(null) }}
                      style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "1.2rem", padding: "0 0.5rem" }}
                      title="ปิด"
                    >
                      &times;
                    </button>
                  )}
                </div>
                
                {isExpanded && (
                  <>
                    <p className={styles.amuletAction} title={issue.action}>
                      🎯 วิธีปฏิบัติ: <span className={styles.amuletActionHighlight}>{issue.action}</span>
                    </p>
                    <div className={styles.amuletAssignees}>
                      <span className={styles.amuletAssigneeLabel}>ผู้รับผิดชอบ</span>
                      <span className={styles.amuletAssigneeNames} title={assigneeNames.length > 30 ? "ทุกคน" : assigneeNames}>
                        {assigneeNames.length > 30 ? "ทุกคน" : assigneeNames}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className={styles.calendarWrapper}>
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        selectedDate={selectedDate}
        existingTask={editingTask}
      />
      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tasks={tasks}
      />
    </div>
  )
}
