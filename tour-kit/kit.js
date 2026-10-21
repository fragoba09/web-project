// kit.js - materials, procedural textures and geometry helpers shared by the model.
// All geometry is in metres. UVs are generated from vertex positions, so textures
// tile at a real-world scale (a 1.6 m plank texture covers 1.6 m of floor).
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Lighten (amt > 0) or darken (amt < 0) a hex colour, returned as a CSS colour.
export function tone(hex, amt) {
  const f = (c) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
  const [r, g, b] = rgb(hex);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

// ---------------------------------------------------------------------------
// Procedural textures (canvas based, deterministic)
// ---------------------------------------------------------------------------

let maxAniso = 4;
export function setMaxAnisotropy(n) { maxAniso = n; }

function canvasTex(metres, draw, px = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const g = c.getContext('2d');
  draw(g, px);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  t.repeat.set(1 / metres, 1 / metres);
  return t;
}

function speckle(g, px, n, colors, rMin, rMax, rand) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[(rand() * colors.length) | 0];
    const r = rMin + rand() * (rMax - rMin);
    g.fillRect(rand() * px, rand() * px, r, r);
  }
}

// Draws fn at (x, y) and at the wrapped copies so blobs near an edge tile seamlessly.
function wrapDraw(px, x, y, reach, fn) {
  for (const dx of [-px, 0, px]) {
    for (const dy of [-px, 0, px]) {
      const cx = x + dx, cy = y + dy;
      if (cx > -reach && cx < px + reach && cy > -reach && cy < px + reach) fn(cx, cy);
    }
  }
}

const TEX = {
  planks: ({ base, size = 1.6, w = 0.19, vary = 0.1, seed = 1 }) => canvasTex(size, (g, px) => {
    const rand = rng(seed);
    const rows = Math.max(1, Math.round(size / w));
    const rowH = px / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      // Cut points around the row so planks wrap across the tile edge.
      const cuts = [];
      let x = rand() * px * 0.6;
      while (cuts.length < 3) { cuts.push(x % px); x += px * (0.3 + rand() * 0.25); }
      cuts.sort((a, b) => a - b);
      for (let i = 0; i < cuts.length; i++) {
        const a = cuts[i];
        const b = i + 1 < cuts.length ? cuts[i + 1] : cuts[0] + px;
        g.fillStyle = tone(base, (rand() - 0.5) * vary * 2);
        const paint = (x0, x1) => {
          g.fillRect(x0, y, x1 - x0, rowH);
          g.strokeStyle = 'rgba(60,40,20,0.07)';
          g.lineWidth = 1;
          for (let k = 0; k < 4; k++) {
            const gy = y + rowH * (0.15 + rand() * 0.7);
            g.beginPath(); g.moveTo(x0, gy); g.bezierCurveTo(x0 + (x1 - x0) * 0.3, gy + 2, x0 + (x1 - x0) * 0.6, gy - 2, x1, gy); g.stroke();
          }
        };
        if (b <= px) paint(a, b); else { paint(a, px); paint(0, b - px); }
        g.fillStyle = 'rgba(40,30,20,0.28)';
        g.fillRect(a, y, 1.5, rowH);
      }
      g.fillStyle = 'rgba(40,30,20,0.22)';
      g.fillRect(0, y, px, 1.5);
    }
  }),

  tiles: ({ base, grout, tw, th, size, vary = 0.05, stagger = false, seed = 2 }) => canvasTex(size, (g, px) => {
    const rand = rng(seed);
    const cols = Math.round(size / tw), rows = Math.round(size / th);
    const cw = px / cols, rh = px / rows;
    g.fillStyle = grout; g.fillRect(0, 0, px, px);
    for (let r = 0; r < rows; r++) {
      const off = stagger && r % 2 ? cw / 2 : 0;
      for (let c = -1; c < cols; c++) {
        g.fillStyle = tone(base, (rand() - 0.5) * vary * 2);
        g.fillRect(c * cw + off + 1.5, r * rh + 1.5, cw - 3, rh - 3);
      }
    }
  }),

  floral: ({ base, inks, size = 0.7, count = 70, scale = 1, seed = 3 }) => canvasTex(size, (g, px) => {
    const rand = rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, px, px);
    for (let i = 0; i < count; i++) {
      const ink = inks[(rand() * inks.length) | 0];
      const x = rand() * px, y = rand() * px;
      const r = (10 + rand() * 18) * scale;
      const rot = rand() * Math.PI;
      const petals = 4 + ((rand() * 3) | 0);
      wrapDraw(px, x, y, r * 2.4, (cx, cy) => {
        g.save(); g.translate(cx, cy); g.rotate(rot);
        g.globalAlpha = 0.55 + rand() * 0.3;
        g.fillStyle = ink;
        for (let p = 0; p < petals; p++) {
          g.rotate((Math.PI * 2) / petals);
          g.beginPath(); g.ellipse(r * 0.7, 0, r * 0.65, r * 0.32, 0, 0, Math.PI * 2); g.fill();
        }
        g.globalAlpha = 0.4;
        g.beginPath(); g.ellipse(-r * 1.5, r * 0.8, r * 0.9, r * 0.28, 0.6, 0, Math.PI * 2); g.fill();
        g.restore();
      });
    }
    g.globalAlpha = 1;
  }),

  diamond: ({ base, line, dot, size = 0.5, cells = 3 }) => canvasTex(size, (g, px) => {
    g.fillStyle = base; g.fillRect(0, 0, px, px);
    const s = px / cells;
    g.strokeStyle = line; g.lineWidth = px / 90;
    for (let i = -cells; i <= cells * 2; i++) {
      g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s + px, px); g.stroke();
      g.beginPath(); g.moveTo(i * s, px); g.lineTo(i * s + px, 0); g.stroke();
    }
    g.fillStyle = dot;
    for (let i = 0; i <= cells; i++) {
      for (let j = 0; j <= cells; j++) {
        g.beginPath(); g.arc(i * s + s / 2, j * s, px / 70, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.arc(i * s, j * s + s / 2, px / 70, 0, Math.PI * 2); g.fill();
      }
    }
  }),

  speck: ({ base, colors, size = 1, n = 9000, rMin = 1, rMax = 2.6, seed = 4 }) => canvasTex(size, (g, px) => {
    const rand = rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, px, px);
    speckle(g, px, n, colors, rMin, rMax, rand);
  }),

  // Roof courses run along v (the ridge direction); u climbs the slope.
  roof: ({ base, size = 1, moss = 0 }) => canvasTex(size, (g, px) => {
    const rand = rng(9);
    const courses = 4, tiles = 3;
    const cw = px / courses, th = px / tiles;
    for (let c = 0; c < courses; c++) {
      const off = c % 2 ? th / 2 : 0;
      for (let t = -1; t <= tiles; t++) {
        const grad = g.createLinearGradient(c * cw, 0, (c + 1) * cw, 0);
        const shade = (rand() - 0.5) * 0.12;
        grad.addColorStop(0, tone(base, -0.35 + shade));
        grad.addColorStop(0.25, tone(base, shade));
        grad.addColorStop(1, tone(base, 0.1 + shade));
        g.fillStyle = grad;
        g.fillRect(c * cw, t * th + off, cw, th);
        g.fillStyle = 'rgba(0,0,0,0.25)';
        g.fillRect(c * cw, t * th + off, cw, 2);
      }
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(c * cw, 0, 3, px);
    }
    if (moss) speckle(g, px, moss, ['rgba(110,128,60,0.55)', 'rgba(140,150,80,0.45)', 'rgba(90,105,50,0.5)'], 2, 6, rand);
  }),

  // Horizontal bands up a wall (paint, tiles, a rail line). u spans `width` metres, v spans `height`.
  band: ({ height = 2.65, width = 0.6, bands }) => {
    const t = canvasTex(1, (g, px) => {
      const yOf = (m) => px * (1 - m / height);
      for (const b of bands) {
        const top = yOf(b.to), bottom = yOf(b.from);
        if (b.color) { g.fillStyle = b.color; g.fillRect(0, top, px, bottom - top); }
        if (b.tiles) {
          const { tw, th, base, grout } = b.tiles;
          const cols = Math.round(width / tw), rows = Math.max(1, Math.round((b.to - b.from) / th));
          const cw = px / cols, rh = (bottom - top) / rows;
          g.fillStyle = grout; g.fillRect(0, top, px, bottom - top);
          for (let r = 0; r < rows; r++) {
            const off = r % 2 ? cw / 2 : 0;
            for (let c = -1; c <= cols; c++) {
              g.fillStyle = base;
              g.fillRect(c * cw + off + 1.2, bottom - (r + 1) * rh + 1.2, cw - 2.4, rh - 2.4);
            }
          }
        }
        if (b.line) { g.fillStyle = b.line; g.fillRect(0, top - 3, px, 6); }
      }
    });
    t.repeat.set(1 / width, 1 / height);
    return t;
  },

  lawn: ({ size = 3 }) => canvasTex(size, (g, px) => {
    const rand = rng(5);
    g.fillStyle = '#6f9d40'; g.fillRect(0, 0, px / 2, px);
    g.fillStyle = '#7fad4b'; g.fillRect(px / 2, 0, px / 2, px);
    speckle(g, px, 14000, ['#5f8c35', '#86b553', '#6a983c', '#93bf5d'], 1, 2.4, rand);
  }),

  flags: ({ base, size = 2.4, seed = 6 }) => canvasTex(size, (g, px) => {
    const rand = rng(seed);
    const n = 4, s = px / n;
    g.fillStyle = tone(base, -0.35); g.fillRect(0, 0, px, px);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const split = rand() < 0.45;
        const parts = split ? [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]] : [[0, 0, 1, 1]];
        for (const [a, b, c, d] of parts) {
          g.fillStyle = tone(base, (rand() - 0.5) * 0.24);
          g.fillRect(i * s + a * s + 2, j * s + b * s + 2, c * s - 4, d * s - 4);
        }
      }
    }
    speckle(g, px, 2500, ['rgba(0,0,0,0.08)', 'rgba(255,255,255,0.08)'], 1, 3, rand);
  }),

  boards: ({ base, size = 1, n = 9, seed = 7 }) => canvasTex(size, (g, px) => {
    const rand = rng(seed);
    const w = px / n;
    g.fillStyle = tone(base, -0.45); g.fillRect(0, 0, px, px);
    for (let i = 0; i < n; i++) {
      g.fillStyle = tone(base, (rand() - 0.5) * 0.22);
      g.fillRect(i * w + 2, 0, w - 4, px);
      g.strokeStyle = 'rgba(70,45,20,0.12)';
      for (let k = 0; k < 3; k++) {
        const x = i * w + 4 + rand() * (w - 8);
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (rand() - 0.5) * 6, px); g.stroke();
      }
    }
  }),

  laps: ({ base, size = 1.8, n = 16 }) => canvasTex(size, (g, px) => {
    const h = px / n;
    for (let i = 0; i < n; i++) {
      const grad = g.createLinearGradient(0, i * h, 0, (i + 1) * h);
      grad.addColorStop(0, tone(base, 0.12));
      grad.addColorStop(0.8, base);
      grad.addColorStop(1, tone(base, -0.35));
      g.fillStyle = grad; g.fillRect(0, i * h, px, h);
    }
  }),

  stripes: ({ base, line, size = 0.3, n = 12, vertical = false, lw = 0.35 }) => canvasTex(size, (g, px) => {
    g.fillStyle = base; g.fillRect(0, 0, px, px);
    g.fillStyle = line;
    const step = px / n;
    for (let i = 0; i < n; i++) {
      if (vertical) g.fillRect(i * step, 0, step * lw, px);
      else g.fillRect(0, i * step, px, step * lw);
    }
  }),

  weave: ({ base, size = 0.25 }) => canvasTex(size, (g, px) => {
    g.fillStyle = base; g.fillRect(0, 0, px, px);
    const n = 16, s = px / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        g.fillStyle = (i + j) % 2 ? tone(base, -0.25) : tone(base, 0.15);
        if ((i + j) % 2) g.fillRect(i * s, j * s + s * 0.2, s, s * 0.6);
        else g.fillRect(i * s + s * 0.2, j * s, s * 0.6, s);
      }
    }
  }, 256),
};

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

// Named finishes. Anything not listed can be used directly as a hex key ('#c9aaa0').
const DEF = {
  // structure
  ext: { tex: () => TEX.speck({ base: '#c8c4bb', colors: ['#a19d93', '#d9d6cf', '#b3afa6', '#8f8b82', '#e4e1da'], size: 0.8, n: 16000 }) },
  extLight: { tex: () => TEX.speck({ base: '#dad7d0', colors: ['#bdb9b1', '#e9e7e2', '#c9c6be'], size: 0.8, n: 12000, seed: 8 }) },
  neighbour: { tex: () => TEX.speck({ base: '#d2cfc8', colors: ['#bab6ae', '#e0ddd6'], size: 0.8, n: 9000, seed: 11 }) },
  party: { color: '#b9b5ad' },
  cap: { color: '#26303b', rough: 0.95 },
  reveal: { color: '#ecebe6' },
  roof: { tex: () => TEX.roof({ base: '#4c5158' }), rough: 0.8 },
  roofNeighbour: { tex: () => TEX.roof({ base: '#5c6167' }), rough: 0.8 },
  // Same tiles for slopes that fall along z, so the courses still run along the eaves.
  roofZ: { tex: () => { const t = TEX.roof({ base: '#4c5158' }); t.rotation = Math.PI / 2; return t; }, rough: 0.8 },
  lead: { color: '#5c6168', rough: 0.6 },
  upvc: { color: '#f5f5f2', rough: 0.4 },
  glass: { color: '#a9cad8', rough: 0.05, metal: 0.1, opacity: 0.34, env: true },
  obscure: { color: '#e4ecef', rough: 0.3, opacity: 0.78, env: true },
  mirror: { color: '#cfdde3', rough: 0.02, metal: 0.9, env: true },
  mirrorSoft: { color: '#d3dfe4', rough: 0.15, metal: 0.3, env: true },
  chrome: { color: '#d6d9dc', rough: 0.2, metal: 0.9, env: true },
  steel: { color: '#bfc3c6', rough: 0.35, metal: 0.75, env: true },
  black: { color: '#1f2225', rough: 0.5 },
  blackGlass: { color: '#15181b', rough: 0.1, metal: 0.3, env: true },
  base: { color: '#b4bcc4', rough: 0.95 },
  baseSide: { color: '#8c96a1', rough: 0.95 },
  glow: { color: '#ffb35c', emissive: '#ff8a1f', emissiveIntensity: 1.6 },
  warmLight: { color: '#fff3d6', emissive: '#ffe2a8', emissiveIntensity: 1.2 },

  // wall finishes (room colours sampled from the listing photos)
  porch: { color: '#dddad4' },
  lounge: { color: '#d8cfc2' },
  toile: { tex: () => TEX.floral({ base: '#cfd8d4', inks: ['#7f97a3', '#97ab92', '#a9b8c4', '#6f8790', '#b9a7b4'], size: 0.8, count: 85 }) },
  kitchen: { color: '#45604f' },
  kitchenLow: { color: '#ece9e1' },
  hall: { color: '#2f5f69' },
  diamond: { tex: () => TEX.diamond({ base: '#2d5b66', line: '#cdbb86', dot: '#e3d6a8', size: 0.45 }) },
  landing: { color: '#2f5f69' },
  cupboard: { color: '#e9e7e1' },
  garage: { color: '#ebe9e3' },
  bed1: { color: '#dcdde0' },
  navy: { color: '#29365a' },
  bed1Toile: { tex: () => TEX.floral({ base: '#e9edf0', inks: ['#3d5482', '#5a6f98', '#8a9cbc'], size: 0.8, count: 60, seed: 12 }) },
  bed2: { tex: () => TEX.speck({ base: '#c9cbce', colors: ['#bdbfc3', '#d4d6d9'], size: 0.6, n: 7000, seed: 13 }) },
  bed3: { color: '#c7cfbc' },
  bath: { color: '#d6d4cf' },
  bathTile: { tex: () => TEX.tiles({ base: '#b8b5af', grout: '#9d9a94', tw: 0.6, th: 0.3, size: 1.2, vary: 0.06, stagger: true }) },
  bathTeal: { color: '#1f5a63' },

  // floors
  oakGrey: { tex: () => TEX.planks({ base: '#cfc8bd', vary: 0.06, seed: 21 }) },
  greyLam: { tex: () => TEX.planks({ base: '#a7a39c', vary: 0.07, seed: 22 }) },
  oak: { tex: () => TEX.planks({ base: '#c49a62', vary: 0.09, seed: 23 }) },
  oakMid: { tex: () => TEX.planks({ base: '#b88f5d', vary: 0.09, seed: 24 }) },
  carpet: { tex: () => TEX.speck({ base: '#b9b2a6', colors: ['#aaa397', '#c6bfb3', '#a19a8e'], size: 0.5, n: 14000, seed: 25 }), rough: 1 },
  vinyl: { tex: () => TEX.tiles({ base: '#53575c', grout: '#3f4246', tw: 0.3, th: 0.6, size: 1.2, vary: 0.1, seed: 26 }) },
  hearth: { tex: () => TEX.tiles({ base: '#3d3f42', grout: '#2a2b2d', tw: 0.15, th: 0.15, size: 0.6, vary: 0.12, seed: 27 }) },

  // outside
  lawn: { tex: () => TEX.lawn({}), rough: 1 },
  lawnPlain: { tex: () => TEX.speck({ base: '#88a865', colors: ['#7c9b5a', '#93b26f'], size: 1, n: 6000, seed: 28 }), rough: 1 },
  tarmac: { tex: () => TEX.speck({ base: '#55585b', colors: ['#45484b', '#64676a', '#3c3f42', '#6e7174'], size: 1, n: 16000, seed: 29 }), rough: 1 },
  concrete: { tex: () => TEX.speck({ base: '#c3bfb6', colors: ['#b3afa6', '#cfccc4', '#aaa69d'], size: 1, n: 9000, seed: 30 }), rough: 1 },
  gravel: { tex: () => TEX.speck({ base: '#bdb8ae', colors: ['#9c978d', '#d7d3cb', '#878279', '#e8e5df'], size: 0.5, n: 9000, rMin: 2, rMax: 4, seed: 31 }), rough: 1 },
  flags: { tex: () => TEX.flags({ base: '#b9b0a2' }), rough: 1 },
  soil: { tex: () => TEX.speck({ base: '#5a4636', colors: ['#4a392b', '#6a5442', '#3f3025'], size: 0.8, n: 8000, seed: 32 }), rough: 1 },
  hedge: { tex: () => TEX.speck({ base: '#3e6533', colors: ['#2f5228', '#4d7a3f', '#365c2d', '#5a8848'], size: 0.8, n: 20000, rMin: 2, rMax: 5, seed: 33 }), rough: 1 },
  foliage: { color: '#557f3e', rough: 1 },
  foliageDark: { color: '#3f6a34', rough: 1 },
  foliageRed: { color: '#8a4f3c', rough: 1 },
  bark: { color: '#6b5240', rough: 1 },
  fenceTimber: { tex: () => TEX.boards({ base: '#b99566' }) },
  fenceGreen: { tex: () => TEX.laps({ base: '#4d6a49' }) },
  superlap: { tex: () => TEX.laps({ base: '#c8863a', size: 1.32, n: 12 }) },
  felt: { tex: () => TEX.speck({ base: '#3a3d41', colors: ['#2f3236', '#45484c'], size: 0.6, n: 5000, seed: 65 }), rough: 0.95 },
  post: { color: '#a8a49b' },
  road: { tex: () => TEX.speck({ base: '#4a4d50', colors: ['#3d4043', '#57595c', '#606366'], size: 1, n: 16000, seed: 34 }), rough: 1 },
  board: { color: '#59636e', rough: 1 },
  shed: { color: '#8e9296', rough: 0.7 },
  shedDark: { color: '#6e7276', rough: 0.7 },
  rattan: { tex: () => TEX.weave({ base: '#5b4434' }) },
  sky: { color: '#ffffff' },

  // 22 Ellan Park: painted render, anthracite joinery, terrace neighbours
  render22: { tex: () => TEX.speck({ base: '#cdd2d3', colors: ['#c3c8c9', '#d6dadb', '#c8cdce'], size: 0.8, n: 6000, seed: 51 }) },
  renderBeige: { tex: () => TEX.speck({ base: '#d6cab4', colors: ['#bfb39c', '#e2d8c4', '#c9bda6', '#ab9f89'], size: 0.8, n: 15000, seed: 52 }) },
  renderCream: { tex: () => TEX.speck({ base: '#e4d9c0', colors: ['#d8ccb2', '#ece3cd'], size: 0.8, n: 6000, seed: 53 }) },
  roofMoss: { tex: () => TEX.roof({ base: '#6c645b', moss: 2600 }), rough: 0.9 },
  roofMossZ: { tex: () => { const t = TEX.roof({ base: '#6c645b', moss: 2600 }); t.rotation = Math.PI / 2; return t; }, rough: 0.9 },
  roofBrownZ: { tex: () => { const t = TEX.roof({ base: '#6b5145' }); t.rotation = Math.PI / 2; return t; }, rough: 0.8 },
  roofBrown: { tex: () => TEX.roof({ base: '#6b5145' }), rough: 0.8 },
  anthracite: { color: '#3b4046', rough: 0.45 },
  navyDoor: { color: '#2b3b57', rough: 0.45 },
  fascia: { color: '#f2f2ef', rough: 0.5 },
  duckEgg: { color: '#a6c0c7' },
  duckEggPanel: { color: '#98b4bc' },
  oakTop: { tex: () => TEX.planks({ base: '#d8bf98', size: 1.2, w: 0.6, vary: 0.04, seed: 54 }), rough: 0.6 },
  metro: { tex: () => TEX.tiles({ base: '#f5f5f2', grout: '#d3d3cf', tw: 0.2, th: 0.1, size: 0.6, vary: 0.02, stagger: true }), rough: 0.3 },
  wall22: { color: '#f1eee8' },
  dining22: { color: '#efe9df' },
  living22: { color: '#efe5d4' },
  wc22: { tex: () => TEX.band({ width: 0.6, bands: [{ from: 1.25, to: 2.65, color: '#1f4744' }, { from: 0, to: 1.25, tiles: { tw: 0.2, th: 0.1, base: '#f6f6f3', grout: '#3d4248' } }] }), rough: 0.4 },
  bed3pink: { tex: () => TEX.band({ bands: [{ from: 0, to: 2.65, color: '#f2eee9' }, { from: 0, to: 1.9, color: '#e6c0bf' }] }) },
  landing22: { color: '#efe7d7' },
  bedWhite: { color: '#eeebe5' },
  bed1w22: { color: '#e7e4de' },
  beigeTile: { tex: () => TEX.tiles({ base: '#cdb694', grout: '#bca582', tw: 0.6, th: 0.3, size: 1.2, vary: 0.04, stagger: false, seed: 55 }), rough: 0.35 },
  beigeFloor: { tex: () => TEX.tiles({ base: '#ddcfb5', grout: '#c8b99d', tw: 0.6, th: 0.6, size: 1.2, vary: 0.03, seed: 56 }), rough: 0.4 },
  carpetBeige: { tex: () => TEX.speck({ base: '#c4b7a2', colors: ['#b7a994', '#d0c4b0', '#ada08b'], size: 0.5, n: 14000, seed: 57 }), rough: 1 },
  carpetGrey: { tex: () => TEX.speck({ base: '#a9abad', colors: ['#9b9da0', '#b6b8ba'], size: 0.5, n: 12000, seed: 58 }), rough: 1 },
  velvetTaupe: { color: '#9a846d', rough: 0.95 },
  mustard: { color: '#d2a11f', rough: 0.9 },
  tanLeather: { color: '#a6704b', rough: 0.6 },
  herringbone: { tex: () => TEX.planks({ base: '#c4955b', size: 0.6, w: 0.1, vary: 0.12, seed: 59 }), rough: 0.6 },
  marble: { tex: () => TEX.speck({ base: '#f1f0ec', colors: ['#d9d8d3', '#c9c8c3', '#e5e4df'], size: 0.4, n: 1600, rMin: 1, rMax: 7, seed: 60 }), rough: 0.25 },
  gold: { color: '#c9a45c', rough: 0.3, metal: 0.8, env: true },
  silver: { color: '#c7c9cc', rough: 0.3, metal: 0.8, env: true },
  blockPaving: { tex: () => TEX.tiles({ base: '#8e8478', grout: '#6e665c', tw: 0.2, th: 0.1, size: 0.8, vary: 0.16, stagger: true, seed: 61 }), rough: 1 },
  redPath: { tex: () => TEX.speck({ base: '#8a5c50', colors: ['#7a4f44', '#9a6a5d', '#6f463c'], size: 1, n: 14000, seed: 62 }), rough: 1 },
  astro: { tex: () => TEX.speck({ base: '#7fbe48', colors: ['#6fae3c', '#8fcb58', '#76b443'], size: 1, n: 16000, seed: 63 }), rough: 1 },
  fenceWeathered: { tex: () => TEX.boards({ base: '#a0968a', n: 7, seed: 64 }) },
  pinkVelvet: { color: '#d9a7a6', rough: 0.95 },

  // 19 Laurys Avenue: white-rendered bungalow, sun room, raised deck
  renderWhite: { tex: () => TEX.speck({ base: '#ebe9e3', colors: ['#dedbd4', '#f3f1ec', '#d6d3cb'], size: 0.8, n: 9000, seed: 66 }) },
  stoneWall: { tex: () => TEX.flags({ base: '#a99a86', size: 1.2, seed: 67 }), rough: 1 },
  stoneBreast: { tex: () => TEX.flags({ base: '#b8ab98', size: 0.9, seed: 68 }), rough: 1 },
  slate: { color: '#3c4046', rough: 0.6 },
  sunTile: { tex: () => TEX.tiles({ base: '#d8d3ca', grout: '#c3bdb2', tw: 0.6, th: 0.6, size: 1.2, vary: 0.04, seed: 69 }), rough: 0.4 },
  deck: { tex: () => TEX.planks({ base: '#8c6c4c', size: 1.4, w: 0.14, vary: 0.1, seed: 70 }), rough: 0.9 },
  kitchenGrey: { color: '#7f878e', rough: 0.35 },
  kitchenGreyPanel: { color: '#788087', rough: 0.35 },
  quartz: { color: '#eeeeeb', rough: 0.25 },
  sunRoof: { color: '#d7dadd', rough: 0.5 },
  compositeDoor: { color: '#4b5866', rough: 0.4 },
  lounge19: { color: '#e5dfd5' },
  hall19: { color: '#ebe7df' },
  kitchen19: { color: '#eef0ee' },
  sun19: { color: '#f4f2ed' },
  bed1w19: { color: '#dde2e6' },
  bed2w19: { color: '#e8e2d6' },
  bed3w19: { color: '#dee6da' },
  utility19: { color: '#efeeea' },

  // furnishings
  white: { color: '#f3f2ee' },
  gloss: { color: '#f7f7f5', rough: 0.25 },
  porcelain: { color: '#fbfbfa', rough: 0.15, env: true },
  cream: { color: '#ece6d6' },
  creamPanel: { color: '#e3dcc9' },
  worktop: { color: '#9b9993', rough: 0.5 },
  pine: { color: '#c79a5b' },
  oakWood: { color: '#b8915e' },
  darkWood: { color: '#6e5847' },
  floralSofa: { tex: () => TEX.floral({ base: '#cbbcc4', inks: ['#8f7a8f', '#a99aa8', '#6f6a7a', '#b6a39d'], size: 0.6, count: 60, scale: 0.8, seed: 41 }) },
  tablecloth: { tex: () => TEX.floral({ base: '#eceee7', inks: ['#a9bda1', '#c4b6c9', '#e0c9a8', '#9bb0bf'], size: 0.4, count: 60, scale: 0.5, seed: 42 }) },
  duvet: { tex: () => TEX.floral({ base: '#f1f0ec', inks: ['#dcdcd5', '#d2d3cd'], size: 0.5, count: 30, scale: 1.4, seed: 43 }) },
  blind: { tex: () => TEX.stripes({ base: '#f4f4f1', line: '#d9d9d5', size: 0.25, n: 10 }) },
  radiator: { tex: () => TEX.stripes({ base: '#f4f4f1', line: '#dadad6', size: 0.3, n: 8, vertical: true }) },
  slatted: { tex: () => TEX.stripes({ base: '#f2f1ed', line: '#cfcec9', size: 0.3, n: 10, vertical: true, lw: 0.4 }) },
  pegboard: { tex: () => TEX.speck({ base: '#c8a77d', colors: ['#7a6248'], size: 0.3, n: 220, rMin: 3, rMax: 3.4, seed: 44 }) },
  rugGrey: { tex: () => TEX.speck({ base: '#b8b6b2', colors: ['#a9a7a3', '#c7c5c1'], size: 0.4, n: 9000, seed: 45 }), rough: 1 },
  rugPattern: { tex: () => TEX.tiles({ base: '#8c8794', grout: '#5f5a66', tw: 0.15, th: 0.15, size: 0.6, vary: 0.25, seed: 46 }), rough: 1 },
  rugSage: { tex: () => TEX.floral({ base: '#d8d3c4', inks: ['#b7ae9a', '#a5a08f'], size: 0.5, count: 30, scale: 0.7, seed: 47 }), rough: 1 },
};

const cache = new Map();
const envMats = new Set();
let envMap = null;

export function setEnvMap(tex) {
  envMap = tex;
  for (const m of envMats) { m.envMap = tex; m.needsUpdate = true; }
}

function build(spec) {
  const m = new THREE.MeshStandardMaterial({
    color: spec.tex ? '#ffffff' : spec.color,
    roughness: spec.rough ?? 0.86,
    metalness: spec.metal ?? 0,
  });
  if (spec.tex) m.map = spec.tex();
  if (spec.color && spec.tex) m.color.set(spec.color);
  if (spec.opacity !== undefined) { m.transparent = true; m.opacity = spec.opacity; m.depthWrite = false; }
  if (spec.emissive) { m.emissive.set(spec.emissive); m.emissiveIntensity = spec.emissiveIntensity ?? 1; }
  if (spec.env) { envMats.add(m); if (envMap) m.envMap = envMap; m.envMapIntensity = 0.9; }
  return m;
}

// M('lounge') -> named finish, M('#aabbcc') -> plain colour. Cached.
export function M(key) {
  if (key && key.isMaterial) return key;
  let m = cache.get(key);
  if (m) return m;
  const spec = key.startsWith('#') ? { color: key } : DEF[key];
  if (!spec) throw new Error(`Unknown material: ${key}`);
  m = build(spec);
  cache.set(key, m);
  return m;
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

// Planar-projects UVs from positions using each vertex's dominant normal axis.
export function worldUV(geo) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    if (nx >= ny && nx >= nz) uv.setXY(i, p.getZ(i), p.getY(i));
    else if (ny >= nz) uv.setXY(i, p.getX(i), p.getZ(i));
    else uv.setXY(i, p.getX(i), p.getY(i));
  }
  uv.needsUpdate = true;
  return geo;
}

function mats(m) { return Array.isArray(m) ? m.map(M) : M(m); }

export function mesh(geo, material) {
  const m = new THREE.Mesh(geo, mats(material));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function boxGeo(x0, y0, z0, x1, y1, z1) {
  const g = new THREE.BoxGeometry(Math.max(x1 - x0, 1e-3), Math.max(y1 - y0, 1e-3), Math.max(z1 - z0, 1e-3));
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return worldUV(g);
}

// Axis-aligned box from min/max corners. Material may be one key or six (px nx py ny pz nz).
export function box(x0, y0, z0, x1, y1, z1, material) {
  return mesh(boxGeo(x0, y0, z0, x1, y1, z1), material);
}

export function cyl(x, y0, z, r, h, material, seg = 20, rTop = r) {
  const g = new THREE.CylinderGeometry(rTop, r, h, seg);
  g.translate(x, y0 + h / 2, z);
  return mesh(g, material);
}

const UP = new THREE.Vector3(0, 1, 0);
// Cylinder from point a to point b (arrays or Vector3).
export function rod(a, b, r, material, seg = 8) {
  const A = Array.isArray(a) ? new THREE.Vector3(...a) : a;
  const B = Array.isArray(b) ? new THREE.Vector3(...b) : b;
  const v = new THREE.Vector3().subVectors(B, A);
  const g = new THREE.CylinderGeometry(r, r, v.length(), seg);
  g.translate(0, v.length() / 2, 0);
  const m = mesh(g, material);
  m.position.copy(A);
  m.quaternion.setFromUnitVectors(UP, v.normalize());
  return m;
}

export function sphere(x, y, z, r, material, detail = 1) {
  const g = new THREE.IcosahedronGeometry(r, detail);
  g.translate(x, y, z);
  return mesh(g, material);
}

function prismGeo(points, depth) {
  const shape = new THREE.Shape(points.map(([a, b]) => new THREE.Vector2(a, b)));
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
}

// Profile drawn in (x, y), extruded along +z from z0 to z1.
export function prismZ(points, z0, z1, material) {
  const g = prismGeo(points, z1 - z0);
  g.translate(0, 0, z0);
  return mesh(g, material);
}

// Profile drawn in (z, y), extruded along x from x0 to x1.
export function prismX(points, x0, x1, material) {
  const g = prismGeo(points, x1 - x0);
  g.rotateY(-Math.PI / 2);
  g.translate(x1, 0, 0);
  return mesh(g, material);
}

export function group(...children) {
  const g = new THREE.Group();
  for (const c of children.flat()) if (c) g.add(c);
  return g;
}
