# Last Stop Bakery & Mercantile — Growth Plan

**Status**: Updated with real Production data pull (June 2026)  
**Data sources**: Real Square Production account (read-only pull) + website menu (src/App.tsx)  
**Next**: Populate the real catalog in Square → re-pull → refine metrics and recommendations.

## Executive Summary

The Last Stop is a beloved, story-rich artisan bakery and mercantile located at 205 Edmond Rd NE in Piedmont, OK. It is owned by Brad and Amber Brearton. Amber started with a weekly home bakery stand that has now moved to the current location. The brand, photography, on-site experience, and real Square business profile are already excellent.

**Core opportunity**: Turn the beautiful physical experience + strong local following into repeatable, measurable growth using real operational data from Square.

Current state (real Production pull, 2026-06-11):

**Square Location (real):**

- Name: Last Stop Bakery & Mercantile
- ID: LB9CKCBZAARA3
- Address: 205 Edmond Rd NE, Piedmont, OK 73078
- Timezone: America/Chicago
- Phone: +1 405-568-2738
- Business email: metrostitchokc@gmail.com
- Merchant ID: MLWTBSG030AR8
- Status: ACTIVE
- Capabilities: CREDIT_CARD_PROCESSING, AUTOMATIC_TRANSFERS
- Created: 2026-04-30T17:39:04.487Z
- Business hours (from Square): Wed–Sat 09:00–17:00 (note mismatch with website, which says Wed–Sun)
- Description (from Square): "Piedmont's newest bakery! The Last Stop Bakery & Mercantile is owned by Brad and Amber Brearton which live in Piedmont. Amber loves baking and gained customers through a weekly bakery stand located at our home in Piedmont. The bakery stand is now moving to Edmond Road."
- Coordinates: approx 35.65288, -97.74307

**Catalog & Transactions:**

- Catalog items returned: 0
- Payments (last 90 days): 0
- Orders: 0 (orders search returned "not available or no permission")

The website menu is our current "catalog truth" (we will sync this into Square):

- **Breads** (3): Classic Sourdough (popular, $8.50), Seeded Whole Wheat ($9), Rosemary Olive ($9.50)
- **Pastries** (4): Butter Croissant (popular, $4.25), Almond Croissant ($5.50), Cinnamon Morning Bun ($4.75), Pain au Chocolat ($4.75)
- **Savories** (3): Ham & Gruyère Hand Pie (popular, $7.50), Tomato & Basil Quiche ($6.75), Spinach Feta Pocket ($7)
- **Mercantile** (4): Strawberry Rhubarb Jam ($9), Wildflower Honey (popular, $11), Willow Creek Coffee Beans ($16), Linen Apron ($28)

## Key Metrics (Current / Targets)

When you have real Square data, these numbers will come from the analyzer:

- Monthly gross revenue: $\_\_\_\_ (target: +25% in 6 months)
- Average ticket: $\_\_\_\_ (target: +$2.50 via bundles + mercantile add-ons)
- Transactions per week: \_\_\_\_
- % of revenue from Breads vs Pastry vs Savories vs Mercantile
- Top 5 items by revenue and by units
- Repeat customer signals (via customer data or order frequency)

## Insights from Current Menu + Brand

**Strengths**

- Extremely strong hero product (Classic Sourdough) + 3 "popular" flags that should be the engine.
- Mercantile goods have excellent margins and travel well (honey, jam, coffee, apron).
- The depot story + restored 1898 building is a massive differentiator for tourism, events, and wholesale.

**Gaps / Opportunities**

- No current item-level sales data (we need Square orders or line-item data to know true bestsellers and attach rates).
- Pastry and savories are impulse-friendly but lower ticket — bundling is the fastest lever.
- Mercantile is under-leveraged for "take home the experience."
- The website is 100% hardcoded (great design, but menu drift risk and no real-time accuracy).

## Prioritized Initiatives (Next 90 Days)

### 1. Data Foundation (Week 1-2) — Do this first

- [ ] Get full write/read Square token (Sandbox first, then Production).
- [ ] Run `npm run square:seed` (or manually add the 14 items + categories in the Square Sandbox dashboard).
- [ ] Run `npm run square:connect && npm run square:analyze` weekly.
- [ ] Enhance puller further for inventory counts + customer data when useful.

### 2. Ticket Size & Bundles (Week 2-4)

- Create 3 signature bundles:
  - "Daily Bread" — Sourdough + Wildflower Honey ($17.50)
  - "Morning Flight" — 2 croissants or morning bun + small coffee (price to be set)
  - "Picnic Box" — 2 hand pies or quiche + jam + drink
- Train staff to suggest one bundle add-on at every savory/pastry sale.
- Target: +$2–3.50 average ticket within 60 days.

### 3. Mercantile Push (Week 3-6)

- Move high-margin mercantile items closer to the pastry case / register.
- Create "Last Stop Pantry" shelf talkers and a small "take the depot home" story card.
- Wholesale test: Approach 3–5 local cafes/inns with honey, jam, and coffee beans (low risk, high visibility).

### 4. Website ↔ Square Sync (Week 4-8)

- Make the menu section load from `data/square/catalog.json` (or a live API endpoint later).
- Add a small "Updated from our ovens today" timestamp.
- Future: real pre-order or "reserve for pickup" using Square Orders.

### 5. Measurement & Cadence

- Weekly: glance at the analyzer output.
- Monthly: review top 5 items, category mix, and ticket size. Adjust bundles or hours.
- Quarterly: deeper look at customer data + events/wholesale performance.

## Longer-Term Bets (6–18 months)

- Wholesale channel (10–15% of revenue target)
- Small events / private baking classes in the depot (high margin, uses the story)
- Second location or commissary (only after consistent data + 18+ months of profitable growth)
- Online gifting of mercantile items (honey/jam/coffee gift boxes) — seasonal spikes

## Risks & Mitigations

- Small team / limited capacity: Protect baking days (Mon/Tue closed). Any growth must not break the "we still bake before dawn" promise.
- Menu drift: Syncing website to Square catalog is non-negotiable.
- Data quality: Start simple (payments + orders). Add inventory and customers only when the basics are solid.

## Immediate Next Actions (for you + this workspace)

1. Decide: manually add the 14 items in your Square Sandbox dashboard (fastest) **or** fix token scopes and re-run the seeder.
2. `npm run square:connect && npm run square:analyze`
3. Review this plan + the analyzer output together.
4. Pick the top 2 initiatives above and we’ll break them into concrete tasks (pricing, copy, website changes, in-store process, etc.).

---

_This plan is a living document. Every time we pull fresh Square data we will update the metrics, insights, and priorities._

Let's grow the company — one data-backed loaf at a time. 🥖

(Connector + analysis tooling lives in `scripts/`. Run `npm run square:full` once you have good data.)
