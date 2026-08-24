import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const favorites = await prisma.favoriteTask.findMany({
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json(favorites)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { title, type, plot, icon, color } = await req.json()
    
    // Validate
    if (!title) return NextResponse.json({ error: "Missing title" }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { username: session.user.name! } })

    const newFavorite = await prisma.favoriteTask.create({
      data: {
        title,
        type: type || "TASK",
        plot,
        icon: icon || "📝",
        color: color || "#40E0D0",
        creatorId: user?.id
      }
    })

    return NextResponse.json(newFavorite)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to save favorite" }, { status: 500 })
  }
}
