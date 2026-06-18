"use client"
import React, { useState } from "react"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { FiAlertTriangle } from "react-icons/fi"
import TaskModal from "@/components/planner/TaskModal"

export default function NotificationClient({ tasks }: { tasks: any[] }) {
  const [selectedTask, setSelectedTask] = useState<any | null>(null)

  // Find tasks that have unacknowledged warnings
  const warnings = tasks.filter(t => {
    if (t.status !== "WAITING" || t.isWarningAcknowledged) return false
    return t.usages.some((u: any) => {
      const inv = u.inventory
      if (!inv) return false
      return u.quantity > inv.quantity
    })
  })

  if (warnings.length === 0) return null

  const handleSaveTask = async (taskData: any) => {
    const res = await fetch(`/api/tasks/${taskData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData)
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => null)
      const errorMessage = errorData?.error || "เกิดข้อผิดพลาดในการบันทึก"
      alert(errorMessage)
      throw new Error(errorMessage)
    }
    window.location.reload()
  }

  return (
    <div style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", marginBottom: "2rem", border: "1px solid #f39c12" }}>
      <h2 style={{ fontSize: "1.25rem", color: "#e67e22", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <FiAlertTriangle /> แจ้งเตือนพัสดุไม่เพียงพอ ({warnings.length})
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {warnings.map(task => (
          <div 
            key={task.id} 
            onClick={() => setSelectedTask(task)}
            style={{ padding: "1rem", background: "#fdf3e7", borderRadius: "8px", cursor: "pointer", border: "1px solid #fdebd0", transition: "all 0.2s" }}
            onMouseOver={e => e.currentTarget.style.background = "#fae5d3"}
            onMouseOut={e => e.currentTarget.style.background = "#fdf3e7"}
          >
            <div style={{ fontWeight: "bold", color: "#d35400" }}>{task.icon} {task.title}</div>
            <div style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.25rem" }}>
              วันที่แผน: {format(new Date(task.date), "dd MMM yyyy", { locale: th })} | 
              รายการที่สต๊อกไม่พอ: {task.usages.filter((u:any) => u.quantity > u.inventory?.quantity).map((u:any) => u.inventory?.name).join(", ")}
            </div>
          </div>
        ))}
      </div>

      <TaskModal 
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        selectedDate={null}
        existingTask={selectedTask}
        onSave={handleSaveTask}
      />
    </div>
  )
}
