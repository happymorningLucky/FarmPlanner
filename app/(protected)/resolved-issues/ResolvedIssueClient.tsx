"use client"

import { useState } from "react"
import { deleteIssue } from "@/lib/actions/issueActions"
import Link from "next/link"

const MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
]

export default function ResolvedIssueClient({ resolvedIssues: initialIssues, users }: any) {
  const [issues, setIssues] = useState(initialIssues)

  const handleDelete = async (id: string) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลปัญหานี้?")) {
      const res = await deleteIssue(id)
      if (res.success) {
        setIssues(issues.filter((i: any) => i.id !== id))
      } else {
        alert(res.error || "ลบข้อมูลไม่สำเร็จ")
      }
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--color-surface)", padding: "1rem", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--color-border)", marginBottom: "1.5rem" }}>
        <Link 
          href="/issues"
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
          🔙 กลับไปหน้าปัญหาที่ต้องเฝ้าระวัง
        </Link>
      </div>

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
            {issues.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>ไม่มีข้อมูลปัญหาที่ได้รับการแก้ไข</td>
              </tr>
            ) : (
              issues.map((issue: any) => (
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
                    <div style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", textAlign: "left", marginBottom: "0.75rem" }}>
                      <span style={{ display: "block", fontWeight: 700, color: "#16a34a", marginBottom: "0.25rem" }}>วิธีแก้:</span>
                      {issue.resolution}
                    </div>
                    <button 
                      onClick={() => handleDelete(issue.id)}
                      style={{
                        backgroundColor: "#fee2e2",
                        color: "#991b1b",
                        padding: "0.4rem 0.6rem",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        float: "right"
                      }}
                    >
                      🗑️ ลบประวัติ
                    </button>
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
