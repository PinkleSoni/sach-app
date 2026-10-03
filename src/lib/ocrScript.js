// The OCR engine is Tesseract.js (open source), loaded from a CDN the first
// time a label is scanned. It runs inside a page, a hidden WebView on the
// phone or the browser itself on web, so the photo never leaves the device.
// This is a string, not a function, because a function's source isn't
// available in release builds and the WebView needs the source text.
export const TESSERACT_SRC = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

export const OCR_RUNNER = `
async function sachOcr(dataUrl, onProgress) {
  const img = await new Promise(function (resolve, reject) {
    const i = new Image();
    i.onload = function () { resolve(i); };
    i.onerror = function () { reject(new Error('image')); };
    i.src = dataUrl;
  });
  // Phone photos are huge; reading a 1600px version is faster and just as accurate.
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.filter = 'grayscale(1) contrast(1.4)';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const result = await Tesseract.recognize(canvas, 'eng', { logger: function (m) { if (onProgress) onProgress(m); } });
  return result.data.text;
}
`;
