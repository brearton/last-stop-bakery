#!/usr/bin/env node
/**
 * Last Stop Bakery & Mercantile
 * Square Account Connector & Data Puller
 *
 * Purpose: Connect to your real Square account and harvest key business data
 * so we can build a data-driven growth plan.
 *
 * Usage:
 *   1. Copy .env.example -> .env and add your token
 *   2. npm run square:pull
 *
 * This script:
 * - Validates the connection and prints your Square locations
 * - Pulls your Catalog (items, categories) — great for menu alignment
 * - Pulls recent Payments (last ~90 days, capped) for revenue signals
 * - Saves raw JSONs to data/square/ (local only — do not commit real data)
 *
 * Next steps after successful run: share high-level numbers or redacted
 * excerpts here and we'll start the growth plan (product mix, pricing,
 * hours, marketing, wholesale, inventory, customer insights, etc.).
 */

import "dotenv/config";
import { SquareClient, SquareEnvironment, SquareError } from "square";
import fs from "node:fs";
import path from "node:path";

const TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const ENV = (process.env.SQUARE_ENVIRONMENT || "Sandbox").toLowerCase();
const LOCATION_ID = process.env.SQUARE_LOCATION_ID || undefined;

if (!TOKEN || TOKEN.includes("PASTE") || TOKEN.length < 20) {
  console.error("❌ Missing or placeholder SQUARE_ACCESS_TOKEN in .env");
  console.error("   → Copy .env.example to .env and paste your real token.");
  console.error("   → Get tokens at: https://developer.squareup.com/apps");
  process.exit(1);
}

const squareEnvironment =
  ENV === "production" || ENV === "prod" ? SquareEnvironment.Production : SquareEnvironment.Sandbox;

const client = new SquareClient({
  token: TOKEN,
  environment: squareEnvironment,
});

const DATA_DIR = path.join(process.cwd(), "data", "square");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveJSON(filename, data) {
  const full = path.join(DATA_DIR, filename);
  fs.writeFileSync(full, JSON.stringify(data, null, 2));
  console.log(`   ✓ Saved ${filename}`);
}

function formatMoney(money) {
  if (!money || !money.amount) return 0;
  // Square amounts are in the smallest currency unit (cents) as string or number
  const cents = typeof money.amount === "bigint" ? Number(money.amount) : Number(money.amount);
  return cents / 100;
}

async function listAllPages(apiCall, initialParams = {}) {
  const results = [];
  let cursor;
  let page = 0;
  const MAX_PAGES = 20; // safety for first-time pulls

  do {
    const params = { ...initialParams };
    if (cursor !== undefined) params.cursor = cursor;
    const resp = await apiCall(params);
    const items = resp.payments || resp.objects || resp.customers || [];
    results.push(...items);
    cursor = resp.cursor;
    page += 1;
    if (page >= MAX_PAGES) {
      console.log(`   (capped at ${MAX_PAGES} pages for safety on first run)`);
      break;
    }
  } while (cursor);

  return results;
}

async function main() {
  console.log("\n🟫 The Last Stop Bakery & Mercantile — Square Connector");
  console.log(
    `   Environment: ${squareEnvironment === SquareEnvironment.Production ? "PRODUCTION (live data)" : "SANDBOX (test data)"}`,
  );
  if (LOCATION_ID) console.log(`   Filtering to location: ${LOCATION_ID}`);

  ensureDataDir();

  try {
    // 1. Locations — proves we are talking to the right account
    console.log("\n📍 Fetching locations...");
    const locResp = await client.locations.list();
    const locations = locResp.locations || [];
    console.log(`   Found ${locations.length} location(s):`);
    locations.forEach((loc, i) => {
      console.log(
        `   ${i + 1}. ${loc.name || "Unnamed"} (ID: ${loc.id}) — ${loc.address?.locality || ""}`,
      );
    });
    saveJSON("locations.json", locations);

    if (locations.length === 0) {
      console.warn(
        "   ⚠️  No locations found. Check that the token belongs to an active Square account with locations set up.",
      );
    }

    // 2. Catalog — your real products (ITEMs + categories). Perfect for reconciling with the website menu.
    console.log("\n📦 Fetching catalog (items & categories)...");
    const catalog = await listAllPages(
      (params) => client.catalog.list({ types: "ITEM,CATEGORY,IMAGE", ...params }),
      {},
    );
    const itemCount = catalog.filter((o) => o.type === "ITEM").length;
    const catCount = catalog.filter((o) => o.type === "CATEGORY").length;
    console.log(
      `   Catalog objects: ${catalog.length} (Items: ${itemCount}, Categories: ${catCount})`,
    );
    saveJSON("catalog.json", catalog);

    // 3. Recent payments — core revenue signal. Pull last ~90 days.
    console.log("\n💳 Fetching recent payments (last ~90 days)...");
    const beginTime = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const payments = await listAllPages(
      (params) =>
        client.payments.list({
          beginTime,
          locationId: LOCATION_ID,
          limit: 100,
          sortField: "CREATED_AT",
          sortOrder: "DESC",
          ...params,
        }),
      {},
    );

    console.log(`   Pulled ${payments.length} payments`);

    if (payments.length > 0) {
      const totalRevenue = payments.reduce((sum, p) => sum + formatMoney(p.totalMoney), 0);
      const avgTicket = totalRevenue / payments.length;
      const currencies = new Set(payments.map((p) => p.totalMoney?.currency || "USD"));

      console.log(`   Sample gross revenue: $${totalRevenue.toFixed(2)}`);
      console.log(`   Average ticket: $${avgTicket.toFixed(2)}`);
      console.log(`   Currencies seen: ${Array.from(currencies).join(", ")}`);
    } else {
      console.log("   No payments in the window (common in Sandbox or brand new accounts).");
    }

    saveJSON("recent-payments.json", payments);

    // Optional quick peek at first few for structure
    if (payments.length > 0) {
      saveJSON("recent-payments-sample.json", payments.slice(0, 5));
    }

    // 4. Recent orders (for line items / true best-sellers)
    console.log("\n🧾 Fetching recent orders (for item-level data)...");
    let orders = [];
    try {
      const effectiveLocId = LOCATION_ID || (locations[0] && locations[0].id);
      if (effectiveLocId) {
        orders = await listAllPages(
          (params) =>
            client.orders.searchOrders({
              locationIds: [effectiveLocId],
              query: {
                filter: {
                  dateTimeFilter: {
                    createdAt: { startAt: beginTime },
                  },
                },
              },
              ...params,
            }),
          {},
        );
      }
    } catch (e) {
      console.log("   (orders search not available or no permission - using payments only)");
    }
    console.log(`   Pulled ${orders.length} orders`);
    saveJSON("recent-orders.json", orders);

    // Done
    console.log("\n✅ Connection successful. Data saved to data/square/");
    console.log("\nNext:");
    console.log("  • Review the JSON files (or run `cat data/square/locations.json` etc.)");
    console.log("  • Paste key numbers, top-level stats, or a few item names here");
    console.log(
      "  • We will immediately start building a concrete growth plan for Last Stop Bakery & Mercantile.",
    );
    console.log(
      "\nTip: When ready for live data, set SQUARE_ENVIRONMENT=Production in .env and re-run.\n",
    );
  } catch (err) {
    if (err instanceof SquareError) {
      console.error("\n❌ Square API error:");
      console.error(err.errors || err);
    } else {
      console.error("\n❌ Unexpected error:", err);
    }
    console.error("\nCommon fixes:");
    console.error("  • Double-check the token in .env");
    console.error(
      "  • Make sure you are using a Sandbox token while SQUARE_ENVIRONMENT=Sandbox (or vice-versa)",
    );
    console.error(
      "  • Confirm the token has the required permissions (Payments, Orders, Catalog, Locations)",
    );
    process.exit(1);
  }
}

main();
