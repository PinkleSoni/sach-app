import { forwardRef, useImperativeHandle } from 'react';
import { OCR_RUNNER, TESSERACT_SRC } from '../lib/ocrScript';

let loading = null;

function loadEngine() {
  if (typeof window !== 'undefined' && window.Tesseract && window.sachOcr) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const lib = document.createElement('script');
      lib.src = TESSERACT_SRC;
      lib.onload = () => {
        const runner = document.createElement('script');
        runner.text = OCR_RUNNER;
        document.head.appendChild(runner);
        resolve();
      };
      lib.onerror = () => {
        loading = null;
        reject(new Error('offline'));
      };
      document.head.appendChild(lib);
    });
  }
  return loading;
}

// Web version: the browser runs the OCR engine directly, no WebView needed.
const OcrEngine = forwardRef(function OcrEngine(_props, ref) {
  useImperativeHandle(ref, () => ({
    async recognize(base64, onProgress) {
      await loadEngine();
      return window.sachOcr(`data:image/jpeg;base64,${base64}`, (m) => onProgress?.(m.progress || 0));
    },
  }));
  return null;
});

export default OcrEngine;
