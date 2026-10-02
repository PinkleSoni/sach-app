# lookupIngredients

> **Optional and switched off.** It needs the paid Blaze plan and an API key. Without it, the app uses the free route: a "Search Google" button that opens a normal Google search for a person to copy the list from. Delete this folder if you never plan to use it.

Finds a product's ingredient list on the web when Open Beauty Facts has none. The app calls it from the Result screen ("Find them online"). It runs on the server because it needs a paid API key.

What it does, in order: returns a list someone already added or found (free) → skips barcodes that recently came up empty (free) → checks the signed-in user's daily allowance (15) → searches the web with Claude → validates the answer (exact product, source must be a page the search returned, plausible list) → saves it to `webIngredientLists/{barcode}` so everyone benefits.

## Turn it on (one time)

1. **Upgrade the Firebase project to the Blaze (pay-as-you-go) plan** in the console: Project settings → Usage and billing. Cloud Functions require it. Typical cost here is a few cents per product looked up, and a product is only ever looked up once.
2. **Create an Anthropic API key** at https://platform.claude.com and store it as a secret:
   ```bash
   npx firebase-tools functions:secrets:set ANTHROPIC_API_KEY --project sach-7d177
   ```
3. **Deploy:**
   ```bash
   npx firebase-tools deploy --only functions --project sach-7d177
   ```
4. In `src/lib/ingredientSources.js` set `WEB_LOOKUP_ENABLED = true`, then publish the app.

Costs are bounded by `maxInstances: 5`, the per-user daily limit, and a 7-day memory of misses. Setting a budget alert on the Google Cloud billing account is still a good idea.
