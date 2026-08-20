import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { eq } = await import("drizzle-orm");
  const { db, pool } = await import("@/lib/db");
  const schema = await import("@/db/schema");
  const {
    cages,
    eggCollections,
    expenses,
    farmMembers,
    farms,
    flockStageHistory,
    flocks,
    products,
    storefrontThemes,
    users,
  } = schema;

  const demoUserId = "user_demo_seed_kuku";

  await db
    .insert(users)
    .values({
      id: demoUserId,
      email: "demo@kukufarm.local",
      name: "Demo Farmer",
    })
    .onConflictDoUpdate({
      target: users.id,
      set: { name: "Demo Farmer", email: "demo@kukufarm.local" },
    });

  const existing = await db.query.farms.findFirst({
    where: eq(farms.slug, "green-valley"),
  });
  if (existing) {
    console.log("Demo farm already exists:", existing.slug);
    await pool.end();
    return;
  }

  const [farm] = await db
    .insert(farms)
    .values({
      name: "Green Valley Poultry",
      slug: "green-valley",
      currency: "KES",
      storefrontPublished: true,
    })
    .returning();

  await db.insert(farmMembers).values({
    farmId: farm.id,
    userId: demoUserId,
    role: "owner",
  });

  await db.insert(storefrontThemes).values({
    farmId: farm.id,
    layout: "classic",
    primaryColor: "#2d6a4f",
    accentColor: "#d4a373",
    backgroundColor: "#f7f4ef",
    textColor: "#1a1a1a",
    heroHeadline: "Eggs collected this morning",
    aboutBlurb:
      "Family-run layers in Kiambu. We sell trays of eggs and healthy point-of-lay birds.",
    contactPhone: "+254700000000",
    contactWhatsapp: "+254700000000",
    shippingNotes: "Nairobi delivery Tue/Thu. Farm pickup daily 8am–4pm.",
  });

  const [cage] = await db
    .insert(cages)
    .values({
      farmId: farm.id,
      name: "House A",
      capacity: 200,
      notes: "Layers",
    })
    .returning();

  const [flock] = await db
    .insert(flocks)
    .values({
      farmId: farm.id,
      cageId: cage.id,
      name: "Layer Batch 1",
      breed: "Kuroiler",
      quantity: 150,
      acquiredAt: "2025-11-01",
      stage: "layer",
    })
    .returning();

  await db.insert(flockStageHistory).values({
    flockId: flock.id,
    farmId: farm.id,
    fromStage: null,
    toStage: "layer",
    changedByUserId: demoUserId,
  });

  await db.insert(eggCollections).values({
    farmId: farm.id,
    flockId: flock.id,
    cageId: cage.id,
    collectedOn: new Date().toISOString().slice(0, 10),
    quantity: 120,
    brokenCount: 3,
    grade: "large",
    recordedByUserId: demoUserId,
  });

  await db.insert(expenses).values({
    farmId: farm.id,
    category: "vaccine",
    amount: "4500.00",
    incurredOn: new Date().toISOString().slice(0, 10),
    notes: "Newcastle vaccine",
    recordedByUserId: demoUserId,
  });

  await db.insert(products).values([
    {
      farmId: farm.id,
      type: "eggs",
      title: "Fresh eggs — tray of 30",
      description: "Large brown eggs from free-range layers.",
      price: "450.00",
      stockQty: 40,
      unitLabel: "tray",
      active: true,
    },
    {
      farmId: farm.id,
      type: "live_chicken",
      title: "Point of lay pullet",
      description: "16–18 week Kuroiler pullets.",
      price: "1200.00",
      stockQty: 25,
      unitLabel: "bird",
      active: true,
    },
  ]);

  console.log("Seeded demo farm:");
  console.log("  slug: green-valley");
  console.log("  shop: /shop/green-valley");
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
