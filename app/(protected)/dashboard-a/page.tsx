import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import DashboardAClient from "./DashboardAClient"

export default async function DashboardAPage() {
  const session = await getServerSession(authOptions)

  if (session?.user?.role !== "ADMIN") {
    redirect("/planner")
  }

  // Fetch Inventory
  const inventories = await prisma.inventory.findMany({
    orderBy: { quantity: 'asc' } // Show lowest stock first
  })

  // Generate Mock IoT Data
  const mockIoT = {
    soilMoisture: Math.floor(Math.random() * 40) + 30, // 30-70%
    phLevel: (Math.random() * 2 + 5.5).toFixed(1), // 5.5 - 7.5
    nitrogen: Math.floor(Math.random() * 50) + 50, // 50-100 mg/kg
    phosphorus: Math.floor(Math.random() * 30) + 20, // 20-50 mg/kg
    potassium: Math.floor(Math.random() * 100) + 100, // 100-200 mg/kg
  }

  return (
    <DashboardAClient inventories={inventories} mockIoT={mockIoT} />
  )
}
