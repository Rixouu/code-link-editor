import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICON_SOURCE = path.join(__dirname, '../public/icon-code-link-editor.png');
const PUBLIC_DIR = path.join(__dirname, '../public');

const APPLE_SPLASH_SCREENS = [
  { width: 1290, height: 2796, name: 'apple-splash-1290-2796' },
  { width: 1179, height: 2556, name: 'apple-splash-1179-2556' },
  { width: 1284, height: 2778, name: 'apple-splash-1284-2778' },
  { width: 1170, height: 2532, name: 'apple-splash-1170-2532' },
  { width: 1125, height: 2436, name: 'apple-splash-1125-2436' },
  { width: 1242, height: 2688, name: 'apple-splash-1242-2688' },
  { width: 828, height: 1792, name: 'apple-splash-828-1792' },
  { width: 1242, height: 2208, name: 'apple-splash-1242-2208' },
  { width: 750, height: 1334, name: 'apple-splash-750-1334' },
  { width: 640, height: 1136, name: 'apple-splash-640-1136' },
  { width: 1536, height: 2048, name: 'apple-splash-1536-2048' },
  { width: 1668, height: 2224, name: 'apple-splash-1668-2224' },
  { width: 1668, height: 2388, name: 'apple-splash-1668-2388' },
  { width: 2048, height: 2732, name: 'apple-splash-2048-2732' }
];

const ICONS = [
  { size: 192, name: 'icon-192x192' },
  { size: 512, name: 'icon-512x512' }
];

const BACKGROUND_COLOR = '#19303F';

async function generateAssets() {
  if (!fs.existsSync(ICON_SOURCE)) {
    console.error('Source icon not found at', ICON_SOURCE);
    return;
  }

  const baseImage = sharp(ICON_SOURCE);
  const metadata = await baseImage.metadata();
  
  // 1. Generate Favicon
  console.log('Generating favicon...');
  await baseImage
    .resize(32, 32)
    .toFile(path.join(PUBLIC_DIR, 'favicon.ico'));

  // 2. Generate standard PWA icons
  console.log('Generating PWA icons...');
  for (const icon of ICONS) {
    await baseImage
      .resize(icon.size, icon.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(path.join(PUBLIC_DIR, `${icon.name}.png`));
  }

  // 3. Generate Apple Splash Screens
  console.log('Generating Apple Splash Screens...');
  for (const splash of APPLE_SPLASH_SCREENS) {
    const splashPath = path.join(PUBLIC_DIR, `${splash.name}.png`);
    
    // Calculate icon size for splash screen (usually 1/3 of the smaller dimension)
    const minDimension = Math.min(splash.width, splash.height);
    const iconSize = Math.floor(minDimension / 3);

    // Resize the icon for the splash screen
    const resizedIconBuffer = await sharp(ICON_SOURCE)
      .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    // Create the splash screen image
    await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 4,
        background: BACKGROUND_COLOR
      }
    })
    .composite([
      {
        input: resizedIconBuffer,
        gravity: 'center'
      }
    ])
    .png()
    .toFile(splashPath);
  }

  console.log('All assets generated successfully!');
}

generateAssets().catch(console.error);
