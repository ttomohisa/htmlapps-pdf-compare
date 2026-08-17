# PDF Compare

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-pdf-compare/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-pdf-compare/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-pdf-compare/)

[English README](README.md)

2つのPDFをブラウザ内だけで比較し、ページの追加・削除、見た目の変化、テキストの変更を見つける単一HTMLアプリです。

単純に「1ページ目同士、2ページ目同士」を比較するのではなく、各ページの見た目と抽出テキストを使って変更前後のページを自動対応付けします。途中にページが追加・削除されたPDFでも、それ以降のページがすべて差分扱いになりにくいようにしています。

## 🚀 デモ

### [GitHub PagesでPDF Compareを開く](https://ttomohisa.github.io/htmlapps-pdf-compare/)

GitHub Pagesから最初のHTMLを読み込んだ後、PDFの読み込み、ページ解析、描画、対応付け、差分計算は端末内で処理されます。選択したPDFがアプリからサーバーへ送信されることはありません。

## 主な機能

- 変更前 / 変更後の2つのPDFをブラウザ内だけで比較
- 見た目と抽出テキストを組み合わせたページ自動対応付け
- 途中に挿入されたページ、削除されたページを検出
- 数px程度の位置ずれを自動補正してから視覚差分を計算
- **差分 / 左右 / 重ねる / スライダー / 点滅** の5つの比較表示
- ページごとの視覚差分率、テキスト類似度、位置ずれ補正量を表示
- まとまった変更箇所を「変更領域」として抽出
- PDF内に文字情報がある場合はテキスト差分も表示
- 「変更のみ」で差分があるページだけに絞り込み
- 差分感度と小さな差分の無視量を調整
- 標準 / 高精細の描画品質切り替え
- **50〜400%の拡大・縮小**と「画面に合わせる」
- `Ctrl` / `⌘` + マウスホイールによるズーム
- パスワード保護PDFに対応
- 現在ページの差分画像をPNGで保存
- 文書全体の比較結果をCSVで保存
- 日本語 / English 切り替え
- PC・スマートフォン向けレスポンシブUI
- SVG faviconをHTML内に埋め込み
- PDF.js、Worker、CMap、標準フォント、WASM、ICC、画像デコーダーを単一HTMLへ内包
- 通常版 `dist/index.html` と自己解凍版 `dist/index.self-extract.html` を生成

## すぐに使う

### Webで使う

[デモを開く](https://ttomohisa.github.io/htmlapps-pdf-compare/)だけで利用できます。インストールやアカウント登録は不要です。

### 完全オフラインで使う (advance)

1. このリポジトリをダウンロードまたはクローンします。
2. Windowsで `build-standalone.bat` を実行します。
3. 初回だけ、`dependencies.json` で固定されたPDF.jsをnpm公式レジストリから取得します。
4. 生成された `dist/index.html` を任意の場所へコピーします。
5. 以降はそのHTML単体を、インターネット接続なしで直接開けます。

```powershell
.\build-standalone.bat
```

Python、Node.js、ローカルWebサーバーは不要です。Windows PowerShellと `tar.exe` を使用します。

## 使い方

1. **変更前** に元のPDF、**変更後** に更新後のPDFを選択します。
2. PDFを解析し、ページの見た目と抽出テキストから変更前後のページを自動対応付けします。
3. 上部のサマリーで、対応ページ、変更あり、追加ページ、削除ページ、見た目の変更量を確認します。
4. 左側（スマートフォンでは横スクロール）のページ一覧から確認したいページを選びます。
5. **差分 / 左右 / 重ねる / スライダー / 点滅** を切り替えて変更箇所を確認します。
6. 必要に応じて差分感度、小さな差分の無視量、描画品質を調整します。
7. 細かい箇所はズームして確認し、変更領域ボタンから該当位置へ移動します。
8. 必要なら差分PNGまたはCSVレポートを保存します。

### 5つの比較表示

| 表示 | 用途 |
| --- | --- |
| **差分** | 変化したピクセルを強調して、変更箇所を素早く見つける |
| **左右** | 変更前と変更後を並べて自然な見た目のまま比較する |
| **重ねる** | 2ページを半透明で重ね、位置・形状の変化を見る |
| **スライダー** | 境界を左右に動かしてBefore / Afterを切り替える |
| **点滅** | 変更前後を交互に表示し、微妙な変化を目で追う |

### 差分設定

- **差分感度**: 値を小さくすると、より小さな色・描画の変化も差分として検出します。
- **小さな差分を無視**: スキャンノイズなど、小さな変更領域を結果から除外します。
- **表示品質**: 通常は「標準」を推奨します。細部を確認するときは「高精細」を使用できます。

位置が数pxずれただけでページ全体が差分になるのを抑えるため、詳細比較の前に平行移動の位置合わせを自動で行います。

### ズーム操作

| 操作 | 動作 |
| --- | --- |
| `−` / `＋` | 25%刻みで縮小 / 拡大 |
| `100%` | 表示倍率を100%へ戻す |
| `画面に合わせる` | 比較エリアへ収まる基本倍率へ戻す |
| `Ctrl` / `⌘` + マウスホイール | カーソル操作で拡大 / 縮小 |
| `+` / `=` | 拡大 |
| `-` | 縮小 |
| `0` | 100%へ戻す |

表示倍率は50〜400%です。ズームは表示だけに作用し、差分判定そのものの計算結果は変えません。

### キーボード操作

| ショートカット | 操作 |
| --- | --- |
| `←` / `→` | 前 / 次の比較ページへ移動 |
| `+` / `=` | 拡大 |
| `-` | 縮小 |
| `0` | 100%へ戻す |

## 比較の仕組み

PDF Compareはページ番号だけを基準に比較しません。

1. 各ページから縮小画像を生成
2. PDF内に文字情報があればテキストも抽出
3. 視覚類似度・テキスト類似度・ページ比率からページ同士の類似度を計算
4. 動的計画法でページ列全体を対応付け
5. 追加・削除ページを判定
6. 選択したページだけ高解像度で遅延描画
7. 数pxの位置ずれを補正
8. ピクセル差分率と変更領域を計算

すべてのページを最初から高解像度で差分計算せず、詳細表示したページだけ処理することで、端末メモリの使用量を抑えています。

## GitHub Pagesで公開する

このリポジトリには、完全内包版をビルドしてGitHub Pagesへ自動公開するワークフローが含まれています。

1. リポジトリ名を `htmlapps-pdf-compare` としてGitHubへプッシュします。
2. **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選択します。
3. `main` ブランチへプッシュするか、Actions画面からデプロイワークフローを手動実行します。
4. ビルド成功後、`https://ttomohisa.github.io/htmlapps-pdf-compare/` で公開されます。

Pagesがまだ有効化されていない場合、ワークフローはビルド成果物を作成したうえでデプロイだけをスキップします。SettingsでGitHub Actionsを選択した後、ワークフローを再実行してください。

`main` へのプッシュ時には、固定バージョンの依存パッケージから `dist/index.html` と `dist/index.self-extract.html` を再生成し、外部ランタイム参照や未置換プレースホルダーが残っていないことを検証してから公開します。

## 開発とビルド

```text
.
├─ src/index.template.html            # アプリ本体のテンプレート
├─ app.config.json                    # アプリ名・バージョン・出力設定
├─ dependencies.json                  # PDF.jsの固定バージョンと内包対象
├─ build-standalone.bat               # Windows用ビルド入口
├─ build-standalone.ps1               # 単一HTML生成処理
├─ scripts/
│  ├─ check-repository.ps1            # リポジトリ全体のビルド検証
│  ├─ verify-standalone.ps1           # 通常版HTMLの検証
│  ├─ build-self-extract.ps1          # 自己解凍HTMLの生成
│  └─ verify-self-extract.ps1         # 自己解凍版の検証
├─ dist/
│  ├─ index.html                      # ビルド後の通常版
│  └─ index.self-extract.html         # gzip自己解凍版
└─ .github/workflows/
   ├─ build-standalone.yml            # ビルド検証
   └─ deploy-pages.yml                # mainからPagesへ自動公開
```

### 依存ライブラリを更新する

`dependencies.json` のバージョンと内包対象を変更し、再ビルドします。

キャッシュを破棄してパッケージを再取得する場合：

```powershell
.\build-standalone.bat -ForceDownload
```

ビルド処理は以下を自動で行います。

- npm公式レジストリから固定バージョンの `pdfjs-dist` tarballを取得
- PDF.js本体とWorkerをHTMLへBase64内包
- `cmaps`、`standard_fonts`、`wasm`、`iccs`、`image_decoders` をHTMLへ内包
- 依存パッケージと内包ファイルのSHA-256を記録
- 外部ランタイムスクリプト / CSS / module importが残っていないことを検証
- `connect-src 'none'` を検証
- `dist/dependency-manifest.json` を生成
- 通常版HTMLをgzip圧縮した自己解凍版を生成
- 自己解凍版が元のHTMLへバイト単位で復元できることを検証
- 自己解凍ローダーがASCII-onlyであることとfavicon継承を検証

## プライバシーと通信防止

生成されたHTMLには以下の仕組みがあります。

- Content Security Policyに `connect-src 'none'` を設定
- Main Threadからの外部 `fetch` を拒否
- PDF.js Workerからの外部 `fetch` も拒否
- CMap・フォント・WASMなどはHTML内の仮想アセットローダーから取得
- PDF.js本体とWorkerはHTML内に埋め込んだデータからBlobとして起動

GitHub Pages版では最初のHTMLを配信する通信は発生しますが、ユーザーが選択したPDFの内容や比較結果をアプリが外部へ送信することはありません。

完全にネットワークを切って使う場合は、ビルド済みの `dist/index.html` をローカルで直接開いてください。

HTML内の `pdf-compare.invalid` は埋め込みPDF.jsアセットを識別するための内部仮想URLであり、実際の通信先ではありません。

## 制限事項

- OCRは行いません。スキャンPDFも見た目では比較できますが、画像化された文字はテキスト差分の対象外です。
- PDF内部の電子署名、フォーム、注釈、オブジェクト構造そのものを監査するツールではありません。
- 見た目が同じでもPDF内部構造が異なるケースは、基本的に「同じ見た目」として扱います。
- 特殊な画像形式やフォントを含むPDFでは、元のPDFビューアと描画結果が完全には一致しない場合があります。
- ページ数が多いPDF、画像量が多いPDF、高精細表示では端末メモリを多く使用します。
- テキスト差分はPDFから文字情報を抽出できる場合のみ利用できます。

## 使用ライブラリ

| ライブラリ | バージョン | ライセンス | 用途 |
| --- | ---: | --- | --- |
| PDF.js (`pdfjs-dist`) | 6.2.108 | Apache-2.0 | PDF読み込み、文字抽出、描画、CMap・フォント等の処理 |

ページ対応付け、位置ずれ補正、ピクセル差分、変更領域抽出、テキスト差分、ズームUIはアプリ側で実装しています。詳細は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を確認してください。

## コントリビューション

バグ報告や機能提案はIssueからお願いします。開発時は [CONTRIBUTING.md](CONTRIBUTING.md) も確認してください。

## ライセンス

Copyright © 2026 ttomohisa

このプロジェクトは [MIT License](LICENSE) で公開されています。
