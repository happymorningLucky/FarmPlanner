"use client"

import { useState } from "react"
import { createIssue, resolveIssue, updateIssue, deleteIssue } from "@/lib/actions/issueActions"
import Link from "next/link"
import { useSession } from "next-auth/react"

const MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
]

export default function IssueClient({ activeIssues, resolvedIssues, users }: any) {
  const { data: session } = useSession()
  const [tab, setTab] = useState("ACTIVE")
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form State
  const [startMonth, setStartMonth] = useState(1)
  const [endMonth, setEndMonth] = useState(1)
  const [problem, setProblem] = useState("")
  const [action, setAction] = useState("")
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [editIssueId, setEditIssueId] = useState<string | null>(null)

  // Resolve State
  const [resolveTargetId, setResolveTargetId] = useState<string | null>(null)
  const [resolutionText, setResolutionText] = useState("")

  const handleToggleAssignee = (userId: string) => {
    if (assigneeIds.includes(userId)) {
      setAssigneeIds(assigneeIds.filter(id => id !== userId))
    } else {
      setAssigneeIds([...assigneeIds, userId])
    }
  }

  const handleSelectAll = () => {
    if (assigneeIds.length === users.length) {
      setAssigneeIds([]) // Deselect all
    } else {
      setAssigneeIds(users.map((u: any) => u.id)) // Select all
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!problem || !action || assigneeIds.length === 0) {
      alert("กรุณากรอกข้อมูลให้ครบและเลือกผู้รับผิดชอบอย่างน้อย 1 คน")
      return
    }
    setLoading(true)
    let res
    
    try {
      if (editIssueId) {
        res = await updateIssue(editIssueId, {
          startMonth,
          endMonth,
          problem,
          action,
          assigneeIds
        })
      } else {
        res = await createIssue({
          startMonth,
          endMonth,
          problem,
          action,
          assigneeIds
        })
      }

      setLoading(false)
      if (res.success) {
        setProblem("")
        setAction("")
        setAssigneeIds([])
        setStartMonth(1)
        setEndMonth(1)
        setIsAdding(false)
        setEditIssueId(null)
      } else {
        alert(res.error)
      }
    } catch (error) {
      setLoading(false)
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล")
    }
  }

  const handleEdit = (issue: any) => {
    setStartMonth(issue.startMonth)
    setEndMonth(issue.endMonth)
    setProblem(issue.problem)
    setAction(issue.action)
    setAssigneeIds(issue.assignees.map((a: any) => a.id))
    setEditIssueId(issue.id)
    setIsAdding(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id: string) => {
    if (confirm("คุณต้องการลบข้อมูลนี้ใช่หรือไม่?")) {
      await deleteIssue(id)
    }
  }

  const handleResolve = async () => {
    if (!resolveTargetId) return
    if (!resolutionText.trim()) {
      alert("กรุณาระบุวิธีแก้ปัญหา")
      return
    }
    
    const resolverId = users.find((u: any) => u.username === session?.user?.name)?.id
    if (!resolverId) {
      alert("ไม่พบผู้ใช้งานของคุณ")
      return
    }

    setLoading(true)
    const res = await resolveIssue(resolveTargetId, resolutionText, resolverId)
    setLoading(false)
    if (res.success) {
      setResolveTargetId(null)
      setResolutionText("")
    } else {
      alert(res.error)
    }
  }

  const renderAssignees = (assignees: any[]) => {
    if (!assignees || assignees.length === 0) return <span style={{ color: "var(--color-text-muted)" }}>-</span>
    if (assignees.length === users.length) {
      return (
        <span style={{ 
          padding: "0.25rem 0.5rem", 
          backgroundColor: "#dcfce7", 
          color: "#166534", 
          borderRadius: "999px", 
          fontSize: "0.8rem",
          fontWeight: 700 
        }}>
          ทุกคน
        </span>
      )
    }
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
        {assignees.map((a: any) => (
          <span 
            key={a.id} 
            style={{ 
              padding: "0.25rem 0.5rem", 
              backgroundColor: "var(--color-background)", 
              color: "var(--color-primary)", 
              borderRadius: "999px", 
              fontSize: "0.8rem",
              border: "1px solid var(--color-border)"
            }}
          >
            {a.username}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--color-surface)", padding: "1rem", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--color-border)", marginBottom: "1.5rem", gap: "1rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <button 
            style={{ 
              padding: "0.75rem 1.5rem", 
              borderRadius: "var(--radius-md)", 
              fontWeight: 700, 
              cursor: "default", 
              border: "1px solid var(--color-primary)", 
              backgroundColor: "var(--color-primary)", 
              color: "white" 
            }}
          >
            🚧 ปัญหาที่ยังอยู่ ({activeIssues.length})
          </button>
          <Link 
            href="/resolved-issues"
            style={{ 
              padding: "0.75rem 1.5rem", 
              borderRadius: "var(--radius-md)", 
              fontWeight: 700, 
              cursor: "pointer", 
              border: "1px solid var(--color-border)", 
              backgroundColor: "var(--color-background)", 
              color: "var(--color-text-main)",
              textDecoration: "none"
            }}
          >
            ✅ ปัญหาที่ได้รับการแก้ไข ({resolvedIssues.length})
          </Link>
        </div>
        <button 
          onClick={() => {
            if (isAdding) {
              setIsAdding(false)
              setEditIssueId(null)
              setProblem("")
              setAction("")
              setAssigneeIds([])
            } else {
              setIsAdding(true)
            }
          }}
          style={{ 
            backgroundColor: isAdding ? "var(--color-background)" : "var(--color-primary)", 
            color: isAdding ? "var(--color-text-main)" : "white", 
            padding: "0.75rem 1.5rem", 
            borderRadius: "var(--radius-md)", 
            fontWeight: 700, 
            cursor: "pointer", 
            border: isAdding ? "1px solid var(--color-border)" : "none",
            boxShadow: isAdding ? "none" : "var(--shadow-sm)"
          }}
        >
          {isAdding ? "✕ ยกเลิก" : "+ เพิ่มปัญหา"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} style={{ backgroundColor: "var(--color-surface)", padding: "1.5rem", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--color-border)", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-primary)", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>{editIssueId ? "ฟอร์มแก้ไขปัญหาที่ต้องเฝ้าระวัง" : "ฟอร์มเพิ่มปัญหาที่ต้องเฝ้าระวัง"}</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.25rem" }}>ตั้งแต่เดือน</label>
              <select 
                value={startMonth} 
                onChange={e => setStartMonth(Number(e.target.value))}
                style={{ width: "100%", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "0.75rem", backgroundColor: "var(--color-background)" }}
              >
                {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.25rem" }}>ถึงเดือน</label>
              <select 
                value={endMonth} 
                onChange={e => setEndMonth(Number(e.target.value))}
                style={{ width: "100%", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "0.75rem", backgroundColor: "var(--color-background)" }}
              >
                {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.25rem" }}>ปัญหาที่ต้องระวัง</label>
            <input 
              required
              type="text" 
              placeholder="เช่น โรครากเน่าโคนเน่า, แมลงหวี่ขาวระบาด"
              value={problem} 
              onChange={e => setProblem(e.target.value)}
              style={{ width: "100%", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "0.75rem", backgroundColor: "var(--color-background)" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.25rem" }}>สิ่งที่ต้องปฏิบัติ (วิธีป้องกัน/รับมือ)</label>
            <input 
              required
              type="text" 
              placeholder="เช่น ฉีดพ่นไตรโคเดอร์มาทุก 7 วัน, ตรวจเช็คกับดักกาวเหนียว"
              value={action} 
              onChange={e => setAction(e.target.value)}
              style={{ width: "100%", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "0.75rem", backgroundColor: "var(--color-background)" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)" }}>ผู้รับผิดชอบ</label>
              <button 
                type="button" 
                onClick={handleSelectAll}
                style={{ 
                  fontSize: "0.8rem", 
                  color: "var(--color-primary)", 
                  fontWeight: 700, 
                  cursor: "pointer", 
                  border: "1px solid var(--color-primary)", 
                  backgroundColor: "var(--color-surface)", 
                  padding: "0.4rem 0.8rem", 
                  borderRadius: "var(--radius-md)" 
                }}
              >
                {assigneeIds.length === users.length ? "ยกเลิกเลือกทุกคน" : "เลือกทุกคน"}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.75rem", backgroundColor: "var(--color-background)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
              {users.map((u: any) => (
                <label key={u.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={assigneeIds.includes(u.id)}
                    onChange={() => handleToggleAssignee(u.id)}
                    style={{ width: "1.2rem", height: "1.2rem", accentColor: "var(--color-primary)" }}
                  />
                  <span style={{ fontWeight: 500, color: "var(--color-text-main)" }}>{u.username}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{ backgroundColor: "var(--color-primary)", color: "white", padding: "0.75rem 2rem", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", border: "none", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>
        </form>
      )}

      {/* Issues List */}
      <div style={{ backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--color-background)", borderBottom: "2px solid var(--color-border)", textAlign: "left" }}>
              <th style={{ padding: "1.2rem 1rem", fontWeight: 700, color: "var(--color-text-main)", width: "15%" }}>ช่วงเดือน</th>
              <th style={{ padding: "1.2rem 1rem", fontWeight: 700, color: "var(--color-text-main)", width: "20%" }}>ปัญหา</th>
              <th style={{ padding: "1.2rem 1rem", fontWeight: 700, color: "var(--color-text-main)", width: "35%" }}>สิ่งที่ต้องปฏิบัติ</th>
              <th style={{ padding: "1.2rem 1rem", fontWeight: 700, color: "var(--color-text-main)", width: "15%" }}>ผู้รับผิดชอบ</th>
              <th style={{ padding: "1.2rem 1rem", fontWeight: 700, color: "var(--color-text-main)", textAlign: "right", width: "15%" }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {activeIssues.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>ไม่มีปัญหาที่ต้องเฝ้าระวัง</td>
              </tr>
            ) : (
              activeIssues.map((issue: any) => (
                <tr key={issue.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "1rem", color: "var(--color-text-main)" }}>
                    {MONTHS[issue.startMonth - 1]} - {MONTHS[issue.endMonth - 1]}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>⚠️ {issue.problem}</span>
                  </td>
                  <td style={{ padding: "1rem", color: "var(--color-text-main)" }}>{issue.action}</td>
                  <td style={{ padding: "1rem" }}>{renderAssignees(issue.assignees)}</td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button 
                        onClick={() => handleEdit(issue)}
                        style={{
                          backgroundColor: "#fef08a",
                          color: "#854d0e",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer"
                        }}
                      >
                        ✎ แก้ไข
                      </button>
                      <button 
                        onClick={() => handleDelete(issue.id)}
                        style={{
                          backgroundColor: "#fee2e2",
                          color: "#991b1b",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer"
                        }}
                      >
                        🗑️ ลบ
                      </button>
                      <button 
                        onClick={() => setResolveTargetId(issue.id)}
                        style={{
                          backgroundColor: "#dcfce7",
                          color: "#166534",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer"
                        }}
                      >
                        ✔ ปิดปัญหา
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Resolve Modal */}
      {resolveTargetId && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-lg)", width: "100%", maxWidth: "500px", padding: "2rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-text-main)" }}>ปิดปัญหา / ใส่วิธีแก้ไข</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>เพื่อเป็นฐานความรู้ กรุณาระบุวิธีที่คุณใช้แก้ไขปัญหานี้</p>
            <textarea 
              value={resolutionText}
              onChange={e => setResolutionText(e.target.value)}
              placeholder="เช่น ลดการให้น้ำลง 50%, พ่นยาฆ่าแมลงสูตร A"
              style={{ width: "100%", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1rem", backgroundColor: "var(--color-background)", minHeight: "120px", marginBottom: "1.5rem", fontFamily: "inherit" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button 
                onClick={() => {
                  setResolveTargetId(null)
                  setResolutionText("")
                }}
                style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)" }}
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleResolve}
                disabled={loading}
                style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", border: "none", backgroundColor: "#16a34a", color: "white", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "กำลังบันทึก..." : "ยืนยันการปิดปัญหา"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
