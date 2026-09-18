# Sach

Check any beauty product against your own fit: allergens, values, skin and hair.
Built from the V2 design canvas (camera-first check, personal match, review chat).

## Run it

```bash
npm install
npx expo start
```

Open in Expo Go, or press `i` / `a` for a simulator. The camera and barcode scanning need a real device.

## What is real and what is demo

- Real: fit profile, match scoring, barcode scan (EAN-13/8, UPC-A/E), gallery barcode scan, name search, review chat with photos, wishlist and recents. All data is stored on the device.
- Demo: the product catalog (`src/data/catalog.js`) and sample reviews (`src/data/reviews.js`) are fictional. Replace `src/lib/catalog.js` lookups with a real product and ingredient API before public launch.
- Not built yet: label (OCR) scanning, voice notes, accounts and a shared review backend.

## Ship checklist

1. Replace `assets/icon.png`, `assets/splash-icon.png` and the Android adaptive icons with the Sach artwork.
2. Confirm the bundle id / package in `app.json` (`app.sach.fitcheck`) is one you own.
3. `npm i -g eas-cli && eas login && eas init`
4. Test build: `eas build --profile preview --platform all`
5. Store build: `eas build --profile production --platform all`, then `eas submit --platform ios` / `android`.
6. Store listing needs a privacy policy URL: camera and photos are read on-device, nothing is uploaded.
