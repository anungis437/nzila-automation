import { readFileSync } from 'fs';
import { join } from 'path';

export default function Icon() {
  const iconPath = join(process.cwd(), 'public', 'images', 'brand', 'icon.png');
  const pngBuffer = readFileSync(iconPath);

  return new Response(pngBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

