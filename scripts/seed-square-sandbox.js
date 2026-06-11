#!/usr/bin/env node
/**
 * Last Stop Bakery & Mercantile
 * Square Sandbox Seeder
 *
 * Seeds realistic catalog items + sample transactions into your Sandbox
 * so we have concrete data for analysis and growth planning.
 *
 * Run with: npm run square:seed
 *
 * - Creates categories + items matching the website menu
 * - Creates 12-15 sample payments (with orders) spread over the last ~30 days
 * - Uses stable idempotency keys so re-runs are safe (no massive duplicates)
 * - After seeding, run `npm run square:connect` to pull the fresh data
 *
 * IMPORTANT: This only affects the SANDBOX environment. Never run against Production.
 *
 * Token scopes note: The provided sandbox token must have write permissions for Catalog, Orders, and Payments.
 * If upserts fail or catalog stays empty, use the Square Sandbox dashboard (Items section) to manually
 * add the 4 categories + 14 items from the website menu. It takes ~2 minutes and is the most reliable way.
 */

import "dotenv/config";
import { SquareClient, SquareEnvironment, SquareError } from "square";
import { randomUUID } from "node:crypto";

const TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const ENV = (process.env.SQUARE_ENVIRONMENT || "Sandbox").toLowerCase();

if (!TOKEN || TOKEN.includes("PASTE") || TOKEN.length < 20) {
  console.error("❌ Missing or placeholder SQUARE_ACCESS_TOKEN in .env");
  process.exit(1);
}

const squareEnvironment =
  ENV === "production" || ENV === "prod" ? SquareEnvironment.Production : SquareEnvironment.Sandbox;

if (squareEnvironment === SquareEnvironment.Production) {
  console.error("🛑 Refusing to seed Production. Set SQUARE_ENVIRONMENT=Sandbox first.");
  process.exit(1);
}

const client = new SquareClient({ token: TOKEN, environment: squareEnvironment });

// === Menu data (synced from the website) ===
const MENU = [
  {
    name: "Classic Sourdough",
    category: "Breads",
    price: 8.5,
    desc: "36-hour fermented loaf, crackling crust, tangy open crumb. Our daily foundation.",
    popular: true,
  },
  {
    name: "Seeded Whole Wheat",
    category: "Breads",
    price: 9,
    desc: "Nutty, hearty, loaded with flax, sesame, sunflower and pumpkin seeds.",
    unit: "loaf",
  },
  {
    name: "Rosemary Olive Loaf",
    category: "Breads",
    price: 9.5,
    desc: "Fragrant rosemary and briny kalamata olives baked into a golden crust.",
  },
  {
    name: "Butter Croissant",
    category: "Pastries",
    price: 4.25,
    desc: "Laminated daily with European butter. Flaky, golden, perfect with coffee.",
    popular: true,
  },
  {
    name: "Almond Croissant",
    category: "Pastries",
    price: 5.5,
    desc: "Filled with almond frangipane, finished with toasted almonds and powdered sugar.",
  },
  {
    name: "Cinnamon Morning Bun",
    category: "Pastries",
    price: 4.75,
    desc: "Swirled with cinnamon sugar and orange zest, baked until caramelized edges.",
  },
  {
    name: "Pain au Chocolat",
    category: "Pastries",
    price: 4.75,
    desc: "Two batons of dark chocolate wrapped in layers of buttery pastry.",
  },
  {
    name: "Ham & Gruyère Hand Pie",
    category: "Savories",
    price: 7.5,
    desc: "Flaky pastry pocket filled with smoked ham, aged gruyère and a touch of mustard.",
    popular: true,
  },
  {
    name: "Tomato & Basil Quiche",
    category: "Savories",
    price: 6.75,
    desc: "Individual slice. Slow-roasted tomatoes, fresh basil, farm egg custard in butter crust.",
  },
  {
    name: "Spinach Feta Pocket",
    category: "Savories",
    price: 7,
    desc: "Wild spinach, local feta, dill and lemon zest in a whole wheat crust.",
  },
  {
    name: "Strawberry Rhubarb Jam",
    category: "Mercantile",
    price: 9,
    desc: "Small batch, 9oz jar. Made with local berries and just enough sugar.",
    unit: "jar",
  },
  {
    name: "Wildflower Honey",
    category: "Mercantile",
    price: 11,
    desc: "Raw, unfiltered. From hives 12 miles up the canyon. 12oz jar.",
    unit: "jar",
    popular: true,
  },
  {
    name: "Willow Creek Coffee Beans",
    category: "Mercantile",
    price: 16,
    desc: "1 lb bag. Medium roast from our friends at Highline Roasters. Notes of cocoa and stone fruit.",
    unit: "bag",
  },
  {
    name: "Linen Apron - Natural",
    category: "Mercantile",
    price: 28,
    desc: "Heavyweight European linen, cross-back style. One size fits most. Built to last generations.",
  },
];

const CATEGORIES = ["Breads", "Pastries", "Savories", "Mercantile"];

async function getLocationId() {
  const resp = await client.locations.list();
  const loc = resp.locations?.[0];
  if (!loc?.id) throw new Error("No location found in this Square account");
  console.log(`📍 Using location: ${loc.name} (${loc.id})`);
  return loc.id;
}

async function seedCatalog(locationId) {
  console.log("\n📦 Seeding catalog (categories + items) using individual upserts...");

  // 1. Create categories (use idempotency so re-runs are safe)
  for (const catName of CATEGORIES) {
    const idempotencyKey = `last-stop-seed-cat-${catName.toLowerCase().replace(/\s+/g, "-")}`;
    await client.catalog.object.upsert({
      idempotencyKey,
      object: {
        type: "CATEGORY",
        id: `#${catName.toLowerCase().replace(/\s+/g, "-")}`,
        categoryData: { name: catName },
      },
    });
  }
  console.log(`   ✓ Category objects created/updated`);

  // 2. Fetch live categories to get real IDs by name (reliable across response shapes)
  const catList = await client.catalog.list({ types: "CATEGORY" });
  let catObjects = [];
  if (catList) {
    if (Array.isArray(catList)) catObjects = catList;
    else if (Array.isArray(catList.objects)) catObjects = catList.objects;
  }
  const catNameToId = {};
  catObjects.forEach((o) => {
    if (o.type === "CATEGORY" && o.categoryData?.name) {
      catNameToId[o.categoryData.name] = o.id;
    }
  });
  console.log(`   ✓ Loaded ${Object.keys(catNameToId).length} categories from catalog`);

  // 3. Create items referencing the live category IDs
  const nameToVariationId = {};

  for (const item of MENU) {
    const catId = catNameToId[item.category];
    if (!catId) throw new Error(`Missing category id for ${item.category}`);

    const safeName = item.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const idempotencyKey = `last-stop-seed-item-${safeName}`;

    const resp = await client.catalog.object.upsert({
      idempotencyKey,
      object: {
        type: "ITEM",
        id: `#item-${safeName}`,
        itemData: {
          name: item.name,
          description: item.desc,
          categoryId: catId,
          variations: [
            {
              type: "ITEM_VARIATION",
              id: `#var-${safeName}`,
              itemVariationData: {
                name: item.unit || "Each",
                pricingType: "FIXED_PRICING",
                priceMoney: {
                  amount: Math.round(item.price * 100),
                  currency: "USD",
                },
              },
            },
          ],
        },
      },
    });

    const created = resp.object || resp;
    // Find the variation ID
    let varId = null;
    const variations = created?.itemData?.variations || created?.variations || [];
    if (variations[0]?.id) varId = variations[0].id;
    if (varId) {
      nameToVariationId[item.name] = varId;
    }
  }

  console.log(`   ✓ Upserted ${Object.keys(nameToVariationId).length} items with variations`);
  return { nameToVariationId };
}

function pickWeightedItem() {
  // Bias toward popular items
  const popular = MENU.filter((m) => m.popular);
  const all = MENU;
  return Math.random() < 0.65
    ? popular[Math.floor(Math.random() * popular.length)]
    : all[Math.floor(Math.random() * all.length)];
}

async function seedSampleTransactions(locationId, nameToVariationId) {
  console.log("\n💳 Seeding sample transactions (orders + payments)...");

  // 14 realistic transactions over the last ~35 days
  const transactions = [
    {
      daysAgo: 1,
      hour: 8,
      items: [
        { name: "Classic Sourdough", qty: 2 },
        { name: "Butter Croissant", qty: 4 },
      ],
    },
    { daysAgo: 2, hour: 10, items: [{ name: "Ham & Gruyère Hand Pie", qty: 3 }] },
    {
      daysAgo: 3,
      hour: 7,
      items: [
        { name: "Classic Sourdough", qty: 1 },
        { name: "Wildflower Honey", qty: 1 },
      ],
    },
    {
      daysAgo: 4,
      hour: 14,
      items: [
        { name: "Almond Croissant", qty: 2 },
        { name: "Cinnamon Morning Bun", qty: 2 },
      ],
    },
    {
      daysAgo: 5,
      hour: 9,
      items: [
        { name: "Seeded Whole Wheat", qty: 1 },
        { name: "Strawberry Rhubarb Jam", qty: 2 },
      ],
    },
    {
      daysAgo: 7,
      hour: 11,
      items: [
        { name: "Classic Sourdough", qty: 3 },
        { name: "Pain au Chocolat", qty: 2 },
      ],
    },
    {
      daysAgo: 8,
      hour: 16,
      items: [
        { name: "Tomato & Basil Quiche", qty: 2 },
        { name: "Spinach Feta Pocket", qty: 1 },
      ],
    },
    {
      daysAgo: 10,
      hour: 8,
      items: [
        { name: "Butter Croissant", qty: 6 },
        { name: "Classic Sourdough", qty: 1 },
      ],
    },
    {
      daysAgo: 12,
      hour: 13,
      items: [
        { name: "Willow Creek Coffee Beans", qty: 1 },
        { name: "Linen Apron - Natural", qty: 1 },
      ],
    },
    { daysAgo: 14, hour: 7, items: [{ name: "Rosemary Olive Loaf", qty: 2 }] },
    {
      daysAgo: 18,
      hour: 15,
      items: [
        { name: "Ham & Gruyère Hand Pie", qty: 4 },
        { name: "Classic Sourdough", qty: 1 },
      ],
    },
    {
      daysAgo: 21,
      hour: 9,
      items: [
        { name: "Wildflower Honey", qty: 2 },
        { name: "Strawberry Rhubarb Jam", qty: 1 },
      ],
    },
    {
      daysAgo: 25,
      hour: 10,
      items: [
        { name: "Classic Sourdough", qty: 2 },
        { name: "Almond Croissant", qty: 3 },
        { name: "Cinnamon Morning Bun", qty: 2 },
      ],
    },
    {
      daysAgo: 30,
      hour: 12,
      items: [
        { name: "Seeded Whole Wheat", qty: 1 },
        { name: "Butter Croissant", qty: 3 },
      ],
    },
  ];

  let created = 0;

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    const date = new Date();
    date.setDate(date.getDate() - t.daysAgo);
    date.setHours(t.hour, Math.floor(Math.random() * 50), 0, 0);

    const lineItems = t.items.map((line) => {
      const varId = nameToVariationId[line.name];
      if (!varId) throw new Error(`Missing variation id for ${line.name}`);
      return {
        catalog_object_id: varId,
        quantity: String(line.qty),
      };
    });

    const idempotencyOrder = `last-stop-seed-order-${i}`;
    const orderResp = await client.orders.createOrder({
      idempotencyKey: idempotencyOrder,
      order: {
        location_id: locationId,
        line_items: lineItems,
        state: "COMPLETED",
      },
    });

    const order = orderResp.order || orderResp;
    const orderId = order.id;

    // Calculate total from lines (or use Square total, but for demo we compute)
    let totalCents = 0;
    t.items.forEach((line) => {
      const menuItem = MENU.find((m) => m.name === line.name);
      if (menuItem) totalCents += Math.round(menuItem.price * 100) * line.qty;
    });

    const idempotencyPay = `last-stop-seed-pay-${i}`;
    await client.payments.createPayment({
      sourceId: "cnon:card-nonce-ok", // Sandbox success nonce
      idempotencyKey: idempotencyPay,
      amountMoney: {
        amount: totalCents,
        currency: "USD",
      },
      orderId,
      locationId,
      note: "Last Stop Bakery & Mercantile — seeded test transaction",
    });

    created++;
    if (created % 4 === 0) process.stdout.write(".");
  }

  console.log(`\n   ✓ Created ${created} sample orders + payments`);
}

async function main() {
  console.log("\n🟫 Last Stop Bakery & Mercantile — Sandbox Seeder");
  console.log("   Environment: SANDBOX (safe test data only)\n");

  try {
    const locationId = await getLocationId();

    const { nameToVariationId } = await seedCatalog(locationId);

    await seedSampleTransactions(locationId, nameToVariationId);

    console.log("\n✅ Seeding complete!");
    console.log("\nNext steps:");
    console.log("  1. npm run square:connect     # Pull the new catalog + payments");
    console.log(
      "  2. npm run square:analyze     # Generate insights (once analysis script exists)",
    );
    console.log("  3. Review data/square/ files and the growth plan\n");
  } catch (err) {
    if (err instanceof SquareError) {
      console.error("\n❌ Square API error during seeding:");
      console.error(err.errors || err);
      console.error(
        "\nMake sure your sandbox token has write permissions for Catalog, Orders, and Payments.",
      );
    } else {
      console.error("\n❌ Seeding error:", err.message || err);
    }
    process.exit(1);
  }
}

main();
