# Last Stop Bakery & Mercantile — PICKUP (2026-06-11)

**OPEN THIS FILE FIRST in Zed tomorrow.**

This is the exact handoff point after `/check-work`.

---

## Verified State (right now)

- `/check-work` ran twice. Final verdict: **PASS**.
- Full live-hub → Square Production sync feature is implemented, tested, and working:
  - `scripts/sync-square-menu.js` (the main one)
  - Supporting scripts: `pull-square-data.js`, `analyze-square-data.js`, `seed-square-sandbox.js`, `create-test-menu.js`
  - `npm run sync-menu` wired in package.json
  - `.env.example` has `APPS_SCRIPT_URL`
  - `.gitignore` protects secrets + `data/square/`
  - `README.md` has the complete "Live Menu Sync from Google Sheet (Current Workflow)" section
  - `GROWTH-PLAN.md` has the real Piedmont, OK location (LB9CKCBZAARA3), 0 catalog items (fresh after your clear), and the current website menu as source-of-truth
- Git: Clean working tree on `main`. Latest commit `c99e722` ("feat(menu): add live Google Sheet hub to Square Production catalog sync") is pushed to `origin/main`.
- Builds: `npm run build` + `npm run lint` clean. `npm run square:analyze` runs successfully against real data + fallback.
- The Google Sheet (via deployed Apps Script `/exec` web app) is the **always-live hub**. No publish-to-web lag.

The sync does:
- Fetches your sheet as JSON (columns: Item Name, Description, Categories, Price, Ingredients, etc.)
- Cleans ingredients (strips amounts, sorts ascending by quantity)
- Idempotently upserts "The Menu" CATEGORY + ITEMs (with price as "Each" variation) into your **Production** Square catalog

---

## Exact Next Steps (resume here tomorrow)

### 1. Prepare the live data in Google Sheet (use the format you opened in Zed)
- Columns (exact names from the Square catalog CSV export you viewed in Zed):
  - `Item Name`
  - `Description` (put the full fancy recipe text here for Hostest Cake Cookie, or any other copy)
  - `Categories` → "The Menu" (this becomes the category name)
  - `Price` (e.g. 5.00 or 5)
  - `Ingredients` (raw list with amounts is fine — the Apps Script + sync script will strip + sort + append a clean version to the description)
- Add the **Hostest Cake Cookie** (and any other real items you want live).
- Save the sheet.

### 2. Apps Script (the web app that turns the sheet into the JSON hub)
- Go to your Google Sheet → Extensions → Apps Script.
- Make sure it has the current `doGet()` that reads the Square-format columns (`getCol` for "Item Name", "Description", "Categories", "Price", "Ingredients"), accumulates multi-row ingredients, runs `processIngredients()` (strip qty/unit/(g), numeric sort by quantity, join with ", "), and returns:
  ```json
  {
    "menuName": "The Menu",
    "categories": [
      {
        "name": "The Menu",
        "items": [ { "name": "...", "price": "...", "description": "... (clean ingredients)" } ]
      }
    ]
  }
  ```
- **Deploy** (or redeploy as new version) as Web App → "Anyone" access.
- Copy the new `https://script.google.com/macros/s/XXXXXX/exec` URL.

### 3. Local env (in this folder)
```powershell
cp .env.example .env
```

Edit `.env`:
- `SQUARE_ACCESS_TOKEN=` → your Production token (must come from a Square OAuth app with full Catalog scopes: ITEMS_READ, ITEMS_WRITE, CATEGORIES_READ, CATEGORIES_WRITE, etc. Limited PATs often hide data.)
- `SQUARE_ENVIRONMENT=Production`
- `APPS_SCRIPT_URL=` → the /exec URL from step 2 (the sync script also has a fallback to the current live one)

### 4. Run the sync
```powershell
npm run sync-menu
# or explicitly:
node --env-file=.env scripts/sync-square-menu.js
```

Watch for the ✅ "Full menu synced to Square Production from live hub!" + the printed "See it" instructions.

### 5. See the changes (Square Dashboard is the source of truth)
- Items → search the item name (e.g. "Hostest Cake Cookie" or "Chocolate Chip Cookie")
- Items → Categories → "The Menu" (refresh the page; you may need to edit the item and assign the category in the UI)
- **Menus** tab → edit your menu and add "The Menu" category (this is what customers see online)
- Optional local pull (note: reads can be limited by token scopes):
  ```powershell
  npm run square:connect
  cat data/square/catalog.json
  ```

### 6. Inspect the live hub directly (anytime)
```powershell
# After setting APPS_SCRIPT_URL in .env, or just paste the URL
curl -L -s "$APPS_SCRIPT_URL" | cat
```

Edit sheet → instant in the web app → re-run `npm run sync-menu` to push to Square. This is the loop.

---

## Key Files to Open in Zed Tomorrow
- `PICKUP.md` (this file — start here)
- `scripts/sync-square-menu.js` (read the comments at the top and the success output block)
- `README.md` (the "Live Menu Sync from Google Sheet (Current Workflow)" section is the user-facing guide)
- `GROWTH-PLAN.md` (real location + current 0-item state + website menu truth)
- `.env` (once created)
- `package.json` (see the scripts)

Also keep the Google Sheet + Apps Script editor open in your browser.

---

## Notes / Gotchas (from the verification)
- The catalog items are created with `categoryId`, but Square's UI sometimes requires a manual edit/assign or using the **Menus** tab to surface them in the customer menu.
- Full OAuth app token (not a limited PAT) gives the best visibility + control.
- The hardcoded fallback APPS_SCRIPT_URL in the script is the current live one (public endpoint). Override with `.env` when you redeploy.
- No changes were made to `src/App.tsx` or the website menu yet — that is explicitly future work once the Square catalog is the source of truth (see README "Tiny website evolution note").
- Everything follows the boring, standard, observable approach (Node + official Square SDK + exec curl for the Apps Script web app + idempotency).

---

**You are exactly here:**

1. Sheet data ready in Square CSV column format.
2. Apps Script deployed + URL known.
3. `.env` filled.
4. `npm run sync-menu` → dashboard verification.
5. Then we can talk about the fancy Hostest Cake Cookie recipe details, adding more items, or starting the website-to-live-catalog wiring.

See you tomorrow. The pipeline is solid and verified. 🥖

— Grok (after /check-work PASS + commit c99e722)
