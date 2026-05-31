// favicon.svg → apple-touch-icon.png(180²), OG2 레이아웃 → og-default.png(1200×630)
// 빌드 시 PNG를 항상 최신으로 생성한다. 소셜 OG image는 PNG여야 하므로 SVG를 sharp로 래스터화.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const FONT = "Pretendard, 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";

// 1) apple-touch-icon: favicon.svg → 180×180 PNG
const faviconSvg = readFileSync(join(pub, 'favicon.svg'));
await sharp(faviconSvg, { density: 384 })
  .resize(180, 180)
  .png()
  .toFile(join(pub, 'apple-touch-icon.png'));

// 2) OG 썸네일 (OG2 좌우 분할) — 1200×630
const ogSvg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#020617"/>
  <rect x="640" y="0" width="560" height="630" fill="#0b1220"/>
  <defs>
    <linearGradient id="og2g" x1="700" y1="500" x2="1120" y2="160" gradientUnits="userSpaceOnUse"><stop stop-color="#22d3ee"/><stop offset="1" stop-color="#0ea5e9"/></linearGradient>
    <linearGradient id="og2s" x1="6" y1="44" x2="48" y2="12" gradientUnits="userSpaceOnUse"><stop stop-color="#22d3ee"/><stop offset="1" stop-color="#0ea5e9"/></linearGradient>
  </defs>
  <path d="M700 470 C840 440 920 300 1120 180 L1120 320 C940 400 860 470 700 470 Z" fill="#0ea5e9" opacity="0.15"/>
  <path d="M700 470 C840 460 900 340 1120 230" stroke="#0ea5e9" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round" opacity="0.5" fill="none"/>
  <path d="M700 470 L820 470 L1080 180" stroke="url(#og2g)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M1050 175 L1090 175 L1090 215" stroke="#67e8f9" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="1080" cy="180" r="9" fill="#67e8f9"/>
  <g transform="translate(80,200) scale(1.3) translate(-32,-32)">
    <path d="M6 44 L26 44 L44 14" stroke="url(#og2s)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M34 13 L45 13 L45 24" stroke="#67e8f9" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
  <text x="80" y="320" font-family="${FONT}" font-size="54" font-weight="800" letter-spacing="-2"><tspan fill="#e2e8f0">lincoln-</tspan><tspan fill="#38bdf8">surgePick</tspan></text>
  <text x="80" y="378" font-family="${FONT}" font-size="25" font-weight="500" fill="#94a3b8">시장 국면 매칭 기반</text>
  <text x="80" y="414" font-family="${FONT}" font-size="25" font-weight="500" fill="#94a3b8">종목 예측 시뮬레이터</text>
</svg>`;

await sharp(Buffer.from(ogSvg))
  .png()
  .toFile(join(pub, 'og-default.png'));

console.log('✓ favicon → apple-touch-icon.png (180×180)');
console.log('✓ OG2 → og-default.png (1200×630)');
