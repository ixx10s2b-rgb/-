# クライアントテンプレート追加ガイド

新しいクライアントを追加するときは、既存テンプレートをコピーして調整します。1クライアントごとに以下を追加してください。

## 1. 共有してもらうもの

- 完成デザイン例: 1投稿4枚、できれば2〜3投稿分
- 企画文例: `【1ページ目】` から `【4ページ目】` の形
- 実際の一括読み込み用CSV/XLSX
- 背景画像、歯イラスト、4ページ目写真
- デザインルール: イラストページ、写真ページ、強調色、テーマ固定/ローテーション
- Canvaで編集したい範囲: テキスト、写真、イラスト

## 2. 画像素材を置く場所

固定で使う背景や写真は `public/assets/` に保存します。

命名例:

```text
public/assets/client-name-story-background.png
public/assets/client-name-clinic-photo-1.png
public/assets/client-name-clinic-photo-2.png
```

アプリ上でユーザーが登録する歯イラストは、クライアントごとにブラウザ内へ保存されます。固定素材として全員に配布したい場合は `public/assets/` に入れて、テンプレート側で読み込むようにします。

## 3. App.jsxに追加する場所

### 素材パス

ファイル上部の素材定数に追加します。

```js
const SAMPLE_BACKGROUND_PATH = '/assets/sample-story-background.png';
const SAMPLE_PHOTO_PATHS = [
  '/assets/sample-photo-1.png',
  '/assets/sample-photo-2.png'
];
```

### 企画文サンプル

`sampleBriefs` に追加します。

```js
const sampleBriefs = {
  ...,
  sampleClient: sampleClientSampleBrief
};
```

### クライアント設定

`clients` と `clientOrder` に追加します。

```js
sampleClient: {
  name: 'サンプル歯科',
  template: 'sampleClient',
  defaultThemeKey: 'sampleTheme',
  rotateThemes: false,
  description: 'テンプレの説明'
}
```

### テーマ

`themes.sampleTheme` を追加します。

```js
themes.sampleTheme = {
  name: 'サンプル テーマ',
  band: '#f4cfc5',
  soft: '#fffdf0',
  base: '#fffdf0',
  gray: '#727272',
  accent: '#ff666b',
  green: '#99be6c',
  pink: '#d88ca6',
  blue: '#39a8ee',
  pill: '#ffffff'
};
```

## 4. 4ページ分のビルダーを作る

既存テンプレートを参考に4つの関数を作ります。

```js
const buildSampleCover = (slide, theme, artwork, assets = {}, postIndex = 0) => ``;
const buildSampleBenefits = (slide, theme, artwork, assets = {}, postIndex = 0) => ``;
const buildSampleRecommend = (slide, theme, artwork, assets = {}, postIndex = 0) => ``;
const buildSampleCta = (slide, theme, artwork, assets = {}, postIndex = 0) => ``;
```

`createSvg` のテンプレート分岐に追加します。

```js
template === 'sampleClient'
  ? [buildSampleCover, buildSampleBenefits, buildSampleRecommend, buildSampleCta]
```

## 5. PPTX書き出しも追加する

Canvaで編集できるように、`createEditablePptx` 内にテンプレート分岐を追加します。SVGプレビューだけ作ると、画面では良くてもCanva用PPTXで崩れるので、必ず両方対応します。

確認するポイント:

- テキストは `addPptText`
- 写真は `slide.addImage`
- 1〜3ページ目の歯イラストは `addPptArtwork`
- 4ページ目は写真、CTA、予約リンクの位置を固定

## 6. 素材読み込みを追加する

`loadTemplateAssets` に追加します。

```js
if (activeTemplate === 'sampleClient') {
  const [sampleBackground, samplePhotos] = await Promise.all([
    imagePathToDataUrl(SAMPLE_BACKGROUND_PATH),
    Promise.all(SAMPLE_PHOTO_PATHS.map((path) => imagePathToDataUrl(path)))
  ]);
  if (isCurrent) setTemplateAssets({ sampleBackground, samplePhotos });
  return;
}
```

PPTX側の `pptAssets` にも同じ素材を追加します。

## 7. 最後に確認すること

- `npm run build` が成功する
- 1投稿だけで崩れない
- XLSXで8〜10投稿を一括読み込みして崩れない
- 1〜3ページ目のイラストが被りすぎない
- 4ページ目の写真が交互/固定など指定どおり
- PPTXをCanvaに読み込んでも文字、写真、イラストが編集できる
