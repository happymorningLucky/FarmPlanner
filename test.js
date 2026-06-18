const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  const existingTask = await prisma.task.findUnique({ 
    where: { id: 'cmqjmvcm60001cikrl579sqrc' },
    include: { usages: true }
  })
  
  const usages = [
    { inventoryId: 'cmqjrj354000010sc80j73qa5', quantity: '6000' } // 6 units > available (3000 + 2000 = 5000)
  ]
  
  for (const usage of usages) {
    const inv = await prisma.inventory.findUnique({ where: { id: usage.inventoryId } })
    if (inv) {
      let availableQty = inv.quantity
      if (existingTask.status === "ACTIVATED") {
        const prevUsage = existingTask.usages.find((u) => u.inventoryId === usage.inventoryId)
        if (prevUsage) {
          availableQty += prevUsage.quantity
        }
      }
      console.log("Req:", parseFloat(usage.quantity), "Available:", availableQty)
      if (parseFloat(usage.quantity) > availableQty) {
        console.log("WOULD BLOCK")
      } else {
        console.log("WOULD PASS")
      }
    }
  }
}
test()
