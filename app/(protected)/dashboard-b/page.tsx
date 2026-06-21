import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import styles from "./dashboardB.module.css"
import { FiCheckCircle } from "react-icons/fi"
import NotificationClient from "./NotificationClient"
import GapHistoryClient from "./GapHistoryClient"
export const dynamic = "force-dynamic"

export default async function DashboardBPage() {
  // Fetch completed tasks (ACTIVATED)
  const completedTasks = await prisma.task.findMany({
    where: {
      status: "ACTIVATED",
    },
    orderBy: {
      date: "desc"
    },
    include: {
      usages: {
        include: {
          inventory: true
        }
      },
      updater: true
    }
  })

  // Fetch WAITING tasks for notifications
  const waitingTasks = await prisma.task.findMany({
    where: { status: "WAITING" },
    include: { usages: { include: { inventory: true } } }
  })

  return (
    <div className={styles.container}>
      <div style={{ marginBottom: "1.5rem" }}>
        {/* Header and PrintButton are now managed inside GapHistoryClient */}
      </div>

      <NotificationClient tasks={waitingTasks.map(t => ({...t, date: t.date.toISOString(), createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString()}))} />

      <GapHistoryClient completedTasks={completedTasks} />
    </div>
  )
}
