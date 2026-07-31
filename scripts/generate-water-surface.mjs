import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const brand = path.join(__dirname, "..", "public", "brand");

/**
 * Pixel water surface strip — jagged silhouette filled below the crest
 * (Stardew / Emerald / Terraria), not a thin dashed line.
 * Transparent above crest so sky shows through the wavelets.
 */
function makeWaterSurface() {
  const W = 192;
  const H = 20;
  const buf = Buffer.alloc(W * H * 4);

  // Match hero surface blues (no white horizon line)
  const WATER = [58, 138, 186];
  const WATER_DK = [42, 112, 158];
  const FOAM = [250, 252, 255];
  const CYAN = [186, 228, 245];

  function set(x, y, rgb, a = 255) {
    const xx = ((x % W) + W) % W;
    if (y < 0 || y >= H) return;
    const i = (y * W + xx) * 4;
    buf[i] = rgb[0];
    buf[i + 1] = rgb[1];
    buf[i + 2] = rgb[2];
    buf[i + 3] = a;
  }

  // Hill peaks: [centerX, height, halfWidth] — height in px above trough
  const hills = [
    // [center, height, halfWidth] — wider = flatter Stardew-like plateaus
    [12, 4, 7],
    [32, 6, 8],
    [56, 3, 6],
    [78, 7, 9],
    [104, 4, 7],
    [128, 6, 8],
    [152, 3, 6],
    [174, 7, 9],
  ];

  const trough = 14;
  const heightAt = new Array(W).fill(1); // always at least 1px body

  for (const [px, ph, hw] of hills) {
    for (let dx = -hw; dx <= hw; dx++) {
      const x = px + dx;
      if (x < 0 || x >= W) continue;
      const t = 1 - Math.abs(dx) / (hw + 0.001);
      // Flat-top hills (plateau), not sharp triangles
      let h = 1;
      if (t > 0.2) h = 2;
      if (t > 0.45) h = 3;
      if (t > 0.7) h = Math.min(ph, 5);
      if (t > 0.88) h = ph;
      heightAt[x] = Math.max(heightAt[x], h);
    }
  }

  for (let x = 0; x < W; x++) {
    const crestY = trough - heightAt[x];

    for (let y = crestY; y < H; y++) {
      set(x, y, y <= crestY + 1 ? WATER : WATER_DK);
    }

    const left = heightAt[(x - 1 + W) % W];
    const right = heightAt[(x + 1) % W];
    const h = heightAt[x];
    // Foam on plateau tops (discreet)
    if (h >= 5 && h >= left && h >= right) {
      set(x, crestY, FOAM);
    } else if (h >= 6 && Math.abs(h - left) <= 1 && Math.abs(h - right) <= 1 && x % 3 === 0) {
      set(x, crestY, FOAM);
    }

    if (h >= 2 && (x * 9 + 3) % 18 === 0) set(x, crestY + 2, CYAN);
    if ((x * 17 + 5) % 29 === 0) set(x, Math.min(H - 1, crestY + 4), CYAN);
  }

  return { buf, width: W, height: H };
}

const surface = makeWaterSurface();
await sharp(surface.buf, {
  raw: { width: surface.width, height: surface.height, channels: 4 },
})
  .png()
  .toFile(path.join(brand, "water-surface-pixel.png"));

console.log("✓ water-surface-pixel.png", surface.width, "x", surface.height);
