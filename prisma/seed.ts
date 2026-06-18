import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('Sookchan666', 10)

  // Seed Admin
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      color: '#800080', // Purple
      role: 'ADMIN',
    },
  })

  console.log({ admin })

  // Seed Mock Inventory
  await prisma.inventory.createMany({
    data: [
      { name: 'ปุ๋ย 15-15-15', type: 'FERTILIZER', quantity: 100 },
      { name: 'ปุ๋ยยูเรีย 46-0-0', type: 'FERTILIZER', quantity: 50 },
      { name: 'สารป้องกันแมลง (Abamectin)', type: 'CHEMICAL', quantity: 20 },
      { name: 'สารกำจัดวัชพืช (Glufosinate)', type: 'CHEMICAL', quantity: 15 },
    ],
  })

  console.log('Mock inventory seeded')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
