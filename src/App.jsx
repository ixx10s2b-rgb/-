import React, { useEffect, useMemo, useState } from 'react';
import {
  Clipboard,
  Download,
  FileImage,
  FileSpreadsheet,
  ImagePlus,
  LayoutTemplate,
  Palette,
  Shuffle,
  Sparkles,
  Trash2
} from 'lucide-react';
import {
  deleteArtworkFromCloud,
  isCloudConfigured,
  loadArtworksFromCloud,
  loadClientDraftFromCloud,
  saveArtworksToCloud,
  saveClientDraftToCloud
} from './firebaseStorage';

const STORY_W = 1080;
const STORY_H = 1920;
const PPTX_W = 9;
const PPTX_H = 16;
const PX_TO_IN = PPTX_W / STORY_W;
const ARTWORK_STORAGE_KEY = 'story-generator:tooth-artworks';
const ARTWORK_BACKUP_STORAGE_KEY = `${ARTWORK_STORAGE_KEY}:client-backup`;
const ARTWORK_DB_NAME = 'story-generator-artworks';
const ARTWORK_DB_STORE = 'artworks';
const DRAFT_STORAGE_KEY = 'story-generator:client-draft';
const KUMATA_BACKGROUND_PATH = '/assets/kumata-story-background.png';
const KUMATA_CLINIC_PHOTO_PATH = '/assets/kumata-clinic-photo.png';
const YAMAMOTO_BACKGROUND_PATH = '/assets/yamamoto-story-background.png';
const YAMAMOTO_CLINIC_PHOTO_PATH = '/assets/yamamoto-clinic-photo.png';
const NISHIUMI_BACKGROUND_PATH = '/assets/nishiumi-story-background.png?v=202606211820';
const NISHIUMI_DOCTOR_PHOTO_PATH = '/assets/nishiumi-doctor-photo.png?v=202606211835';
const KANOU_BACKGROUND_PATH = '/assets/kanou-story-background.png?v=202607023';
const KANOU_STAFF_PHOTO_PATHS = [
  '/assets/kanou-staff-photo-1.png',
  '/assets/kanou-staff-photo-2.png'
];
const INOUE_CLINIC_PHOTO_PATHS = [
  '/assets/inoue-clinic-photo-1.png',
  '/assets/inoue-clinic-photo-2.png'
];
const OSAKA_SAYAMA_CLINIC_PHOTO_PATHS = [
  '/assets/osaka-sayama-clinic-photo-1.png',
  '/assets/osaka-sayama-clinic-photo-2.png'
];

const assetHref = (path) => {
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
};

const sampleBrief = `【1ページ目】
夏休みのうちに
お子さまの歯並び相談
しませんか？👦👧

【2ページ目】
いのうえ歯科の小児矯正
・成長期に合わせた最適な矯正プランをご提案
・住吉区の地域密着で多くの症例実績
・プライムスキャンで負担の少ない精密な型取り
・専用カウンセリングルームで丁寧にご説明
土日も矯正相談を受付中です

【3ページ目】
こんな方におすすめ
✔ お子さまの歯並びが気になり始めた
✔ 成長期の今のうちに相談しておきたい
✔ 矯正の費用感だけでも知りたい
✔ 夏休み中にゆっくり相談したい

【4ページ目】
住吉区でお子さまの歯並び相談ならいのうえ歯科へ！`;

const kumataSampleBrief = `【1ページ目】
矯正無料カウンセリング
実施中✨
マウスピース矯正のご案内

【2ページ目】
くまたうえの歯科のマウスピース矯正
・部分矯正にも対応で気になるところだけ治せる
・症例に合わせた4段階の料金プラン（363,000円〜）
・口腔内スキャナー（iTero）で精密な型取り
・デンタルローン・クレジットカード対応

【3ページ目】
こんな方におすすめ
✔ 前歯の歯並びだけ気になる
✔ 費用を抑えて矯正したい
✔ 目立たない矯正装置がいい
✔ まずは費用感だけ聞いてみたい

【4ページ目】
まずは矯正の無料カウンセリングへお気軽にお越しください！`;

const yamamotoSampleBrief = `【1ページ目】
他院で「骨が足りない」と
断られた方へ
やまもと歯科のインプラント治療

【2ページ目】
やまもと歯科のインプラント
・日本最大級の医療法人で多数の実績を積んだ院長が担当
・骨が足りない方もサイナスリフト・GBRで対応可能
・歯科用CTで精密に診断し安全性を確保
・専用カウンセリングルームで丁寧にご説明
難症例もまずはご相談ください

【3ページ目】
こんな方におすすめ
✔ 他院でインプラントを断られた
✔ 骨が足りないと言われて諦めていた
✔ 経験豊富な先生に任せたい
✔ しっかり噛める歯を取り戻したい

【4ページ目】
まずはカウンセリングでご相談ください！`;

const nishiumiSampleBrief = `【1ページ目】
目立たない矯正で
理想の歯並びへ✨
マウスピース矯正のご案内

【2ページ目】
インビザライン（マウスピース矯正）
・透明で目立たないから周りに気づかれにくい
・取り外せるから食事・歯磨きも普段通り
・ワイヤー矯正より痛みが少ない
・デジタルスキャナーで精密に型取り

【3ページ目】
こんな方におすすめ
✔ 歯並びが気になるけど装置が目立つのが嫌
✔ 仕事や学校で矯正していることを知られたくない
✔ 食事の制限をできるだけなくしたい

【4ページ目】
マウスピース矯正の不安は無料相談でお話しましょう！`;

const osakaSayamaSampleBrief = `【1ページ目】
お子さまの矯正
5歳から始められます👦
MRC矯正（マイオブレース）のご案内

【2ページ目】
MRC矯正（マイオブレース）
・5〜7歳から始められる早期矯正
・顎の成長を活かして歯並びを整える
・舌の癖や口呼吸の改善トレーニング付き
・将来の抜歯リスクを減らせる
成長期の今だからできる矯正です

【3ページ目】
こんな方におすすめ
✔ お子さまの歯並びが気になり始めた
✔ 口がポカンと開いていることが多い
✔ 指しゃぶりや舌の癖が気になる
✔ できるだけ早いうちに相談しておきたい

【4ページ目】
お子様の矯正治療は大阪狭山おとなこども歯科・矯正歯科にお任せください`;

const kanouSampleBrief = `【1ページ目】
鳥取県で
キレイライン矯正なら✨
かのう歯科医院へ

【2ページ目】
キレイライン矯正
・透明なマウスピースで目立たない
・鳥取県初の提携クリニック
・前歯の気になる部分を中心に整える
・リーズナブルな料金設定で始めやすい
まずはカウンセリングで歯並びの状態を確認しましょう

【3ページ目】
こんな方におすすめ
✔ 前歯の歯並びが気になる
✔ 目立たない矯正装置がいい
✔ 費用を抑えて矯正を始めたい
✔ まずは話だけ聞いてみたい

【4ページ目】
鳥取県でキレイライン矯正は、かのう歯科へお任せください🌷`;

const sampleBriefs = {
  inoue: sampleBrief,
  kumata: kumataSampleBrief,
  yamamoto: yamamotoSampleBrief,
  nishiumi: nishiumiSampleBrief,
  osakaSayama: osakaSayamaSampleBrief,
  kanou: kanouSampleBrief
};

const themes = {
  pink: {
    name: '小児矯正 ピンク',
    band: '#f4cfc5',
    soft: '#fffdf0',
    base: '#fffdf0',
    gray: '#727272',
    accent: '#ff666b',
    green: '#99be6c',
    pink: '#d88ca6',
    blue: '#39a8ee',
    pill: '#ffffff'
  },
  yellow: {
    name: '小児矯正 イエロー',
    band: '#f6dfb8',
    soft: '#fffdf0',
    base: '#fffdf0',
    gray: '#727272',
    accent: '#ff666b',
    green: '#99be6c',
    pink: '#d88ca6',
    blue: '#39a8ee',
    pill: '#ffffff'
  },
  blue: {
    name: '大人矯正 ブルー',
    band: '#ceeff8',
    soft: '#fffdf0',
    base: '#fffdf0',
    gray: '#727272',
    accent: '#ff666b',
    green: '#99be6c',
    pink: '#d88ca6',
    blue: '#39a8ee',
    pill: '#ffffff'
  }
};
const themeOrder = ['pink', 'yellow', 'blue'];

const clients = {
  inoue: {
    name: 'いのうえ歯科',
    template: 'inoue',
    defaultThemeKey: 'pink',
    rotateThemes: true,
    description: '上下ウェーブの小児矯正テンプレ'
  },
  kumata: {
    name: 'くまたうえの歯科',
    template: 'kumata',
    defaultThemeKey: 'kumataGreen',
    rotateThemes: false,
    description: '緑帯と淡い背景の共通テンプレ'
  },
  yamamoto: {
    name: 'やまもと歯科',
    template: 'yamamoto',
    defaultThemeKey: 'yamamotoBlue',
    rotateThemes: false,
    description: '上下ブルー帯と黄色ボックスの固定テンプレ'
  },
  nishiumi: {
    name: 'にしうみ歯科',
    template: 'nishiumi',
    defaultThemeKey: 'nishiumiBlue',
    rotateThemes: false,
    description: '淡い医院背景と水色ボックスの固定テンプレ'
  },
  osakaSayama: {
    name: '大阪狭山おとなこども歯科',
    template: 'osakaSayama',
    defaultThemeKey: 'osakaSayamaMix',
    rotateThemes: false,
    description: 'ピンク・青・緑を使う固定テンプレ'
  },
  kanou: {
    name: 'かのう歯科',
    template: 'kanou',
    defaultThemeKey: 'kanouYellow',
    rotateThemes: false,
    description: '淡い黄色帯と白背景の固定テンプレ'
  }
};

const clientOrder = ['inoue', 'kumata', 'yamamoto', 'nishiumi', 'osakaSayama', 'kanou'];

themes.kumataGreen = {
  name: 'くまたうえの歯科 グリーン',
  band: '#b8d7a2',
  soft: '#f6f0e8',
  base: '#f8f4ef',
  gray: '#6f3a05',
  accent: '#ff4b7f',
  green: '#b8d7a2',
  pink: '#ff4b7f',
  blue: '#5cabdd',
  pill: '#5cabdd'
};

themes.yamamotoBlue = {
  name: 'やまもと歯科 ブルー',
  band: '#75c8eb',
  soft: '#f8f4ef',
  base: '#fbf8f4',
  gray: '#333333',
  accent: '#f15733',
  green: '#75c8eb',
  pink: '#f15733',
  blue: '#8cc2e5',
  yellow: '#ffe36a',
  orange: '#f5aa00',
  pill: '#ffe36a'
};

themes.nishiumiBlue = {
  name: 'にしうみ歯科 ブルー',
  band: '#75c9ee',
  soft: '#f7fbfd',
  base: '#fbfaf8',
  gray: '#705f53',
  accent: '#ee6068',
  green: '#8fbf78',
  pink: '#ee6068',
  blue: '#36b8e9',
  pill: '#75c9ee'
};

themes.osakaSayamaMix = {
  name: '大阪狭山 ミックス',
  band: '#75c3e3',
  soft: '#fffdf0',
  base: '#fffdf0',
  gray: '#717171',
  accent: '#e88aa7',
  green: '#6aaf45',
  pink: '#e88aa7',
  blue: '#4a9ed8',
  yellow: '#f5f27b',
  pill: '#ffffff'
};

themes.kanouYellow = {
  name: 'かのう歯科 イエロー',
  band: '#fbf6a8',
  soft: '#fffdf4',
  base: '#fffdf4',
  gray: '#333333',
  accent: '#dedb13',
  green: '#89b86a',
  pink: '#e16bd0',
  blue: '#59aee8',
  yellow: '#dedb13',
  border: '#f3cf4e',
  pill: '#dedb13'
};

const normalizeThemeKey = (value, fallback = 'pink') => {
  const normalized = String(value || '').trim().toLowerCase();
  if (['pink', 'ピンク', '桃', '桃色'].includes(normalized)) return 'pink';
  if (['yellow', 'イエロー', '黄色', '黄'].includes(normalized)) return 'yellow';
  if (['blue', 'ブルー', '青', '水色'].includes(normalized)) return 'blue';
  return fallback;
};

const defaultSlides = [
  {
    titleTop: '夏休みのうちに',
    titleMiddle: 'お子さまの歯並び相談',
    titleMain: 'しませんか？',
    mascot: 'heart'
  },
  {
    heading: 'いのうえ歯科の小児矯正',
    points: [
      '成長期に合わせた最適な矯正プランをご提案',
      '住吉区の地域密着で多くの症例実績',
      'プライムスキャンで負担の少ない精密な型取り',
      '専用カウンセリングルームで丁寧にご説明'
    ],
    closing: '土日も矯正相談を受付中です',
    mascot: 'doctor'
  },
  {
    heading: 'こんな方におすすめ',
    points: [
      'お子さまの歯並びが気になり始めた',
      '成長期の今のうちに相談しておきたい',
      '矯正の費用感だけでも知りたい',
      '夏休み中にゆっくり相談したい'
    ],
    mascot: 'friends'
  },
  {
    heading: '住吉区でお子さまの歯並び相談なら\nいのうえ歯科へ！',
    sub: 'どんなことでもご相談ください',
    button: 'ご予約はこちら',
    mascot: 'clinic'
  }
];

const fontFamily = 'Hiragino Maru Gothic ProN, Hiragino Sans, Yu Gothic, sans-serif';

const escapeXml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const splitLines = (text = '') => String(text).split('\n').map((line) => line.trim()).filter(Boolean);

const findNaturalBreak = (source, maxChars) => {
  const chars = Array.from(source);
  const limit = Math.min(chars.length, maxChars);
  const slice = chars.slice(0, limit).join('');
  const preferredTokens = ['なら', 'では', 'には', 'へ', 'で', 'に', 'は', 'を', 'が', 'と', 'も', '、', '。', '！', '？'];
  const numericUnitMatch = String(source).match(/[0-9０-９][0-9０-９,.，、]*\s*(?:円|歳|才|%|％|本|回|日|月|年|名|人)/);

  if (numericUnitMatch?.index >= 4 && numericUnitMatch.index <= limit) {
    return Array.from(String(source).slice(0, numericUnitMatch.index)).length;
  }

  for (const token of preferredTokens) {
    const index = slice.lastIndexOf(token);
    if (index >= 7) return Array.from(slice.slice(0, index + token.length)).length;
  }

  const limitChar = chars[limit];
  const beforeLimitChar = chars[limit - 1];
  if ((/[0-9０-９,.，、]/.test(limitChar || '') || /[0-9０-９,.，、]/.test(beforeLimitChar || '')) && limit > 0) {
    let numericStart = limit - 1;
    while (numericStart > 0 && /[0-9０-９,.，、]/.test(chars[numericStart - 1])) {
      numericStart -= 1;
    }
    if (numericStart >= 4) return numericStart;
  }

  return limit;
};

const smartWrap = (text = '', maxChars = 18) => {
  const rawLines = splitLines(text);
  if (rawLines.length > 1) return rawLines;

  let source = rawLines[0] || '';
  const lines = [];

  while (Array.from(source).length > maxChars) {
    const breakIndex = findNaturalBreak(source, maxChars);
    const chars = Array.from(source);
    lines.push(chars.slice(0, breakIndex).join('').trim());
    source = chars.slice(breakIndex).join('').trim();
  }

  if (source.trim()) lines.push(source.trim());
  return lines.length ? lines : [''];
};

const formatOsakaSayamaCtaHeading = (text = '') => {
  const source = String(text || '').trim();
  const clinicPhrase = '大阪狭山おとなこども歯科・矯正歯科に';

  if (!source.includes(clinicPhrase)) return source;

  const before = source.slice(0, source.indexOf(clinicPhrase)).trim();
  const after = source.slice(source.indexOf(clinicPhrase) + clinicPhrase.length).trim();

  return [before, clinicPhrase, after].filter(Boolean).join('\n');
};

const textBlock = ({
  text,
  x = STORY_W / 2,
  y,
  size = 56,
  color = '#727272',
  weight = 700,
  anchor = 'middle',
  lineHeight = 1.35,
  maxChars = 18
}) => {
  const lines = smartWrap(text, maxChars);
  const tspans = lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : size * lineHeight;
      return `<tspan x="${x}" dy="${index === 0 ? 0 : dy}">${escapeXml(line)}</tspan>`;
    })
    .join('');

  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-size="${size}" font-weight="${weight}" font-family="${escapeXml(fontFamily)}" letter-spacing="0">${tspans}</text>`;
};

const centeredTextBlock = ({
  text,
  x = STORY_W / 2,
  y,
  height,
  size = 44,
  color = '#ffffff',
  weight = 700,
  lineHeight = 1.25,
  maxChars = 18
}) => {
  const lines = smartWrap(text, maxChars);
  const gap = size * lineHeight;
  const firstY = y + height / 2 - ((lines.length - 1) * gap) / 2;
  const tspans = lines
    .map((line, index) => `<tspan x="${x}" y="${firstY + index * gap}">${escapeXml(line)}</tspan>`)
    .join('');

  return `<text text-anchor="middle" dominant-baseline="middle" fill="${color}" font-size="${size}" font-weight="${weight}" font-family="${escapeXml(fontFamily)}" letter-spacing="0">${tspans}</text>`;
};

const centeredLinesBlock = ({
  lines,
  x = STORY_W / 2,
  y,
  height,
  size = 44,
  color = '#ffffff',
  weight = 700,
  lineHeight = 1.25
}) => {
  const safeLines = lines?.length ? lines : [''];
  const gap = size * lineHeight;
  const firstY = y + height / 2 - ((safeLines.length - 1) * gap) / 2;
  const tspans = safeLines
    .map((line, index) => `<tspan x="${x}" y="${firstY + index * gap}">${escapeXml(line)}</tspan>`)
    .join('');

  return `<text text-anchor="middle" dominant-baseline="middle" fill="${color}" font-size="${size}" font-weight="${weight}" font-family="${escapeXml(fontFamily)}" letter-spacing="0">${tspans}</text>`;
};

const topWavePath = 'M0 340 C90 350 115 370 205 370 C300 370 310 340 405 340 C500 340 515 370 610 370 C705 370 720 340 815 340 C910 340 930 370 1015 370 C1050 370 1060 350 1080 340 L1080 0 L0 0 Z';
const bottomWavePath = 'M0 1615 C90 1605 115 1585 205 1585 C300 1585 310 1615 405 1615 C500 1615 515 1585 610 1585 C705 1585 720 1615 815 1615 C910 1615 930 1585 1015 1585 C1050 1585 1060 1605 1080 1615 L1080 1920 L0 1920 Z';

const singleLineText = ({
  text,
  x = STORY_W / 2,
  y,
  size = 56,
  minSize = 36,
  maxWidth = 920,
  color = '#727272',
  weight = 700,
  anchor = 'middle'
}) => {
  const chars = Math.max(1, Array.from(String(text || '').replace(/\s/g, '')).length);
  const fittedSize = Math.max(minSize, Math.min(size, Math.floor(maxWidth / chars)));

  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-size="${fittedSize}" font-weight="${weight}" font-family="${escapeXml(fontFamily)}" letter-spacing="0">${escapeXml(text)}</text>`;
};

const waveFrame = (theme) => `
  <rect width="${STORY_W}" height="${STORY_H}" fill="${theme.base}"/>
  <rect width="${STORY_W}" height="330" fill="${theme.band}"/>
  <path d="${topWavePath}" fill="${theme.band}"/>
  <rect y="1645" width="${STORY_W}" height="275" fill="${theme.band}"/>
  <path d="${bottomWavePath}" fill="${theme.band}"/>
`;

const roundedPill = (x, y, width, height, fill = '#fff') =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="${fill}"/>`;

const artworkPositions = [
  { x: 390, y: 995, width: 310, height: 310 },
  { x: 405, y: 1375, width: 270, height: 270 },
  { x: 385, y: 1370, width: 310, height: 310 }
];

const kumataArtworkPositions = [
  { x: 400, y: 1110, width: 280, height: 280 },
  { x: 385, y: 1360, width: 310, height: 310 },
  { x: 395, y: 1330, width: 290, height: 290 }
];

const yamamotoArtworkPositions = [
  { x: 390, y: 1085, width: 300, height: 300 },
  { x: 405, y: 1385, width: 270, height: 270 },
  { x: 405, y: 1320, width: 270, height: 270 }
];

const nishiumiArtworkPositions = [
  { x: 400, y: 860, width: 280, height: 280 },
  { x: 410, y: 1125, width: 260, height: 260 },
  { x: 410, y: 1305, width: 260, height: 260 }
];

const osakaSayamaArtworkPositions = [
  { x: 390, y: 1035, width: 300, height: 300 },
  { x: 400, y: 1350, width: 280, height: 280 },
  { x: 405, y: 1275, width: 270, height: 270 }
];

const kanouArtworkPositions = [
  { x: 400, y: 1095, width: 280, height: 280 },
  { x: 370, y: 1035, width: 340, height: 255 },
  { x: 400, y: 1195, width: 280, height: 280 }
];

const artworkImage = (artwork, index, template = 'inoue') => {
  if (!artwork?.dataUrl) return '';
  const positions = template === 'kumata'
    ? kumataArtworkPositions
    : template === 'yamamoto'
      ? yamamotoArtworkPositions
      : template === 'nishiumi'
        ? nishiumiArtworkPositions
        : template === 'osakaSayama'
          ? osakaSayamaArtworkPositions
          : template === 'kanou'
            ? kanouArtworkPositions
      : artworkPositions;
  const position = positions[index] || positions[0];
  return `<image href="${escapeXml(artwork.dataUrl)}" x="${position.x}" y="${position.y}" width="${position.width}" height="${position.height}" preserveAspectRatio="xMidYMid meet" style="filter: drop-shadow(0 3px 4px rgba(95,96,98,0.16));"/>`;
};

const toothMascot = (variant = 'heart', x = 430, y = 985, scale = 1) => {
  const t = `transform="translate(${x} ${y}) scale(${scale})"`;
  const tooth = `<path d="M98 18 C128 -10 194 9 202 67 C209 119 188 204 176 240 C168 265 139 263 133 237 L124 197 C120 179 97 178 91 196 L78 237 C70 263 42 265 35 240 C24 200 10 121 16 70 C22 22 65 -1 98 18 Z" fill="#fff" stroke="#5f6062" stroke-width="8" stroke-linejoin="round"/>
  <circle cx="76" cy="91" r="6" fill="#5f6062"/><circle cx="139" cy="91" r="6" fill="#5f6062"/>
  <path d="M72 120 C92 136 126 136 149 121" fill="none" stroke="#5f6062" stroke-width="7" stroke-linecap="round"/>
  <path d="M92 132 C106 138 125 138 139 132" fill="none" stroke="#ff777c" stroke-width="7" stroke-linecap="round"/>`;

  const variants = {
    heart: `<g ${t}>${tooth}<path d="M8 16 C-23 -18 -65 18 -45 55 C-32 79 -5 92 18 107 C43 91 71 75 80 47 C91 10 42 -17 20 20 Z" fill="#ff7b7f" stroke="#5f6062" stroke-width="7"/></g>`,
    doctor: `<g ${t}>${tooth}<path d="M14 112 C-28 125 -46 158 -51 214" fill="none" stroke="#5f6062" stroke-width="8" stroke-linecap="round"/><path d="M201 112 C238 130 252 165 256 214" fill="none" stroke="#5f6062" stroke-width="8" stroke-linecap="round"/><circle cx="246" cy="95" r="32" fill="#fff" stroke="#5f6062" stroke-width="7"/><path d="M232 95 L242 106 L262 82" fill="none" stroke="#73c66f" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></g>`,
    friends: `<g ${t}>${tooth}<circle cx="-58" cy="86" r="48" fill="#f07575" stroke="#5f6062" stroke-width="7"/><path d="M-96 52 C-72 12 -38 17 -21 53" fill="#59b86d" stroke="#5f6062" stroke-width="7"/><path d="M222 40 C271 40 292 93 268 138 C251 168 211 171 190 144 C165 112 176 40 222 40 Z" fill="#ef8a45" stroke="#5f6062" stroke-width="7"/><path d="M222 41 L218 7 M239 43 L250 11 M203 47 L188 16" stroke="#4f8f54" stroke-width="8" stroke-linecap="round"/></g>`,
    clinic: `<g ${t}>${tooth}<rect x="-80" y="72" width="76" height="105" rx="18" fill="#a4dad8" stroke="#5f6062" stroke-width="7"/><circle cx="-42" cy="126" r="6" fill="#5f6062"/><path d="M-60 146 C-46 158 -28 158 -15 146" fill="none" stroke="#5f6062" stroke-width="6" stroke-linecap="round"/><path d="M183 20 C212 -6 256 20 252 60 C248 98 217 112 191 94" fill="#fff" stroke="#5f6062" stroke-width="7"/><path d="M205 56 C217 70 232 70 240 55" fill="none" stroke="#ff777c" stroke-width="6" stroke-linecap="round"/></g>`
  };

  return variants[variant] || variants.heart;
};

const arrow = (theme) =>
  `<path d="M845 1320 C879 1373 914 1398 952 1405 M952 1405 L914 1367 M952 1405 L902 1414" fill="none" stroke="${theme.gray}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;

const checkBulletIcon = (cx, cy) => `
  <circle cx="${cx}" cy="${cy}" r="34" fill="#efc36d"/>
  <path d="M${cx - 16} ${cy + 1} L${cx - 3} ${cy + 15} L${cx + 20} ${cy - 17}" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
`;

const checkBulletSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <circle cx="48" cy="48" r="40" fill="#efc36d"/>
  <path d="M30 49 L44 64 L68 31" fill="none" stroke="#ffffff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const photoPlaceholder = (theme) => `
  <rect x="205" y="680" width="670" height="450" rx="10" fill="#67d4d0"/>
  <rect x="205" y="680" width="670" height="450" rx="10" fill="url(#photoGrad)"/>
  <text x="540" y="880" text-anchor="middle" fill="#ffffff" font-size="54" font-weight="700" font-family="${escapeXml(fontFamily)}">CLINIC PHOTO</text>
  <text x="540" y="948" text-anchor="middle" fill="#ffffff" font-size="30" font-weight="700" font-family="${escapeXml(fontFamily)}">Canvaで写真を差し替え</text>
  <defs><linearGradient id="photoGrad" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#70e3df"/><stop offset="1" stop-color="#13bfb7"/></linearGradient></defs>
`;

const getInoueClinicPhotoPath = (postIndex = 0) =>
  INOUE_CLINIC_PHOTO_PATHS[Math.abs(postIndex) % INOUE_CLINIC_PHOTO_PATHS.length];

const inoueClinicPhoto = (postIndex = 0, assets = {}) => `
  <image href="${escapeXml(assets.inoueClinicPhotos?.[Math.abs(postIndex) % INOUE_CLINIC_PHOTO_PATHS.length] || assetHref(getInoueClinicPhotoPath(postIndex)))}" x="205" y="680" width="670" height="450" preserveAspectRatio="xMidYMid slice"/>
`;

const waveFrameOnlySvg = (theme) => `<svg xmlns="http://www.w3.org/2000/svg" width="${STORY_W}" height="${STORY_H}" viewBox="0 0 ${STORY_W} ${STORY_H}">
  <rect width="${STORY_W}" height="${STORY_H}" fill="${theme.base}"/>
  <rect width="${STORY_W}" height="330" fill="${theme.band}"/>
  <path d="${topWavePath}" fill="${theme.band}"/>
  <rect y="1645" width="${STORY_W}" height="275" fill="${theme.band}"/>
  <path d="${bottomWavePath}" fill="${theme.band}"/>
</svg>`;

const kumataFrame = (theme, assets = {}) => `
  <image href="${escapeXml(assets.kumataBackground || assetHref(KUMATA_BACKGROUND_PATH))}" x="0" y="0" width="${STORY_W}" height="${STORY_H}" preserveAspectRatio="xMidYMid slice"/>
`;

const kumataFrameOnlySvg = (theme, assets = {}) => `<svg xmlns="http://www.w3.org/2000/svg" width="${STORY_W}" height="${STORY_H}" viewBox="0 0 ${STORY_W} ${STORY_H}">
  ${kumataFrame(theme, assets)}
</svg>`;

const kumataPhotoPlaceholder = (theme, assets = {}) => `
  <image href="${escapeXml(assets.kumataClinicPhoto || assetHref(KUMATA_CLINIC_PHOTO_PATH))}" x="190" y="725" width="700" height="385" preserveAspectRatio="xMidYMid slice"/>
`;

const yamamotoFrame = (theme, assets = {}) => `
  <image href="${escapeXml(assets.yamamotoBackground || assetHref(YAMAMOTO_BACKGROUND_PATH))}" x="0" y="0" width="${STORY_W}" height="${STORY_H}" preserveAspectRatio="xMidYMid slice"/>
`;

const yamamotoFrameOnlySvg = (theme, assets = {}) => `<svg xmlns="http://www.w3.org/2000/svg" width="${STORY_W}" height="${STORY_H}" viewBox="0 0 ${STORY_W} ${STORY_H}">
  ${yamamotoFrame(theme, assets)}
</svg>`;

const yamamotoPhotoCircleSvg = (photoDataUrl) => `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
  <defs>
    <clipPath id="yamamotoPhotoCircle"><circle cx="450" cy="450" r="450"/></clipPath>
  </defs>
  <image href="${escapeXml(photoDataUrl)}" x="0" y="0" width="900" height="900" preserveAspectRatio="xMidYMid slice" clip-path="url(#yamamotoPhotoCircle)"/>
</svg>`;

const yamamotoPhotoPlaceholder = (theme, assets = {}) => `
  <defs>
    <clipPath id="yamamotoPhotoClip"><circle cx="540" cy="915" r="250"/></clipPath>
  </defs>
  <image href="${escapeXml(assets.yamamotoClinicPhoto || assetHref(YAMAMOTO_CLINIC_PHOTO_PATH))}" x="290" y="665" width="500" height="500" preserveAspectRatio="xMidYMid slice" clip-path="url(#yamamotoPhotoClip)"/>
`;

const nishiumiFrame = (theme, assets = {}) => `
  ${
    assets.nishiumiBackground
      ? `<image href="${escapeXml(assets.nishiumiBackground)}" x="0" y="0" width="${STORY_W}" height="${STORY_H}" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect width="${STORY_W}" height="${STORY_H}" fill="${theme.base}"/>`
  }
`;

const nishiumiFrameOnlySvg = (theme, assets = {}) => `<svg xmlns="http://www.w3.org/2000/svg" width="${STORY_W}" height="${STORY_H}" viewBox="0 0 ${STORY_W} ${STORY_H}">
  ${nishiumiFrame(theme, assets)}
</svg>`;

const nishiumiPhotoPlaceholder = (theme, assets = {}) => `
  ${
    assets.nishiumiDoctorPhoto
      ? `<image href="${escapeXml(assets.nishiumiDoctorPhoto)}" x="250" y="500" width="580" height="702" preserveAspectRatio="xMidYMid meet"/>`
      : ''
  }
`;

const buildCover = (slide, theme, artwork) => `
  ${waveFrame(theme)}
  ${singleLineText({ text: `＼${slide.titleTop || ''}／`, y: 640, size: 58, minSize: 42, maxWidth: 850, color: theme.green })}
  ${textBlock({ text: slide.titleMiddle || '', y: 720, size: 64, color: theme.gray, maxChars: 18 })}
  ${textBlock({ text: slide.titleMain || '', y: 815, size: 76, color: theme.accent, maxChars: 15 })}
  ${artwork ? artworkImage(artwork, 0) : toothMascot(slide.mascot, 435, 1000, 1.08)}
  ${arrow(theme)}
`;

const buildBenefits = (slide, theme, artwork) => {
  const points = (slide.points || []).slice(0, 4);
  const pillY = [480, 645, 810, 975];
  const pills = points
    .map((point, index) => `${roundedPill(80, pillY[index], 920, 104, theme.pill)}${textBlock({ text: point, y: pillY[index] + 66, size: point.length > 23 ? 40 : 43, color: theme.pink, maxChars: 24 })}`)
    .join('');

  return `
    <rect width="${STORY_W}" height="${STORY_H}" fill="${theme.base}"/>
    ${textBlock({ text: slide.heading, y: 360, size: 56, color: theme.gray, maxChars: 20 })}
    ${pills}
    ${textBlock({ text: slide.closing, y: 1255, size: 54, color: theme.gray, maxChars: 18 })}
    ${artwork ? artworkImage(artwork, 1) : toothMascot(slide.mascot, 425, 1390, 1)}
  `;
};

const buildRecommend = (slide, theme, artwork) => {
  const points = (slide.points || []).slice(0, 4);
  const pillY = [640, 800, 960, 1120];
  const pills = points
    .map((point, index) => `
      ${roundedPill(66, pillY[index], 948, 112, theme.pill)}
      ${checkBulletIcon(145, pillY[index] + 56)}
      ${textBlock({ text: point, x: 200, y: pillY[index] + 72, size: point.length > 22 ? 41 : 45, color: theme.accent, anchor: 'start', maxChars: 24 })}
    `)
    .join('');

  return `
    <rect width="${STORY_W}" height="${STORY_H}" fill="#fff9f8"/>
    ${singleLineText({ text: `＼${slide.heading || 'こんな方におすすめ'}／`, y: 555, size: 62, minSize: 40, maxWidth: 850, color: theme.blue })}
    ${pills}
    ${artwork ? artworkImage(artwork, 2) : toothMascot(slide.mascot, 420, 1390, 0.95)}
  `;
};

const buildCta = (slide, theme, artwork, assets = {}, postIndex = 0) => {
  const headingLength = Array.from(String(slide.heading || '').replace(/\s/g, '')).length;
  const headingSize = headingLength > 34 ? 44 : headingLength > 24 ? 48 : 53;

  return `
  ${waveFrame(theme)}
  ${textBlock({ text: slide.heading, y: 535, size: headingSize, color: theme.pink, lineHeight: 1.28, maxChars: 18 })}
  ${inoueClinicPhoto(postIndex, assets)}
  ${singleLineText({ text: `＼ ${slide.sub || ''} ／`, y: 1290, size: 44, minSize: 32, maxWidth: 820, color: theme.gray })}
  <rect x="345" y="1370" width="390" height="76" rx="24" fill="#fff"/>
  <text x="540" y="1424" text-anchor="middle" fill="${theme.blue}" font-size="42" font-weight="700" font-family="${escapeXml(fontFamily)}">🔗 ${escapeXml(slide.button || 'ご予約はこちら')}</text>
`;
};

const buildKumataCover = (slide, theme, artwork, assets = {}) => {
  const topLines = [slide.titleTop, slide.titleMiddle].filter(Boolean).join('\n');
  const main = slide.titleMain || '';
  return `
    ${kumataFrame(theme, assets)}
    ${textBlock({ text: topLines, y: 585, size: 54, color: theme.gray, lineHeight: 1.36, maxChars: 17 })}
    <text x="540" y="790" text-anchor="middle" fill="${theme.gray}" font-size="64" font-weight="700" font-family="${escapeXml(fontFamily)}">▼</text>
    ${textBlock({ text: main, y: 920, size: 58, color: theme.pink, lineHeight: 1.32, maxChars: 17 })}
    ${artwork ? artworkImage(artwork, 0, 'kumata') : toothMascot(slide.mascot, 430, 1110, 0.98)}
  `;
};

const buildKumataBenefits = (slide, theme, artwork, assets = {}) => {
  const points = (slide.points || []).slice(0, 4);
  const pillY = [560, 745, 930, 1115];
  const pills = points
    .map((point, index) => `
      <rect x="86" y="${pillY[index]}" width="908" height="132" rx="28" fill="${theme.blue}"/>
      ${centeredTextBlock({ text: point, y: pillY[index], height: 132, size: point.length > 27 ? 39 : 43, color: '#ffffff', maxChars: 18, lineHeight: 1.26 })}
    `)
    .join('');

  return `
    ${kumataFrame(theme, assets)}
    ${singleLineText({ text: `＼${slide.heading || ''}／`, y: 465, size: 52, minSize: 34, maxWidth: 980, color: theme.gray })}
    ${pills}
    ${slide.closing ? textBlock({ text: slide.closing, y: 1325, size: 44, color: theme.gray, lineHeight: 1.28, maxChars: 20 }) : ''}
    ${artwork ? artworkImage(artwork, 1, 'kumata') : toothMascot(slide.mascot, 425, slide.closing ? 1480 : 1375, 0.88)}
  `;
};

const buildKumataRecommend = (slide, theme, artwork, assets = {}) => {
  const points = (slide.points || []).slice(0, 4);
  const pillY = points.length >= 4 ? [540, 705, 870, 1035] : [590, 775, 960];
  const pills = points
    .map((point, index) => `
      <rect x="86" y="${pillY[index]}" width="908" height="128" rx="28" fill="${theme.blue}"/>
      ${centeredTextBlock({ text: point, y: pillY[index], height: 128, size: point.length > 27 ? 39 : 43, color: '#ffffff', maxChars: 18, lineHeight: 1.26 })}
    `)
    .join('');
  const artworkY = points.length >= 4 ? 1315 : 1245;

  return `
    ${kumataFrame(theme, assets)}
    ${singleLineText({ text: `＼${slide.heading || 'こんな方におすすめ'}／`, y: 430, size: 56, minSize: 36, maxWidth: 930, color: theme.gray })}
    ${pills}
    ${artwork ? artworkImage(artwork, 2, 'kumata') : toothMascot(slide.mascot, 420, artworkY, 0.92)}
  `;
};

const buildKumataCta = (slide, theme, artwork, assets = {}) => {
  const headingLength = Array.from(String(slide.heading || '').replace(/\s/g, '')).length;
  const headingSize = headingLength > 34 ? 43 : headingLength > 24 ? 48 : 54;
  return `
    ${kumataFrame(theme, assets)}
    ${textBlock({ text: slide.heading, y: 520, size: headingSize, color: theme.gray, lineHeight: 1.28, maxChars: 17 })}
    ${kumataPhotoPlaceholder(theme, assets)}
    ${singleLineText({ text: '＼無料カウンセリングご予約受付中／', y: 1265, size: 48, minSize: 32, maxWidth: 980, color: theme.gray })}
    ${singleLineText({ text: '（ご予約はこちらリンク）', y: 1375, size: 42, minSize: 30, maxWidth: 820, color: theme.gray })}
  `;
};

const buildYamamotoCover = (slide, theme, artwork, assets = {}) => {
  return `
    ${yamamotoFrame(theme, assets)}
    ${textBlock({ text: slide.titleTop || '', y: 640, size: 48, color: theme.gray, lineHeight: 1.25, maxChars: 17 })}
    ${textBlock({ text: slide.titleMiddle || '', y: 715, size: 48, color: theme.orange, lineHeight: 1.25, maxChars: 17 })}
    ${roundedPill(128, 830, 824, 150, theme.blue)}
    ${centeredTextBlock({ text: slide.titleMain || '', y: 830, height: 150, size: 52, color: '#ffffff', maxChars: 17, lineHeight: 1.18 })}
    ${artwork ? artworkImage(artwork, 0, 'yamamoto') : toothMascot(slide.mascot, 430, 1090, 0.98)}
  `;
};

const buildYamamotoBenefits = (slide, theme, artwork, assets = {}) => {
  const points = (slide.points || []).slice(0, 4);
  const pillY = [535, 700, 865, 1030];
  const pills = points
    .map((point, index) => `
      <rect x="128" y="${pillY[index]}" width="824" height="112" fill="${theme.yellow}"/>
      ${centeredTextBlock({ text: point, y: pillY[index], height: 112, size: point.length > 27 ? 36 : 40, color: '#565656', maxChars: 20, lineHeight: 1.2 })}
    `)
    .join('');
  const closingLines = splitLines(slide.closing || '');
  const closingText = closingLines.length ? closingLines.join('\n') : '';

  return `
    ${yamamotoFrame(theme, assets)}
    ${singleLineText({ text: `＼${slide.heading || ''}／`, y: 465, size: 52, minSize: 34, maxWidth: 960, color: theme.gray })}
    ${pills}
    ${closingText ? textBlock({ text: closingText, y: 1255, size: 46, color: theme.gray, lineHeight: 1.28, maxChars: 18 }) : ''}
    ${closingText ? textBlock({ text: closingLines[0] || '', y: 1255, size: 46, color: theme.accent, lineHeight: 1.28, maxChars: 18 }) : ''}
    ${artwork ? artworkImage(artwork, 1, 'yamamoto') : toothMascot(slide.mascot, 430, 1390, 0.82)}
  `;
};

const buildYamamotoRecommend = (slide, theme, artwork, assets = {}) => {
  const points = (slide.points || []).slice(0, 4);
  const pillY = [600, 760, 920, 1080];
  const pills = points
    .map((point, index) => `
      <rect x="128" y="${pillY[index]}" width="824" height="112" fill="${theme.yellow}"/>
      ${centeredTextBlock({ text: point, y: pillY[index], height: 112, size: point.length > 25 ? 36 : 40, color: '#565656', maxChars: 20, lineHeight: 1.2 })}
    `)
    .join('');

  return `
    ${yamamotoFrame(theme, assets)}
    ${singleLineText({ text: `＼${slide.heading || 'こんな方におすすめ'}／`, y: 535, size: 54, minSize: 36, maxWidth: 900, color: theme.gray })}
    ${pills}
    ${artwork ? artworkImage(artwork, 2, 'yamamoto') : toothMascot(slide.mascot, 430, 1325, 0.82)}
  `;
};

const buildYamamotoCta = (slide, theme, artwork, assets = {}) => {
  return `
    ${yamamotoFrame(theme, assets)}
    ${textBlock({ text: slide.heading || '', y: 520, size: 48, color: theme.gray, lineHeight: 1.28, maxChars: 17 })}
    ${yamamotoPhotoPlaceholder(theme, assets)}
    ${singleLineText({ text: '＼無料相談受付中📣／', y: 1270, size: 54, minSize: 36, maxWidth: 820, color: theme.gray })}
    ${singleLineText({ text: '（ご予約はこちらリンク）', y: 1380, size: 42, minSize: 30, maxWidth: 820, color: theme.gray })}
  `;
};

const buildNishiumiCover = (slide, theme, artwork, assets = {}) => {
  const pillText = [slide.titleTop, slide.titleMiddle].filter(Boolean).join('\n');
  return `
    ${nishiumiFrame(theme, assets)}
    ${roundedPill(85, 500, 910, 260, theme.pill)}
    ${centeredTextBlock({ text: pillText, y: 535, height: 112, size: 42, color: theme.accent, maxChars: 16, lineHeight: 1.22 })}
    ${centeredTextBlock({ text: slide.titleMain || '', y: 655, height: 80, size: 43, color: '#ffffff', maxChars: 18, lineHeight: 1.18 })}
    ${artwork ? artworkImage(artwork, 0, 'nishiumi') : toothMascot(slide.mascot, 410, 880, 0.92)}
    ${textBlock({ text: '自信ある笑顔へ', y: 1255, size: 46, color: theme.gray, lineHeight: 1.25, maxChars: 16 })}
  `;
};

const buildNishiumiBenefits = (slide, theme, artwork, assets = {}) => {
  const points = (slide.points || []).slice(0, 4);
  const pillY = points.length >= 4 ? [500, 655, 810, 965] : [545, 720, 895];
  const pills = points
    .map((point, index) => `
      ${roundedPill(55, pillY[index], 970, 112, theme.pill)}
      ${centeredTextBlock({ text: point, y: pillY[index], height: 112, size: point.length > 25 ? 38 : 44, color: '#ffffff', maxChars: 21, lineHeight: 1.18 })}
    `)
    .join('');
  const artworkY = points.length >= 4 ? 1120 : 1160;

  return `
    ${nishiumiFrame(theme, assets)}
    ${singleLineText({ text: `＼${slide.heading || ''}／`, y: 455, size: 48, minSize: 34, maxWidth: 900, color: theme.gray })}
    ${pills}
    ${artwork ? artworkImage(artwork, 1, 'nishiumi') : toothMascot(slide.mascot, 420, artworkY, 0.78)}
    ${slide.closing ? textBlock({ text: slide.closing, y: points.length >= 4 ? 1450 : 1365, size: 48, color: theme.accent, lineHeight: 1.32, maxChars: 18 }) : ''}
  `;
};

const buildNishiumiRecommend = (slide, theme, artwork, assets = {}) => {
  const points = (slide.points || []).slice(0, 4);
  const pillY = points.length >= 4 ? [545, 700, 855, 1010] : [575, 760, 945];
  const pills = points
    .map((point, index) => `
      ${roundedPill(55, pillY[index], 970, 112, theme.pill)}
      ${centeredTextBlock({ text: point, y: pillY[index], height: 112, size: point.length > 25 ? 36 : 42, color: '#ffffff', maxChars: 21, lineHeight: 1.18 })}
    `)
    .join('');

  return `
    ${nishiumiFrame(theme, assets)}
    ${singleLineText({ text: `＼${slide.heading || 'こんな方におすすめ'}／`, y: 455, size: 48, minSize: 34, maxWidth: 900, color: theme.gray })}
    ${pills}
    ${slide.closing ? textBlock({ text: slide.closing, y: 1215, size: 46, color: theme.accent, lineHeight: 1.3, maxChars: 18 }) : ''}
    ${artwork ? artworkImage(artwork, 2, 'nishiumi') : toothMascot(slide.mascot, 420, points.length >= 4 ? 1300 : 1235, 0.78)}
  `;
};

const buildNishiumiCta = (slide, theme, artwork, assets = {}) => {
  return `
    ${nishiumiFrame(theme, assets)}
    ${nishiumiPhotoPlaceholder(theme, assets)}
    ${textBlock({ text: slide.heading || '', y: 1245, size: 47, color: theme.gray, lineHeight: 1.32, maxChars: 17 })}
    ${textBlock({ text: 'なんでもお気軽にご相談ください！', y: 1370, size: 47, color: theme.blue, lineHeight: 1.28, maxChars: 17 })}
    ${singleLineText({ text: '（予約はこちらからURL）', y: 1525, size: 34, minSize: 28, maxWidth: 720, color: theme.gray })}
    ${singleLineText({ text: 'にしうみ歯科・矯正歯科', y: 1785, size: 33, minSize: 28, maxWidth: 680, color: '#6f3a05' })}
    ${singleLineText({ text: 'Nishiumi Dental Clinic', y: 1828, size: 21, minSize: 18, maxWidth: 520, color: '#6f3a05', weight: 500 })}
  `;
};

const osakaSayamaFrame = (theme) => `
  <rect width="${STORY_W}" height="${STORY_H}" fill="${theme.base}"/>
  <rect x="-1" y="-150" width="181" height="330" rx="90" fill="${theme.band}"/>
  <rect x="180" y="-150" width="180" height="330" rx="90" fill="${theme.yellow}"/>
  <rect x="360" y="-150" width="180" height="330" rx="90" fill="${theme.pink}"/>
  <rect x="540" y="-150" width="180" height="330" rx="90" fill="${theme.band}"/>
  <rect x="720" y="-150" width="180" height="330" rx="90" fill="${theme.yellow}"/>
  <rect x="900" y="-150" width="181" height="330" rx="90" fill="${theme.pink}"/>
  <rect x="-1" y="1740" width="181" height="330" rx="90" fill="${theme.pink}"/>
  <rect x="180" y="1740" width="180" height="330" rx="90" fill="${theme.yellow}"/>
  <rect x="360" y="1740" width="180" height="330" rx="90" fill="${theme.band}"/>
  <rect x="540" y="1740" width="180" height="330" rx="90" fill="${theme.pink}"/>
  <rect x="720" y="1740" width="180" height="330" rx="90" fill="${theme.yellow}"/>
  <rect x="900" y="1740" width="181" height="330" rx="90" fill="${theme.band}"/>
`;

const osakaSayamaFrameOnlySvg = (theme) => `<svg xmlns="http://www.w3.org/2000/svg" width="${STORY_W}" height="${STORY_H}" viewBox="0 0 ${STORY_W} ${STORY_H}">
  ${osakaSayamaFrame(theme)}
</svg>`;

const getOsakaSayamaClinicPhotoPath = (postIndex = 0) =>
  OSAKA_SAYAMA_CLINIC_PHOTO_PATHS[Math.abs(postIndex) % OSAKA_SAYAMA_CLINIC_PHOTO_PATHS.length];

const osakaSayamaPhoto = (assets = {}, postIndex = 0) => `
  <image href="${escapeXml(assets.osakaSayamaClinicPhotos?.[Math.abs(postIndex) % OSAKA_SAYAMA_CLINIC_PHOTO_PATHS.length] || assetHref(getOsakaSayamaClinicPhotoPath(postIndex)))}" x="210" y="690" width="660" height="440" preserveAspectRatio="xMidYMid slice"/>
`;

const buildOsakaSayamaCover = (slide, theme, artwork) => {
  const main = slide.titleMain || '';
  return `
    ${osakaSayamaFrame(theme)}
    ${textBlock({ text: slide.titleTop || '', y: 665, size: 56, color: theme.gray, lineHeight: 1.18, maxChars: 18 })}
    ${singleLineText({ text: `＼${slide.titleMiddle || ''}／`, y: 760, size: 58, minSize: 39, maxWidth: 780, color: theme.blue })}
    ${textBlock({ text: main, y: 900, size: main.length > 18 ? 54 : 60, color: theme.green, lineHeight: 1.28, maxChars: 14 })}
    ${artwork ? artworkImage(artwork, 0, 'osakaSayama') : toothMascot(slide.mascot, 430, 1065, 0.9)}
  `;
};

const buildOsakaSayamaBenefits = (slide, theme, artwork) => {
  const points = (slide.points || []).slice(0, 4);
  const rowY = [610, 755, 900, 1045];
  const colors = [theme.band, '#f5aa20', theme.pink, theme.green];
  const rows = points
    .map((point, index) => `
      <rect x="110" y="${rowY[index]}" width="860" height="112" rx="14" fill="#ffffff" stroke="${colors[index]}" stroke-width="4"/>
      ${centeredTextBlock({ text: point, y: rowY[index], height: 112, size: point.length > 25 ? 40 : 46, color: theme.gray, maxChars: 22, lineHeight: 1.16 })}
    `)
    .join('');

  return `
    ${osakaSayamaFrame(theme)}
    ${singleLineText({ text: `＼${slide.heading || ''}／`, y: 520, size: 56, minSize: 35, maxWidth: 920, color: theme.gray })}
    ${rows}
    ${slide.closing ? textBlock({ text: slide.closing, y: 1255, size: 52, color: theme.gray, lineHeight: 1.25, maxChars: 18 }) : ''}
    ${artwork ? artworkImage(artwork, 1, 'osakaSayama') : toothMascot(slide.mascot, 430, 1305, 0.86)}
  `;
};

const buildOsakaSayamaRecommend = (slide, theme, artwork) => {
  const points = (slide.points || []).slice(0, 4);
  const rowY = [610, 755, 900, 1045];
  const colors = [theme.band, '#f5aa20', theme.pink, theme.green];
  const rows = points
    .map((point, index) => `
      <rect x="110" y="${rowY[index]}" width="860" height="112" rx="14" fill="#ffffff" stroke="${colors[index]}" stroke-width="4"/>
      ${centeredTextBlock({ text: point, y: rowY[index], height: 112, size: point.length > 25 ? 38 : 44, color: theme.gray, maxChars: 22, lineHeight: 1.16 })}
    `)
    .join('');

  return `
    ${osakaSayamaFrame(theme)}
    ${singleLineText({ text: `＼${slide.heading || 'こんな方におすすめ'}✨／`, y: 520, size: 54, minSize: 35, maxWidth: 850, color: theme.gray })}
    ${rows}
    ${artwork ? artworkImage(artwork, 2, 'osakaSayama') : toothMascot(slide.mascot, 430, 1305, 0.86)}
  `;
};

const buildOsakaSayamaCta = (slide, theme, artwork, assets = {}, postIndex = 0) => {
  const heading = formatOsakaSayamaCtaHeading(slide.heading || '');
  return `
    ${osakaSayamaFrame(theme)}
    ${textBlock({ text: heading, y: 430, size: 46, color: theme.gray, lineHeight: 1.35, maxChars: 17 })}
    ${osakaSayamaPhoto(assets, postIndex)}
    ${singleLineText({ text: '＼無料相談のご予約受付中🌱／', y: 1285, size: 50, minSize: 34, maxWidth: 900, color: theme.gray })}
    ${singleLineText({ text: 'ご予約はこちらリンク', y: 1375, size: 42, minSize: 30, maxWidth: 760, color: theme.gray })}
  `;
};

const kanouFrame = (theme, assets = {}) => `
  <image href="${escapeXml(assets.kanouBackground || assetHref(KANOU_BACKGROUND_PATH))}" x="0" y="0" width="${STORY_W}" height="${STORY_H}" preserveAspectRatio="xMidYMid slice"/>
  <rect width="${STORY_W}" height="${STORY_H}" fill="#ffffff" opacity="0.18"/>
  <rect width="${STORY_W}" height="184" fill="${theme.band}"/>
  <rect y="1736" width="${STORY_W}" height="184" fill="${theme.band}"/>
  <rect y="184" width="${STORY_W}" height="1552" fill="#ffffff" opacity="0.78"/>
`;

const kanouFrameOnlySvg = (theme, assets = {}) => `<svg xmlns="http://www.w3.org/2000/svg" width="${STORY_W}" height="${STORY_H}" viewBox="0 0 ${STORY_W} ${STORY_H}">
  ${kanouFrame(theme, assets)}
</svg>`;

const kanouHeadingPill = (theme, text, y = 355) => `
  ${roundedPill(62, y, 956, 145, theme.pill)}
  ${centeredTextBlock({ text, y, height: 145, size: 58, color: '#ffffff', maxChars: 15, lineHeight: 1.16 })}
`;

const getKanouBenefitTextLayout = (text = '') => {
  const candidates = [
    { size: 48, maxChars: 18, lineHeight: 1.12 },
    { size: 44, maxChars: 18, lineHeight: 1.12 },
    { size: 40, maxChars: 20, lineHeight: 1.1 },
    { size: 36, maxChars: 22, lineHeight: 1.08 },
    { size: 32, maxChars: 24, lineHeight: 1.06 }
  ];

  for (const candidate of candidates) {
    const lines = smartWrap(text, candidate.maxChars);
    const maxLineWidth = Math.max(...lines.map((line) => estimateKanouTextWidth(line, candidate.size)), 0);
    const totalHeight = candidate.size + (lines.length - 1) * candidate.size * candidate.lineHeight;
    if (lines.length <= 2 && maxLineWidth <= 830 && totalHeight <= 108) {
      return { ...candidate, lines };
    }
  }

  const fallback = candidates.at(-1);
  return { ...fallback, lines: smartWrap(text, fallback.maxChars) };
};

const kanouBenefitCard = (theme, text, y) => {
  const layout = getKanouBenefitTextLayout(text);
  return `
    <rect x="80" y="${y}" width="920" height="135" fill="#ffffff" opacity="0.92" stroke="${theme.pill}" stroke-width="4"/>
    ${centeredLinesBlock({ lines: layout.lines, y, height: 135, size: layout.size, color: theme.gray, lineHeight: layout.lineHeight })}
  `;
};

const kanouSoftToothIcon = (x, y) => `
  <g transform="translate(${x} ${y}) scale(0.42)" opacity="0.7">
    <path d="M98 18 C128 -10 194 9 202 67 C209 119 188 204 176 240 C168 265 139 263 133 237 L124 197 C120 179 97 178 91 196 L78 237 C70 263 42 265 35 240 C24 200 10 121 16 70 C22 22 65 -1 98 18 Z" fill="#e7eef1"/>
    <path d="M58 48 C72 63 92 62 104 48 C119 63 143 62 157 48" fill="none" stroke="#a8cfdd" stroke-width="8" stroke-linecap="round"/>
  </g>
`;

const kanouToothEmojiBullet = (x, y) => `
  <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="44" font-family="${escapeXml(fontFamily)}, Apple Color Emoji, Segoe UI Emoji, sans-serif">🦷</text>
`;

const estimateKanouTextWidth = (text = '', size = 47) =>
  Array.from(String(text || '')).reduce((total, char) => total + (char.charCodeAt(0) < 128 ? size * 0.55 : size * 0.92), 0);

const getKanouRecommendRowLayout = (text = '') => {
  const size = Array.from(text || '').length > 23 ? 42 : 47;
  const lines = smartWrap(text, 22);
  const textWidth = Math.min(820, Math.max(...lines.map((line) => estimateKanouTextWidth(line, size)), 0));
  const iconWidth = 44;
  const gap = 28;
  const groupWidth = iconWidth + gap + textWidth;
  const startX = Math.max(70, (STORY_W - groupWidth) / 2);

  return {
    size,
    iconX: startX + iconWidth / 2,
    textX: startX + iconWidth + gap,
    textWidth,
    groupWidth
  };
};

const getKanouRecommendListLayout = (points = []) => {
  const rows = points.map((point) => getKanouRecommendRowLayout(point));
  const iconWidth = 44;
  const gap = 28;
  const groupWidth = Math.min(940, Math.max(...rows.map((row) => row.groupWidth), 0));
  const startX = Math.max(70, (STORY_W - groupWidth) / 2);

  return rows.map((row) => ({
    ...row,
    iconX: startX + iconWidth / 2,
    textX: startX + iconWidth + gap,
    textWidth: Math.max(0, groupWidth - iconWidth - gap)
  }));
};

const kanouFlowerGroup = (x = 360, y = 1130, scale = 1) => `
  <g transform="translate(${x} ${y}) scale(${scale})">
    <g transform="translate(0 0)">
      <path d="M52 108 L52 182" stroke="#a6d9a6" stroke-width="14" stroke-linecap="round"/>
      <path d="M48 132 C16 113 9 88 20 62 C34 33 73 37 84 64 C96 95 79 119 48 132 Z" fill="#f2a3ad"/>
      <path d="M50 150 C26 149 7 139 0 120 C25 117 44 124 56 143 Z" fill="#bde6bd"/>
      <path d="M58 150 C82 149 101 139 108 120 C83 117 64 124 52 143 Z" fill="#bde6bd"/>
    </g>
    <g transform="translate(135 0)">
      <path d="M52 108 L52 182" stroke="#a6d9a6" stroke-width="14" stroke-linecap="round"/>
      <path d="M48 132 C16 113 9 88 20 62 C34 33 73 37 84 64 C96 95 79 119 48 132 Z" fill="#fee5a4"/>
      <path d="M50 150 C26 149 7 139 0 120 C25 117 44 124 56 143 Z" fill="#bde6bd"/>
      <path d="M58 150 C82 149 101 139 108 120 C83 117 64 124 52 143 Z" fill="#bde6bd"/>
    </g>
    <g transform="translate(270 0)">
      <path d="M52 108 L52 182" stroke="#a6d9a6" stroke-width="14" stroke-linecap="round"/>
      <path d="M48 132 C16 113 9 88 20 62 C34 33 73 37 84 64 C96 95 79 119 48 132 Z" fill="#9ed0ea"/>
      <path d="M50 150 C26 149 7 139 0 120 C25 117 44 124 56 143 Z" fill="#bde6bd"/>
      <path d="M58 150 C82 149 101 139 108 120 C83 117 64 124 52 143 Z" fill="#bde6bd"/>
    </g>
  </g>
`;

const getKanouStaffPhotoPath = (postIndex = 0) =>
  KANOU_STAFF_PHOTO_PATHS[Math.abs(postIndex) % KANOU_STAFF_PHOTO_PATHS.length];

const kanouPhotoFrame = (theme) => `
  <path d="M320 1075 L320 690 C320 560 760 560 760 690 L760 1075 Z" fill="#ffffff" stroke="#d9a758" stroke-width="3"/>
`;

const kanouStaffPhoto = (theme, assets = {}, postIndex = 0) => {
  const index = Math.abs(postIndex) % KANOU_STAFF_PHOTO_PATHS.length;
  const imageHref = assets.kanouStaffPhotos?.[index] || assetHref(getKanouStaffPhotoPath(postIndex));
  const isMale = index === 1;
  const x = isMale ? 275 : 292;
  const y = isMale ? 508 : 520;
  const width = isMale ? 530 : 500;
  const height = isMale ? 595 : 575;
  return `
    ${kanouPhotoFrame(theme)}
    <image href="${escapeXml(imageHref)}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMax meet" style="filter: drop-shadow(0 6px 8px rgba(90, 70, 50, 0.12));"/>
  `;
};

const buildKanouCover = (slide, theme, artwork, assets = {}) => `
  ${kanouFrame(theme, assets)}
  <rect x="110" y="512" width="860" height="895" rx="50" fill="#ffffff" stroke="${theme.border}" stroke-width="4"/>
  ${textBlock({ text: slide.titleTop || '', y: 730, size: 50, color: theme.gray, maxChars: 16 })}
  ${roundedPill(180, 765, 720, 100, theme.pill)}
  ${centeredTextBlock({ text: slide.titleMiddle || '', y: 765, height: 100, size: 54, color: '#ffffff', maxChars: 15 })}
  ${singleLineText({ text: `＼${slide.titleMain || ''}／`, y: 985, size: 58, minSize: 38, maxWidth: 760, color: theme.gray })}
  ${artwork ? artworkImage(artwork, 0, 'kanou') : kanouFlowerGroup()}
`;

const buildKanouBenefits = (slide, theme, artwork, assets = {}) => {
  const points = (slide.points || []).slice(0, 4);
  const rowY = [570, 790, 1010, 1230];
  const rows = points
    .map((point, index) => kanouBenefitCard(theme, point, rowY[index]))
    .join('');

  return `
    ${kanouFrame(theme, assets)}
    ${kanouHeadingPill(theme, slide.heading || '', 360)}
    ${rows}
    ${slide.closing ? textBlock({ text: slide.closing, y: 1510, size: 48, color: theme.gray, lineHeight: 1.28, maxChars: 18 }) : ''}
  `;
};

const buildKanouRecommend = (slide, theme, artwork, assets = {}) => {
  const points = (slide.points || []).slice(0, 4);
  const rowY = [690, 805, 920, 1035];
  const layouts = getKanouRecommendListLayout(points);
  const rows = points
    .map((point, index) => {
      const layout = layouts[index];
      return `
        ${kanouToothEmojiBullet(layout.iconX, rowY[index] + 5)}
        ${textBlock({ text: point, x: layout.textX, y: rowY[index] + 20, size: layout.size, color: theme.gray, anchor: 'start', maxChars: 22, lineHeight: 1.18 })}
      `;
    })
    .join('');

  return `
    ${kanouFrame(theme, assets)}
    ${kanouHeadingPill(theme, slide.heading || 'こんな方におすすめ', 455)}
    ${rows}
    ${artwork ? artworkImage(artwork, 2, 'kanou') : kanouFlowerGroup(390, 1210, 0.75)}
  `;
};

const buildKanouCta = (slide, theme, artwork, assets = {}, postIndex = 0) => {
  const heading = smartWrap(slide.heading || '', 18).join('\n');
  return `
    ${kanouFrame(theme, assets)}
    ${kanouStaffPhoto(theme, assets, postIndex)}
    <rect x="215" y="1158" width="650" height="18" fill="${theme.band}" opacity="0.8"/>
    <rect x="215" y="1224" width="650" height="18" fill="${theme.band}" opacity="0.8"/>
    ${textBlock({ text: heading, y: 1150, size: 45, color: theme.gray, lineHeight: 1.3, maxChars: 18 })}
    ${singleLineText({ text: '（ご予約はこちらリンク）', y: 1395, size: 38, minSize: 30, maxWidth: 760, color: theme.gray })}
  `;
};

const createSvg = (slide, index, theme, artwork, template = 'inoue', assets = {}, postIndex = 0) => {
  const builders =
    template === 'kumata'
      ? [buildKumataCover, buildKumataBenefits, buildKumataRecommend, buildKumataCta]
      : template === 'yamamoto'
        ? [buildYamamotoCover, buildYamamotoBenefits, buildYamamotoRecommend, buildYamamotoCta]
        : template === 'nishiumi'
          ? [buildNishiumiCover, buildNishiumiBenefits, buildNishiumiRecommend, buildNishiumiCta]
          : template === 'osakaSayama'
            ? [buildOsakaSayamaCover, buildOsakaSayamaBenefits, buildOsakaSayamaRecommend, buildOsakaSayamaCta]
            : template === 'kanou'
              ? [buildKanouCover, buildKanouBenefits, buildKanouRecommend, buildKanouCta]
        : [buildCover, buildBenefits, buildRecommend, buildCta];
  const body = builders[index](slide, theme, artwork, assets, postIndex);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${STORY_W}" height="${STORY_H}" viewBox="0 0 ${STORY_W} ${STORY_H}">
    <title>Instagram story slide ${index + 1}</title>
    ${body}
  </svg>`;
};

const parseBrief = (brief) => {
  const sections = [...brief.matchAll(/【\s*(\d+)\s*ページ目\s*】([\s\S]*?)(?=【\s*\d+\s*ページ目\s*】|$)/g)]
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .map((match) => match[2].trim());

  if (sections.length < 4) return defaultSlides;

  const page1 = splitLines(sections[0]);
  const page2 = splitLines(sections[1]);
  const page3 = splitLines(sections[2]);
  const page4 = splitLines(sections[3]);

  return [
    {
      titleTop: page1[0] || defaultSlides[0].titleTop,
      titleMiddle: page1[1] || defaultSlides[0].titleMiddle,
      titleMain: page1.slice(2).join('\n') || defaultSlides[0].titleMain,
      mascot: 'heart'
    },
    {
      heading: page2[0] || defaultSlides[1].heading,
      points: page2.filter((line) => /^[・\-]/.test(line)).map((line) => line.replace(/^[・\-\s]+/, '')),
      closing: page2.filter((line) => !/^[・\-]/.test(line)).slice(1).join('\n'),
      mascot: 'doctor'
    },
    {
      heading: (page3[0] || defaultSlides[2].heading).replace(/^＼|／$/g, ''),
      points: page3.slice(1).map((line) => line.replace(/^[✔✓・\-\s]+/, '')),
      mascot: 'friends'
    },
    {
      heading: page4.join('\n') || defaultSlides[3].heading,
      sub: defaultSlides[3].sub,
      button: defaultSlides[3].button,
      mascot: 'clinic'
    }
  ];
};

const artworkStorageKey = (clientKey) => `${ARTWORK_STORAGE_KEY}:${clientKey}`;

const openArtworkDb = () =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(ARTWORK_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ARTWORK_DB_STORE)) {
        const store = db.createObjectStore(ARTWORK_DB_STORE, { keyPath: 'storageId' });
        store.createIndex('clientKey', 'clientKey', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const loadArtworksFromIndexedDb = async (clientKey) => {
  const db = await openArtworkDb();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ARTWORK_DB_STORE, 'readonly');
    const store = transaction.objectStore(ARTWORK_DB_STORE);
    const request = store.index('clientKey').getAll(window.IDBKeyRange.only(clientKey));
    request.onsuccess = () => {
      db.close();
      resolve((request.result || []).map(({ storageId, clientKey: _clientKey, ...item }) => item));
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

const replaceArtworksInIndexedDb = async (clientKey, items) => {
  const db = await openArtworkDb();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ARTWORK_DB_STORE, 'readwrite');
    const store = transaction.objectStore(ARTWORK_DB_STORE);
    const request = store.index('clientKey').openCursor(window.IDBKeyRange.only(clientKey));

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
        return;
      }

      items.forEach((item) => {
        store.put({ ...item, clientKey, storageId: `${clientKey}:${item.id}` });
      });
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

const parseStorageJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(error);
    return fallback;
  }
};

const mergeArtworksById = (...groups) => {
  const artworkMap = new Map();
  groups.flat().filter(Boolean).forEach((item) => {
    if (item?.id && !artworkMap.has(item.id)) {
      artworkMap.set(item.id, item);
    }
  });
  return Array.from(artworkMap.values());
};

const loadArtworkBackup = () => {
  if (typeof window === 'undefined') return {};
  return parseStorageJson(window.localStorage.getItem(ARTWORK_BACKUP_STORAGE_KEY), {});
};

const saveArtworkBackup = (backup) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ARTWORK_BACKUP_STORAGE_KEY, JSON.stringify(backup));
};

const rememberArtworkBackup = (clientKey, items) => {
  if (!Array.isArray(items) || !items.length) return;
  const backup = loadArtworkBackup();
  backup[clientKey] = mergeArtworksById(backup[clientKey] || [], items);
  saveArtworkBackup(backup);
};

const loadArtworks = (clientKey = 'inoue') => {
  try {
    if (typeof window === 'undefined') return [];
    const namespaced = parseStorageJson(window.localStorage.getItem(artworkStorageKey(clientKey)), null);
    const legacy =
      clientKey === 'inoue' ? parseStorageJson(window.localStorage.getItem(ARTWORK_STORAGE_KEY), null) : null;
    const backup = loadArtworkBackup();
    const backupItems = Array.isArray(backup[clientKey]) ? backup[clientKey] : [];
    const savedItems = Array.isArray(namespaced) && namespaced.length ? namespaced : null;
    const legacyItems = Array.isArray(legacy) && legacy.length ? legacy : null;
    const items = savedItems || legacyItems || backupItems;
    rememberArtworkBackup(clientKey, items);
    return Array.isArray(items) ? items : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

const saveArtworks = (items, clientKey = 'inoue', options = {}) => {
  if (typeof window === 'undefined') return;
  const nextItems = Array.isArray(items) ? items : [];
  const backup = loadArtworkBackup();
  const backupItems = Array.isArray(backup[clientKey]) ? backup[clientKey] : [];

  if (!options.allowEmpty && !nextItems.length) {
    return;
  }

  try {
    window.localStorage.setItem(artworkStorageKey(clientKey), JSON.stringify(nextItems));
  } catch (error) {
    console.warn('localStorageにイラストを保存できませんでした。IndexedDBに保存します。', error);
  }
  backup[clientKey] = options.allowEmpty ? nextItems : mergeArtworksById(backupItems, nextItems);
  try {
    saveArtworkBackup(backup);
  } catch (error) {
    console.warn('localStorageにイラストのバックアップを保存できませんでした。', error);
  }
  replaceArtworksInIndexedDb(clientKey, nextItems).catch((error) => {
    console.warn('IndexedDBにイラストを保存できませんでした。', error);
  });
};

const draftStorageKey = (clientKey) => `${DRAFT_STORAGE_KEY}:${clientKey}`;

const defaultClientDraft = (clientKey = 'inoue') => {
  const client = clients[clientKey] || clients.inoue;
  return {
    brief: sampleBriefs[clientKey] || sampleBrief,
    themeKey: client.defaultThemeKey,
    artworkAssignments: ['', '', ''],
    bulkArtworkAssignments: {},
    bulkPosts: [],
    selectedPostId: ''
  };
};

const normalizeDraft = (draft, clientKey = 'inoue') => {
  const fallback = defaultClientDraft(clientKey);
  const bulkPosts = Array.isArray(draft?.bulkPosts) ? draft.bulkPosts : fallback.bulkPosts;
  const selectedPostId = bulkPosts.some((post) => post.id === draft?.selectedPostId) ? draft.selectedPostId : '';

  return {
    ...fallback,
    ...draft,
    brief: typeof draft?.brief === 'string' ? draft.brief : fallback.brief,
    themeKey: typeof draft?.themeKey === 'string' ? draft.themeKey : fallback.themeKey,
    artworkAssignments: Array.isArray(draft?.artworkAssignments)
      ? [...draft.artworkAssignments, '', '', ''].slice(0, 3)
      : fallback.artworkAssignments,
    bulkArtworkAssignments: draft?.bulkArtworkAssignments && typeof draft.bulkArtworkAssignments === 'object'
      ? draft.bulkArtworkAssignments
      : fallback.bulkArtworkAssignments,
    bulkPosts,
    selectedPostId
  };
};

const loadClientDraft = (clientKey = 'inoue') => {
  try {
    const saved = window.localStorage.getItem(draftStorageKey(clientKey));
    return normalizeDraft(saved ? JSON.parse(saved) : null, clientKey);
  } catch (error) {
    console.error(error);
    return defaultClientDraft(clientKey);
  }
};

const saveClientDraft = (clientKey, draft) => {
  window.localStorage.setItem(draftStorageKey(clientKey), JSON.stringify(normalizeDraft(draft, clientKey)));
};

const createArtworkId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });

const readFileAsArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

const parseCsvText = (text) => {
  const firstLine = text.split(/\r?\n/)[0] || '';
  const delimiter = firstLine.includes('\t') && !firstLine.includes(',') ? '\t' : ',';
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((value) => String(value).trim())) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => String(value).trim())) rows.push(row);
  return rows;
};

const tableRowsToObjects = (rows) => {
  if (!rows.length) return [];
  const headerIndex = rows.findIndex((row) => {
    const normalized = row.map((cell) => String(cell || '').replace(/\s/g, '').toLowerCase());
    return (
      normalized.some((cell) => ['投稿名', 'タイトル', 'テーマ', '内容', '番号'].includes(cell)) &&
      normalized.some((cell) => ['参考/ワード', '参考ワード', '企画', '企画文', '1ページ目', '1枚目', 'page1'].includes(cell))
    );
  });
  const safeHeaderIndex = headerIndex >= 0 ? headerIndex : 0;
  const headers = rows[safeHeaderIndex].map((header) => String(header || '').trim());
  return rows.slice(safeHeaderIndex + 1).map((row) =>
    headers.reduce((object, header, index) => {
      if (header) object[header] = row[index] ?? '';
      return object;
    }, {})
  );
};

const getCell = (row, names) => {
  const normalized = Object.entries(row).reduce((object, [key, value]) => {
    object[String(key).replace(/\s/g, '').toLowerCase()] = value;
    return object;
  }, {});
  for (const name of names) {
    const value = normalized[String(name).replace(/\s/g, '').toLowerCase()];
    if (value !== undefined && String(value).trim()) return String(value).trim();
  }
  return '';
};

const rowToBrief = (row, index) => {
  const raw = getCell(row, ['参考/ワード', '参考ワード', '企画', '企画文', '本文', 'ストーリーズ企画', 'story', 'brief']);
  if (raw.includes('【1ページ目】')) return raw;

  const page1 = getCell(row, ['1ページ目', '1枚目', 'page1', 'p1']);
  const page2 = getCell(row, ['2ページ目', '2枚目', 'page2', 'p2']);
  const page3 = getCell(row, ['3ページ目', '3枚目', 'page3', 'p3']);
  const page4 = getCell(row, ['4ページ目', '4枚目', 'page4', 'p4']);
  if (!page1 && !page2 && !page3 && !page4) return '';

  return `【1ページ目】\n${page1}\n\n【2ページ目】\n${page2}\n\n【3ページ目】\n${page3}\n\n【4ページ目】\n${page4}`.trim();
};

const rowToPost = (row, index, clientKey = 'inoue') => {
  const brief = rowToBrief(row, index);
  if (!brief) return null;
  const number = getCell(row, ['番号', 'no', 'num']);
  const client = clients[clientKey] || clients.inoue;
  const fallbackThemeKey = client.rotateThemes
    ? themeOrder[index % themeOrder.length]
    : client.defaultThemeKey;
  const themeKey = client.rotateThemes
    ? normalizeThemeKey(
        getCell(row, ['テーマカラー', 'カラー', '色', 'theme', 'color']),
        fallbackThemeKey
      )
    : client.defaultThemeKey;
  const title =
    getCell(row, ['投稿名', 'タイトル', 'テーマ', '投稿テーマ', '内容', 'name', 'title']) ||
    `投稿${index + 1}`;
  return { id: `${Date.now()}-${index}`, title: number ? `${number}. ${title}` : title, brief, themeKey };
};

const parseSpreadsheetFile = async (file, clientKey = 'inoue') => {
  const lowerName = file.name.toLowerCase();
  let rows = [];

  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(await readFileAsArrayBuffer(file), { type: 'array' });
    const sheetName = workbook.SheetNames[workbook.SheetNames.length - 1];
    const sheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  } else {
    rows = parseCsvText(await readFileAsText(file));
  }

  return tableRowsToObjects(rows)
    .map((row, index) => rowToPost(row, index, clientKey))
    .filter(Boolean);
};

const isNearWhite = (r, g, b, a) => {
  if (a <= 8) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max - min;
  return (r > 248 && g > 248 && b > 248) || (max > 252 && min > 242 && saturation < 12);
};

const sanitizeSvgArtwork = (svgText) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg || doc.querySelector('parsererror')) return svgText;

  const viewBox = svg.getAttribute('viewBox')?.split(/[\s,]+/).map(Number);
  const svgWidth = viewBox?.[2] || parseFloat(svg.getAttribute('width')) || 0;
  const svgHeight = viewBox?.[3] || parseFloat(svg.getAttribute('height')) || 0;

  svg.querySelectorAll('rect').forEach((rect) => {
    const fill = (rect.getAttribute('fill') || '').trim().toLowerCase();
    const style = (rect.getAttribute('style') || '').toLowerCase();
    const isWhiteFill = ['#fff', '#ffffff', 'white', 'rgb(255,255,255)', 'rgb(255, 255, 255)'].includes(fill) || /fill:\s*(#fff|#ffffff|white|rgb\(255,\s*255,\s*255\))/.test(style);
    if (!isWhiteFill) return;

    const x = parseFloat(rect.getAttribute('x') || '0');
    const y = parseFloat(rect.getAttribute('y') || '0');
    const widthAttr = rect.getAttribute('width') || '';
    const heightAttr = rect.getAttribute('height') || '';
    const width = widthAttr.includes('%') ? svgWidth : parseFloat(widthAttr);
    const height = heightAttr.includes('%') ? svgHeight : parseFloat(heightAttr);
    const coversCanvas =
      x <= 1 &&
      y <= 1 &&
      (!svgWidth || width >= svgWidth * 0.9) &&
      (!svgHeight || height >= svgHeight * 0.9);

    if (coversCanvas) rect.remove();
  });

  svg.removeAttribute('style');
  return new XMLSerializer().serializeToString(svg);
};

const imageFromDataUrl = (dataUrl) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

const removeBorderWhitePixels = (canvas) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  const visited = new Uint8Array(width * height);
  const queue = [];

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (visited[index]) return;
    const pixel = index * 4;
    if (!isNearWhite(data[pixel], data[pixel + 1], data[pixel + 2], data[pixel + 3])) return;
    visited[index] = 1;
    queue.push(index);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor];
    const x = index % width;
    const y = Math.floor(index / width);
    const pixel = index * 4;
    data[pixel + 3] = 0;
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  ctx.putImageData(imageData, 0, 0);
};

const cropTransparentCanvas = (sourceCanvas, padding = 12) => {
  const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const imageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const { data, width, height } = imageData;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX > maxX || minY > maxY) return sourceCanvas;

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = maxX - minX + 1;
  targetCanvas.height = maxY - minY + 1;
  targetCanvas
    .getContext('2d')
    .drawImage(sourceCanvas, minX, minY, targetCanvas.width, targetCanvas.height, 0, 0, targetCanvas.width, targetCanvas.height);
  return targetCanvas;
};

const padCanvasToSquare = (sourceCanvas, outputSize = 900, artworkScale = 0.82) => {
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = outputSize;
  targetCanvas.height = outputSize;
  const targetCtx = targetCanvas.getContext('2d');
  targetCtx.clearRect(0, 0, outputSize, outputSize);

  const scale = Math.min((outputSize * artworkScale) / sourceCanvas.width, (outputSize * artworkScale) / sourceCanvas.height);
  const drawWidth = sourceCanvas.width * scale;
  const drawHeight = sourceCanvas.height * scale;
  const x = (outputSize - drawWidth) / 2;
  const y = (outputSize - drawHeight) / 2;
  targetCtx.drawImage(sourceCanvas, x, y, drawWidth, drawHeight);
  return targetCanvas;
};

const normalizeArtworkDataUrl = async (sourceDataUrl) => {
  const img = await imageFromDataUrl(sourceDataUrl);
  const maxSide = 900;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
  canvas.height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  removeBorderWhitePixels(canvas);
  return padCanvasToSquare(cropTransparentCanvas(canvas)).toDataURL('image/png');
};

const removeBorderWhiteBackgroundDataUrl = async (sourceDataUrl, padding = 18) => {
  const img = await imageFromDataUrl(sourceDataUrl);
  const maxSide = 1200;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
  canvas.height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  removeBorderWhitePixels(canvas);
  return cropTransparentCanvas(canvas, padding).toDataURL('image/png');
};

const normalizeArtworkFile = async (file) => {
  const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
  const sourceDataUrl = isSvg
    ? svgToDataUrl(sanitizeSvgArtwork(await readFileAsText(file)))
    : await readFileAsDataUrl(file);

  return normalizeArtworkDataUrl(sourceDataUrl);
};

const pickRandomArtworkId = (artworks, previousId) => {
  if (!artworks.length) return '';
  if (artworks.length === 1) return artworks[0].id;

  const candidates = artworks.filter((item) => item.id !== previousId);
  return candidates[Math.floor(Math.random() * candidates.length)].id;
};

const pickUniqueArtworkId = (artworks, previousId, usedIds = []) => {
  if (!artworks.length) return '';
  const unusedCandidates = artworks.filter((item) => item.id !== previousId && !usedIds.includes(item.id));
  const candidates = unusedCandidates.length
    ? unusedCandidates
    : artworks.filter((item) => item.id !== previousId);
  const finalPool = candidates.length ? candidates : artworks;
  return finalPool[Math.floor(Math.random() * finalPool.length)].id;
};

const buildRotatingArtworkSets = (posts, artworks, fallbackArtworks = []) => {
  const pool = artworks.length ? artworks : fallbackArtworks.filter(Boolean);
  if (!pool.length) return posts.map(() => fallbackArtworks);

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return posts.map((_, postIndex) =>
    [0, 1, 2].map((pageIndex) => shuffled[(postIndex + pageIndex) % shuffled.length])
  );
};

const buildRotatingArtworkAssignmentMap = (posts, artworks, fallbackIds = []) => {
  const poolIds = artworks.length ? artworks.map((artwork) => artwork.id) : fallbackIds.filter(Boolean);
  if (!poolIds.length) return {};

  const shuffledIds = [...poolIds].sort(() => Math.random() - 0.5);
  return posts.reduce((map, post, postIndex) => {
    const postIds = [];
    for (let pageIndex = 0; pageIndex < 3; pageIndex += 1) {
      const offset = postIndex + pageIndex;
      const unusedIds = shuffledIds.filter((id) => !postIds.includes(id));
      const sourceIds = unusedIds.length ? unusedIds : shuffledIds;
      postIds.push(sourceIds[offset % sourceIds.length]);
    }
    map[post.id] = postIds;
    return map;
  }, {});
};

const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const downloadReadyBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const svgToDataUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const imagePathToDataUrl = async (path) => {
  const response = await fetch(path);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const downloadPng = async (svg, filename) => {
  const img = new Image();
  const url = svgToDataUrl(svg);
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
};

const toCsv = (slides) => {
  const rows = [
    ['page', 'field', 'text'],
    ['1', 'top', slides[0].titleTop],
    ['1', 'middle', slides[0].titleMiddle],
    ['1', 'main', slides[0].titleMain],
    ['2', 'heading', slides[1].heading],
    ...slides[1].points.map((point, index) => ['2', `point_${index + 1}`, point]),
    ['2', 'closing', slides[1].closing],
    ['3', 'heading', slides[2].heading],
    ...slides[2].points.map((point, index) => ['3', `point_${index + 1}`, point]),
    ['4', 'heading', slides[3].heading],
    ['4', 'sub', slides[3].sub],
    ['4', 'button', slides[3].button]
  ];

  return rows.map((row) => row.map((cell) => `"${String(cell || '').replaceAll('"', '""')}"`).join(',')).join('\n');
};

const pt = (px) => Math.round(px * 0.52);
const inch = (px) => px * PX_TO_IN;
const hex = (color) => color.replace('#', '').toUpperCase();
const cleanText = (text = '') => String(text).replaceAll('＼', '').replaceAll('／', '').trim();

const addPptText = (slide, text, { x, y, w, h, size, color, bold = true, align = 'center', breakable = true }) => {
  const formatted = breakable ? smartWrap(text, Math.max(8, Math.floor(w / 62))).join('\n') : text;
  slide.addText(formatted, {
    x: inch(x),
    y: inch(y),
    w: inch(w),
    h: inch(h),
    margin: 0,
    fontFace: 'Yu Gothic',
    fontSize: pt(size),
    bold,
    color: hex(color),
    align,
    valign: 'mid',
    fit: 'shrink'
  });
};

const addPptBandFrame = (slide, pptx, theme, frameData) => {
  slide.background = { color: hex(theme.base) };
  slide.addImage({
    data: frameData || svgToDataUrl(waveFrameOnlySvg(theme)),
    x: 0,
    y: 0,
    w: PPTX_W,
    h: PPTX_H
  });
};

const addPptKumataFrame = (slide, theme, pptAssets = {}) => {
  slide.background = { color: hex(theme.base) };
  slide.addImage({
    data: pptAssets.kumataBackground || svgToDataUrl(kumataFrameOnlySvg(theme)),
    x: 0,
    y: 0,
    w: PPTX_W,
    h: PPTX_H
  });
};

const addPptYamamotoFrame = (slide, theme, pptAssets = {}) => {
  slide.background = { color: hex(theme.base) };
  slide.addImage({
    data: pptAssets.yamamotoBackground || svgToDataUrl(yamamotoFrameOnlySvg(theme)),
    x: 0,
    y: 0,
    w: PPTX_W,
    h: PPTX_H
  });
};

const addPptPill = (slide, pptx, x, y, w, h, text, theme, color = theme.pink) => {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: inch(x),
    y: inch(y),
    w: inch(w),
    h: inch(h),
    rectRadius: 0.08,
    fill: { color: hex(theme.pill) },
    line: { color: hex(theme.pill), transparency: 100 }
  });
  addPptText(slide, text, { x: x + 40, y: y + 12, w: w - 80, h: h - 18, size: text.length > 23 ? 40 : 43, color, breakable: false });
};

const addPptArtwork = (slide, artwork, index, template = 'inoue') => {
  if (!artwork?.dataUrl) return;
  const positions = template === 'kumata'
    ? kumataArtworkPositions
    : template === 'yamamoto'
      ? yamamotoArtworkPositions
      : template === 'nishiumi'
        ? nishiumiArtworkPositions
        : template === 'osakaSayama'
          ? osakaSayamaArtworkPositions
          : template === 'kanou'
            ? kanouArtworkPositions
      : artworkPositions;
  const position = positions[index] || positions[0];
  slide.addImage({
    data: artwork.dataUrl,
    x: inch(position.x),
    y: inch(position.y),
    w: inch(position.width),
    h: inch(position.height)
  });
};

const addPptPhotoPlaceholder = (slide, pptx, theme, pptAssets = {}, postIndex = 0) => {
  const clinicPhoto = pptAssets.inoueClinicPhotos?.[Math.abs(postIndex) % INOUE_CLINIC_PHOTO_PATHS.length];
  if (clinicPhoto) {
    slide.addImage({
      data: clinicPhoto,
      x: inch(205),
      y: inch(680),
      w: inch(670),
      h: inch(450)
    });
    return;
  }

  slide.addShape(pptx.ShapeType.roundRect, {
    x: inch(205),
    y: inch(680),
    w: inch(670),
    h: inch(450),
    rectRadius: 0.03,
    fill: { color: '37CFC8' },
    line: { color: '37CFC8', transparency: 100 }
  });
  addPptText(slide, 'CLINIC PHOTO', { x: 205, y: 835, w: 670, h: 70, size: 54, color: '#ffffff', breakable: false });
  addPptText(slide, 'Canvaで写真を差し替え', { x: 205, y: 910, w: 670, h: 50, size: 30, color: '#ffffff', breakable: false });
};

const addPptKumataPhotoPlaceholder = (slide, pptx, theme, pptAssets = {}) => {
  if (pptAssets.kumataClinicPhoto) {
    slide.addImage({
      data: pptAssets.kumataClinicPhoto,
      x: inch(190),
      y: inch(725),
      w: inch(700),
      h: inch(385)
    });
    return;
  }

  slide.addShape(pptx.ShapeType.rect, {
    x: inch(190),
    y: inch(725),
    w: inch(700),
    h: inch(395),
    fill: { color: 'E9D8CB' },
    line: { color: 'E9D8CB', transparency: 100 }
  });
  addPptText(slide, 'CLINIC PHOTO', { x: 190, y: 865, w: 700, h: 65, size: 52, color: '#ffffff', breakable: false });
  addPptText(slide, 'Canvaで写真を差し替え', { x: 190, y: 935, w: 700, h: 50, size: 30, color: '#ffffff', breakable: false });
};

const addPptYamamotoPhotoPlaceholder = (slide, pptx, theme, pptAssets = {}) => {
  if (pptAssets.yamamotoClinicPhoto) {
    slide.addImage({
      data: svgToDataUrl(yamamotoPhotoCircleSvg(pptAssets.yamamotoClinicPhoto)),
      x: inch(290),
      y: inch(665),
      w: inch(500),
      h: inch(500)
    });
    return;
  }

  slide.addShape(pptx.ShapeType.ellipse, {
    x: inch(290),
    y: inch(665),
    w: inch(500),
    h: inch(500),
    fill: { color: 'DCEBF4' },
    line: { color: 'DCEBF4', transparency: 100 }
  });
  addPptText(slide, 'CLINIC PHOTO', { x: 320, y: 855, w: 440, h: 60, size: 44, color: '#ffffff', breakable: false });
  addPptText(slide, 'Canvaで写真を差し替え', { x: 320, y: 920, w: 440, h: 50, size: 26, color: '#ffffff', breakable: false });
};

const addPptNishiumiFrame = (slide, theme, pptAssets = {}) => {
  slide.background = { color: hex(theme.base) };
  slide.addImage({
    data: pptAssets.nishiumiBackground || svgToDataUrl(nishiumiFrameOnlySvg(theme)),
    x: 0,
    y: 0,
    w: PPTX_W,
    h: PPTX_H
  });
};

const addPptNishiumiPhotoPlaceholder = (slide, pptx, theme, pptAssets = {}) => {
  if (pptAssets.nishiumiDoctorPhoto) {
    slide.addImage({
      data: pptAssets.nishiumiDoctorPhoto,
      x: inch(250),
      y: inch(500),
      w: inch(580),
      h: inch(702)
    });
    return;
  }

  addPptText(slide, 'CLINIC PHOTO', { x: 285, y: 680, w: 510, h: 65, size: 48, color: theme.blue, breakable: false });
};

const addPptOsakaSayamaFrame = (slide, theme, frameData) => {
  slide.background = { color: hex(theme.base) };
  slide.addImage({
    data: frameData || svgToDataUrl(osakaSayamaFrameOnlySvg(theme)),
    x: 0,
    y: 0,
    w: PPTX_W,
    h: PPTX_H
  });
};

const addPptOsakaSayamaPhoto = (slide, pptAssets = {}, postIndex = 0) => {
  const clinicPhoto = pptAssets.osakaSayamaClinicPhotos?.[Math.abs(postIndex) % OSAKA_SAYAMA_CLINIC_PHOTO_PATHS.length];
  if (!clinicPhoto) return;
  slide.addImage({
    data: clinicPhoto,
    x: inch(210),
    y: inch(690),
    w: inch(660),
    h: inch(440)
  });
};

const addPptKanouFrame = (slide, theme, frameData) => {
  slide.background = { color: hex(theme.base) };
  slide.addImage({
    data: frameData || svgToDataUrl(kanouFrameOnlySvg(theme)),
    x: 0,
    y: 0,
    w: PPTX_W,
    h: PPTX_H
  });
};

const addPptKanouHeadingPill = (slide, pptx, theme, text, y = 360) => {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: inch(62),
    y: inch(y),
    w: inch(956),
    h: inch(145),
    rectRadius: 0.08,
    fill: { color: hex(theme.pill) },
    line: { color: hex(theme.pill), transparency: 100 }
  });
  addPptText(slide, text, { x: 105, y: y + 18, w: 870, h: 105, size: 58, color: '#ffffff', breakable: true });
};

const addPptKanouStaffPhoto = (slide, theme, pptAssets = {}, postIndex = 0) => {
  slide.addImage({
    data: svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${STORY_W}" height="${STORY_H}" viewBox="0 0 ${STORY_W} ${STORY_H}">${kanouPhotoFrame(theme)}</svg>`),
    x: 0,
    y: 0,
    w: PPTX_W,
    h: PPTX_H
  });

  const index = Math.abs(postIndex) % KANOU_STAFF_PHOTO_PATHS.length;
  const isMale = index === 1;
  slide.addImage({
    data: pptAssets.kanouStaffPhotos?.[index] || '',
    x: inch(isMale ? 275 : 292),
    y: inch(isMale ? 508 : 520),
    w: inch(isMale ? 530 : 500),
    h: inch(isMale ? 595 : 575),
    sizing: { type: 'contain', x: inch(isMale ? 275 : 292), y: inch(isMale ? 508 : 520), w: inch(isMale ? 530 : 500), h: inch(isMale ? 595 : 575) }
  });
};

const createEditablePptx = async ({ slides, slideSets, theme, assignedArtworks, template = 'inoue', fileName = 'inoue-story-editable.pptx', postIndex = 0 }) => {
  const { default: pptxgen } = await import('pptxgenjs');
  const pptx = new pptxgen();
  pptx.author = 'Instagram Story Creative Generator';
  pptx.subject = 'Instagram Stories';
  pptx.title = 'Instagram Story Creative';
  pptx.company = 'OpenAI Codex';
  pptx.defineLayout({ name: 'INSTAGRAM_STORY', width: PPTX_W, height: PPTX_H });
  pptx.layout = 'INSTAGRAM_STORY';
  pptx.theme = {
    headFontFace: 'Yu Gothic',
    bodyFontFace: 'Yu Gothic',
    lang: 'ja-JP'
  };

  const deckItems = slideSets || [{ title: '', slides, template, postIndex }];
  const usesTemplate = (templateName) => deckItems.some((deckItem) => (deckItem.template || template) === templateName);
  const pptAssets = {};

  if (usesTemplate('inoue')) {
    pptAssets.inoueClinicPhotos = await Promise.all(INOUE_CLINIC_PHOTO_PATHS.map((path) => imagePathToDataUrl(path)));
  }

  if (usesTemplate('kumata')) {
    pptAssets.kumataBackground = await imagePathToDataUrl(KUMATA_BACKGROUND_PATH);
    pptAssets.kumataClinicPhoto = await imagePathToDataUrl(KUMATA_CLINIC_PHOTO_PATH);
  }

  if (usesTemplate('yamamoto')) {
    pptAssets.yamamotoBackground = await imagePathToDataUrl(YAMAMOTO_BACKGROUND_PATH);
    pptAssets.yamamotoClinicPhoto = await imagePathToDataUrl(YAMAMOTO_CLINIC_PHOTO_PATH);
  }

  if (usesTemplate('nishiumi')) {
    pptAssets.nishiumiBackground = await imagePathToDataUrl(NISHIUMI_BACKGROUND_PATH);
    pptAssets.nishiumiDoctorPhoto = await imagePathToDataUrl(NISHIUMI_DOCTOR_PHOTO_PATH);
  }

  if (usesTemplate('osakaSayama')) {
    pptAssets.osakaSayamaClinicPhotos = await Promise.all(OSAKA_SAYAMA_CLINIC_PHOTO_PATHS.map((path) => imagePathToDataUrl(path)));
  }

  if (usesTemplate('kanou')) {
    pptAssets.kanouBackground = await imagePathToDataUrl(KANOU_BACKGROUND_PATH);
    pptAssets.kanouStaffPhotos = await Promise.all(
      KANOU_STAFF_PHOTO_PATHS.map(async (path) => removeBorderWhiteBackgroundDataUrl(await imagePathToDataUrl(path)))
    );
  }

  const frameCache = new Map();
  const frameCacheKey = (templateName, itemTheme) => `${templateName}:${JSON.stringify(itemTheme)}`;
  const getFrameData = (templateName, itemTheme) => frameCache.get(frameCacheKey(templateName, itemTheme));
  const frameTemplates = new Set(['inoue', 'osakaSayama', 'kanou']);
  for (const deckItem of deckItems) {
    const itemTemplate = deckItem.template || template;
    if (!frameTemplates.has(itemTemplate)) continue;
    const itemTheme = deckItem.theme || theme;
    const cacheKey = frameCacheKey(itemTemplate, itemTheme);
    if (frameCache.has(cacheKey)) continue;
    const frameSvg = itemTemplate === 'osakaSayama'
      ? osakaSayamaFrameOnlySvg(itemTheme)
      : itemTemplate === 'kanou'
        ? kanouFrameOnlySvg(itemTheme, pptAssets)
        : waveFrameOnlySvg(itemTheme);
    frameCache.set(cacheKey, await downloadPng(frameSvg));
  }

  const artworkCache = new Map();
  const allAssignedArtworks = deckItems.flatMap((deckItem) => deckItem.assignedArtworks || assignedArtworks || []);
  for (const artwork of allAssignedArtworks) {
    if (!artwork?.dataUrl || artworkCache.has(artwork.dataUrl)) continue;
    try {
      artworkCache.set(artwork.dataUrl, await normalizeArtworkDataUrl(artwork.dataUrl));
    } catch (error) {
      console.error(error);
      artworkCache.set(artwork.dataUrl, artwork.dataUrl);
    }
  }

  deckItems.forEach((deckItem) => {
    const itemTheme = deckItem.theme || theme;
    const itemArtworks = (deckItem.assignedArtworks || assignedArtworks || []).map((artwork) =>
      artwork?.dataUrl ? { ...artwork, dataUrl: artworkCache.get(artwork.dataUrl) || artwork.dataUrl } : artwork
    );
    const itemTemplate = deckItem.template || template;
    const itemPostIndex = deckItem.postIndex || 0;
    deckItem.slides.forEach((storySlide, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: hex(itemTheme.base) };

    if (itemTemplate === 'kumata') {
      addPptKumataFrame(slide, itemTheme, pptAssets);

      if (index === 0) {
        const topLines = [storySlide.titleTop, storySlide.titleMiddle].filter(Boolean).join('\n');
        addPptText(slide, topLines, { x: 100, y: 545, w: 880, h: 150, size: 54, color: itemTheme.gray, breakable: true });
        addPptText(slide, '▼', { x: 490, y: 750, w: 100, h: 80, size: 64, color: itemTheme.gray, breakable: false });
        addPptText(slide, storySlide.titleMain || '', { x: 95, y: 875, w: 890, h: 135, size: 58, color: itemTheme.pink, breakable: true });
        addPptArtwork(slide, itemArtworks[0], 0, 'kumata');
      }

      if (index === 1) {
        addPptText(slide, `＼${storySlide.heading || ''}／`, { x: 45, y: 420, w: 990, h: 75, size: 52, color: itemTheme.gray, breakable: false });
        (storySlide.points || []).slice(0, 4).forEach((point, pointIndex) => {
          const y = [560, 745, 930, 1115][pointIndex];
          slide.addShape(pptx.ShapeType.roundRect, {
            x: inch(86),
            y: inch(y),
            w: inch(908),
            h: inch(132),
            rectRadius: 0.04,
            fill: { color: hex(itemTheme.blue) },
            line: { color: hex(itemTheme.blue), transparency: 100 }
          });
          addPptText(slide, point, { x: 125, y, w: 830, h: 132, size: point.length > 27 ? 39 : 43, color: '#ffffff', breakable: true });
        });
        if (storySlide.closing) {
          addPptText(slide, storySlide.closing, { x: 120, y: 1290, w: 840, h: 105, size: 44, color: itemTheme.gray, breakable: true });
        }
        addPptArtwork(slide, itemArtworks[1], 1, 'kumata');
      }

      if (index === 2) {
        addPptText(slide, `＼${storySlide.heading || 'こんな方におすすめ'}／`, { x: 75, y: 385, w: 930, h: 80, size: 56, color: itemTheme.gray, breakable: false });
        const points = (storySlide.points || []).slice(0, 4);
        const pillY = points.length >= 4 ? [540, 705, 870, 1035] : [590, 775, 960];
        points.forEach((point, pointIndex) => {
          const y = pillY[pointIndex];
          slide.addShape(pptx.ShapeType.roundRect, {
            x: inch(86),
            y: inch(y),
            w: inch(908),
            h: inch(128),
            rectRadius: 0.04,
            fill: { color: hex(itemTheme.blue) },
            line: { color: hex(itemTheme.blue), transparency: 100 }
          });
          addPptText(slide, point, { x: 125, y, w: 830, h: 128, size: point.length > 27 ? 39 : 43, color: '#ffffff', breakable: true });
        });
        addPptArtwork(slide, itemArtworks[2], 2, 'kumata');
      }

      if (index === 3) {
        const headingLength = Array.from(String(storySlide.heading || '').replace(/\s/g, '')).length;
        const headingSize = headingLength > 34 ? 43 : headingLength > 24 ? 48 : 54;
        addPptText(slide, storySlide.heading, { x: 80, y: 480, w: 920, h: 145, size: headingSize, color: itemTheme.gray, breakable: true });
        addPptKumataPhotoPlaceholder(slide, pptx, itemTheme, pptAssets);
        addPptText(slide, '＼無料カウンセリングご予約受付中／', { x: 50, y: 1230, w: 980, h: 70, size: 48, color: itemTheme.gray, breakable: false });
        addPptText(slide, '（ご予約はこちらリンク）', { x: 130, y: 1340, w: 820, h: 65, size: 42, color: itemTheme.gray, breakable: false });
      }

      return;
    }

    if (itemTemplate === 'yamamoto') {
      addPptYamamotoFrame(slide, itemTheme, pptAssets);

      if (index === 0) {
        addPptText(slide, storySlide.titleTop || '', { x: 110, y: 605, w: 860, h: 70, size: 48, color: itemTheme.gray, breakable: true });
        addPptText(slide, storySlide.titleMiddle || '', { x: 110, y: 680, w: 860, h: 70, size: 48, color: itemTheme.orange, breakable: true });
        slide.addShape(pptx.ShapeType.roundRect, {
          x: inch(128),
          y: inch(830),
          w: inch(824),
          h: inch(150),
          rectRadius: 0.12,
          fill: { color: hex(itemTheme.blue) },
          line: { color: hex(itemTheme.blue), transparency: 100 }
        });
        addPptText(slide, storySlide.titleMain || '', { x: 165, y: 830, w: 750, h: 150, size: 52, color: '#ffffff', breakable: true });
        addPptArtwork(slide, itemArtworks[0], 0, 'yamamoto');
      }

      if (index === 1) {
        addPptText(slide, `＼${storySlide.heading || ''}／`, { x: 65, y: 425, w: 950, h: 80, size: 52, color: itemTheme.gray, breakable: false });
        (storySlide.points || []).slice(0, 4).forEach((point, pointIndex) => {
          const y = [535, 700, 865, 1030][pointIndex];
          slide.addShape(pptx.ShapeType.rect, {
            x: inch(128),
            y: inch(y),
            w: inch(824),
            h: inch(112),
            fill: { color: hex(itemTheme.yellow) },
            line: { color: hex(itemTheme.yellow), transparency: 100 }
          });
          addPptText(slide, point, { x: 165, y, w: 750, h: 112, size: point.length > 27 ? 36 : 40, color: '#565656', breakable: true });
        });
        if (storySlide.closing) {
          addPptText(slide, storySlide.closing, { x: 120, y: 1220, w: 840, h: 120, size: 46, color: itemTheme.gray, breakable: true });
        }
        addPptArtwork(slide, itemArtworks[1], 1, 'yamamoto');
      }

      if (index === 2) {
        addPptText(slide, `＼${storySlide.heading || 'こんな方におすすめ'}／`, { x: 90, y: 495, w: 900, h: 80, size: 54, color: itemTheme.gray, breakable: false });
        (storySlide.points || []).slice(0, 4).forEach((point, pointIndex) => {
          const y = [600, 760, 920, 1080][pointIndex];
          slide.addShape(pptx.ShapeType.rect, {
            x: inch(128),
            y: inch(y),
            w: inch(824),
            h: inch(112),
            fill: { color: hex(itemTheme.yellow) },
            line: { color: hex(itemTheme.yellow), transparency: 100 }
          });
          addPptText(slide, point, { x: 165, y, w: 750, h: 112, size: point.length > 25 ? 36 : 40, color: '#565656', breakable: true });
        });
        addPptArtwork(slide, itemArtworks[2], 2, 'yamamoto');
      }

      if (index === 3) {
        addPptText(slide, storySlide.heading || '', { x: 100, y: 485, w: 880, h: 130, size: 48, color: itemTheme.gray, breakable: true });
        addPptYamamotoPhotoPlaceholder(slide, pptx, itemTheme, pptAssets);
        addPptText(slide, '＼無料相談受付中📣／', { x: 130, y: 1235, w: 820, h: 70, size: 54, color: itemTheme.gray, breakable: false });
        addPptText(slide, '（ご予約はこちらリンク）', { x: 130, y: 1345, w: 820, h: 65, size: 42, color: itemTheme.gray, breakable: false });
      }

      return;
    }

    if (itemTemplate === 'nishiumi') {
      addPptNishiumiFrame(slide, itemTheme, pptAssets);

      if (index === 0) {
        slide.addShape(pptx.ShapeType.roundRect, {
          x: inch(85),
          y: inch(500),
          w: inch(910),
          h: inch(260),
          rectRadius: 0.09,
          fill: { color: hex(itemTheme.pill) },
          line: { color: hex(itemTheme.pill), transparency: 100 }
        });
        addPptText(slide, [storySlide.titleTop, storySlide.titleMiddle].filter(Boolean).join('\n'), { x: 130, y: 535, w: 820, h: 112, size: 42, color: itemTheme.accent, breakable: true });
        addPptText(slide, storySlide.titleMain || '', { x: 120, y: 655, w: 840, h: 80, size: 43, color: '#ffffff', breakable: true });
        addPptArtwork(slide, itemArtworks[0], 0, 'nishiumi');
        addPptText(slide, '自信ある笑顔へ', { x: 190, y: 1215, w: 700, h: 70, size: 46, color: itemTheme.gray, breakable: false });
      }

      if (index === 1) {
        addPptText(slide, `＼${storySlide.heading || ''}／`, { x: 90, y: 415, w: 900, h: 70, size: 48, color: itemTheme.gray, breakable: false });
        const points = (storySlide.points || []).slice(0, 4);
        const pillY = points.length >= 4 ? [500, 655, 810, 965] : [545, 720, 895];
        points.forEach((point, pointIndex) => {
          const y = pillY[pointIndex];
          slide.addShape(pptx.ShapeType.roundRect, {
            x: inch(55),
            y: inch(y),
            w: inch(970),
            h: inch(112),
            rectRadius: 0.08,
            fill: { color: hex(itemTheme.pill) },
            line: { color: hex(itemTheme.pill), transparency: 100 }
          });
          addPptText(slide, point, { x: 95, y, w: 890, h: 112, size: point.length > 25 ? 38 : 44, color: '#ffffff', breakable: true });
        });
        addPptArtwork(slide, itemArtworks[1], 1, 'nishiumi');
        if (storySlide.closing) {
          addPptText(slide, storySlide.closing, { x: 80, y: points.length >= 4 ? 1410 : 1325, w: 920, h: 110, size: 48, color: itemTheme.accent, breakable: true });
        }
      }

      if (index === 2) {
        addPptText(slide, `＼${storySlide.heading || 'こんな方におすすめ'}／`, { x: 90, y: 415, w: 900, h: 70, size: 48, color: itemTheme.gray, breakable: false });
        const points = (storySlide.points || []).slice(0, 4);
        const pillY = points.length >= 4 ? [545, 700, 855, 1010] : [575, 760, 945];
        points.forEach((point, pointIndex) => {
          const y = pillY[pointIndex];
          slide.addShape(pptx.ShapeType.roundRect, {
            x: inch(55),
            y: inch(y),
            w: inch(970),
            h: inch(112),
            rectRadius: 0.08,
            fill: { color: hex(itemTheme.pill) },
            line: { color: hex(itemTheme.pill), transparency: 100 }
          });
          addPptText(slide, point, { x: 95, y, w: 890, h: 112, size: point.length > 25 ? 36 : 42, color: '#ffffff', breakable: true });
        });
        if (storySlide.closing) {
          addPptText(slide, storySlide.closing, { x: 90, y: 1175, w: 900, h: 110, size: 46, color: itemTheme.accent, breakable: true });
        }
        addPptArtwork(slide, itemArtworks[2], 2, 'nishiumi');
      }

      if (index === 3) {
        addPptNishiumiPhotoPlaceholder(slide, pptx, itemTheme, pptAssets);
        addPptText(slide, storySlide.heading || '', { x: 130, y: 1205, w: 820, h: 115, size: 47, color: itemTheme.gray, breakable: true });
        addPptText(slide, 'なんでもお気軽にご相談ください！', { x: 100, y: 1330, w: 880, h: 70, size: 47, color: itemTheme.blue, breakable: true });
        addPptText(slide, '（予約はこちらからURL）', { x: 180, y: 1490, w: 720, h: 50, size: 34, color: itemTheme.gray, breakable: false });
        addPptText(slide, 'にしうみ歯科・矯正歯科', { x: 220, y: 1750, w: 640, h: 45, size: 33, color: '#6f3a05', breakable: false });
        addPptText(slide, 'Nishiumi Dental Clinic', { x: 280, y: 1795, w: 520, h: 35, size: 21, color: '#6f3a05', breakable: false });
      }

      return;
    }

    if (itemTemplate === 'osakaSayama') {
      addPptOsakaSayamaFrame(slide, itemTheme, getFrameData('osakaSayama', itemTheme));

      if (index === 0) {
        addPptText(slide, storySlide.titleTop || '', { x: 110, y: 625, w: 860, h: 70, size: 56, color: itemTheme.gray, breakable: true });
        addPptText(slide, `＼${storySlide.titleMiddle || ''}／`, { x: 150, y: 720, w: 780, h: 70, size: 58, color: itemTheme.blue, breakable: false });
        addPptText(slide, storySlide.titleMain || '', { x: 90, y: 850, w: 900, h: 140, size: String(storySlide.titleMain || '').length > 18 ? 54 : 60, color: itemTheme.green, breakable: true });
        addPptArtwork(slide, itemArtworks[0], 0, 'osakaSayama');
      }

      if (index === 1) {
        addPptText(slide, `＼${storySlide.heading || ''}／`, { x: 80, y: 480, w: 920, h: 75, size: 56, color: itemTheme.gray, breakable: false });
        const colors = [itemTheme.band, '#f5aa20', itemTheme.pink, itemTheme.green];
        (storySlide.points || []).slice(0, 4).forEach((point, pointIndex) => {
          const y = [610, 755, 900, 1045][pointIndex];
          slide.addShape(pptx.ShapeType.roundRect, {
            x: inch(110),
            y: inch(y),
            w: inch(860),
            h: inch(112),
            rectRadius: 0.02,
            fill: { color: 'FFFFFF' },
            line: { color: hex(colors[pointIndex]), transparency: 0, width: 1.5 }
          });
          addPptText(slide, point, { x: 140, y, w: 800, h: 112, size: point.length > 25 ? 40 : 46, color: itemTheme.gray, breakable: true });
        });
        if (storySlide.closing) {
          addPptText(slide, storySlide.closing, { x: 120, y: 1215, w: 840, h: 100, size: 52, color: itemTheme.gray, breakable: true });
        }
        addPptArtwork(slide, itemArtworks[1], 1, 'osakaSayama');
      }

      if (index === 2) {
        addPptText(slide, `＼${storySlide.heading || 'こんな方におすすめ'}✨／`, { x: 115, y: 480, w: 850, h: 75, size: 54, color: itemTheme.gray, breakable: false });
        const colors = [itemTheme.band, '#f5aa20', itemTheme.pink, itemTheme.green];
        (storySlide.points || []).slice(0, 4).forEach((point, pointIndex) => {
          const y = [610, 755, 900, 1045][pointIndex];
          slide.addShape(pptx.ShapeType.roundRect, {
            x: inch(110),
            y: inch(y),
            w: inch(860),
            h: inch(112),
            rectRadius: 0.02,
            fill: { color: 'FFFFFF' },
            line: { color: hex(colors[pointIndex]), transparency: 0, width: 1.5 }
          });
          addPptText(slide, point, { x: 140, y, w: 800, h: 112, size: point.length > 25 ? 38 : 44, color: itemTheme.gray, breakable: true });
        });
        addPptArtwork(slide, itemArtworks[2], 2, 'osakaSayama');
      }

      if (index === 3) {
        addPptText(slide, formatOsakaSayamaCtaHeading(storySlide.heading || ''), { x: 90, y: 390, w: 900, h: 160, size: 46, color: itemTheme.gray, breakable: true });
        addPptOsakaSayamaPhoto(slide, pptAssets, itemPostIndex);
        addPptText(slide, '＼無料相談のご予約受付中🌱／', { x: 90, y: 1245, w: 900, h: 70, size: 50, color: itemTheme.gray, breakable: false });
        addPptText(slide, 'ご予約はこちらリンク', { x: 160, y: 1340, w: 760, h: 60, size: 42, color: itemTheme.gray, breakable: false });
      }

      return;
    }

    if (itemTemplate === 'kanou') {
      addPptKanouFrame(slide, itemTheme, getFrameData('kanou', itemTheme));

      if (index === 0) {
        slide.addShape(pptx.ShapeType.roundRect, {
          x: inch(110),
          y: inch(512),
          w: inch(860),
          h: inch(895),
          rectRadius: 0.05,
          fill: { color: 'FFFFFF' },
          line: { color: hex(itemTheme.border), transparency: 0, width: 1.5 }
        });
        addPptText(slide, storySlide.titleTop || '', { x: 170, y: 690, w: 740, h: 70, size: 50, color: itemTheme.gray, breakable: false });
        slide.addShape(pptx.ShapeType.roundRect, {
          x: inch(180),
          y: inch(765),
          w: inch(720),
          h: inch(100),
          rectRadius: 0.08,
          fill: { color: hex(itemTheme.pill) },
          line: { color: hex(itemTheme.pill), transparency: 100 }
        });
        addPptText(slide, storySlide.titleMiddle || '', { x: 210, y: 780, w: 660, h: 70, size: 54, color: '#ffffff', breakable: false });
        addPptText(slide, `＼${storySlide.titleMain || ''}／`, { x: 160, y: 945, w: 760, h: 80, size: 58, color: itemTheme.gray, breakable: false });
        addPptArtwork(slide, itemArtworks[0], 0, 'kanou');
      }

      if (index === 1) {
        addPptKanouHeadingPill(slide, pptx, itemTheme, storySlide.heading || '', 360);
        (storySlide.points || []).slice(0, 4).forEach((point, pointIndex) => {
          const y = [570, 790, 1010, 1230][pointIndex];
          slide.addShape(pptx.ShapeType.rect, {
            x: inch(80),
            y: inch(y),
            w: inch(920),
            h: inch(135),
            fill: { color: 'FFFFFF', transparency: 8 },
            line: { color: hex(itemTheme.pill), transparency: 0, width: 1.5 }
          });
          const layout = getKanouBenefitTextLayout(point);
          addPptText(slide, layout.lines.join('\n'), { x: 105, y: y + 12, w: 870, h: 108, size: layout.size, color: itemTheme.gray, breakable: false });
        });
        if (storySlide.closing) {
          addPptText(slide, storySlide.closing, { x: 130, y: 1475, w: 820, h: 115, size: 48, color: itemTheme.gray, breakable: true });
        }
      }

      if (index === 2) {
        addPptKanouHeadingPill(slide, pptx, itemTheme, storySlide.heading || 'こんな方におすすめ', 455);
        const recommendPoints = (storySlide.points || []).slice(0, 4);
        const recommendLayouts = getKanouRecommendListLayout(recommendPoints);
        recommendPoints.forEach((point, pointIndex) => {
          const y = [690, 805, 920, 1035][pointIndex];
          const layout = recommendLayouts[pointIndex];
          addPptText(slide, '🦷', { x: layout.iconX - 27, y: y - 22, w: 55, h: 55, size: 34, color: '#e7eef1', breakable: false });
          addPptText(slide, point, { x: layout.textX, y: y - 3, w: Math.min(820, layout.textWidth + 35), h: 72, size: layout.size, color: itemTheme.gray, align: 'left', breakable: true });
        });
        addPptArtwork(slide, itemArtworks[2], 2, 'kanou');
      }

      if (index === 3) {
        addPptKanouStaffPhoto(slide, itemTheme, pptAssets, itemPostIndex);
        slide.addShape(pptx.ShapeType.rect, {
          x: inch(215),
          y: inch(1158),
          w: inch(650),
          h: inch(18),
          fill: { color: hex(itemTheme.band), transparency: 20 },
          line: { color: hex(itemTheme.band), transparency: 100 }
        });
        slide.addShape(pptx.ShapeType.rect, {
          x: inch(215),
          y: inch(1224),
          w: inch(650),
          h: inch(18),
          fill: { color: hex(itemTheme.band), transparency: 20 },
          line: { color: hex(itemTheme.band), transparency: 100 }
        });
        addPptText(slide, storySlide.heading || '', { x: 130, y: 1115, w: 820, h: 150, size: 45, color: itemTheme.gray, breakable: true });
        addPptText(slide, '（ご予約はこちらリンク）', { x: 160, y: 1360, w: 760, h: 65, size: 38, color: itemTheme.gray, breakable: false });
      }

      return;
    }

    if (index === 0) {
      addPptBandFrame(slide, pptx, itemTheme, getFrameData('inoue', itemTheme));
      addPptText(slide, `＼${storySlide.titleTop || ''}／`, { x: 120, y: 610, w: 840, h: 70, size: 58, color: itemTheme.green, breakable: false });
      addPptText(slide, storySlide.titleMiddle || '', { x: 70, y: 690, w: 940, h: 80, size: 64, color: itemTheme.gray, breakable: true });
      addPptText(slide, storySlide.titleMain || '', { x: 70, y: 780, w: 940, h: 105, size: 76, color: itemTheme.accent, breakable: true });
      addPptArtwork(slide, itemArtworks[0], 0);
      addPptText(slide, '↪', { x: 820, y: 1300, w: 130, h: 90, size: 72, color: itemTheme.gray, breakable: false });
    }

    if (index === 1) {
      addPptText(slide, storySlide.heading, { x: 80, y: 325, w: 920, h: 80, size: 56, color: itemTheme.gray, breakable: true });
      (storySlide.points || []).slice(0, 4).forEach((point, pointIndex) => {
        addPptPill(slide, pptx, 80, [480, 645, 810, 975][pointIndex], 920, 104, point, itemTheme, itemTheme.pink);
      });
      addPptText(slide, storySlide.closing, { x: 80, y: 1215, w: 920, h: 120, size: 54, color: itemTheme.gray, breakable: true });
      addPptArtwork(slide, itemArtworks[1], 1);
    }

    if (index === 2) {
      slide.background = { color: 'FFF9F8' };
      addPptText(slide, `＼${storySlide.heading || 'こんな方におすすめ'}／`, { x: 120, y: 520, w: 840, h: 85, size: 62, color: itemTheme.blue, breakable: false });
      (storySlide.points || []).slice(0, 4).forEach((point, pointIndex) => {
        const y = [640, 800, 960, 1120][pointIndex];
        slide.addShape(pptx.ShapeType.roundRect, {
          x: inch(66),
          y: inch(y),
          w: inch(948),
          h: inch(112),
          rectRadius: 0.08,
          fill: { color: hex(itemTheme.pill) },
          line: { color: hex(itemTheme.pill), transparency: 100 }
        });
        slide.addImage({
          data: svgToDataUrl(checkBulletSvg),
          x: inch(106),
          y: inch(y + 16),
          w: inch(78),
          h: inch(78)
        });
        addPptText(slide, point, { x: 200, y: y + 18, w: 760, h: 76, size: point.length > 22 ? 41 : 45, color: itemTheme.accent, align: 'left', breakable: false });
      });
      addPptArtwork(slide, itemArtworks[2], 2);
    }

    if (index === 3) {
      addPptBandFrame(slide, pptx, itemTheme, getFrameData('inoue', itemTheme));
      const headingLength = Array.from(String(storySlide.heading || '').replace(/\s/g, '')).length;
      const headingSize = headingLength > 34 ? 44 : headingLength > 24 ? 48 : 53;
      addPptText(slide, storySlide.heading, { x: 160, y: 505, w: 760, h: 120, size: headingSize, color: itemTheme.pink, breakable: true });
      addPptPhotoPlaceholder(slide, pptx, itemTheme, pptAssets, itemPostIndex);
      addPptText(slide, `＼ ${storySlide.sub || ''} ／`, { x: 130, y: 1260, w: 820, h: 70, size: 44, color: itemTheme.gray, breakable: false });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: inch(345),
        y: inch(1370),
        w: inch(390),
        h: inch(76),
        rectRadius: 0.08,
        fill: { color: 'FFFFFF' },
        line: { color: 'FFFFFF', transparency: 100 }
      });
      addPptText(slide, `🔗 ${storySlide.button || 'ご予約はこちら'}`, { x: 345, y: 1380, w: 390, h: 58, size: 42, color: itemTheme.blue, breakable: false });
    }
    });
  });

  const blob = await pptx.write({ outputType: 'blob' });
  downloadReadyBlob(blob, fileName);
};

const App = () => {
  const initialDraft = useMemo(() => loadClientDraft('inoue'), []);
  const [clientKey, setClientKey] = useState('inoue');
  const [brief, setBrief] = useState(initialDraft.brief);
  const [themeKey, setThemeKey] = useState(initialDraft.themeKey);
  const [status, setStatus] = useState('');
  const [pngUrls, setPngUrls] = useState([]);
  const [artworks, setArtworks] = useState(() => loadArtworks('inoue'));
  const [artworkAssignments, setArtworkAssignments] = useState(initialDraft.artworkAssignments);
  const [selectedArtworkPageIndex, setSelectedArtworkPageIndex] = useState(0);
  const [bulkArtworkAssignments, setBulkArtworkAssignments] = useState(initialDraft.bulkArtworkAssignments);
  const [templateAssets, setTemplateAssets] = useState({});
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [bulkPosts, setBulkPosts] = useState(initialDraft.bulkPosts);
  const [selectedPostId, setSelectedPostId] = useState(initialDraft.selectedPostId);
  const [cloudMode, setCloudMode] = useState(() => (isCloudConfigured() ? 'connecting' : 'local'));
  const [isHydratingCloud, setIsHydratingCloud] = useState(false);
  const [hasCloudHydrated, setHasCloudHydrated] = useState(() => !isCloudConfigured());

  const selectedPost = useMemo(() => bulkPosts.find((post) => post.id === selectedPostId) || null, [bulkPosts, selectedPostId]);
  const selectedPostIndex = useMemo(() => Math.max(0, bulkPosts.findIndex((post) => post.id === selectedPostId)), [bulkPosts, selectedPostId]);
  const activeClient = clients[clientKey] || clients.inoue;
  const activeTemplate = activeClient.template;
  const activeThemeKey = selectedPost?.themeKey || themeKey || activeClient.defaultThemeKey;
  const theme = themes[activeThemeKey] || themes.pink;
  const slides = useMemo(() => parseBrief(brief), [brief]);
  const currentArtworkAssignments = bulkArtworkAssignments[selectedPostId] || artworkAssignments;
  const assignedArtworks = useMemo(
    () => currentArtworkAssignments.map((id) => artworks.find((item) => item.id === id) || null),
    [currentArtworkAssignments, artworks]
  );
  const svgs = useMemo(
    () => slides.map((slide, index) => createSvg(slide, index, theme, index < 3 ? assignedArtworks[index] : null, activeTemplate, templateAssets, selectedPostIndex)),
    [slides, theme, assignedArtworks, activeTemplate, templateAssets, selectedPostIndex]
  );
  const csv = useMemo(() => toCsv(slides), [slides]);
  const svgUrls = useMemo(() => svgs.map(svgToDataUrl), [svgs]);
  const csvUrl = useMemo(() => `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`, [csv]);

  const showStatus = (message) => {
    setStatus(message);
    window.setTimeout(() => setStatus(''), 2600);
  };

  const applyDraft = (draft, nextClientKey = clientKey) => {
    const nextClient = clients[nextClientKey] || clients.inoue;
    const normalizedDraft = normalizeDraft(draft, nextClientKey);
    setBulkPosts(normalizedDraft.bulkPosts);
    setSelectedPostId(normalizedDraft.selectedPostId);
    setBulkArtworkAssignments(normalizedDraft.bulkArtworkAssignments);
    setArtworkAssignments(normalizedDraft.artworkAssignments);
    setThemeKey(normalizedDraft.themeKey || nextClient.defaultThemeKey);
    setBrief(normalizedDraft.brief || sampleBriefs[nextClientKey] || sampleBrief);
  };

  const switchClient = (nextClientKey) => {
    const nextClient = clients[nextClientKey] || clients.inoue;
    const nextDraft = loadClientDraft(nextClientKey);
    saveArtworks(artworks, clientKey);
    setClientKey(nextClientKey);
    applyDraft(nextDraft, nextClientKey);
    setArtworks(loadArtworks(nextClientKey));
    showStatus(`${nextClient.name}に切り替えました`);
  };

  useEffect(() => {
    const draft = {
      brief,
      themeKey,
      artworkAssignments,
      bulkArtworkAssignments,
      bulkPosts,
      selectedPostId
    };

    saveClientDraft(clientKey, draft);
    if (!isCloudConfigured() || isHydratingCloud || !hasCloudHydrated) return undefined;

    const timeoutId = window.setTimeout(() => {
      saveClientDraftToCloud(clientKey, normalizeDraft(draft, clientKey))
        .then(() => setCloudMode('ready'))
        .catch((error) => {
          console.warn('クラウドに下書きを保存できませんでした。', error);
          setCloudMode('error');
        });
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [clientKey, brief, themeKey, artworkAssignments, bulkArtworkAssignments, bulkPosts, selectedPostId, isHydratingCloud, hasCloudHydrated]);

  useEffect(() => {
    if (!isCloudConfigured()) {
      setCloudMode('local');
      return undefined;
    }

    let isCurrent = true;
    setIsHydratingCloud(true);
    setHasCloudHydrated(false);
    setCloudMode('connecting');

    Promise.all([loadClientDraftFromCloud(clientKey), loadArtworksFromCloud(clientKey)])
      .then(([cloudDraft, cloudArtworks]) => {
        if (!isCurrent) return;

        if (cloudDraft) {
          applyDraft(cloudDraft, clientKey);
          saveClientDraft(clientKey, cloudDraft);
        }

        if (cloudArtworks.length) {
          setArtworks((current) => {
            const nextArtworks = mergeArtworksById(current, cloudArtworks);
            saveArtworks(nextArtworks, clientKey);
            return nextArtworks;
          });
        }

        setCloudMode('ready');
      })
      .catch((error) => {
        console.warn('クラウド保存先を読み込めませんでした。', error);
        if (isCurrent) setCloudMode('error');
      })
      .finally(() => {
        if (isCurrent) {
          setIsHydratingCloud(false);
          setHasCloudHydrated(true);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [clientKey]);

  useEffect(() => {
    let isCurrent = true;

    loadArtworksFromIndexedDb(clientKey)
      .then((storedArtworks) => {
        if (!isCurrent || !storedArtworks.length) return;
        setArtworks((current) => {
          const nextArtworks = mergeArtworksById(current, storedArtworks);
          if (nextArtworks.length === current.length) return current;
          saveArtworks(nextArtworks, clientKey);
          return nextArtworks;
        });
      })
      .catch((error) => {
        console.warn('IndexedDBからイラストを読み込めませんでした。', error);
      });

    return () => {
      isCurrent = false;
    };
  }, [clientKey]);

  useEffect(() => {
    setArtworkAssignments((current) => current.map((id) => (artworks.some((item) => item.id === id) ? id : '')));
    setBulkArtworkAssignments((current) =>
      Object.entries(current).reduce((next, [postId, ids]) => {
        next[postId] = ids.map((id) => (artworks.some((item) => item.id === id) ? id : ''));
        return next;
      }, {})
    );
  }, [artworks]);

  useEffect(() => {
    let isCurrent = true;

    const loadTemplateAssets = async () => {
      try {
        if (activeTemplate === 'inoue') {
          const inoueClinicPhotos = await Promise.all(INOUE_CLINIC_PHOTO_PATHS.map((path) => imagePathToDataUrl(path)));
          if (isCurrent) setTemplateAssets({ inoueClinicPhotos });
          return;
        }

        if (activeTemplate === 'kumata') {
          const [kumataBackground, kumataClinicPhoto] = await Promise.all([
            imagePathToDataUrl(KUMATA_BACKGROUND_PATH),
            imagePathToDataUrl(KUMATA_CLINIC_PHOTO_PATH)
          ]);
          if (isCurrent) setTemplateAssets({ kumataBackground, kumataClinicPhoto });
          return;
        }

        if (activeTemplate === 'yamamoto') {
          const [yamamotoBackground, yamamotoClinicPhoto] = await Promise.all([
            imagePathToDataUrl(YAMAMOTO_BACKGROUND_PATH),
            imagePathToDataUrl(YAMAMOTO_CLINIC_PHOTO_PATH)
          ]);
          if (isCurrent) setTemplateAssets({ yamamotoBackground, yamamotoClinicPhoto });
          return;
        }

        if (activeTemplate === 'nishiumi') {
          const [nishiumiBackground, nishiumiDoctorPhoto] = await Promise.all([
            imagePathToDataUrl(NISHIUMI_BACKGROUND_PATH),
            imagePathToDataUrl(NISHIUMI_DOCTOR_PHOTO_PATH)
          ]);
          if (isCurrent) setTemplateAssets({ nishiumiBackground, nishiumiDoctorPhoto });
          return;
        }

        if (activeTemplate === 'osakaSayama') {
          const osakaSayamaClinicPhotos = await Promise.all(OSAKA_SAYAMA_CLINIC_PHOTO_PATHS.map((path) => imagePathToDataUrl(path)));
          if (isCurrent) setTemplateAssets({ osakaSayamaClinicPhotos });
          return;
        }

        if (activeTemplate === 'kanou') {
          const [kanouBackground, kanouStaffPhotos] = await Promise.all([
            imagePathToDataUrl(KANOU_BACKGROUND_PATH),
            Promise.all(KANOU_STAFF_PHOTO_PATHS.map(async (path) => removeBorderWhiteBackgroundDataUrl(await imagePathToDataUrl(path))))
          ]);
          if (isCurrent) setTemplateAssets({ kanouBackground, kanouStaffPhotos });
          return;
        }

        if (isCurrent) setTemplateAssets({});
      } catch (error) {
        console.error(error);
        if (isCurrent) setTemplateAssets({});
      }
    };

    loadTemplateAssets();
    return () => {
      isCurrent = false;
    };
  }, [activeTemplate]);

  useEffect(() => {
    let isCurrent = true;

    const preparePngs = async () => {
      try {
        const nextUrls = await Promise.all(svgs.map((svg) => downloadPng(svg)));
        if (isCurrent) setPngUrls(nextUrls);
      } catch (error) {
        console.error(error);
        if (isCurrent) setPngUrls([]);
      }
    };

    preparePngs();
    return () => {
      isCurrent = false;
    };
  }, [svgs]);

  const registerArtworks = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      const nextItems = await Promise.all(
        files.map(async (file) => ({
          id: createArtworkId(),
          name: file.name.replace(/\.[^.]+$/, ''),
          type: 'image/png',
          dataUrl: await normalizeArtworkFile(file)
        }))
      );
      const nextArtworks = [...artworks, ...nextItems];
      setArtworks(nextArtworks);
      if (bulkPosts.length) {
        setBulkArtworkAssignments(buildRotatingArtworkAssignmentMap(bulkPosts, nextArtworks, artworkAssignments));
      }
      saveArtworks(nextArtworks, clientKey);
      saveArtworksToCloud(clientKey, nextItems).catch((error) => {
        console.warn('クラウドにイラストを保存できませんでした。', error);
        setCloudMode('error');
      });
      showStatus(`${nextItems.length}件のイラストを登録しました`);
    } catch (error) {
      console.error(error);
      showStatus('イラストを登録できませんでした');
    } finally {
      event.target.value = '';
    }
  };

  const copyInoueArtworksToCurrent = () => {
    if (clientKey === 'inoue') {
      showStatus('いのうえ歯科の素材はすでに表示中です');
      return;
    }

    const sourceArtworks = loadArtworks('inoue');
    if (!sourceArtworks.length) {
      showStatus('いのうえ歯科に登録済みのイラストがありません');
      return;
    }

    const existingDataUrls = new Set(artworks.map((item) => item.dataUrl));
    const copiedItems = sourceArtworks
      .filter((item) => !existingDataUrls.has(item.dataUrl))
      .map((item) => ({
        ...item,
        id: createArtworkId(),
        name: item.name.startsWith('いのうえ_') ? item.name : `いのうえ_${item.name}`
      }));

    if (!copiedItems.length) {
      showStatus('いのうえ歯科の素材はすでにコピー済みです');
      return;
    }

    const nextArtworks = [...artworks, ...copiedItems];
    setArtworks(nextArtworks);
    saveArtworks(nextArtworks, clientKey);
    saveArtworksToCloud(clientKey, copiedItems).catch((error) => {
      console.warn('クラウドにコピー素材を保存できませんでした。', error);
      setCloudMode('error');
    });
    if (bulkPosts.length) {
      setBulkArtworkAssignments(buildRotatingArtworkAssignmentMap(bulkPosts, nextArtworks, artworkAssignments));
    }
    showStatus(`${copiedItems.length}件のいのうえ素材をコピーしました`);
  };

  const importSpreadsheet = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      showStatus('スプレッドシートを読み込んでいます');
      const posts = await parseSpreadsheetFile(file, clientKey);
      if (!posts.length) {
        showStatus('読み込める投稿が見つかりませんでした');
        return;
      }

      setBulkPosts(posts);
      setBulkArtworkAssignments(buildRotatingArtworkAssignmentMap(posts, artworks, artworkAssignments));
      setSelectedPostId(posts[0].id);
      setBrief(posts[0].brief);
      setThemeKey(posts[0].themeKey || activeClient.defaultThemeKey);
      showStatus(`${posts.length}投稿を読み込みました`);
    } catch (error) {
      console.error(error);
      showStatus('スプレッドシートを読み込めませんでした');
    } finally {
      event.target.value = '';
    }
  };

  const deleteArtwork = (id) => {
    const deletedArtwork = artworks.find((item) => item.id === id);
    const nextArtworks = artworks.filter((item) => item.id !== id);
    setArtworks(nextArtworks);
    saveArtworks(nextArtworks, clientKey, { allowEmpty: true });
    deleteArtworkFromCloud(clientKey, deletedArtwork).catch((error) => {
      console.warn('クラウドからイラストを削除できませんでした。', error);
      setCloudMode('error');
    });
    setArtworkAssignments((current) => current.map((itemId) => (itemId === id ? '' : itemId)));
    setBulkArtworkAssignments((current) =>
      Object.entries(current).reduce((next, [postId, ids]) => {
        next[postId] = ids.map((itemId) => (itemId === id ? '' : itemId));
        return next;
      }, {})
    );
    showStatus('イラストを削除しました');
  };

  const normalizeRegisteredArtworks = async () => {
    if (!artworks.length) {
      showStatus('先に歯のイラストを登録してください');
      return;
    }

    try {
      showStatus('登録済みイラストを整えています');
      const nextArtworks = await Promise.all(
        artworks.map(async (artwork) => ({
          ...artwork,
          type: 'image/png',
          dataUrl: await normalizeArtworkDataUrl(artwork.dataUrl)
        }))
      );
      setArtworks(nextArtworks);
      saveArtworks(nextArtworks, clientKey);
      saveArtworksToCloud(clientKey, nextArtworks).catch((error) => {
        console.warn('クラウドに整形済みイラストを保存できませんでした。', error);
        setCloudMode('error');
      });
      showStatus('背景透過とサイズ調整を反映しました');
    } catch (error) {
      console.error(error);
      showStatus('イラストを整えられませんでした');
    }
  };

  const randomizeArtwork = (index) => {
    if (selectedPostId) {
      const currentIds = currentArtworkAssignments.length ? currentArtworkAssignments : ['', '', ''];
      const next = [...currentIds];
      next[index] = pickUniqueArtworkId(artworks, currentIds[index], currentIds.filter((_, itemIndex) => itemIndex !== index));
      setBulkArtworkAssignments((current) => ({ ...current, [selectedPostId]: next }));
      return;
    }

    setArtworkAssignments((current) => {
      const next = [...current];
      next[index] = pickUniqueArtworkId(artworks, current[index], current.filter((_, itemIndex) => itemIndex !== index));
      return next;
    });
  };

  const assignArtworkToPage = (index, nextId) => {
    if (selectedPostId) {
      const next = [...(currentArtworkAssignments.length ? currentArtworkAssignments : ['', '', ''])];
      const duplicatedIndex = next.findIndex((id, itemIndex) => itemIndex !== index && id === nextId && nextId);
      if (duplicatedIndex >= 0) next[duplicatedIndex] = '';
      next[index] = nextId;
      setBulkArtworkAssignments((current) => ({ ...current, [selectedPostId]: next }));
    } else {
      setArtworkAssignments((current) => {
        const next = [...current];
        const duplicatedIndex = next.findIndex((id, itemIndex) => itemIndex !== index && id === nextId && nextId);
        if (duplicatedIndex >= 0) next[duplicatedIndex] = '';
        next[index] = nextId;
        return next;
      });
    }
  };

  const randomizeAllArtworks = () => {
    if (!artworks.length) {
      showStatus('先に歯のイラストを登録してください');
      return;
    }

    if (bulkPosts.length) {
      setBulkArtworkAssignments(buildRotatingArtworkAssignmentMap(bulkPosts, artworks, artworkAssignments));
      showStatus('全投稿のイラストをランダムに割り当てました');
      return;
    }

    setArtworkAssignments((current) =>
      current.map((id, index) => {
        const usedIds = current.slice(0, index);
        const candidates = artworks.filter((item) => item.id !== id && !usedIds.includes(item.id));
        const pool = candidates.length ? candidates : artworks.filter((item) => item.id !== id);
        const finalPool = pool.length ? pool : artworks;
        return finalPool[Math.floor(Math.random() * finalPool.length)].id;
      })
    );
    showStatus('ページごとのイラストをランダムに割り当てました');
  };

  const copyCsv = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(csv);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = csv;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      showStatus('テキスト表をコピーしました');
    } catch (error) {
      console.error(error);
      showStatus('コピーできない場合は補助用CSVを使ってください');
    }
  };

  const downloadAllSvg = () => {
    svgs.forEach((svg, index) => {
      downloadBlob(svg, `inoue-story-${index + 1}.svg`, 'image/svg+xml;charset=utf-8');
    });
    showStatus('SVGを4枚書き出しました');
  };

  const downloadAllPng = async () => {
    pngUrls.forEach((url, index) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = `inoue-story-${index + 1}.png`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
    showStatus(pngUrls.length ? 'PNGを4枚書き出しました' : 'PNG準備中です。少し待ってから押してください');
  };

  const exportPptx = async () => {
    try {
      setIsExportingPptx(true);
      showStatus('PPTXを書き出しています');
      await createEditablePptx({
        slides,
        theme,
        assignedArtworks,
        template: activeTemplate,
        fileName: `${clientKey}-story-editable.pptx`,
        postIndex: selectedPostIndex
      });
      showStatus('PPTXを書き出しました');
    } catch (error) {
      console.error(error);
      showStatus('PPTXを書き出せませんでした');
    } finally {
      setIsExportingPptx(false);
    }
  };

  const exportBulkPptx = async () => {
    if (!bulkPosts.length) {
      showStatus('先にスプレッドシートを読み込んでください');
      return;
    }

    try {
      setIsExportingPptx(true);
      showStatus('全投稿PPTXを書き出しています');
      const generatedAssignmentMap = buildRotatingArtworkAssignmentMap(bulkPosts, artworks, artworkAssignments);
      const assignmentMap = { ...generatedAssignmentMap, ...bulkArtworkAssignments };
      if (bulkPosts.some((post) => !bulkArtworkAssignments[post.id])) {
        setBulkArtworkAssignments(assignmentMap);
      }
      const slideSets = bulkPosts.map((post, postIndex) => {
        const postAssignedArtworks = (assignmentMap[post.id] || []).map((id) => artworks.find((item) => item.id === id) || null);
        return {
          title: post.title,
          slides: parseBrief(post.brief),
          theme: themes[post.themeKey] || theme,
          template: activeTemplate,
          postIndex,
          assignedArtworks: postAssignedArtworks.length ? postAssignedArtworks : assignedArtworks
        };
      });
      await createEditablePptx({
        slideSets,
        theme,
        assignedArtworks,
        template: activeTemplate,
        fileName: `${clientKey}-story-all-posts-editable.pptx`
      });
      showStatus(`${bulkPosts.length}投稿分のPPTXを書き出しました`);
    } catch (error) {
      console.error(error);
      showStatus('全投稿PPTXを書き出せませんでした');
    } finally {
      setIsExportingPptx(false);
    }
  };

  const cloudLabel =
    cloudMode === 'ready'
      ? 'クラウド保存中'
      : cloudMode === 'connecting'
        ? 'クラウド接続中'
        : cloudMode === 'error'
          ? 'ローカル保存中'
          : 'ローカル保存';

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#3f3f3f]">
      <section className="border-b border-[#ded7cc] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-[#ffdfd8] text-[#ff666b]">
              <LayoutTemplate size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold">ストーリーズクリエイティブ生成</h1>
              <p className="text-sm text-[#777]">企画文から4枚構成のSVG/PNGとテキスト表を作成</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`rounded-md px-3 py-2 text-xs font-bold ${
                cloudMode === 'ready'
                  ? 'bg-[#eaf7ed] text-[#357a3d]'
                  : cloudMode === 'connecting'
                    ? 'bg-[#eef5ff] text-[#3f6b9c]'
                    : cloudMode === 'error'
                      ? 'bg-[#fff0ee] text-[#b74d4d]'
                      : 'bg-[#f4f0e8] text-[#777]'
              }`}
            >
              {cloudLabel}
            </div>
            {status && <div className="rounded-md bg-[#fff4d6] px-4 py-2 text-sm font-semibold text-[#80612b]">{status}</div>}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[430px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-lg border border-[#ded7cc] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 font-bold">
              <LayoutTemplate size={18} />
              クライアント
            </div>
            <select
              value={clientKey}
              onChange={(event) => switchClient(event.target.value)}
              className="h-11 w-full rounded-md border border-[#d8d1c7] bg-white px-3 text-sm font-semibold outline-none focus:border-[#ff9b90]"
            >
              {clientOrder.map((key) => (
                <option key={key} value={key}>
                  {clients[key].name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-[#777]">{activeClient.description}</p>
          </div>

          <div className="rounded-lg border border-[#ded7cc] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 font-bold">
              <FileSpreadsheet size={18} />
              スプレッドシート一括読み込み
            </div>
            <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[#cfc6bb] bg-[#fffdf8] px-4 py-3 text-sm font-bold text-[#4f4f4f]">
              <FileSpreadsheet size={17} />
              CSV/XLSXをアップロード
              <input type="file" accept=".csv,.tsv,.xlsx,.xls" onChange={importSpreadsheet} className="hidden" />
            </label>

            {bulkPosts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-[#777]">
                  <span>{bulkPosts.length}投稿を読み込み済み</span>
                  <span>1投稿=4ページ</span>
                </div>
                <select
                  value={selectedPostId}
                  onChange={(event) => {
                    const nextPost = bulkPosts.find((post) => post.id === event.target.value);
                    setSelectedPostId(event.target.value);
                    if (nextPost) {
                      setBrief(nextPost.brief);
                      setThemeKey(nextPost.themeKey || activeClient.defaultThemeKey);
                    }
                  }}
                  className="h-10 w-full rounded-md border border-[#d8d1c7] bg-white px-3 text-sm font-semibold outline-none focus:border-[#ff9b90]"
                >
                  {bulkPosts.map((post, index) => (
                    <option key={post.id} value={post.id}>
                      {index + 1}. {post.title} / {themes[post.themeKey]?.name || themes.pink.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={exportBulkPptx}
                  disabled={isExportingPptx}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-[#39a8ee] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <Download size={18} />
                  {isExportingPptx ? '全投稿PPTX書き出し中' : '全投稿PPTXを書き出し'}
                </button>
              </div>
            )}

            <p className="mt-3 text-xs leading-5 text-[#777]">
              推奨列名は「投稿名」「1ページ目」「2ページ目」「3ページ目」「4ページ目」です。{activeClient.rotateThemes ? 'テーマはピンク、イエロー、ブルーの順で自動割り当てされます。' : 'このクライアントは全投稿で同じテーマカラーを使用します。'}
            </p>
          </div>

          <div className="rounded-lg border border-[#ded7cc] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 font-bold">
              <Sparkles size={18} />
              企画文
            </div>
            <textarea
              value={brief}
              onChange={(event) => {
                const nextBrief = event.target.value;
                setBrief(nextBrief);
                if (selectedPostId) {
                  setBulkPosts((current) =>
                    current.map((post) => (post.id === selectedPostId ? { ...post, brief: nextBrief } : post))
                  );
                }
              }}
              className="h-[520px] w-full resize-none rounded-md border border-[#d8d1c7] bg-[#fffdf8] p-3 text-sm leading-7 outline-none focus:border-[#ff9b90]"
            />
          </div>

          <div className="rounded-lg border border-[#ded7cc] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 font-bold">
              <Palette size={18} />
              テーマ
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(themes)
                .filter(([key]) => (activeClient.rotateThemes ? themeOrder.includes(key) : key === activeClient.defaultThemeKey))
                .map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setThemeKey(key);
                    if (selectedPostId) {
                      setBulkPosts((current) =>
                        current.map((post) => (post.id === selectedPostId ? { ...post, themeKey: key } : post))
                      );
                    }
                  }}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold ${activeThemeKey === key ? 'border-[#ff666b] bg-[#fff0ee]' : 'border-[#ddd6cb] bg-white'}`}
                >
                  <span className="mx-auto mb-2 block h-5 w-12 rounded-full" style={{ background: item.band }} />
                  {item.name.replace('小児矯正 ', '').replace('大人矯正 ', '')}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#ded7cc] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-bold">
                <ImagePlus size={18} />
                歯イラスト素材
              </div>
              <span className="text-xs font-semibold text-[#777]">{artworks.length}件登録中</span>
            </div>

            <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[#cfc6bb] bg-[#fffdf8] px-4 py-3 text-sm font-bold text-[#4f4f4f]">
              <ImagePlus size={17} />
              PNG/SVGを追加
              <input type="file" accept="image/png,image/jpeg,image/svg+xml" multiple onChange={registerArtworks} className="hidden" />
            </label>

            {clientKey !== 'inoue' && (
              <button
                type="button"
                onClick={copyInoueArtworksToCurrent}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-md border border-[#d8d1c7] bg-[#fffdf8] px-4 py-2.5 text-sm font-bold text-[#4f4f4f]"
              >
                <Clipboard size={16} />
                いのうえ歯科の素材をコピー
              </button>
            )}

            <button
              type="button"
              onClick={normalizeRegisteredArtworks}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-md border border-[#d8d1c7] bg-white px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!artworks.length}
            >
              <Sparkles size={16} />
              登録済み素材を透過・サイズ調整
            </button>

            {artworks.length > 0 && (
              <div className="mb-3 rounded-md border border-[#ebe4d9] bg-[#fffdf8] p-3">
                <div className="mb-2 text-xs font-bold text-[#777]">クリックで割り当てるページ</div>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedArtworkPageIndex(index)}
                      className={`h-9 rounded-md border text-sm font-bold ${
                        selectedArtworkPageIndex === index
                          ? 'border-[#ff666b] bg-[#fff0ee] text-[#ff666b]'
                          : 'border-[#d8d1c7] bg-white text-[#666]'
                      }`}
                    >
                      {index + 1}ページ目
                    </button>
                  ))}
                </div>
              </div>
            )}

            {artworks.length > 0 && (
              <div className="mb-4 grid grid-cols-4 gap-2">
                {artworks.map((artwork) => (
                  <div
                    key={artwork.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      assignArtworkToPage(selectedArtworkPageIndex, artwork.id);
                      showStatus(`${selectedArtworkPageIndex + 1}ページ目に割り当てました`);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        assignArtworkToPage(selectedArtworkPageIndex, artwork.id);
                        showStatus(`${selectedArtworkPageIndex + 1}ページ目に割り当てました`);
                      }
                    }}
                    className={`group relative aspect-square cursor-pointer overflow-hidden rounded-md border bg-[#fffdf0] transition ${
                      currentArtworkAssignments[selectedArtworkPageIndex] === artwork.id
                        ? 'border-[#ff666b] ring-2 ring-[#ffb5ae]'
                        : 'border-[#e2dbd0] hover:border-[#ffb5ae]'
                    }`}
                    aria-label={`${artwork.name}を${selectedArtworkPageIndex + 1}ページ目に割り当て`}
                  >
                    <img src={artwork.dataUrl} alt={artwork.name} className="h-full w-full object-contain p-1.5" />
                    {currentArtworkAssignments[selectedArtworkPageIndex] === artwork.id && (
                      <span className="absolute bottom-1 left-1 rounded bg-[#ff666b] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {selectedArtworkPageIndex + 1}P
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteArtwork(artwork.id);
                      }}
                      className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-md bg-white/90 text-[#bd4d4d] shadow-sm opacity-0 transition group-hover:opacity-100"
                      aria-label={`${artwork.name}を削除`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={randomizeAllArtworks}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-md bg-[#3f3f3f] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!artworks.length}
            >
              <Shuffle size={17} />
              1〜3ページをランダム割り当て
            </button>

            <div className="grid gap-2">
              {[0, 1, 2].map((index) => (
                <div key={index} className="grid grid-cols-[76px_1fr_44px] items-center gap-2">
                  <span className="text-sm font-bold text-[#666]">{index + 1}ページ</span>
                  <select
                    value={currentArtworkAssignments[index] || ''}
                    onChange={(event) => {
                      assignArtworkToPage(index, event.target.value);
                    }}
                    className="h-10 rounded-md border border-[#d8d1c7] bg-white px-2 text-sm outline-none focus:border-[#ff9b90]"
                  >
                    <option value="">仮イラストを使用</option>
                    {artworks.map((artwork) => (
                      <option key={artwork.id} value={artwork.id}>
                        {artwork.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => randomizeArtwork(index)}
                    disabled={!artworks.length}
                    className="grid h-10 place-items-center rounded-md border border-[#d8d1c7] bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`${index + 1}ページ目のイラストをランダムに変更`}
                  >
                    <Shuffle size={16} />
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs leading-5 text-[#777]">
              全投稿PPTXでは、投稿ごとに別の歯イラストが自動で割り当たります。素材数が足りない場合は循環して使用します。
            </p>
          </div>

          <div className="grid gap-2">
            <button type="button" onClick={downloadAllSvg} className="flex items-center justify-center gap-2 rounded-md bg-[#4f8f54] px-4 py-3 font-bold text-white">
              <Download size={18} />
              SVGを4枚書き出し
            </button>
            <button type="button" onClick={downloadAllPng} disabled={pngUrls.length !== svgs.length} className="flex items-center justify-center gap-2 rounded-md bg-[#ff666b] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-55">
              <FileImage size={18} />
              {pngUrls.length === svgs.length ? 'PNGを4枚書き出し' : 'PNG準備中'}
            </button>
            <button
              type="button"
              onClick={exportPptx}
              disabled={isExportingPptx}
              className="flex items-center justify-center gap-2 rounded-md bg-[#39a8ee] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-55"
            >
              <Download size={18} />
              {isExportingPptx ? 'PPTX書き出し中' : 'PPTXを書き出し'}
            </button>
            <button type="button" onClick={copyCsv} className="flex items-center justify-center gap-2 rounded-md border border-[#d8d1c7] bg-white px-4 py-3 font-bold">
              <Clipboard size={18} />
              テキスト表をコピー
            </button>
            <a href={csvUrl} download="inoue-story-canva.csv" className="flex items-center justify-center gap-2 rounded-md border border-dashed border-[#d8d1c7] bg-white px-4 py-2 text-sm font-bold text-[#686868]">
              <Download size={18} />
              補助用CSVをダウンロード
            </a>
          </div>

          <div className="rounded-lg border border-[#ded7cc] bg-white p-4 text-sm leading-6 text-[#6e6e6e] shadow-sm">
            <div className="mb-2 flex items-center gap-2 font-bold text-[#3f3f3f]">
              <ImagePlus size={18} />
              Canvaで使う流れ
            </div>
            基本はSVGを書き出してCanvaにアップロードします。CSVは画像ではなく、Canvaの一括作成や原稿確認に使うテキスト表です。4ページ目の写真部分はCanva上で医院写真に差し替えてください。
          </div>
        </aside>

        <section className="grid gap-5 md:grid-cols-2">
          {svgs.map((svg, index) => (
            <article key={index} className="rounded-lg border border-[#ded7cc] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold">{index + 1}ページ目</h2>
                <div className="flex gap-2">
                  <a
                    href={svgUrls[index]}
                    download={`inoue-story-${index + 1}.svg`}
                    className="rounded-md border border-[#d8d1c7] px-3 py-2 text-sm font-semibold"
                  >
                    SVG
                  </a>
                  <a
                    href={pngUrls[index] || '#'}
                    download={`inoue-story-${index + 1}.png`}
                    aria-disabled={!pngUrls[index]}
                    onClick={(event) => {
                      if (!pngUrls[index]) {
                        event.preventDefault();
                        showStatus('PNG準備中です。少し待ってから押してください');
                      }
                    }}
                    className={`rounded-md border border-[#d8d1c7] px-3 py-2 text-sm font-semibold ${pngUrls[index] ? '' : 'cursor-not-allowed opacity-55'}`}
                  >
                    PNG
                  </a>
                </div>
              </div>
              <div className="mx-auto aspect-[9/16] max-h-[620px] overflow-hidden rounded-md border border-[#eee7dc] bg-[#fffdf0]">
                <img src={svgToDataUrl(svg)} alt={`${index + 1}ページ目プレビュー`} className="h-full w-full object-contain" />
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
};

export default App;
