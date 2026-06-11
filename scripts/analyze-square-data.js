#!/usr/bin/env node
/**
 * Last Stop Bakery & Mercantile
 * Square Data Analyzer
 *
 * Reads data/square/*.json (from npm run square:connect)
 * and produces actionable KPIs + growth recommendations.
 *
 * Falls back to the website menu when Square data is empty (common in fresh sandboxes).
 *
 * Run: npm run square:analyze
 */

import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data", "square");

function loadJSON(name) {
  const p = path.join(DATA_DIR, name);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

const locations = loadJSON("locations.json") || [];
const catalog = loadJSON("catalog.json") || [];
const payments = loadJSON("recent-payments.json") || [];
const orders = loadJSON("recent-orders.json") || [];

// Embedded menu from the site (source of truth until full catalog sync)
const MENU = [
  { name: "Classic Sourdough", category: "Breads", price: 8.5, popular: true },
  { name: "Seeded Whole Wheat", category: "Breads", price: 9 },
  { name: "Rosemary Olive Loaf", category: "Breads", price: 9.5 },
  { name: "Butter Croissant", category: "Pastries", price: 4.25, popular: true },
  { name: "Almond Croissant", category: "Pastries", price: 5.5 },
  { name: "Cinnamon Morning Bun", category: "Pastries", price: 4.75 },
  { name: "Pain au Chocolat", category: "Pastries", price: 4.75 },
  { name: "Ham & Gruyère Hand Pie", category: "Savories", price: 7.5, popular: true },
  { name: "Tomato & Basil Quiche", category: "Savories", price: 6.75 },
  { name: "Spinach Feta Pocket", category: "Savories", price: 7 },
  { name: "Strawberry Rhubarb Jam", category: "Mercantile", price: 9 },
  { name: "Wildflower Honey", category: "Mercantile", price: 11, popular: true },
  { name: "Willow Creek Coffee Beans", category: "Mercantile", price: 16 },
  { name: "Linen Apron - Natural", category: "Mercantile", price: 28 },
];

const categories = ["Breads", "Pastries", "Savories", "Mercantile"];

console.log("\n🟫 Last Stop Bakery & Mercantile — Data Analysis");
console.log("   Generated from Square pull + website menu\n");

// === Basic stats ===
const locationCount = locations.length;
const catalogItems = catalog.filter((o) => o.type === "ITEM" || o.itemData).length || MENU.length;
const paymentCount = payments.length;
const orderCount = orders.length;

let totalRevenue = 0;
payments.forEach((p) => {
  const amt = p.totalMoney?.amount;
  if (amt) totalRevenue += Number(amt) / 100;
});

const avgTicket = paymentCount > 0 ? totalRevenue / paymentCount : 0;

console.log("=== Snapshot ===");
console.log(`Locations:          ${locationCount}`);
console.log(`Catalog items:      ${catalogItems} (from Square${catalogItems === MENU.length ? " — using website menu as fallback" : ""})`);
console.log(`Payments (90d):     ${paymentCount}`);
console.log(`Orders (90d):       ${orderCount}`);
console.log(`Gross revenue:      $${totalRevenue.toFixed(2)}`);
console.log(`Avg ticket:         $${avgTicket.toFixed(2) || "N/A (no payments yet)"}`);

// === Category breakdown (from menu as proxy) ===
const byCat = {};
categories.forEach((c) => (byCat[c] = { count: 0, popular: 0, revenuePotential: 0 }));

MENU.forEach((item) => {
  const c = item.category;
  byCat[c].count++;
  if (item.popular) byCat[c].popular++;
  byCat[c].revenuePotential += item.price;
});

console.log("\n=== Menu by Category (current offering) ===");
categories.forEach((c) => {
  const d = byCat[c];
  console.log(`${c.padEnd(12)} | ${d.count} items (${d.popular} popular) | potential avg item $${(d.revenuePotential / d.count).toFixed(2)}`);
});

// === Insights ===
console.log("\n=== Insights & Opportunities ===");

if (paymentCount === 0) {
  console.log("• No transaction data yet in Square. Seed the sandbox or switch to Production token for real numbers.");
}

const popularItems = MENU.filter((m) => m.popular).map((m) => m.name);
console.log(`• Bestsellers to promote: ${popularItems.join(", ")}`);

console.log("• High-margin mercantile add-ons (honey, jam, coffee, apron) have strong perceived value — bundle with bread/pastry purchases.");
console.log("• Breads category is the hero (daily foundation). Consider a 'loaf of the week' subscription or wholesale test.");
console.log("• Pastry case drives impulse (croissants + morning buns). Opportunity for 'pastry flight' or coffee + pastry combo at higher ticket.");

// Simple recommendations
console.log("\n=== Quick Growth Recommendations (prioritized) ===");
console.log("1. Menu & Merchandising: Add 2-3 seasonal items to Savories/Mercantile. Push popular items harder on the website and in-store signage.");
console.log("2. Ticket size: Create 2-3 bundles (e.g. Sourdough + Honey $17, Croissant flight + coffee). Target +$2.50 avg ticket.");
console.log("3. Data loop: Once you have 30+ real transactions, re-run analysis weekly. Focus on day-of-week and time-of-day patterns.");
console.log("4. Digital: Wire the website menu to pull from Square catalog (see GROWTH-PLAN.md). Enables real-time accuracy + future online pre-order.");
console.log("5. Wholesale / events: The mercantile goods (honey, jam, coffee, linen) travel well — test a small wholesale pilot with 3 local cafes.");

console.log("\nNext: Update your .env with a Production token (when ready) and run `npm run square:full` for real data + this analysis.\n");

console.log("Files used: data/square/{locations,catalog,recent-payments,recent-orders}.json\n");
