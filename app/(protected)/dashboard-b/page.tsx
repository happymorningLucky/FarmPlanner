import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import styles from "./dashboardB.module.css"
import { FiCheckCircle } from "react-icons/fi"
import NotificationClient from "./NotificationClient"
import PrintButton from "./PrintButton"
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }} className="print:hidden">
        <div>
          <h1 className={styles.title} style={{ margin: 0 }}>ประวัติการทำงาน (GAP)</h1>
          <p className={styles.subtitle} style={{ margin: 0, marginTop: "0.5rem" }}>สรุปข้อมูลการปฏิบัติงานเพื่อใช้ประกอบการประเมินมาตรฐาน GAP</p>
        </div>
        <PrintButton />
      </div>

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-center">ประวัติการทำงาน (GAP)</h1>
      </div>

      <NotificationClient tasks={waitingTasks.map(t => ({...t, date: t.date.toISOString(), createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString()}))} />

      <GapHistoryClient completedTasks={completedTasks} />
    </div>
  )
}
