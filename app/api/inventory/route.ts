import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"

export async function GET() {
  try {
    const inventories = await prisma.inventory.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(inventories)
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, type, quantity, usageRate, unit, usageUnit, conversionRate } = body

  if (!name || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const rawQuantity = quantity ? parseFloat(quantity) : 0
    const convRate = conversionRate ? parseFloat(conversionRate) : null
    
    // Convert to sub-units if conversionRate is provided
    const storedQuantity = convRate ? rawQuantity * convRate : rawQuantity

    const inv = await prisma.inventory.create({
      data: {
        name,
        type,
        quantity: storedQuantity,
        usageRate: usageRate ? parseFloat(usageRate) : 0,
        unit: unit || null,
        usageUnit: usageUnit || null,
        conversionRate: convRate
      }
    })
    return NextResponse.json(inv)
  } catch (err) {
    console.error("Error creating inventory:", err)
    return NextResponse.json({ error: "Failed to create inventory" }, { status: 500 })
  }
}
