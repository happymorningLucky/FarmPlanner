import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, type, quantity, usageRate, unit, usageUnit, conversionRate } = body

  try {
    const rawQuantity = quantity !== undefined && quantity !== "" ? parseFloat(quantity) : undefined
    const convRate = conversionRate !== undefined ? (conversionRate ? parseFloat(conversionRate) : null) : undefined
    
    let addedQuantity = rawQuantity
    if (rawQuantity !== undefined && !isNaN(rawQuantity)) {
      if (convRate !== undefined && convRate !== null) {
        addedQuantity = rawQuantity * convRate
      } else {
        const existing = await prisma.inventory.findUnique({ where: { id } })
        if (existing?.conversionRate) {
          addedQuantity = rawQuantity * existing.conversionRate
        }
      }
    }

    const inv = await prisma.inventory.update({
      where: { id },
      data: {
        name,
        type,
        quantity: addedQuantity !== undefined && !isNaN(addedQuantity) ? { increment: addedQuantity } : undefined,
        usageRate: usageRate !== undefined && usageRate !== "" ? parseFloat(usageRate) : undefined,
        unit: unit !== undefined ? unit || null : undefined,
        usageUnit: usageUnit !== undefined ? usageUnit || null : undefined,
        conversionRate: convRate
      }
    })
    return NextResponse.json(inv)
  } catch (err) {
    console.error("Error updating inventory:", err)
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  try {
    // Check if it's used in tasks before deleting
    const tasksUsingIt = await prisma.taskUsage.count({ where: { inventoryId: id } })
    if (tasksUsingIt > 0) {
      return NextResponse.json({ error: "ไม่สามารถลบได้เนื่องจากพัสดุนี้ถูกอ้างอิงในแผนงาน" }, { status: 400 })
    }

    await prisma.inventory.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting inventory:", err)
    return NextResponse.json({ error: "Failed to delete inventory" }, { status: 500 })
  }
}
