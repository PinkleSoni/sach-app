import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { OCR_RUNNER, TESSERACT_SRC } from '../lib/ocrScript';

const HTML = `<!doctype html><html><body>
<script src="${TESSERACT_SRC}"></script>
<script>
${OCR_RUNNER}
function post(o) { window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
window.__run = function (id, dataUrl) {
  sachOcr(dataUrl, function (m) { post({ id: id, type: 'progress', p: m.progress || 0 }); })
    .then(function (text) { post({ id: id, type: 'done', text: text }); })
    .catch(function (e) { post({ id: id, type: 'error', message: String((e && e.message) || e) }); });
};
window.addEventListener('load', function () { post({ type: window.Tesseract ? 'ready' : 'unavailable' }); });
</script></body></html>`;

const LOAD_TIMEOUT_MS = 25000;
const JOB_TIMEOUT_MS = 90000;

// Renders nothing visible. Call ref.recognize(base64Jpeg, onProgress) to read
// the text in a photo; resolves to the raw text, or rejects with Error('offline')
// when the OCR engine couldn't be downloaded.
const OcrEngine = forwardRef(function OcrEngine(_props, ref) {
  const web = useRef(null);
  const st = useRef({ ready: false, failed: false, waiters: [], jobs: new Map(), seq: 0 });

  const onMessage = (event) => {
    let m;
    try {
      m = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    const s = st.current;
    if (m.type === 'ready') {
      s.ready = true;
      s.waiters.splice(0).forEach((w) => w.resolve());
    } else if (m.type === 'unavailable') {
      s.failed = true;
      s.waiters.splice(0).forEach((w) => w.reject(new Error('offline')));
    } else {
      const job = s.jobs.get(m.id);
      if (!job) return;
      if (m.type === 'progress') {
        job.onProgress?.(m.p);
      } else {
        s.jobs.delete(m.id);
        if (m.type === 'done') job.resolve(m.text);
        else job.reject(new Error(m.message));
      }
    }
  };

  useImperativeHandle(ref, () => ({
    recognize(base64, onProgress) {
      const s = st.current;
      const ready = s.ready
        ? Promise.resolve()
        : s.failed
        ? Promise.reject(new Error('offline'))
        : new Promise((resolve, reject) => {
            s.waiters.push({ resolve, reject });
            setTimeout(() => reject(new Error('offline')), LOAD_TIMEOUT_MS);
          });
      return ready.then(
        () =>
          new Promise((resolve, reject) => {
            const id = ++s.seq;
            s.jobs.set(id, { resolve, reject, onProgress });
            setTimeout(() => {
              if (s.jobs.delete(id)) reject(new Error('timeout'));
            }, JOB_TIMEOUT_MS);
            web.current.injectJavaScript(`window.__run(${id}, ${JSON.stringify(`data:image/jpeg;base64,${base64}`)}); true;`);
          })
      );
    },
  }));

  return (
    <View pointerEvents="none" style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}>
      <WebView ref={web} originWhitelist={['*']} source={{ html: HTML, baseUrl: 'https://sach.local/' }} javaScriptEnabled onMessage={onMessage} />
    </View>
  );
});

export default OcrEngine;
