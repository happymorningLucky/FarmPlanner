import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { title, date, icon, color, plot, status, usages, waterVolume } = body

  // Block if ACTIVATED and stock insufficient
  if (status === "ACTIVATED" && usages && Array.isArray(usages) && usages.length > 0) {
    for (const usage of usages) {
      if (usage.inventoryId && usage.quantity) {
        const inv = await prisma.inventory.findUnique({ where: { id: usage.inventoryId } })
        if (inv && parseFloat(usage.quantity) > inv.quantity) {
          return NextResponse.json({ error: `สต๊อก ${inv.name} ไม่เพียงพอ กรุณาเติมสต๊อกก่อนเปลี่ยนสถานะ` }, { status: 400 })
        }
      }
    }
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        date: new Date(date),
        icon,
        color,
        plot,
        status: status || "WAITING",
        waterVolume: waterVolume ? parseFloat(waterVolume) : null,
        creatorId: session.user.id,
        updaterId: session.user.id,
      }
    })

    // Handle usages
    if (usages && Array.isArray(usages) && usages.length > 0) {
      for (const usage of usages) {
        if (usage.inventoryId && usage.quantity) {
          await prisma.taskUsage.create({
            data: {
              taskId: task.id,
              inventoryId: usage.inventoryId,
              quantity: parseFloat(usage.quantity)
            }
          })

          // Deduct inventory if ACTIVATED
          if (status === "ACTIVATED") {
            await prisma.inventory.update({
              where: { id: usage.inventoryId },
              data: { quantity: { decrement: parseFloat(usage.quantity) } }
            })
          }
        }
      }
    }



    return NextResponse.json(task)
  } catch (error) {
    return NextResponse.json({ error: "Error creating task" }, { status: 500 })
  }
}

export async function GET() {
  const tasks = await prisma.task.findMany({
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
  return NextResponse.json(tasks)
}
