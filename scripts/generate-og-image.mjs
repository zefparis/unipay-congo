import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const OG_W = 1200;
const OG_H = 630;

async function generateOgImage() {
  console.log('Generating OG image (1200×630)...');

  const logoBuffer = readFileSync(join(publicDir, 'logo.png'));

  // Scale logo to fit within 440×240 keeping aspect ratio (original 2816×1536 → ~1.833:1)
  const LOGO_W = 440;
  const LOGO_H = Math.round(LOGO_W / (2816 / 1536)); // 240px

  const resizedLogo = await sharp(logoBuffer)
    .resize(LOGO_W, LOGO_H, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const logoBase64 = resizedLogo.toString('base64');
  const logoX = Math.round((OG_W - LOGO_W) / 2); // 380
  const logoY = 80;

  // Title baseline ≈ logoY + LOGO_H + 55
  const titleY = logoY + LOGO_H + 88;   // ~448
  const subtitleY = titleY + 54;         // ~502
  const accentY = OG_H - 42;            // 588

  const svg = `<svg
  width="${OG_W}" height="${OG_H}"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink">

  <defs>
    <!-- Main background gradient: dark blue → deep green -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#0D2B5E"/>
      <stop offset="100%" stop-color="#0A3D2B"/>
    </linearGradient>
    <!-- Subtle radial glow behind logo -->
    <radialGradient id="glow" cx="50%" cy="37%" r="35%">
      <stop offset="0%"   stop-color="#1D9E75" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#1D9E75" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${OG_W}" height="${OG_H}" fill="url(#bgGrad)"/>

  <!-- Decorative circles (top-left, bottom-right) -->
  <circle cx="-30"       cy="-30"      r="220" fill="white" fill-opacity="0.025"/>
  <circle cx="${OG_W + 60}" cy="${OG_H + 60}" r="280" fill="white" fill-opacity="0.025"/>
  <circle cx="${OG_W - 60}" cy="60"    r="160" fill="#1D9E75" fill-opacity="0.06"/>

  <!-- Subtle horizontal rule above logo -->
  <rect x="${logoX}" y="${logoY - 18}" width="${LOGO_W}" height="1" fill="white" fill-opacity="0.08"/>

  <!-- Glow behind logo -->
  <rect width="${OG_W}" height="${OG_H}" fill="url(#glow)"/>

  <!-- Logo (PNG, transparent) -->
  <image
    x="${logoX}" y="${logoY}"
    width="${LOGO_W}" height="${LOGO_H}"
    href="data:image/png;base64,${logoBase64}"
    preserveAspectRatio="xMidYMid meet"
  />

  <!-- Title -->
  <text
    x="${OG_W / 2}" y="${titleY}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="72"
    font-weight="bold"
    fill="white"
    text-anchor="middle"
    letter-spacing="-1"
  >UniPay Congo</text>

  <!-- Subtitle -->
  <text
    x="${OG_W / 2}" y="${subtitleY}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="28"
    fill="#A8C5E8"
    text-anchor="middle"
    letter-spacing="0.5"
  >Your Payment Infrastructure in DRC</text>

  <!-- Green accent line -->
  <rect x="${(OG_W - 180) / 2}" y="${accentY}" width="180" height="4" rx="2" fill="#1D9E75"/>

  <!-- Small domain tag -->
  <text
    x="${OG_W / 2}" y="${accentY + 28}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="16"
    fill="white"
    fill-opacity="0.4"
    text-anchor="middle"
    letter-spacing="2"
  >unipaycongo.com</text>

</svg>`;

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(join(publicDir, 'og-image.png'));

  console.log(`✓ og-image.png  — ${OG_W}×${OG_H}px`);
}

generateOgImage().catch((err) => {
  console.error('Error generating OG image:', err);
  process.exit(1);
});
