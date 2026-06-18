import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  try {
    const existingTask = await prisma.task.findUnique({ where: { id } })
    if (!existingTask) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const task = await prisma.task.update({
      where: { id },
      data: {
        isWarningAcknowledged: true,
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error("POST Error:", error)
    return NextResponse.json({ error: "Error updating task", details: String(error) }, { status: 500 })
  }
}
