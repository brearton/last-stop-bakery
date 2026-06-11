#!/usr/bin/env node
/**
 * Last Stop Bakery & Mercantile
 * Create Test Menu in Production Square
 *
 * This script creates a test category named "--test--" and adds the "Hostest Cake Cookie"
 * with the full recipe/ingredients provided by the user.
 *
 * IMPORTANT:
 * - This writes to your PRODUCTION Square account.
 * - Only catalog items are created (no orders, payments, or test sales).
 * - Uses idempotency keys so it is safe to re-run.
 * - User explicitly gave go-ahead for this action.
 *
 * Run with: node --env-file=.env scripts/create-test-menu.js
 */

import "dotenv/config";
import { SquareClient, SquareEnvironment, SquareError } from "square";

const TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const ENV = (process.env.SQUARE_ENVIRONMENT || "Sandbox").toLowerCase();

if (!TOKEN || TOKEN.length < 20) {
  console.error("❌ Missing SQUARE_ACCESS_TOKEN in .env");
  process.exit(1);
}

const squareEnvironment =
  ENV === "production" || ENV === "prod" ? SquareEnvironment.Production : SquareEnvironment.Sandbox;

if (squareEnvironment !== SquareEnvironment.Production) {
  console.warn("⚠️  Warning: Not running against Production (current env = " + ENV + ")");
}

const client = new SquareClient({ token: TOKEN, environment: squareEnvironment });

async function main() {
  console.log("\n🟫 Last Stop Bakery & Mercantile — Create Test Menu (--test--)");
  console.log(
    `   Environment: ${squareEnvironment === SquareEnvironment.Production ? "PRODUCTION (LIVE)" : "SANDBOX"}`,
  );

  try {
    // Get the real location
    const locResp = await client.locations.list();
    const location = locResp.locations?.[0];
    if (!location) {
      throw new Error("No location found");
    }
    console.log(`   Using location: ${location.name} (${location.id})`);

    // 1. Create the "--test--" category
    console.log('\n📦 Creating category "--test--"...');
    const catIdempotency = "last-stop-test-menu-category-001";
    const catResp = await client.catalog.object.upsert({
      idempotencyKey: catIdempotency,
      object: {
        type: "CATEGORY",
        id: "#test-menu-category",
        categoryData: {
          name: "--test--",
        },
      },
    });
    const createdCat = catResp.object || catResp;
    const categoryId = createdCat.id;
    console.log(`   ✓ Category created: --test-- (ID: ${categoryId})`);

    // 2. Create the "Hostest Cake Cookie" item with full recipe
    console.log('\n🍪 Creating item "Hostest Cake Cookie"...');

    const fullDescription = `Hostest Cake Cookie

A rich, decadent cookie inspired by classic cake flavors, featuring a soft cookie base, fluffy marshmallow layer, and silky ganache topping.

Ingredients:

For the cookies:
1 cup salted butter melted
1 ¼ cup granulated sugar
¾ cup light brown sugar
2 tsp vanilla extract
2 eggs room temperature
1 ⅔ cups all-purpose flour
2 tsp corn starch
1 cup cocoa powder
1 tsp baking soda
½ tsp kosher salt

For the marshmallow layer:
¾ cup salted butter room temperature. I use salted but you can use unsalted if you prefer!
7 oz marshmallow creme
1 tsp vanilla extract
2 cups powdered sugar
½ tsp kosher salt
2 tbsp heavy cream or milk room temperature

For the ganache:
8 oz semi-sweet chocolate I like to use baking chocolate bars but you can use chocolate chips as well!
¾ cup heavy cream`;

    const itemIdempotency = "last-stop-test-menu-hostest-cake-cookie-001";
    const itemResp = await client.catalog.object.upsert({
      idempotencyKey: itemIdempotency,
      object: {
        type: "ITEM",
        id: "#hostest-cake-cookie",
        itemData: {
          name: "Hostest Cake Cookie",
          description: fullDescription,
          categoryId: categoryId,
          variations: [
            {
              type: "ITEM_VARIATION",
              id: "#hostest-cake-cookie-var",
              itemVariationData: {
                name: "Each",
                pricingType: "FIXED_PRICING",
                priceMoney: {
                  amount: 550n, // $5.50 (must be BigInt in this SDK version)
                  currency: "USD",
                },
              },
            },
          ],
        },
      },
    });

    const createdItem = itemResp.object || itemResp;
    console.log(`   ✓ Item created: Hostest Cake Cookie (ID: ${createdItem.id})`);

    console.log('\n✅ Test menu "--test--" successfully created in Square!');
    console.log("\nNext steps:");
    console.log("  • Run `npm run square:connect` to verify the new items appear in your catalog.");
    console.log("  • Check your Square Dashboard > Items to see the --test-- category and cookie.");
    console.log(
      "  • This is a test menu — you can delete or modify it anytime in the Square dashboard.",
    );
  } catch (err) {
    if (err instanceof SquareError) {
      console.error("\n❌ Square API error:");
      console.error(JSON.stringify(err.errors, null, 2));
    } else {
      console.error("\n❌ Error:", err.message || err);
    }
    console.error("\nCommon fixes:");
    console.error("  • Ensure your Production token has Catalog write permissions.");
    console.error("  • Check that you are using the correct .env (Production token).");
    process.exit(1);
  }
}

main();
