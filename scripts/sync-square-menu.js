#!/usr/bin/env node
/**
 * Last Stop Bakery & Mercantile
 * Sync Menu from LIVE Google Apps Script Hub to Square Production
 *
 * This is the live hub solution:
 * - Google Sheet = your editable source of truth (names, ingredients with amounts, costs).
 * - Apps Script web app = always-live JSON endpoint (no publish-to-web snapshots, no re-publish needed after edits).
 * - This Node script = fetches the live hub, processes data (ingredients stripped of amounts + sorted ascending), and syncs to your Production Square catalog (categories + items).
 *
 * Setup:
 * 1. In the Google Sheet: Extensions > Apps Script.
 * 2. Replace all code with the Apps Script provided in the chat.
 * 3. Save, then Deploy > New deployment (or edit existing) as Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the /exec URL and paste it into the APPS_SCRIPT_URL constant below.
 * 5. Run this script anytime after editing the sheet.
 *
 * The Apps Script handles parsing your current sheet format and ingredient processing.
 * This gives you a true "live hub".
 */

import "dotenv/config";
import { SquareClient, SquareEnvironment, SquareError } from "square";
import { execSync } from "child_process";

const TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const ENV = (process.env.SQUARE_ENVIRONMENT || "Production").toLowerCase();

if (!TOKEN || TOKEN.length < 20) {
  console.error("❌ Missing SQUARE_ACCESS_TOKEN in .env");
  process.exit(1);
}

const squareEnvironment =
  ENV === "production" || ENV === "prod" ? SquareEnvironment.Production : SquareEnvironment.Sandbox;

console.log(`\n🟫 Last Stop Bakery & Mercantile — Sync Menu from Sheet Hub`);
console.log(
  `   Environment: ${squareEnvironment === SquareEnvironment.Production ? "PRODUCTION (LIVE)" : "SANDBOX"}`,
);

const client = new SquareClient({ token: TOKEN, environment: squareEnvironment });

// === LIVE HUB (Google Apps Script web app) ===
// This is the reliable live source for your menu data.
// The Apps Script web app always sees the latest edits in the Google Sheet
// (no "Publish to web" snapshot delays).
//
// IMPORTANT: Use the Square catalog export format for your Google Sheet columns
// (the CSV you just opened in Zed editor). Key columns: Item Name, Description,
// Categories, Price, Ingredients (optional for raw list with amounts - the script
// will process it: strip amounts, sort ascending by quantity, put clean list in Description).
//
// 1. Update your Google Sheet columns to match the Square catalog CSV header
//    (at minimum: Item Name, Description, Categories, Price; add Ingredients column
//    for the raw amounts from your recipe).
// 2. Paste the Apps Script code below into the sheet's Apps Script editor.
// 3. Deploy as Web App (Execute as: Me, Access: Anyone).
// 4. Copy the /exec URL and paste it into APPS_SCRIPT_URL (or .env).
// 5. Run this script anytime after editing the sheet.
//
// The hub will now use "this format" from your Square catalog download.

const APPS_SCRIPT_URL =
  process.env.APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbxM32MkUsjBxK362OPIbY5IoevU6m5B1gawFznyICv3wbR67XyAhSeO_JvIYj-7f4wfsg/exec"; // LIVE HUB - always fresh from your Google Sheet (using Square catalog format)

// Fetches JSON from the live Apps Script hub.
function fetchMenuData() {
  try {
    // Use curl with headers to reliably get JSON from Apps Script web app (some environments need User-Agent and Accept to avoid error pages)
    const output = execSync(
      `curl -L -s -H "Accept: application/json" -A "Mozilla/5.0 (compatible; GrokBot/1.0)" "${APPS_SCRIPT_URL}"`,
      { encoding: "utf8" },
    );
    const data = JSON.parse(output);
    if (data && data.error) {
      throw new Error("Apps Script error: " + data.error);
    }
    return data;
  } catch (e) {
    throw new Error("Failed to fetch from live Apps Script hub: " + (e.message || e));
  }
}

// (Ingredient processing now lives in the Apps Script for the live hub.
// The Apps Script returns pre-processed items with clean "ingredients" string
// and "description" ready for Square.)

async function main() {
  try {
    console.log("📥 Fetching menu from LIVE Google Apps Script hub...");
    const menuData = fetchMenuData();

    console.log("Hub response (truncated):", JSON.stringify(menuData).slice(0, 600) + "...");

    if (!menuData || !menuData.categories || menuData.categories.length === 0) {
      console.log("No categories/items found in live hub.");
      return;
    }

    // Get location (for logging only)
    const locResp = await client.locations.list();
    const location = locResp.locations?.[0];
    if (!location) throw new Error("No location found in Square");
    console.log(`Using Square location: ${location.name} (${location.id})`);

    // Loop over categories from the live hub (supports full multi-category menus)
    for (const catData of menuData.categories) {
      const catName = catData.name || "The Menu";
      console.log(`\n→ Processing category from hub: "${catName}"`);

      // Idempotent category creation using a stable client-side ID
      const catClientId = `#hub-cat-${catName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
      const catIdemp = `last-stop-hub-${catClientId}`;

      const catResp = await client.catalog.object.upsert({
        idempotencyKey: catIdemp,
        object: {
          type: "CATEGORY",
          id: catClientId,
          categoryData: { name: catName },
        },
      });

      const catObj = catResp.catalogObject || catResp.catalog_object || catResp.object || catResp;
      const categoryId =
        catObj.id ||
        (catResp.idMappings && catResp.idMappings[0] && catResp.idMappings[0].objectId);
      console.log(`   ✓ Category "${catName}" (ID: ${categoryId})`);

      // Create/update items from this category in the hub
      if (catData.items && catData.items.length > 0) {
        for (const itemData of catData.items) {
          if (!itemData.name) continue;

          console.log(`   → Item: ${itemData.name} @ ${itemData.price || itemData.cost}`);

          const priceMatch = String(itemData.price || itemData.cost || "5.00").match(/[\d.]+/);
          const priceCents = priceMatch ? Math.round(parseFloat(priceMatch[0]) * 100) : 500;
          const priceBig = BigInt(priceCents);

          const desc =
            itemData.description ||
            `${itemData.name}\n\n$${itemData.price || itemData.cost}\n\nIngredients: ${itemData.ingredients || ""}`;

          const itemClientId = `#hub-item-${itemData.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
          const itemIdemp = `last-stop-hub-${itemClientId}`;

          const itemResp = await client.catalog.object.upsert({
            idempotencyKey: itemIdemp,
            object: {
              type: "ITEM",
              id: itemClientId,
              itemData: {
                name: itemData.name,
                description: desc,
                categoryId: categoryId,
                variations: [
                  {
                    type: "ITEM_VARIATION",
                    id: `${itemClientId}-var`,
                    itemVariationData: {
                      name: "Each",
                      pricingType: "FIXED_PRICING",
                      priceMoney: {
                        amount: priceBig,
                        currency: "USD",
                      },
                    },
                  },
                ],
              },
            },
          });

          const itemObj =
            itemResp.catalogObject || itemResp.catalog_object || itemResp.object || itemResp;
          console.log(`      ✓ Item created/updated (ID: ${itemObj.id})`);
        }
      }
    }

    console.log("\n✅ Full menu synced to Square Production from live hub!");

    // 3. See it
    console.log("\n# 3. See it");
    console.log(
      "npm run square:connect   # pulls latest catalog to local data/square/ (may show limited due to token scopes)",
    );
    console.log("cat data/square/catalog.json");
    console.log("");
    console.log("Or (recommended):");
    console.log(
      "- Square Dashboard → Items (search the item name from your hub, e.g. 'Chocolate Chip Cookie')",
    );
    console.log(
      "- Or Items > Categories > 'The Menu' (refresh if needed; assign category to item in UI if it doesn't appear automatically)",
    );
    console.log("- Menus tab: edit 'The Menu' and add the category if using online menus");
    console.log("");
    console.log("The Google Sheet + Apps Script is the live hub.");
    console.log(
      "Edit the sheet → the web app sees it instantly → re-run `npm run sync-menu` to update Square.",
    );
  } catch (err) {
    if (err instanceof SquareError) {
      console.error("❌ Square error:", JSON.stringify(err.errors, null, 2));
    } else {
      console.error("❌ Error:", err.message || err);
    }
    process.exit(1);
  }
}

main();
