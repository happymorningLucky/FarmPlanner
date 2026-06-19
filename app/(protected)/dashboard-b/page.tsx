import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import styles from "./dashboardB.module.css"
import { FiCheckCircle } from "react-icons/fi"
import NotificationClient from "./NotificationClient"
import PrintButton from "./PrintButton"

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

      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>วันที่ดำเนินการ</th>
                <th>ชื่องาน / กิจกรรม</th>
                <th>แปลง</th>
                <th>พัสดุและปริมาณที่ใช้ (ปุ๋ย/ยา)</th>
                <th>ผู้บันทึก</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {completedTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>ยังไม่มีประวัติการทำงาน</td>
                </tr>
              ) : (
                completedTasks.map(task => (
                  <tr key={task.id}>
                    <td>{format(task.date, "dd MMM yyyy", { locale: th })}</td>
                    <td>
                      <span className={styles.icon}>{task.icon}</span> 
                      {task.title}
                    </td>
                    <td>{task.plot || "-"}</td>
                    <td>
                      {task.usages && task.usages.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: "1.2rem", listStyleType: "circle", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {task.usages.map((u: any, idx: number) => (
                            <li key={idx}>
                              {u.inventory?.name} : <strong>{u.quantity} {u.inventory?.usageUnit || 'หน่วย'}</strong>
                            </li>
                          ))}
                        </ul>
                      ) : "-"}
                    </td>
                    <td>{task.updater?.username || "-"}</td>
                    <td>
                      <span className={styles.statusActivated}>
                        <FiCheckCircle /> เสร็จสิ้น
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
