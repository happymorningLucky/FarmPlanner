function test() {
  const usages = [{ inventoryId: '1', quantity: 5000 }];
  const status = "ACTIVATED";
  const inv = { id: '1', name: 'Item', quantity: 3000 };
  const existingTask = {
    status: "ACTIVATED",
    usages: [{ inventoryId: '1', quantity: 2000 }]
  };

  if (status === "ACTIVATED" && usages && Array.isArray(usages) && usages.length > 0) {
    for (const usage of usages) {
      if (usage.inventoryId && usage.quantity) {
        let availableQty = inv.quantity
        if (existingTask.status === "ACTIVATED") {
          const prevUsage = existingTask.usages.find((u) => u.inventoryId === usage.inventoryId)
          if (prevUsage) {
            availableQty += prevUsage.quantity
          }
        }
        console.log(`Checking: ${parseFloat(usage.quantity)} > ${availableQty}`)
        if (parseFloat(usage.quantity) > availableQty) {
          console.log("BLOCK")
          return
        }
      }
    }
  }
  console.log("PASS")
}

test()
