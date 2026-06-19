import { prisma } from "@/lib/prisma"
import Calendar from "@/components/planner/Calendar"
import { getIssues } from "@/lib/actions/issueActions"

export const dynamic = "force-dynamic"

export default async function PlannerPage() {
  // Fetch tasks for the initial render (could fetch all or just current month)
  // For simplicity, we can fetch tasks from the past 2 months to next 2 months
  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1)
  const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0)

  const tasks = await prisma.task.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      }
    },
    include: {
      creator: true,
      updater: true,
      usages: {
        include: {
          inventory: true
        }
      }
    }
  })

  const issues = await getIssues()

  // We need to pass serializable data to Client Component
  const serializedTasks = tasks.map(t => ({
    ...t,
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))

  return (
    <div>
      <Calendar initialTasks={serializedTasks} issues={issues} />
    </div>
  )
}
