import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { title, date, icon, color, plot, status, usages, waterVolume } = body

  try {
    const existingTask = await prisma.task.findUnique({ 
      where: { id },
      include: { usages: true }
    })
    if (!existingTask) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Validation: Block if ACTIVATED and stock insufficient
    if (status === "ACTIVATED" && usages && Array.isArray(usages) && usages.length > 0) {
      for (const usage of usages) {
        if (usage.inventoryId && usage.quantity) {
          const inv = await prisma.inventory.findUnique({ where: { id: usage.inventoryId } })
          if (inv) {
            let availableQty = inv.quantity
            if (existingTask.status === "ACTIVATED") {
              const prevUsage = existingTask.usages.find((u: any) => u.inventoryId === usage.inventoryId)
              if (prevUsage) {
                availableQty += prevUsage.quantity
              }
            }
            if (parseFloat(usage.quantity) > availableQty) {
              return NextResponse.json({ error: `สต๊อก ${inv.name} ไม่เพียงพอ กรุณาเติมสต๊อกก่อนเปลี่ยนสถานะ` }, { status: 400 })
            }
          }
        }
      }
    }

    // Revert previous inventory deduction if it was ACTIVATED
    if (existingTask.status === "ACTIVATED") {
      for (const usage of existingTask.usages) {
        await prisma.inventory.update({
          where: { id: usage.inventoryId },
          data: { quantity: { increment: usage.quantity } }
        })
      }
    }

    // Delete existing usages
    await prisma.taskUsage.deleteMany({
      where: { taskId: id }
    })

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        date: new Date(date),
        icon,
        color,
        plot,
        status: status || existingTask.status,
        waterVolume: waterVolume !== undefined ? (waterVolume ? parseFloat(waterVolume) : null) : existingTask.waterVolume,
        updaterId: session.user.id,
        isWarningAcknowledged: usages ? false : undefined,
      }
    })

    // Handle new usages
    if (usages && Array.isArray(usages) && usages.length > 0) {
      for (const usage of usages) {
        if (usage.inventoryId && usage.quantity) {
          await prisma.taskUsage.create({
            data: {
              taskId: id,
              inventoryId: usage.inventoryId,
              quantity: parseFloat(usage.quantity)
            }
          })

          // Deduct inventory if new status is ACTIVATED
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
    console.error("PUT Error:", error)
    return NextResponse.json({ error: "Error updating task", details: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  try {
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { usages: true }
    })

    if (existingTask && existingTask.status === "ACTIVATED") {
      for (const usage of existingTask.usages) {
        await prisma.inventory.update({
          where: { id: usage.inventoryId },
          data: { quantity: { increment: usage.quantity } }
        })
      }
    }

    await prisma.task.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Error deleting task" }, { status: 500 })
  }
}
