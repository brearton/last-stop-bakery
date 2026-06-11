# The Last Stop Bakery & Mercantile

A beautiful, modern single-page website for a fictional artisan bakery and mercantile located in the restored 1898 train depot at the end of the line in Willow Creek, Colorado.

![Hero preview](./public/images/hero.jpg)

## Features

- Warm, rustic design system with custom Tailwind v4 theme (cream, terracotta, gold, deep brown)
- Fully responsive (mobile-first) with accessible sticky nav + hamburger
- Interactive menu with category filters (Breads, Pastries, Savories, Mercantile)
- Shopping basket simulation: add items, adjust quantities, running total, fake "place order for pickup" with success toast
- Image gallery with clickable lightbox + prev/next navigation
- Smooth scroll navigation with active section highlighting
- Contact form (client-side fake submit with success states + toasts)
- Subtle framer-motion animations (mobile menu, cart slide-in, presence)
- Beautiful custom photography generated for the brand

## Tech

- Vite + React 19 + TypeScript
- Tailwind CSS v4 (via @tailwindcss/vite)
- framer-motion
- lucide-react icons
- sonner (toasts)

## Getting started

```bash
cd last-stop-bakery
npm install
npm run dev
```

Then open http://localhost:5173

### Other scripts

- `npm run build` – production build (outputs to `dist/`)
- `npm run preview` – serve the production build locally
- `npm run lint` – ESLint

## Content & Customization

All menu items, copy, hours, address, and gallery captions live in `src/App.tsx`.

Images are in `public/images/` (hero + 6 gallery shots).

The cart is 100% client-side; "checkout" shows a toast and clears state. No backend.

## Notes

- Built following boring, proven patterns: Vite + React + TS + Tailwind.
- Emphasis on accessibility: semantic sections, ARIA labels, keyboard friendly, focus states.
- The "Last Stop" story is fictional but feels rooted and specific.

Enjoy the bread.

— Grok

---

## Live Menu Sync from Google Sheet (Current Workflow)

The Google Sheet (via its deployed Apps Script web app) is the **live hub** for the menu.

`scripts/sync-square-menu.js` pulls the latest (ingredients: no amounts, sorted ascending by quantity) and syncs to your Square Production catalog.

### 1. One-time setup

```bash
cp .env.example .env
# Edit .env and put a real token (Sandbox token is perfect for testing)
# Also set APPS_SCRIPT_URL to the /exec URL from your deployed Apps Script web app
```

### 2. Sync

```bash
node --env-file=.env scripts/sync-square-menu.js
# or
npm run sync-menu
```

### 3. See it

```bash
npm run square:connect   # pulls to local data/square/ (reads may be limited by token scopes — use dashboard as truth)
cat data/square/catalog.json
```

**In Square Dashboard (primary way to see it):**

- Items → search the item name from your current sheet/hub (e.g. "Chocolate Chip Cookie")
- Or Items → Categories → "The Menu" (refresh; edit the item and assign the category if it doesn't appear under it automatically)
- Menus tab: edit/create "The Menu" and add the category (or items) to it

The Google Sheet + Apps Script is the live hub:

- Edit the sheet (update the cookie name + full recipe/ingredients list, add more items in the same columns).
- The web app serves the latest instantly.
- Re-run `npm run sync-menu` (or the node command) to push changes to Square.

**Directly inspect the live hub:**

```bash
curl -L -s "$APPS_SCRIPT_URL" | cat
```

---

The original sandbox seed/analyze tools are still available if needed for other analysis. The focus is now the live sheet → Square catalog sync for the real menu.

Open [GROWTH-PLAN.md](GROWTH-PLAN.md) for growth ideas once the menu is live.

### Tiny website evolution note

The site is still the beautiful marketing face. Future light updates we can do:

- Load the menu section from the live hub or Square catalog JSON for accuracy
- "Data connected via Square for growth planning" footnote
- Later real pre-order / pickup flow

---

Run the commands above. The connection uses your Production token (make sure the app has Catalog permissions in the developer dashboard for full control and visibility). The live hub is wired in.

Let me know the output of `npm run sync-menu` or what you see in the dashboard, and we can refine (e.g. the fancy Hostest recipe in the sheet, more items, parser tweaks in the Apps Script, etc.). Fresh start ready! 🥖

- Website evolution (live menu from Square catalog, real ordering, etc.)

Run `npm run square:connect` when you have the token ready. I'm standing by to turn the data into a strong, actionable plan for the company. Let's grow Last Stop. 🥖
