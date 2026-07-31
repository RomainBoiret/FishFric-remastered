import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const brand = path.join(__dirname, "..", "public", "brand");

function canvas(w, h) {
  return { buf: Buffer.alloc(w * h * 4), w, h };
}

function set(c, x, y, rgba) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 4;
  c.buf[i] = rgba[0];
  c.buf[i + 1] = rgba[1];
  c.buf[i + 2] = rgba[2];
  c.buf[i + 3] = rgba[3] ?? 255;
}

function fillRect(c, x, y, w, h, rgba) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) set(c, xx, yy, rgba);
  }
}

function hLine(c, x0, x1, y, rgba) {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) set(c, x, y, rgba);
}

async function save(c, name) {
  await sharp(c.buf, {
    raw: { width: c.w, height: c.h, channels: 4 },
  })
    .png()
    .toFile(path.join(brand, name));
  console.log("✓", name, `${c.w}x${c.h}`);
}

/**
 * Polished mini fishing boat — readable silhouette, brand accents, flat keel.
 * Bow on the left (faces the title when parked on the right).
 */
function makeBoat() {
  const W = 128;
  const H = 56;
  const c = canvas(W, H);

  const INK = [10, 22, 32];
  const HULL = [42, 108, 158];
  const HULL_MID = [34, 90, 136];
  const HULL_DK = [22, 62, 98];
  const STRIPE = [248, 250, 252];
  const DECK = [214, 186, 140];
  const CABIN = [240, 244, 248];
  const CABIN_SH = [210, 220, 230];
  const WIN = [110, 188, 220];
  const WIN_DK = [48, 110, 150];
  const WOOD = [168, 112, 58];
  const WOOD_DK = [120, 78, 40];
  const GOLD = [224, 170, 44];
  const GOLD_DK = [176, 120, 24];
  const RED = [208, 56, 56];
  const SMOKE = [190, 200, 210];

  // --- Hull (bow left, flat bottom) ---
  for (let y = 30; y <= 48; y++) {
    const t = (y - 30) / 18;
    const left = Math.round(10 + t * t * 14);
    const right = Math.round(118 - t * 3);
    for (let x = left; x <= right; x++) {
      let col = HULL;
      if (y >= 42) col = HULL_DK;
      else if (y >= 36) col = HULL_MID;
      set(c, x, y, col);
    }
  }

  // Bow tip (left)
  for (let i = 0; i < 8; i++) {
    const y = 30 + i;
    hLine(c, 8 + Math.floor(i * 0.15), 16 - Math.floor(i * 0.4), y, i < 4 ? HULL : HULL_MID);
  }

  // White waterline stripe
  hLine(c, 12, 116, 30, STRIPE);
  hLine(c, 14, 114, 29, STRIPE);
  hLine(c, 12, 116, 31, INK);

  // Deck planks
  fillRect(c, 20, 24, 90, 6, DECK);
  for (let x = 24; x < 106; x += 8) {
    fillRect(c, x, 24, 1, 6, WOOD_DK);
  }
  hLine(c, 20, 109, 24, WOOD);

  // --- Cabin (center-right of deck) ---
  fillRect(c, 60, 10, 34, 16, CABIN);
  fillRect(c, 60, 20, 34, 6, CABIN_SH);
  hLine(c, 60, 93, 10, INK);
  fillRect(c, 60, 10, 1, 16, INK);
  fillRect(c, 93, 10, 1, 16, INK);
  fillRect(c, 58, 8, 38, 3, WOOD);
  hLine(c, 58, 95, 8, WOOD_DK);
  for (const wx of [64, 74, 84]) {
    fillRect(c, wx, 13, 6, 6, WIN);
    fillRect(c, wx, 13, 6, 1, WIN_DK);
    fillRect(c, wx, 13, 1, 6, WIN_DK);
  }
  fillRect(c, 78, 20, 6, 6, WOOD_DK);
  set(c, 82, 23, GOLD);

  // Funnel
  fillRect(c, 48, 6, 8, 18, [72, 84, 96]);
  fillRect(c, 48, 6, 8, 3, RED);
  fillRect(c, 48, 9, 8, 2, STRIPE);
  fillRect(c, 50, 2, 3, 2, SMOKE);
  fillRect(c, 45, 1, 4, 2, SMOKE);
  set(c, 43, 2, SMOKE);

  // Mast + gold pennant at stern (right)
  fillRect(c, 100, 2, 2, 24, WOOD_DK);
  for (let i = 0; i < 10; i++) {
    hLine(c, 90 + i, 100, 3 + i, i % 3 === 1 ? STRIPE : GOLD);
  }
  hLine(c, 90, 100, 3, GOLD_DK);

  // Life ring
  fillRect(c, 51, 18, 7, 7, GOLD);
  fillRect(c, 53, 20, 3, 3, RED);
  set(c, 54, 21, STRIPE);

  // Small crate near bow
  fillRect(c, 22, 18, 10, 8, WOOD);
  fillRect(c, 22, 18, 10, 2, WOOD_DK);
  hLine(c, 22, 31, 22, GOLD);

  // Keel outline
  hLine(c, 18, 114, 48, INK);
  hLine(c, 20, 112, 49, INK);

  return c;
}

/** Side-view seagull flying left (toward title) — wings up */
function makeGullUp() {
  const W = 28;
  const H = 18;
  const c = canvas(W, H);
  const WHT = [252, 252, 255];
  const GRY = [186, 196, 208];
  const BLK = [28, 32, 40];
  const BEAK = [232, 168, 48];

  fillRect(c, 9, 8, 9, 4, WHT);
  fillRect(c, 11, 11, 6, 2, GRY);
  fillRect(c, 6, 7, 4, 4, WHT);
  set(c, 7, 8, BLK);
  set(c, 4, 9, BEAK);
  set(c, 5, 9, BEAK);

  fillRect(c, 17, 2, 3, 2, WHT);
  fillRect(c, 15, 3, 4, 2, WHT);
  fillRect(c, 13, 4, 5, 2, WHT);
  fillRect(c, 12, 5, 5, 2, WHT);
  fillRect(c, 12, 6, 4, 2, WHT);
  set(c, 18, 2, BLK);
  set(c, 19, 2, BLK);

  fillRect(c, 18, 7, 4, 2, GRY);

  fillRect(c, 18, 9, 3, 2, WHT);
  set(c, 21, 10, BLK);
  set(c, 21, 11, BLK);

  set(c, 11, 13, BEAK);
  set(c, 13, 13, BEAK);

  return c;
}

/** Side-view seagull flying left — wings down */
function makeGullDown() {
  const W = 28;
  const H = 18;
  const c = canvas(W, H);
  const WHT = [252, 252, 255];
  const GRY = [186, 196, 208];
  const BLK = [28, 32, 40];
  const BEAK = [232, 168, 48];

  fillRect(c, 9, 8, 9, 4, WHT);
  fillRect(c, 11, 11, 6, 2, GRY);
  fillRect(c, 6, 7, 4, 4, WHT);
  set(c, 7, 8, BLK);
  set(c, 4, 9, BEAK);
  set(c, 5, 9, BEAK);

  fillRect(c, 12, 10, 4, 2, WHT);
  fillRect(c, 12, 11, 5, 2, WHT);
  fillRect(c, 13, 12, 5, 2, WHT);
  fillRect(c, 15, 13, 4, 2, WHT);
  fillRect(c, 17, 14, 3, 2, WHT);
  set(c, 18, 15, BLK);
  set(c, 19, 15, BLK);

  fillRect(c, 18, 9, 4, 2, GRY);

  fillRect(c, 18, 9, 3, 2, WHT);
  set(c, 21, 10, BLK);
  set(c, 21, 11, BLK);

  set(c, 11, 13, BEAK);
  set(c, 13, 13, BEAK);

  return c;
}

await save(makeBoat(), "boat-simple.png");
await save(makeGullUp(), "gull-simple-a.png");
await save(makeGullDown(), "gull-simple-b.png");
