# PDF Compare

2つのPDFをブラウザー内だけで比較し、ページ追加・削除を含む変更点を見つける単一HTMLアプリです。

## 特徴

- PDFをサーバーへアップロードしない完全ローカル処理
- 日本語/CIDフォントPDF向けのCMap・標準フォント・WASM・ICC・画像デコーダーもHTMLへ内包
- 見た目＋抽出テキストによる自動ページ対応付け
- ページの追加・削除を検出
- 数pxの位置ずれを自動補正して差分ノイズを低減
- 差分 / 左右 / 重ねる / スライダー / 点滅 の5表示
- ピクセル差分率と変更領域の抽出
- PDF内文字情報を使ったテキスト差分
- パスワード保護PDFに対応
- 50〜400%の拡大表示と「画面に合わせる」
- 差分PNG、比較レポートCSVの保存
- 日本語 / English
- スマホ最適化
- `dist/index.html` と自己解凍版 `dist/index.self-extract.html` を生成

## ビルド

Windows 10/11 の PowerShell で:

```powershell
.\build-standalone.bat
```

初回のみ npm registry から固定バージョンの `pdfjs-dist` を取得し、HTMLへ埋め込みます。生成物の実行時通信はCSPで禁止されています。

生成物:

- `dist/index.html`
- `dist/index.self-extract.html`
- `dist/dependency-manifest.json`
- `dist/self-extract-manifest.json`

## GitHub Pages

1. リポジトリの **Settings → Pages** を開く
2. **Source** を **GitHub Actions** にする
3. `main` へ push

Pages がまだ有効化されていない初回実行では、ビルド成果物を残したままデプロイだけをスキップします。

## 比較ロジック

ページ番号をそのまま比較するのではなく、各ページの縮小画像と抽出テキストの類似度を計算し、動的計画法で変更前後のページ列を対応付けます。詳細表示では描画結果の平行移動を探索して位置ずれを補正し、その後ピクセル差分と変更領域を計算します。

## 制限

- OCRは含みません。画像化された文字は視覚差分には含まれますが、テキスト差分には含まれません。
- 電子署名、フォーム、注釈などPDF内部オブジェクトそのものを監査する用途ではありません。
- 大きなPDFや高精細表示では端末メモリを多く使用します。

## Privacy

選択したPDFはブラウザーのメモリ内で処理され、外部へ送信されません。ビルド済みHTMLのCSPは `connect-src 'none'` です。

## License

MIT. PDF rendering uses Mozilla PDF.js (`pdfjs-dist`, Apache-2.0).
