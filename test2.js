const http = require('http')

async function testApi() {
  const payload = {
    title: "พ่นยาใบ",
    date: "2026-06-09T17:00:00.000Z",
    status: "ACTIVATED",
    icon: "🧪",
    color: "#1abc9c",
    plot: "คลองหิน",
    waterVolume: 8,
    usages: [
      { inventoryId: "cmqjlgcbx0003d4q309np4jv3", quantity: 3 },
      { inventoryId: "cmqjnnhhs0006cikrxmebzgl1", quantity: 9000 },
      { inventoryId: "cmqjrj354000010sc80j73qa5", quantity: 12000 } // previously 2000, current stock is 3000. 12000 > 5000.
    ]
  }

  const res = await fetch('http://localhost:3000/api/tasks/cmqjmvcm60001cikrl579sqrc', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await res.text()
  console.log(res.status, data)
}

testApi()
