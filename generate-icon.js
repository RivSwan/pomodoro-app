const { Jimp } = require('jimp');

const SIZE = 256;
const CX = SIZE / 2;
const CY = SIZE / 2;
const TOMATO_R = 100;

const U = (v) => v >>> 0;
const RGBA = (r, g, b, a) => U((r << 24) | (g << 16) | (b << 8) | a);

const WHITE = RGBA(255, 255, 255, 255);
const WHITE_SEMI = RGBA(255, 255, 255, 170);
const GREEN = RGBA(76, 175, 80, 255);
const BROWN = RGBA(93, 64, 55, 255);
const TRANSPARENT = 0;

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function setPx(img, x, y, color) {
  if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) {
    img.setPixelColor(color, x, y);
  }
}

function drawLine(img, x1, y1, x2, y2, thickness, color) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(len);
  for (let i = 0; i <= steps; i++) {
    const cx = x1 + (dx * i) / steps;
    const cy = y1 + (dy * i) / steps;
    for (let ty = -thickness; ty <= thickness; ty++) {
      for (let tx = -thickness; tx <= thickness; tx++) {
        if (tx * tx + ty * ty <= thickness * thickness) {
          setPx(img, Math.round(cx + tx), Math.round(cy + ty), color);
        }
      }
    }
  }
}

async function generate() {
  const img = new Jimp({ width: SIZE, height: SIZE, color: TRANSPARENT });

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const d = dist(x, y, CX, CY);

      // === Tomato body ===
      if (d <= TOMATO_R) {
        let r = 224, g = 70, b = 55;

        // Gradient
        const nx = (x - CX) / TOMATO_R;
        const ny = (y - CY) / TOMATO_R;
        const shade = (nx * 0.3 + ny * 0.4) * 40;
        r = Math.max(0, Math.min(255, r - shade));
        g = Math.max(0, Math.min(255, g - shade * 1.2));
        b = Math.max(0, Math.min(255, b - shade * 1.5));

        // Edge
        const ef = d / TOMATO_R;
        const ed = ef > 0.85 ? ((ef - 0.85) / 0.15) * 50 : 0;
        r = Math.max(0, Math.min(255, r - ed));
        g = Math.max(0, Math.min(255, g - ed));
        b = Math.max(0, Math.min(255, b - ed));

        // Highlight
        const hl = dist(x, y, CX - 35, CY - 45);
        if (hl < 22) {
          const a = (1 - hl / 22) * 0.3;
          r = Math.min(255, r + 55 * a);
          g = Math.min(255, g + 45 * a);
          b = Math.min(255, b + 40 * a);
        }

        setPx(img, x, y, RGBA(Math.round(r), Math.round(g), Math.round(b), 255));
      }

      // === Leaf 1 ===
      const lx1 = CX + 15, ly1 = CY - TOMATO_R + 5;
      const dx1 = (x - lx1) / 22, dy1 = (y - ly1) / 18;
      if (dx1 * dx1 + (dy1 * dy1) / 0.55 <= 1.0) {
        const s = Math.abs(dx1) * 35;
        setPx(img, x, y, RGBA(Math.round(65 + s), Math.round(175 - s * 0.3), Math.round(72 + s), 255));
      }

      // === Leaf 2 ===
      const lx2 = CX - 5, ly2 = CY - TOMATO_R + 8;
      const dx2 = (x - lx2) / 18, dy2 = (y - ly2) / 12;
      if ((dx2 * dx2) / 0.7 + (dy2 * dy2) / 0.5 <= 1.0) {
        setPx(img, x, y, GREEN);
      }

      // === Stem ===
      const sx = CX + 8, sTop = CY - TOMATO_R - 20;
      if (y >= sTop && y <= CY - TOMATO_R + 2 && x >= sx - 3 && x <= sx + 3) {
        setPx(img, x, y, BROWN);
      }
    }
  }

  // Clock ticks
  for (let i = 0; i < 12; i++) {
    const angle = ((i * 30 - 90) * Math.PI) / 180;
    for (let tr = TOMATO_R - 12; tr <= TOMATO_R - 6; tr++) {
      setPx(img, Math.round(CX + Math.cos(angle) * tr), Math.round(CY + Math.sin(angle) * tr), WHITE_SEMI);
    }
  }

  // Clock hands (25 min position)
  drawLine(img, CX, CY, CX + 50, CY - 55, 3, WHITE);
  drawLine(img, CX, CY, CX + 25, CY - 10, 4, WHITE);

  // Center dot
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      if (dx * dx + dy * dy <= 16) setPx(img, CX + dx, CY + dy, WHITE);
    }
  }

  await img.write('icon.png');
  console.log('Icon generated: icon.png');
}

generate().catch(console.error);
