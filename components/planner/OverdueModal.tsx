"use client"

import { FiX, FiCheck, FiTrash2, FiAlertCircle } from "react-icons/fi"
import { format, parseISO } from "date-fns"
import { th } from "date-fns/locale"
import styles from "./OverdueModal.module.css"
import { useState } from "react"

type Task = {
  id: string
  title: string
  date: string
  endDate?: string | null
  status: string
  icon: string
  color: string
}

type OverdueModalProps = {
  isOpen: boolean
  onClose: () => void
  overdueTasks: Task[]
  onCompleteTask: (task: Task) => Promise<void>
  onDeleteTask: (id: string) => Promise<void>
}

export default function OverdueModal({ isOpen, onClose, overdueTasks, onCompleteTask, onDeleteTask }: OverdueModalProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleComplete = async (task: Task) => {
    setLoadingId(task.id)
    try {
      await onCompleteTask(task)
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบงานค้างนี้?")) {
      setLoadingId(id)
      try {
        await onDeleteTask(id)
      } finally {
        setLoadingId(null)
      }
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <FiAlertCircle size={24} /> งานค้าง ({overdueTasks.length})
          </h2>
          <button onClick={onClose} className={styles.closeBtn}><FiX size={24} /></button>
        </div>
        
        <div className={styles.body}>
          {overdueTasks.length > 0 ? (
            <div className={styles.taskList}>
              {overdueTasks.map(task => {
                const startDate = parseISO(task.date)
                const endDate = task.endDate ? parseISO(task.endDate) : null
                
                let dateDisplay = format(startDate, "dd MMM yy", { locale: th })
                if (endDate && endDate.getTime() !== startDate.getTime()) {
                  dateDisplay += ` - ${format(endDate, "dd MMM yy", { locale: th })}`
                }

                return (
                  <div key={task.id} className={styles.taskItem} style={{ borderLeft: `4px solid ${task.color}` }}>
                    <div className={styles.taskHeader}>
                      <span className={styles.taskIcon}>{task.icon}</span>
                      <span className={styles.taskTitle}>{task.title}</span>
                      <span className={styles.taskDate}>{dateDisplay}</span>
                    </div>
                    <div className={styles.taskActions}>
                      <button 
                        className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                        onClick={() => handleDelete(task.id)}
                        disabled={loadingId === task.id}
                      >
                        <FiTrash2 /> ลบทิ้ง
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.completeBtn}`} 
                        onClick={() => handleComplete(task)}
                        disabled={loadingId === task.id}
                      >
                        <FiCheck /> เสร็จสิ้น
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎉</div>
              <h3>ยอดเยี่ยมมาก!</h3>
              <p>ไม่มีงานค้างในระบบแล้ว</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
