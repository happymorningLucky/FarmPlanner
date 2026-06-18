import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        color: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { username, color, role } = body

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash("1234", 10)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        color: color || "#800080",
        role: role || "USER",
      },
      select: { id: true, username: true, color: true, role: true }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
