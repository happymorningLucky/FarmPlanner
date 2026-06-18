const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const task = await prisma.task.findUnique({
    where: { id: 'cmqjmvcm60001cikrl579sqrc' },
    include: { usages: true }
  })
  console.log("Task 'พ่นยาใบ' usages:")
  for (const usage of task.usages) {
    const inv = await prisma.inventory.findUnique({ where: { id: usage.inventoryId } })
    console.log(`- Inventory: ${inv.name}`)
    console.log(`  Current Stock (DB): ${inv.quantity}`)
    console.log(`  This Task Used: ${usage.quantity}`)
    console.log(`  Total Originally Available: ${inv.quantity + usage.quantity}`)
  }
}

check()
