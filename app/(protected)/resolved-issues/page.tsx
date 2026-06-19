import { getResolvedIssues } from "@/lib/actions/issueActions"
import { getUsers } from "@/lib/actions/userActions"
import ResolvedIssueClient from "./ResolvedIssueClient"

export default async function ResolvedIssuesPage() {
  const [resolvedIssues, users] = await Promise.all([
    getResolvedIssues(),
    getUsers(),
  ])

  return (
    <div style={{ padding: "1rem", maxWidth: "1024px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-primary)" }}>✅ ปัญหาที่ได้รับการแก้ไข</h1>
      <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>ประวัติปัญหาที่ผ่านการแก้ไขแล้ว เพื่อเป็นฐานความรู้</p>
      
      <ResolvedIssueClient 
        resolvedIssues={resolvedIssues} 
        users={users} 
      />
    </div>
  )
}
