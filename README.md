# Sach

Check any beauty product against your own fit: allergens, values, skin and hair.
Built from the V2 design canvas: welcome and set-your-fit onboarding, a Home screen with a scan hero, camera-first check, personal match, and a review chat.

## [Try the live demo →](https://pinklesoni.github.io/sach-app/)

A web build of the app, published from the `gh-pages` branch on every manual deploy (see below). Onboarding, Search name, match results, reviews and the review chat all work. The live camera and barcode scan need a phone — they aren't validated in a desktop browser, so use **Search name** on the demo to try a product (`Kesar Ceramide Gel Moisturiser` is a good one to try first). Your fit profile and reviews are saved in that browser only.

<p>
  <img src="docs/screenshots/1-welcome.png" width="180" alt="Welcome screen">
  <img src="docs/screenshots/2-set-your-fit.png" width="180" alt="Set your fit screen">
  <img src="docs/screenshots/3-home.png" width="180" alt="Home screen with scan button">
  <img src="docs/screenshots/4-result.png" width="180" alt="Match result with dealbreaker and ingredients">
  <img src="docs/screenshots/5-review.png" width="180" alt="Three-tap review chat">
</p>

_Screenshots are from the web preview of the app. On a phone it runs in Expo Go with a working camera._

## Screens

- **Welcome / Set your fit:** first-run onboarding (Skip is allowed). Replay it from the My fit tab.
- **Home, Reviews, History, My fit:** the four tabs, with the raised scan button in the middle.
- **Check:** camera barcode scan, gallery scan, name search.
- **Result:** match %, dealbreakers, ingredients that matter, better alternatives, reviews from people like you.
- **Review:** three-tap chat with photos and voice notes.

## Open it in Expo Go

1. Install **Expo Go** on your phone and keep it up to date (this app uses Expo SDK 57):
   - iPhone: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [expo.dev/go](https://expo.dev/go) for details
2. Start the dev server on your computer:

   ```bash
   npm install
   npx expo start
   ```

3. Scan the QR code it prints: iPhone Camera app, or the scanner inside Expo Go on Android. Phone and computer must be on the same Wi-Fi. If they aren't, run `npx expo start --tunnel` instead.

The `exp://…` address in the terminal only works while the dev server is running, on your own network, so it can't be shared as a link. Camera and barcode scanning need a real phone, not a simulator.

### A link that opens in Expo Go itself

The live demo above is a web build — close, but it's not the real app (no live camera). The project is published with [EAS Update](https://docs.expo.dev/eas-update/getting-started/) under the `pinkle0402` Expo account, which gives a link that opens the real app in Expo Go, on a phone, without your computer running:

1. Open [the latest update on expo.dev](https://expo.dev/accounts/pinkle0402/projects/sach/updates/c46793b4-9a49-4c02-9356-188f1d8f8a43) (sign in with the `pinkle0402` account) and use its **Open in Expo Go** button or QR code — this is the reliable way in, since that page builds the link for you.
2. Or, in Expo Go, open the profile tab → **Enter URL manually**, and paste one of these manifest links directly:
   - iOS: `https://u.expo.dev/update/01a0f877-0022-73c7-b85a-d89b3dbeffc2`
   - Android: `https://u.expo.dev/update/01a0f877-0022-70a6-b305-b02adbc7bdf6`

Expo Go still needs to already be installed (see above), and the app's camera/barcode scanning work normally through this link since it's the real native app, not a web build.

To publish a new update after a change:

```bash
eas update --branch main --message "what changed" --environment preview --non-interactive
```

That reuses the existing project link (`https://expo.dev/accounts/pinkle0402/projects/sach`); update the two manifest links above with the new ones it prints.

## Redeploying the live demo

The `gh-pages` branch is a plain static export — it's built and pushed by hand, not on every commit to `main`. To update it after a change:

```bash
npx expo export --platform web --output-dir dist
```

GitHub Pages serves this repo from a sub-path (`/sach-app/`), so `app.json` needs a temporary `"experiments": { "baseUrl": "/sach-app" }` for this one export — add it, export, then remove it again before committing `app.json` (it would otherwise break the iOS/Android builds, which load assets from the app bundle, not a URL). Then publish `dist/`'s contents to the root of `gh-pages` and push.

## What is real and what is demo

- Real: fit profile, match scoring, barcode scan (EAN-13/8, UPC-A/E), gallery barcode scan, name search, review chat with photos and voice notes, wishlist and recents. All data is stored on the device.
- Demo: the product catalog (`src/data/catalog.js`) and sample reviews (`src/data/reviews.js`) are fictional. Replace `src/lib/catalog.js` lookups with a real product and ingredient API before public launch.
- Not built yet: label (OCR) scanning, accounts and a shared review backend. Photos and voice notes are kept as temporary files on the phone.

## Ship checklist

1. Replace `assets/icon.png`, `assets/splash-icon.png` and the Android adaptive icons with the Sach artwork.
2. Confirm the bundle id / package in `app.json` (`app.sach.fitcheck`) is one you own.
3. `npm i -g eas-cli && eas login && eas init`
4. Test build: `eas build --profile preview --platform all`
5. Store build: `eas build --profile production --platform all`, then `eas submit --platform ios` / `android`.
6. Store listing needs a privacy policy URL: camera and photos are read on-device, nothing is uploaded.

## Licence

No licence has been chosen yet, so all rights are reserved. You can read the code, but you don't have permission to reuse it.
