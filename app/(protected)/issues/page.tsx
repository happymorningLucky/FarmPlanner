import { getIssues, getResolvedIssues } from "@/lib/actions/issueActions"
import { getUsers } from "@/lib/actions/userActions"
import IssueClient from "./IssueClient"

export default async function IssuesPage() {
  const [activeIssues, resolvedIssues, users] = await Promise.all([
    getIssues(),
    getResolvedIssues(),
    getUsers(),
  ])

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-[var(--accent-primary)]">⚠️ ปัญหาที่ต้องเฝ้าระวัง</h1>
      <p className="text-sm text-gray-500 mb-6">รวบรวมปัญหาและแนวทางปฏิบัติในแต่ละเดือน (นำไปแสดงเตือนบนปฏิทิน)</p>
      
      <IssueClient 
        activeIssues={activeIssues} 
        resolvedIssues={resolvedIssues} 
        users={users} 
      />
    </div>
  )
}
