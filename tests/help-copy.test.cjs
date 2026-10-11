const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { gunzipSync } = require('node:zlib');

const rejected = [
  "パスワード入力をキャンセルした場合は、同じPDFを選び直して再試行できます。狭い画面でも差分PNG・レポートCSVを保存できます。長いファイル名は表示枠内に収まります。低い画面ではダイアログ内をスクロールでき、背景ページは動きません。",
  "After cancelling a password prompt, choose the same PDF again to retry. PNG and CSV exports stay available on narrow screens. Long filenames stay within their controls. In short windows, scroll inside dialogs while the background page stays still.",
  "圧縮済みPDF.jsアセットの展開に対応した最新のブラウザを使用してください。",
  "Use a current browser that can unpack the compressed embedded PDF.js assets."
];

test('help contains user guidance rather than implementation or layout audit prose', () => {
  const root = path.join(__dirname, '..');
  const files = ['src/index.template.html', 'dist/index.html', 'dist/index.self-extract.html',
    ...fs.readdirSync(root).filter(name => name.endsWith('.html'))];
  for (const file of files) {
    const filename = path.join(root, file);
    if (!fs.existsSync(filename)) continue;
    let html = fs.readFileSync(filename, 'utf8');
    const payload = html.match(/<script id="self-extract-payload"[^>]*>([\s\S]*?)<\/script>/);
    if (payload) html = gunzipSync(Buffer.from(payload[1].replace(/\s/g, ''), 'base64')).toString('utf8');
    for (const copy of rejected) assert.ok(!html.includes(copy), `${file}: remove internal-facing help copy: ${copy}`);
  }
});
