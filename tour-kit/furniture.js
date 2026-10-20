// furniture.js - low-poly furnishings.
// Every builder works in a local frame: footprint w (along x) by d (along z),
// centred on the origin, standing on y = 0, with its front facing +z.
import * as THREE from 'three';
import { box, cyl, rod, sphere, mesh, prismX, worldUV, M, rng } from './kit.js';

function frame(w, d) {
  return { g: new THREE.Group(), x0: -w / 2, x1: w / 2, z0: -d / 2, z1: d / 2 };
}

// A cylinder lying along local z (for dials, wheels seen from the front).
function disc(x, y, z, r, depth, material, seg = 24) {
  const g = new THREE.CylinderGeometry(r, r, depth, seg);
  g.rotateX(Math.PI / 2);
  g.translate(x, y, z);
  return mesh(g, material);
}

// ---------------------------------------------------------------------------
// Seating and beds
// ---------------------------------------------------------------------------

export function sofa(w, d, o = {}) {
  const { body = '#c9aaa0', cushion = body, legs = 'darkWood', seats = 2, back = 0.82, arm = 0.62, seat = 0.44, pillows = [] } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  const aw = Math.min(0.2, w * 0.13), bd = 0.2;
  for (const [x, z] of [[x0 + 0.06, z0 + 0.06], [x1 - 0.06, z0 + 0.06], [x0 + 0.06, z1 - 0.06], [x1 - 0.06, z1 - 0.06]]) {
    g.add(box(x - 0.025, 0, z - 0.025, x + 0.025, 0.08, z + 0.025, legs));
  }
  g.add(box(x0, 0.08, z0, x1, 0.3, z1, body));
  g.add(box(x0, 0.3, z0, x1, back, z0 + bd, body));
  g.add(box(x0, 0.3, z0, x0 + aw, arm, z1, body));
  g.add(box(x1 - aw, 0.3, z0, x1, arm, z1, body));
  const cw = (w - 2 * aw) / seats;
  for (let i = 0; i < seats; i++) {
    const a = x0 + aw + i * cw;
    g.add(box(a + 0.01, 0.3, z0 + bd, a + cw - 0.01, seat, z1 - 0.02, cushion));
    g.add(box(a + 0.02, seat, z0 + bd, a + cw - 0.02, back - 0.03, z0 + bd + 0.15, cushion));
  }
  pillows.forEach((c, i) => {
    const p = box(-0.19, -0.19, -0.06, 0.19, 0.19, 0.06, c);
    const left = i % 2 === 0;
    p.position.set(left ? x0 + aw + 0.25 : x1 - aw - 0.25, seat + 0.19, z0 + bd + 0.2);
    p.rotation.set(-0.25, 0, left ? 0.22 : -0.22);
    g.add(p);
  });
  return g;
}

export function bed(w, d, o = {}) {
  const { head = '#a7a7aa', base = '#b8b8bb', duvet = 'duvet', pillow = '#f7f7f4', throwC = null, headH = 1.15 } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0 + 0.03, 0, z0 + 0.1, x1 - 0.03, 0.06, z1 - 0.03, 'black'));
  g.add(box(x0, 0.06, z0 + 0.08, x1, 0.34, z1, base));
  g.add(box(x0 + 0.02, 0.34, z0 + 0.1, x1 - 0.02, 0.54, z1 - 0.02, '#f4f4f1'));
  g.add(box(x0 - 0.025, 0.4, z0 + 0.62, x1 + 0.025, 0.6, z1 + 0.025, duvet));
  g.add(box(x0 - 0.04, 0, z0, x1 + 0.04, headH, z0 + 0.09, head));
  const pw = Math.min(0.62, (w - 0.14) / 2);
  g.add(box(x0 + 0.05, 0.54, z0 + 0.14, x0 + 0.05 + pw, 0.68, z0 + 0.56, pillow));
  g.add(box(x1 - 0.05 - pw, 0.54, z0 + 0.14, x1 - 0.05, 0.68, z0 + 0.56, pillow));
  if (throwC) g.add(box(x0 - 0.035, 0.6, z1 - 0.6, x1 + 0.035, 0.625, z1 - 0.22, throwC));
  return g;
}

export function chair(w, d, o = {}) {
  const { c = 'cream', seatC = c } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  for (const [x, z] of [[x0, z0], [x1 - 0.04, z0], [x0, z1 - 0.04], [x1 - 0.04, z1 - 0.04]]) {
    g.add(box(x, 0, z, x + 0.04, 0.43, z + 0.04, c));
  }
  g.add(box(x0, 0.43, z0, x1, 0.47, z1, seatC));
  g.add(box(x0, 0.47, z0, x0 + 0.04, 1.0, z0 + 0.04, c));
  g.add(box(x1 - 0.04, 0.47, z0, x1, 1.0, z0 + 0.04, c));
  for (const y of [0.64, 0.77, 0.9]) g.add(box(x0 + 0.04, y, z0 + 0.005, x1 - 0.04, y + 0.055, z0 + 0.035, c));
  return g;
}

export function officeChair(w, d) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.add(rod([0, 0.06, 0], [Math.cos(a) * 0.3, 0.05, Math.sin(a) * 0.3], 0.018, 'black'));
    g.add(sphere(Math.cos(a) * 0.3, 0.03, Math.sin(a) * 0.3, 0.03, 'black', 0));
  }
  g.add(cyl(0, 0.06, 0, 0.025, 0.38, 'chrome'));
  g.add(box(-0.25, 0.44, -0.24, 0.25, 0.52, 0.24, '#2a2c30'));
  g.add(box(-0.23, 0.55, -0.26, 0.23, 1.15, -0.2, '#2a2c30'));
  g.add(box(-0.27, 0.6, -0.12, -0.24, 0.66, 0.16, 'black'));
  g.add(box(0.24, 0.6, -0.12, 0.27, 0.66, 0.16, 'black'));
  return g;
}

export function stool(w, d, o = {}) {
  const { c = '#2d6f74' } = o;
  const g = new THREE.Group();
  g.add(cyl(0, 0.38, 0, Math.min(w, d) / 2, 0.08, c, 20));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.add(rod([x * 0.1, 0, z * 0.1], [x * 0.07, 0.38, z * 0.07], 0.012, '#c6a560'));
  }
  return g;
}

// ---------------------------------------------------------------------------
// Tables and storage
// ---------------------------------------------------------------------------

export function table(w, d, o = {}) {
  const { top = 'cream', leg = 'cream', h = 0.75, cloth = null, glass = false, shelf = false } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  const t = 0.05;
  for (const [x, z] of [[x0 + 0.04, z0 + 0.04], [x1 - 0.04 - t, z0 + 0.04], [x0 + 0.04, z1 - 0.04 - t], [x1 - 0.04 - t, z1 - 0.04 - t]]) {
    g.add(box(x, 0, z, x + t, h - 0.03, z + t, leg));
  }
  g.add(box(x0, h - 0.03, z0, x1, h, z1, glass ? 'glass' : top));
  if (glass) {
    g.add(box(x0, h - 0.05, z0, x1, h - 0.03, z0 + 0.03, leg));
    g.add(box(x0, h - 0.05, z1 - 0.03, x1, h - 0.03, z1, leg));
  }
  if (shelf) g.add(box(x0 + 0.05, 0.12, z0 + 0.05, x1 - 0.05, 0.14, z1 - 0.05, glass ? 'glass' : top));
  if (cloth) g.add(box(x0 - 0.03, h - 0.24, z0 - 0.03, x1 + 0.03, h + 0.006, z1 + 0.03, cloth));
  return g;
}

export function chest(w, d, o = {}) {
  const { h = 0.8, body = 'white', front = body, rows = 3, cols = 1, knob = 'chrome' } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, 0.06, z1 - 0.03, '#d0cec8'));
  g.add(box(x0, 0.06, z0, x1, h, z1 - 0.02, body));
  const rh = (h - 0.1) / rows, cw = w / cols;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = x0 + c * cw, y = 0.08 + r * rh;
      g.add(box(a + 0.015, y, z1 - 0.02, a + cw - 0.015, y + rh - 0.02, z1, front));
      g.add(box(a + cw / 2 - 0.04, y + rh / 2 - 0.012, z1, a + cw / 2 + 0.04, y + rh / 2 + 0.012, z1 + 0.02, knob));
    }
  }
  return g;
}

export function wardrobe(w, d, o = {}) {
  const { h = 2.0, body = 'white', doors = 2 } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, h, z1 - 0.02, body));
  const dw = w / doors;
  for (let i = 0; i < doors; i++) {
    const a = x0 + i * dw;
    g.add(box(a + 0.008, 0.08, z1 - 0.02, a + dw - 0.008, h - 0.02, z1, body));
    const hx = i % 2 === 0 ? a + dw - 0.06 : a + 0.04;
    g.add(box(hx, h * 0.45, z1, hx + 0.02, h * 0.6, z1 + 0.03, 'chrome'));
  }
  return g;
}

export function bookcase(w, d, o = {}) {
  const { h = 1.0, c = 'white', shelves = 3, seed = 5 } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  const rand = rng(seed);
  const t = 0.02;
  g.add(box(x0, 0, z0, x0 + t, h, z1, c), box(x1 - t, 0, z0, x1, h, z1, c));
  g.add(box(x0, 0, z0, x1, 0.06, z1, c), box(x0, h - t, z0, x1, h, z1, c));
  g.add(box(x0, 0, z0, x1, h, z0 + 0.01, c));
  const colors = ['#7b3b3b', '#2f4b6e', '#c9a24a', '#3e6a52', '#e3ddd0', '#5a4a6e', '#b65f3c', '#1f2a36', '#9bb3c4'];
  const step = (h - 0.06) / shelves;
  for (let s = 0; s < shelves; s++) {
    const y = 0.06 + s * step;
    if (s > 0) g.add(box(x0 + t, y - t, z0, x1 - t, y, z1, c));
    let x = x0 + t + 0.01;
    while (x < x1 - t - 0.06) {
      const bw = 0.022 + rand() * 0.03;
      const bh = Math.min(step - 0.04, 0.16 + rand() * 0.1);
      if (rand() < 0.08) { x += 0.06; continue; }
      g.add(box(x, y, z0 + 0.03, x + bw, y + bh, z1 - 0.02, colors[(rand() * colors.length) | 0]));
      x += bw + 0.003;
    }
  }
  return g;
}

export function tvUnit(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  for (const x of [x0 + 0.04, x1 - 0.08]) {
    g.add(box(x, 0, z0 + 0.04, x + 0.04, 0.06, z0 + 0.08, 'pine'), box(x, 0, z1 - 0.08, x + 0.04, 0.06, z1 - 0.04, 'pine'));
  }
  g.add(box(x0, 0.06, z0, x1, 0.5, z1, 'pine'));
  g.add(box(x0 + 0.04, 0.3, z1, -0.01, 0.46, z1 + 0.01, '#b98c50'), box(0.01, 0.3, z1, x1 - 0.04, 0.46, z1 + 0.01, '#b98c50'));
  const tw = Math.min(1.05, w * 0.88);
  g.add(box(-0.14, 0.5, -0.08, 0.14, 0.52, 0.06, 'black'));
  g.add(box(-0.03, 0.52, -0.04, 0.03, 0.62, -0.01, 'black'));
  g.add(box(-tw / 2, 0.6, -0.05, tw / 2, 0.6 + tw * 0.57, -0.01, 'black'));
  g.add(box(-tw / 2 + 0.015, 0.615, -0.01, tw / 2 - 0.015, 0.6 + tw * 0.57 - 0.015, -0.006, 'blackGlass'));
  return g;
}

export function desk(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0.72, z0, x1, 0.75, z1, 'oakWood'));
  g.add(box(x0 + 0.02, 0, z0 + 0.02, x0 + 0.05, 0.72, z1 - 0.02, 'white'));
  g.add(box(x1 - 0.45, 0, z0 + 0.02, x1 - 0.02, 0.72, z1 - 0.02, 'white'));
  for (const y of [0.05, 0.28, 0.5]) g.add(box(x1 - 0.44, y, z1 - 0.02, x1 - 0.03, y + 0.2, z1, '#efeee9'));
  g.add(box(-0.3, 0.75, z0 + 0.08, 0.1, 0.77, z0 + 0.24, 'black'));
  g.add(box(-0.13, 0.77, z0 + 0.12, -0.07, 0.92, z0 + 0.16, 'black'));
  g.add(box(-0.4, 0.9, z0 + 0.1, 0.2, 1.24, z0 + 0.13, 'black'));
  g.add(box(-0.38, 0.92, z0 + 0.13, 0.18, 1.22, z0 + 0.132, 'blackGlass'));
  g.add(box(-0.32, 0.75, z0 + 0.32, 0.08, 0.765, z0 + 0.46, '#2b2d31'));
  return g;
}

export function dressingTable(w, d, o = {}) {
  const { lit = true, body = 'white', top = '#f1f0ee' } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  for (const [x, z] of [[x0 + 0.03, z0 + 0.03], [x1 - 0.06, z0 + 0.03], [x0 + 0.03, z1 - 0.06], [x1 - 0.06, z1 - 0.06]]) {
    g.add(box(x, 0, z, x + 0.03, 0.72, z + 0.03, lit ? '#d8d6d1' : 'silver'));
  }
  g.add(box(x0, 0.6, z0, x1, 0.72, z1, body));
  g.add(box(x0, 0.72, z0, x1, 0.76, z1, top));
  if (!lit) {
    g.add(box(x0 + 0.1, 0.62, z1, x1 - 0.1, 0.7, z1 + 0.005, 'silver'));
    g.add(box(-0.2, 0.76, z0 + 0.05, 0.2, 0.86, z0 + 0.18, '#f4f1ec'));
    return g;
  }
  g.add(box(-0.22, 0.76, z0 + 0.04, 0.22, 1.18, z0 + 0.07, 'white'));
  g.add(box(-0.19, 0.79, z0 + 0.07, 0.19, 1.15, z0 + 0.075, 'mirror'));
  for (let i = 0; i < 5; i++) {
    const y = 0.82 + i * 0.075;
    g.add(sphere(-0.205, y, z0 + 0.085, 0.014, 'warmLight', 0), sphere(0.205, y, z0 + 0.085, 0.014, 'warmLight', 0));
  }
  g.add(cyl(x1 - 0.18, 0.76, 0, 0.09, 0.03, '#5b5f66'));
  g.add(cyl(x1 - 0.18, 0.79, 0, 0.02, 0.22, '#5b5f66'));
  g.add(cyl(x1 - 0.18, 1.0, 0, 0.13, 0.2, '#4a4f57', 20, 0.08));
  g.add(box(x0 + 0.08, 0.76, z0 + 0.06, x0 + 0.3, 0.9, z0 + 0.22, '#f4f1ec'));
  return g;
}

export function shelf(w, d, o = {}) {
  const { c = 'white', items = true, bracket = '#c79a5b' } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, 0.025, z1, c));
  for (const x of [x0 + 0.15, x1 - 0.17]) g.add(box(x, -0.2, z0, x + 0.02, 0, z0 + d * 0.7, bracket));
  if (items) {
    g.add(box(x0 + 0.1, 0.025, z0 + 0.03, x0 + 0.26, 0.2, z0 + 0.12, '#e9e3d6'));
    g.add(cyl(x1 - 0.3, 0.025, 0, 0.05, 0.09, '#d9cfc2'));
    g.add(sphere(x1 - 0.3, 0.16, 0, 0.07, 'foliage', 0));
  }
  return g;
}

export function rack(w, d, o = {}) {
  const { h = 1.8, levels = 4, seed = 8 } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  const rand = rng(seed);
  for (const [x, z] of [[x0, z0], [x1 - 0.03, z0], [x0, z1 - 0.03], [x1 - 0.03, z1 - 0.03]]) g.add(box(x, 0, z, x + 0.03, h, z + 0.03, 'steel'));
  const colors = ['#2f6fb0', '#e1d6c3', '#8a8f96', '#c4473a', '#3a3f45', '#d9a441'];
  for (let i = 0; i < levels; i++) {
    const y = 0.08 + i * ((h - 0.1) / (levels - 1));
    g.add(box(x0, y, z0, x1, y + 0.02, z1, 'oakWood'));
    if (i === levels - 1) continue;
    let x = x0 + 0.04;
    while (x < x1 - 0.3) {
      const bw = 0.28 + rand() * 0.12;
      g.add(box(x, y + 0.02, z0 + 0.04, x + bw, y + 0.02 + 0.2 + rand() * 0.1, z1 - 0.04, colors[(rand() * colors.length) | 0]));
      x += bw + 0.05;
    }
  }
  return g;
}

// ---------------------------------------------------------------------------
// Kitchen
// ---------------------------------------------------------------------------

export function baseUnits(w, d, o = {}) {
  const { door = 'cream', panel = 'creamPanel', top = 'worktop', n = Math.max(1, Math.round(w / 0.5)), h = 0.9, drawers = [], upstand = 0 } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, 0.1, z1 - 0.07, '#d6cfbd'));
  g.add(box(x0, 0.1, z0, x1, h - 0.04, z1 - 0.02, door));
  const dw = w / n;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * dw, b = a + dw, cx = (a + b) / 2;
    if (i > 0) g.add(box(a - 0.003, 0.1, z1 - 0.021, a + 0.003, h - 0.04, z1 - 0.018, '#bcb49f'));
    if (drawers.includes(i)) {
      const rows = 3, rh = (h - 0.16) / rows;
      for (let r = 0; r < rows; r++) {
        const y = 0.11 + r * rh;
        g.add(box(a + 0.05, y + 0.04, z1 - 0.02, b - 0.05, y + rh - 0.04, z1 - 0.012, panel));
        g.add(box(cx - 0.06, y + rh - 0.07, z1 - 0.012, cx + 0.06, y + rh - 0.055, z1 + 0.01, 'chrome'));
        if (r > 0) g.add(box(a, y - 0.003, z1 - 0.021, b, y + 0.003, z1 - 0.018, '#bcb49f'));
      }
    } else {
      g.add(box(a + 0.06, 0.17, z1 - 0.02, b - 0.06, h - 0.12, z1 - 0.012, panel));
      g.add(box(cx - 0.06, h - 0.19, z1 - 0.012, cx + 0.06, h - 0.175, z1 + 0.01, 'chrome'));
    }
  }
  const back = upstand ? z0 + 0.03 : z0;
  g.add(box(x0, h - 0.04, back, x1, h, z1 + 0.02, top));
  if (upstand) g.add(box(x0, 0, z0, x1, upstand, z0 + 0.03, door));
  return g;
}

export function worktop(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0.86, z0, x1, 0.9, z1 + 0.02, 'worktop'));
  return g;
}

export function wallUnits(w, d, o = {}) {
  const { door = 'cream', h = 0.72, n = Math.max(1, Math.round(w / 0.5)), glazed = false, light = true } = o;
  const panel = glazed ? 'blackGlass' : o.panel ?? 'creamPanel';
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, h, z1 - 0.02, door));
  const dw = w / n;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * dw, b = a + dw, cx = (a + b) / 2;
    if (i > 0) g.add(box(a - 0.003, 0, z1 - 0.021, a + 0.003, h, z1 - 0.018, '#bcb49f'));
    g.add(box(a + 0.06, 0.06, z1 - 0.02, b - 0.06, h - 0.06, z1 - 0.012, panel));
    g.add(box(cx - 0.05, 0.08, z1 - 0.012, cx + 0.05, 0.095, z1 + 0.01, 'chrome'));
  }
  if (light) g.add(box(x0 + 0.05, -0.012, z1 - 0.1, x1 - 0.05, 0, z1 - 0.06, 'warmLight'));
  return g;
}

export function rangeCooker(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, 0.08, z1 - 0.05, 'black'));
  g.add(box(x0, 0.08, z0, x1, 0.9, z1 - 0.02, 'steel'));
  g.add(box(x0 + 0.01, 0.9, z0 + 0.02, x1 - 0.01, 0.925, z1 - 0.04, 'black'));
  const hz = (z0 + z1) / 2;
  const burners = [[x0 + 0.2, hz - 0.13, 0.06], [x0 + 0.2, hz + 0.12, 0.07], [0, hz, 0.1], [x1 - 0.2, hz - 0.13, 0.06], [x1 - 0.2, hz + 0.12, 0.07]];
  for (const [x, z, r] of burners) g.add(cyl(x, 0.925, z, r, 0.015, '#3a3d41'));
  g.add(box(x0, 0.925, z0, x1, 0.99, z0 + 0.04, 'steel'));
  g.add(box(x0 + 0.02, 0.79, z1 - 0.02, x1 - 0.02, 0.88, z1 - 0.01, '#9fa3a6'));
  for (let i = 0; i < 7; i++) {
    const kx = x0 + 0.1 + i * ((w - 0.2) / 6);
    g.add(disc(kx, 0.835, z1 + 0.005, 0.02, 0.03, 'black', 12));
  }
  const split = x0 + w * 0.6;
  for (const [a, b] of [[x0 + 0.02, split - 0.01], [split + 0.01, x1 - 0.02]]) {
    g.add(box(a, 0.16, z1 - 0.02, b, 0.76, z1 - 0.005, 'steel'));
    g.add(box(a + 0.05, 0.28, z1 - 0.005, b - 0.05, 0.62, z1, 'blackGlass'));
    g.add(box(a + 0.05, 0.7, z1, b - 0.05, 0.72, z1 + 0.035, 'chrome'));
  }
  g.add(box(x0 + 0.05, 0.1, z1 - 0.02, x1 - 0.05, 0.14, z1, 'black'));
  return g;
}

// Black glass splashback plus a chimney hood; mounted on the wall behind the range.
export function hood(w, d, o = {}) {
  const { flue = 0.8, splash = 'blackGlass' } = o;
  const { g, x0, x1, z0 } = frame(w, d);
  if (splash) g.add(box(x0, 0, z0, x1, 0.62, z0 + 0.012, splash));
  g.add(box(x0 + 0.05, 0.72, z0, x1 - 0.05, 0.84, z0 + 0.5, 'steel'));
  g.add(box(-0.15, 0.84, z0, 0.15, 0.84 + flue, z0 + 0.26, 'steel'));
  return g;
}

export function fridge(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, 1.78, z1, 'gloss'));
  g.add(box(-0.004, 0.02, z1, 0.004, 1.76, z1 + 0.004, '#c9c9c6'));
  g.add(box(-0.05, 0.7, z1, -0.035, 1.4, z1 + 0.04, 'chrome'), box(0.035, 0.7, z1, 0.05, 1.4, z1 + 0.04, 'chrome'));
  g.add(box(x0 + 0.1, 1.0, z1, x0 + 0.28, 1.27, z1 + 0.006, '#3a3f44'));
  g.add(box(x0 + 0.3, 1.5, z1, x0 + 0.42, 1.6, z1 + 0.006, '#e6c2a6'));
  return g;
}

export function washer(w, d, o = {}) {
  const { ring = 'chrome', glass = 'blackGlass' } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, 0.85, z1 - 0.01, 'gloss'));
  g.add(box(x0 + 0.02, 0.74, z1 - 0.01, x1 - 0.02, 0.82, z1, '#e4e4e1'));
  g.add(disc(0, 0.4, z1 + 0.01, 0.19, 0.03, ring, 28));
  g.add(disc(0, 0.4, z1 + 0.02, 0.145, 0.02, glass, 28));
  g.add(disc(x1 - 0.1, 0.78, z1 + 0.005, 0.025, 0.02, '#bfc3c6', 12));
  return g;
}

// Base units with a stainless inset sink; the lounge side gets a counter-height upstand.
export function sinkRun(w, d, o = {}) {
  const { sinkAt = 0, upstand = 1.06, ceramic = false, tap = 'chrome', units = {} } = o;
  const g = baseUnits(w, d, { upstand, n: Math.max(2, Math.round(w / 0.5)), ...units });
  const h = 0.9, z0 = -d / 2;
  const cx = sinkAt;
  if (ceramic) {
    // White ceramic one-and-a-half bowl sink with a ribbed drainer.
    g.add(box(cx - 0.3, h - 0.04, -0.23, cx + 0.62, h + 0.03, 0.22, 'porcelain'));
    g.add(box(cx - 0.26, h - 0.02, -0.19, cx - 0.01, h + 0.032, 0.17, '#e3e8ea'));
    g.add(box(cx + 0.03, h - 0.02, -0.19, cx + 0.2, h + 0.032, 0.17, '#e3e8ea'));
    for (let i = 0; i < 5; i++) g.add(box(cx + 0.25, h + 0.03, -0.17 + i * 0.075, cx + 0.58, h + 0.036, -0.16 + i * 0.075, '#e8e8e5'));
  } else {
    g.add(box(cx - 0.24, h - 0.005, -0.21, cx + 0.24, h + 0.004, 0.2, 'steel'));
    g.add(box(cx - 0.2, h - 0.002, -0.17, cx + 0.2, h + 0.006, 0.16, '#878c90'));
    g.add(box(cx + 0.26, h, -0.2, cx + 0.62, h + 0.006, 0.2, 'steel'));
    for (let i = 0; i < 5; i++) g.add(box(cx + 0.3, h + 0.006, -0.16 + i * 0.075, cx + 0.58, h + 0.009, -0.15 + i * 0.075, '#a7abae'));
  }
  g.add(cyl(cx, h, z0 + 0.07, 0.022, 0.32, tap));
  g.add(rod([cx, h + 0.32, z0 + 0.07], [cx, h + 0.3, z0 + 0.27], 0.014, tap));
  return g;
}

export function microwave(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, 0.28, z1, '#2e3135'));
  g.add(box(x0 + 0.03, 0.03, z1, x1 - 0.12, 0.25, z1 + 0.004, 'blackGlass'));
  return g;
}

// ---------------------------------------------------------------------------
// Fireplace and wall dressing
// ---------------------------------------------------------------------------

// Chimney breast with an optional fireplace recess. Returns 'full' and 'cut' variants
// so it can be cut down with the wall it stands against.
export function chimneyBreast(w, d, o = {}) {
  const { h = 2.4, cut = 0.32, paper = 'toile', recess = 0, recessH = 1.0, recessC = '#8f8d89' } = o;
  const { x0, x1, z0, z1 } = frame(w, d);
  const skin = [paper, paper, 'cap', 'cap', paper, paper];
  const make = (top) => {
    const g = new THREE.Group();
    if (!recess) { g.add(box(x0, 0, z0, x1, top, z1, skin)); return g; }
    const rx = recess / 2;
    g.add(box(x0, 0, z0, -rx, top, z1, skin), box(rx, 0, z0, x1, top, z1, skin));
    if (top > recessH) g.add(box(-rx, recessH, z0, rx, top, z1, skin));
    g.add(box(-rx, 0, z0, rx, Math.min(top, recessH), z0 + 0.04, recessC));
    return g;
  };
  const g = new THREE.Group();
  const full = make(h); full.name = 'full';
  const low = make(cut); low.name = 'cut';
  g.add(full, low);
  return g;
}

export function stove(w, d) {
  const g = new THREE.Group();
  const c = '#2b2c2e';
  for (const [x, z] of [[-0.2, -0.14], [0.2, -0.14], [-0.2, 0.14], [0.2, 0.14]]) g.add(box(x - 0.02, 0, z - 0.02, x + 0.02, 0.1, z + 0.02, c));
  g.add(box(-0.25, 0.1, -0.19, 0.25, 0.6, 0.19, c));
  g.add(box(-0.27, 0.6, -0.21, 0.27, 0.63, 0.21, c));
  g.add(box(-0.19, 0.17, 0.19, 0.19, 0.52, 0.2, c));
  g.add(box(-0.15, 0.21, 0.2, 0.15, 0.48, 0.205, 'glow'));
  g.add(box(0.16, 0.3, 0.2, 0.18, 0.4, 0.23, 'chrome'));
  g.add(cyl(0, 0.63, -0.06, 0.07, 0.4, c));
  return g;
}

export function hearth(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, 0.06, z1, 'hearth'));
  return g;
}

export function octMirror(w) {
  const g = new THREE.Group();
  const r = w / 2;
  const make = (rad, depth, z, m) => {
    const geo = new THREE.CylinderGeometry(rad, rad, depth, 8);
    geo.rotateX(Math.PI / 2);
    geo.rotateZ(Math.PI / 8);
    geo.translate(0, 0, z);
    return mesh(geo, m);
  };
  g.add(make(r, 0.03, 0.015, 'white'), make(r - 0.05, 0.01, 0.033, 'mirror'));
  g.scale.set(1.25, 0.82, 1);
  return g;
}

export function picture(w, h, o = {}) {
  const { art = '#9a8f80', frameC = '#2b2b2b' } = o;
  const g = new THREE.Group();
  g.add(box(-w / 2, 0, 0, w / 2, h, 0.025, frameC));
  g.add(box(-w / 2 + 0.03, 0.03, 0.025, w / 2 - 0.03, h - 0.03, 0.03, '#f2efe8'));
  g.add(box(-w / 2 + 0.07, 0.07, 0.03, w / 2 - 0.07, h - 0.07, 0.033, art));
  return g;
}

export function radiator(w, d, o = {}) {
  const { h = 0.5 } = o;
  const g = new THREE.Group();
  g.add(box(-w / 2, 0.14, -0.035, w / 2, 0.14 + h, 0.035, 'radiator'));
  g.add(box(-w / 2 + 0.05, 0, -0.02, -w / 2 + 0.08, 0.14, 0.02, 'white'), box(w / 2 - 0.08, 0, -0.02, w / 2 - 0.05, 0.14, 0.02, 'white'));
  return g;
}

export function radiatorCover(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, 0.82, z1, 'white'));
  g.add(box(x0 + 0.05, 0.12, z1, x1 - 0.05, 0.7, z1 + 0.005, 'slatted'));
  g.add(box(x0 - 0.02, 0.82, z0, x1 + 0.02, 0.85, z1 + 0.02, 'white'));
  return g;
}

export function curtains(w, h, o = {}) {
  const { c = '#9b9a9d', panel = 0.32 } = o;
  const g = new THREE.Group();
  g.add(rod([-w / 2 - 0.08, h, 0.08], [w / 2 + 0.08, h, 0.08], 0.014, 'chrome'));
  for (const side of [-1, 1]) {
    const edge = side * (w / 2 + 0.06);
    for (let i = 0; i < 4; i++) {
      const a = edge - side * (i * panel / 4);
      const b = a - side * (panel / 4);
      const dz = i % 2 ? 0.03 : 0.07;
      g.add(box(Math.min(a, b), 0.05, dz, Math.max(a, b), h - 0.02, dz + 0.035, c));
    }
  }
  return g;
}

export function blind(w, h, o = {}) {
  const { drop = h, c = 'blind' } = o;
  const g = new THREE.Group();
  g.add(box(-w / 2, h - drop, -0.008, w / 2, h, 0.008, c));
  g.add(box(-w / 2 - 0.01, h - 0.04, -0.02, w / 2 + 0.01, h, 0.02, 'white'));
  return g;
}

export function towelRail(w, h) {
  const g = new THREE.Group();
  for (const x of [-w / 2, w / 2]) g.add(rod([x, 0.35, 0.05], [x, 0.35 + h, 0.05], 0.014, 'white'));
  for (let i = 0; i < 10; i++) {
    const y = 0.4 + i * ((h - 0.1) / 9);
    g.add(rod([-w / 2, y, 0.05], [w / 2, y, 0.05], 0.009, 'white'));
  }
  g.add(box(-w / 2 + 0.06, 0.6 + h * 0.3, 0.06, w / 2 - 0.06, 0.6 + h * 0.72, 0.08, '#c8b79a'));
  return g;
}

export function coatHooks(w) {
  const g = new THREE.Group();
  g.add(box(-w / 2, -0.06, 0, w / 2, 0.02, 0.02, 'white'));
  const n = 5;
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.08 + i * ((w - 0.16) / (n - 1));
    g.add(box(x - 0.008, -0.04, 0.02, x + 0.008, -0.025, 0.07, 'chrome'));
  }
  g.add(box(-w / 2 + 0.04, -0.85, 0.03, -w / 2 + 0.3, -0.03, 0.13, '#2e3b55'));
  g.add(box(-0.06, -0.7, 0.03, 0.18, -0.03, 0.12, '#b9a587'));
  return g;
}

export function wallLight() {
  const g = new THREE.Group();
  g.add(box(-0.06, -0.08, 0, 0.06, 0.08, 0.02, 'white'));
  g.add(box(-0.05, -0.06, 0.02, 0.05, 0.06, 0.08, 'warmLight'));
  return g;
}

export function extractorFan() {
  const g = new THREE.Group();
  g.add(box(-0.09, -0.09, 0, 0.09, 0.09, 0.03, 'white'));
  g.add(disc(0, 0, 0.035, 0.05, 0.01, '#d9d9d6', 16));
  return g;
}

// ---------------------------------------------------------------------------
// Bathroom
// ---------------------------------------------------------------------------

export function toilet(w, d) {
  const { g, z0, z1 } = frame(w, d);
  g.add(box(-0.19, 0.38, z0, 0.19, 0.8, z0 + 0.18, 'porcelain'));
  g.add(box(-0.2, 0.8, z0 - 0.005, 0.2, 0.83, z0 + 0.19, 'porcelain'));
  const ped = new THREE.CylinderGeometry(0.12, 0.1, 0.36, 18);
  ped.scale(1, 1, 1.3); ped.translate(0, 0.18, z0 + 0.32);
  g.add(mesh(ped, 'porcelain'));
  const bowl = new THREE.CylinderGeometry(0.19, 0.14, 0.12, 22);
  bowl.scale(1, 1, 1.35); bowl.translate(0, 0.33, Math.min(z1 - 0.26, z0 + 0.42));
  g.add(mesh(bowl, 'porcelain'));
  const seat = new THREE.CylinderGeometry(0.195, 0.195, 0.03, 22);
  seat.scale(1, 1, 1.35); seat.translate(0, 0.405, Math.min(z1 - 0.26, z0 + 0.42));
  g.add(mesh(seat, '#f4f4f2'));
  g.add(box(0.12, 0.76, z0 + 0.06, 0.16, 0.78, z0 + 0.1, 'chrome'));
  return g;
}

export function vanity(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0.1, z0, x1, 0.82, z1 - 0.02, 'gloss'));
  g.add(box(x0 + 0.02, 0.14, z1 - 0.02, -0.005, 0.8, z1, 'gloss'), box(0.005, 0.14, z1 - 0.02, x1 - 0.02, 0.8, z1, 'gloss'));
  g.add(box(-0.05, 0.62, z1, -0.02, 0.72, z1 + 0.02, 'chrome'), box(0.02, 0.62, z1, 0.05, 0.72, z1 + 0.02, 'chrome'));
  g.add(box(x0 - 0.01, 0.82, z0, x1 + 0.01, 0.86, z1 + 0.01, 'porcelain'));
  g.add(box(x0 + 0.08, 0.83, z0 + 0.1, x1 - 0.08, 0.862, z1 - 0.06, '#e8eef0'));
  g.add(cyl(0, 0.86, z0 + 0.05, 0.018, 0.16, 'chrome'));
  g.add(rod([0, 1.01, z0 + 0.05], [0, 0.99, z0 + 0.17], 0.011, 'chrome'));
  return g;
}

// P-shaped bath: wider at the shower end (+x), with a glass screen and riser rail.
export function bathP(w, d) {
  const { g, x0, x1, z0 } = frame(w, d);
  const h = 0.56, narrow = 0.7, r = 0.42;
  g.add(box(x0, 0, z0, x1 - r, h, z0 + narrow, 'porcelain'));
  g.add(cyl(x1 - r, 0, z0 + r, r, h, 'porcelain', 32));
  g.add(box(x1 - r, 0, z0, x1, h, z0 + r, 'porcelain'));
  g.add(box(x0 + 0.07, h - 0.045, z0 + 0.07, x1 - r, h + 0.003, z0 + narrow - 0.07, '#e4ecef'));
  g.add(cyl(x1 - r, h - 0.045, z0 + r, r - 0.08, 0.048, '#e4ecef', 32));
  g.add(box(x0 + 0.25, h, z0 + 0.03, x0 + 0.29, h + 0.12, z0 + 0.06, 'chrome'));
  g.add(box(x1 - 0.85, h, z0 + r + r - 0.03, x1 - 0.12, 2.0, z0 + r + r - 0.02, 'glass'));
  g.add(rod([x1 - 0.85, 2.0, z0 + 2 * r - 0.025], [x1 - 0.12, 2.0, z0 + 2 * r - 0.025], 0.008, 'chrome'));
  g.add(rod([x1 - 0.35, 0.95, z0 + 0.04], [x1 - 0.35, 2.05, z0 + 0.04], 0.014, 'chrome'));
  g.add(rod([x1 - 0.35, 2.05, z0 + 0.04], [x1 - 0.35, 2.05, z0 + 0.3], 0.012, 'chrome'));
  g.add(cyl(x1 - 0.35, 2.02, z0 + 0.3, 0.11, 0.02, 'chrome'));
  g.add(box(x1 - 0.5, 1.02, z0, x1 - 0.2, 1.08, z0 + 0.06, 'chrome'));
  return g;
}

// ---------------------------------------------------------------------------
// Living extras
// ---------------------------------------------------------------------------

export function rug(w, d, o = {}) {
  const { c = 'rugGrey' } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0.002, z0, x1, 0.018, z1, c));
  return g;
}

export function piano(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  for (const x of [x0 + 0.12, x1 - 0.12]) {
    g.add(rod([x, 0, z0 + 0.04], [x, 0.7, z1 - 0.08], 0.018, 'black'));
    g.add(rod([x, 0, z1 - 0.04], [x, 0.7, z0 + 0.08], 0.018, 'black'));
  }
  g.add(box(x0, 0.7, z0, x1, 0.8, z1 - 0.02, 'black'));
  g.add(box(x0 + 0.09, 0.8, z1 - 0.17, x1 - 0.09, 0.815, z1 - 0.02, '#f7f7f4'));
  for (let i = 0; i < 26; i++) {
    if ([2, 6, 9, 13, 16, 20, 23].includes(i % 26)) continue;
    const x = x0 + 0.12 + i * ((w - 0.24) / 26);
    g.add(box(x, 0.815, z1 - 0.17, x + 0.012, 0.83, z1 - 0.08, 'black'));
  }
  g.add(box(x0 + 0.09, 0.8, z0 + 0.02, x1 - 0.09, 0.84, z1 - 0.18, '#2a2d30'));
  return g;
}

export function lampFloor() {
  const g = new THREE.Group();
  g.add(cyl(0, 0, 0, 0.13, 0.03, 'black'));
  g.add(cyl(0, 0.03, 0, 0.012, 1.4, 'chrome'));
  g.add(cyl(0, 1.32, 0, 0.21, 0.28, '#efe7d8', 24, 0.15));
  return g;
}

export function lampTable(o = {}) {
  const { base = '#6b6f78', shade = '#efe7d8' } = o;
  const g = new THREE.Group();
  g.add(sphere(0, 0.1, 0, 0.09, base, 1));
  g.add(cyl(0, 0.18, 0, 0.01, 0.12, 'chrome'));
  g.add(cyl(0, 0.27, 0, 0.13, 0.17, shade, 20, 0.09));
  return g;
}

export function globe() {
  const g = new THREE.Group();
  g.add(cyl(0, 0, 0, 0.07, 0.02, '#b79a64'));
  g.add(cyl(0, 0.02, 0, 0.01, 0.12, '#b79a64'));
  g.add(sphere(0, 0.25, 0, 0.14, '#cfc4d8', 2));
  return g;
}

export function plant(o = {}) {
  const { pot = '#d9d4cb', h = 0.5, r = 0.11, leaf = 'foliage' } = o;
  const g = new THREE.Group();
  g.add(cyl(0, 0, 0, r * 0.8, h * 0.4, pot, 16, r));
  g.add(sphere(0, h * 0.62, 0, r * 1.5, leaf, 0));
  g.add(sphere(r * 0.7, h * 0.85, r * 0.3, r * 1.1, 'foliageDark', 0));
  g.add(sphere(-r * 0.6, h * 0.9, -r * 0.4, r, leaf, 0));
  return g;
}

export function bin(o = {}) {
  const { c = 'steel', h = 0.62, r = 0.15 } = o;
  const g = new THREE.Group();
  g.add(cyl(0, 0, 0, r, h, c, 20));
  g.add(cyl(0, h, 0, r * 1.02, 0.04, c, 20));
  return g;
}

export function shoeRack(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  for (const x of [x0, x1 - 0.03]) g.add(box(x, 0, z0, x + 0.03, 0.42, z1, 'white'));
  for (const y of [0.05, 0.22, 0.4]) g.add(box(x0, y, z0, x1, y + 0.02, z1, 'white'));
  const shoes = ['#3d3f45', '#a57b54', '#e2ddd3', '#5c3a2e'];
  for (let i = 0; i < 4; i++) {
    const x = x0 + 0.06 + i * ((w - 0.12) / 4);
    const y = i < 2 ? 0.07 : 0.24;
    g.add(box(x, y, z0 + 0.03, x + 0.09, y + 0.09, z1 - 0.02, shoes[i]));
  }
  return g;
}

// ---------------------------------------------------------------------------
// Garage / workshop
// ---------------------------------------------------------------------------

export function workbench(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  for (const [x, z] of [[x0 + 0.04, z0 + 0.04], [x1 - 0.1, z0 + 0.04], [x0 + 0.04, z1 - 0.1], [x1 - 0.1, z1 - 0.1]]) g.add(box(x, 0, z, x + 0.06, 0.86, z + 0.06, 'oakWood'));
  g.add(box(x0, 0.86, z0, x1, 0.92, z1, '#c8a06c'));
  g.add(box(x0 + 0.04, 0.18, z0 + 0.04, x1 - 0.04, 0.21, z1 - 0.04, 'oakWood'));
  g.add(box(x1 - 0.32, 0.92, z1 - 0.12, x1 - 0.12, 1.02, z1 + 0.02, '#3d5a7a'));
  g.add(box(x0 + 0.2, 0.21, z0 + 0.1, x0 + 0.62, 0.45, z1 - 0.1, '#c4473a'));
  g.add(box(x0 + 0.75, 0.21, z0 + 0.1, x0 + 1.1, 0.4, z1 - 0.12, '#2f6fb0'));
  g.add(box(x0 + 0.3, 0.92, z0 + 0.2, x0 + 0.6, 1.0, z0 + 0.36, '#d9a441'));
  return g;
}

export function pegboard(w, h) {
  const g = new THREE.Group();
  g.add(box(-w / 2, 0, 0, w / 2, h, 0.015, 'pegboard'));
  const tools = [
    [-w / 2 + 0.15, 0.25, 0.05, 0.35, '#3a3f45'], [-w / 2 + 0.3, 0.3, 0.03, 0.3, '#c4473a'],
    [-w / 2 + 0.45, 0.2, 0.08, 0.4, '#8a8f96'], [-0.1, 0.35, 0.25, 0.04, '#d9a441'],
    [0.1, 0.15, 0.03, 0.45, '#2f6fb0'], [0.25, 0.25, 0.03, 0.32, '#8a8f96'], [w / 2 - 0.3, 0.12, 0.18, 0.45, '#b9bdc2'],
  ];
  for (const [x, y, tw, th, c] of tools) g.add(box(x, y, 0.015, x + tw, y + th, 0.04, c));
  return g;
}

export function bike(w) {
  const g = new THREE.Group();
  const L = Math.min(w, 1.7) / 2 - 0.34;
  for (const x of [-L, L]) {
    const t = new THREE.TorusGeometry(0.33, 0.025, 8, 28);
    t.translate(x, 0.35, 0);
    g.add(mesh(t, 'black'));
    g.add(sphere(x, 0.35, 0, 0.035, 'chrome', 0));
  }
  const c = '#2d7a7e';
  const rear = [-L, 0.35, 0], crank = [-0.05, 0.3, 0], seat = [-0.22, 0.86, 0], head = [L - 0.14, 0.9, 0], front = [L, 0.35, 0];
  g.add(rod(rear, crank, 0.016, c), rod(crank, seat, 0.018, c), rod(seat, head, 0.018, c), rod(crank, head, 0.02, c), rod(rear, seat, 0.014, c), rod(head, front, 0.016, c));
  g.add(rod([L - 0.14, 0.9, 0], [L - 0.16, 1.02, 0], 0.016, c));
  g.add(rod([L - 0.16, 1.02, -0.24], [L - 0.16, 1.02, 0.24], 0.013, 'black'));
  g.add(box(-0.32, 0.9, -0.05, -0.12, 0.94, 0.05, 'black'));
  g.add(rod([-0.22, 0.86, 0], [-0.22, 0.9, 0], 0.012, 'chrome'));
  return g;
}

export function yogaMat(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, 0.008, z1, '#7a5aa6'));
  for (const x of [x1 + 0.15, x1 + 0.32]) {
    g.add(rod([x, 0.06, z0 + 0.15], [x, 0.06, z0 + 0.45], 0.015, 'chrome'));
    g.add(disc(x, 0.06, z0 + 0.15, 0.06, 0.04, 'black', 12), disc(x, 0.06, z0 + 0.45, 0.06, 0.04, 'black', 12));
  }
  return g;
}

// Built-in cupboard housing the gas boiler, one door left open to show it.
export function boilerCupboard(w, d, o = {}) {
  const { h = 2.3 } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x0 + 0.03, h, z1, 'white'), box(x1 - 0.03, 0, z0, x1, h, z1, 'white'));
  g.add(box(x0, h - 0.03, z0, x1, h, z1, 'white'), box(x0, 0, z0, x1, 0.05, z1, 'white'));
  g.add(box(x0, 0, z0, x1, h, z0 + 0.02, '#e2e0da'));
  const bw = 0.42;
  g.add(box(x0 + 0.15, 1.2, z0 + 0.02, x0 + 0.15 + bw, 1.95, z0 + 0.32, 'gloss'));
  g.add(box(x0 + 0.24, 1.3, z0 + 0.32, x0 + 0.33, 1.36, z0 + 0.325, '#3a6f9e'));
  for (const dx of [0.2, 0.28, 0.36, 0.44]) g.add(rod([x0 + dx, 0.6, z0 + 0.12], [x0 + dx, 1.2, z0 + 0.12], 0.011, '#c98a52'));
  g.add(box(x0 + 0.7, 0.05, z0 + 0.03, x1 - 0.05, 0.2, z1 - 0.06, '#c4473a'));
  g.add(box(x0 + 0.65, 1.0, z0 + 0.02, x1 - 0.03, 1.02, z1 - 0.02, 'white'));
  g.add(box(x0 + 0.7, 1.02, z0 + 0.05, x0 + 1.0, 1.2, z1 - 0.08, '#e1d6c3'));
  // Doors: the left one swung open, the others shut.
  const n = Math.max(2, Math.round(w / 0.55));
  const dw = w / n;
  for (let i = 1; i < n; i++) {
    const a = x0 + i * dw;
    g.add(box(a + 0.004, 0.06, z1 - 0.02, a + dw - 0.004, h - 0.04, z1, 'white'));
    g.add(box(a + 0.05, 1.05, z1, a + 0.07, 1.2, z1 + 0.03, 'chrome'));
  }
  const pivot = new THREE.Group();
  pivot.position.set(x0, 0, z1);
  pivot.add(box(0, 0.06, -0.01, dw - 0.008, h - 0.04, 0.01, 'white'));
  pivot.rotation.y = -1.6;
  g.add(pivot);
  return g;
}

export function cupboardShelves(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  for (const y of [0.9, 1.3, 1.7]) {
    for (let i = 0; i < 7; i++) {
      const x = x0 + 0.03 + i * ((w - 0.06) / 7);
      g.add(box(x, y, z0 + 0.02, x + (w - 0.06) / 7 - 0.01, y + 0.02, z1 - 0.02, '#e9e1d2'));
    }
    g.add(box(x0 + 0.05, y + 0.02, z0 + 0.05, x0 + 0.3, y + 0.12, z1 - 0.08, '#cfd8e0'));
    g.add(box(x0 + 0.32, y + 0.02, z0 + 0.05, x1 - 0.05, y + 0.08, z1 - 0.08, '#efe7da'));
  }
  return g;
}

export function fuseCupboard(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, 0.45, z1, 'white'));
  g.add(box(x0 + 0.02, 0.02, z1, x1 - 0.02, 0.43, z1 + 0.01, '#f2f1ed'));
  g.add(box(x1 - 0.07, 0.18, z1 + 0.01, x1 - 0.05, 0.27, z1 + 0.025, 'chrome'));
  return g;
}

// ---------------------------------------------------------------------------
// Stairs balustrade
// ---------------------------------------------------------------------------

export function balustrade(w, d, o = {}) {
  const { h = 0.9, c = 'white', rail = 'white' } = o;
  const { g, x0, x1 } = frame(w, d);
  g.add(box(x0, 0, -0.04, x1, 0.06, 0.04, c));
  g.add(box(x0 - 0.02, h - 0.05, -0.04, x1 + 0.02, h, 0.04, rail));
  g.add(box(x0 - 0.045, 0, -0.045, x0 + 0.045, h + 0.12, 0.045, c));
  g.add(box(x1 - 0.045, 0, -0.045, x1 + 0.045, h + 0.12, 0.045, c));
  const n = Math.floor(w / 0.11);
  for (let i = 1; i < n; i++) {
    const x = x0 + i * (w / n);
    g.add(box(x - 0.016, 0.06, -0.016, x + 0.016, h - 0.05, 0.016, c));
  }
  return g;
}

// ---------------------------------------------------------------------------
// Outdoors
// ---------------------------------------------------------------------------

export function tubChair(w, d, o = {}) {
  const { c = 'rattan', cushion = '#d8d0c2', legs = null } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  const lift = legs ? 0.14 : 0;
  if (legs) for (const [x, z] of [[x0 + 0.08, z0 + 0.08], [x1 - 0.08, z0 + 0.08], [x0 + 0.08, z1 - 0.08], [x1 - 0.08, z1 - 0.08]]) g.add(cyl(x, 0, z, 0.015, lift, legs, 8));
  g.add(box(x0 + 0.04, lift, z0 + 0.04, x1 - 0.04, 0.4, z1 - 0.04, c));
  g.add(box(x0, 0.4, z0, x1, 0.82, z0 + 0.12, c));
  g.add(box(x0, 0.4, z0, x0 + 0.1, 0.65, z1, c), box(x1 - 0.1, 0.4, z0, x1, 0.65, z1, c));
  g.add(box(x0 + 0.1, 0.4, z0 + 0.12, x1 - 0.1, 0.48, z1 - 0.02, cushion));
  return g;
}

export function patioTable(w) {
  const g = new THREE.Group();
  const r = w / 2;
  g.add(cyl(0, 0, 0, r * 0.75, 0.68, 'rattan', 20, r * 0.6));
  g.add(cyl(0, 0.68, 0, r, 0.04, 'rattan', 28));
  g.add(cyl(0, 0.72, 0, r - 0.03, 0.012, 'glass', 28));
  return g;
}

export function gardenBench(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  const c = '#a77d52';
  for (const x of [x0 + 0.05, x1 - 0.1]) {
    g.add(box(x, 0, z0 + 0.05, x + 0.05, 0.88, z0 + 0.1, c));
    g.add(box(x, 0, z1 - 0.1, x + 0.05, 0.62, z1 - 0.05, c));
    g.add(box(x, 0.58, z0 + 0.05, x + 0.05, 0.62, z1, c));
  }
  for (let i = 0; i < 4; i++) g.add(box(x0, 0.42, z0 + 0.08 + i * 0.1, x1, 0.45, z0 + 0.16 + i * 0.1, c));
  for (const y of [0.55, 0.68, 0.81]) g.add(box(x0, y, z0 + 0.04, x1, y + 0.07, z0 + 0.07, c));
  return g;
}

export function shed(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, 1.85, z1, 'shed'));
  const roofPts = [[x0 - 0.06, 1.85], [x1 + 0.06, 1.85], [0, 2.3]];
  const shape = new THREE.Shape(roofPts.map(([a, b]) => new THREE.Vector2(a, b)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d + 0.12, bevelEnabled: false });
  geo.translate(0, 0, z0 - 0.06);
  g.add(mesh(geo, 'shedDark'));
  g.add(box(-0.5, 0.05, z1, -0.01, 1.75, z1 + 0.02, 'shedDark'), box(0.01, 0.05, z1, 0.5, 1.75, z1 + 0.02, 'shedDark'));
  for (const x of [-0.42, -0.25, 0.09, 0.26]) g.add(box(x, 0.12, z1 + 0.02, x + 0.12, 1.68, z1 + 0.03, 'shed'));
  return g;
}

export function planter(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, 0.4, z1, 'fenceTimber'));
  g.add(box(x0 + 0.04, 0.4, z0 + 0.04, x1 - 0.04, 0.38, z1 - 0.04, 'soil'));
  for (let i = 0; i < 3; i++) g.add(sphere(x0 + 0.3 + i * (w - 0.6) / 2, 0.48, 0, 0.13, i % 2 ? 'foliage' : 'foliageDark', 0));
  return g;
}

export function car(w, d, o = {}) {
  const { c = '#5b6b7d' } = o;
  // Built along x (length) with its nose at +x.
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0.28, z0, x1, 0.82, z1, c));
  g.add(box(x0 + 0.95, 0.82, z0 + 0.1, x1 - 1.25, 1.4, z1 - 0.1, c));
  g.add(box(x0 + 0.98, 0.86, z0 + 0.09, x1 - 1.28, 1.34, z1 - 0.09, 'blackGlass'));
  g.add(box(x1 - 1.27, 0.86, z0 + 0.12, x1 - 1.18, 1.32, z1 - 0.12, 'blackGlass'));
  g.add(box(x0 + 0.86, 0.86, z0 + 0.12, x0 + 0.96, 1.34, z1 - 0.12, 'blackGlass'));
  for (const x of [x0 + 0.75, x1 - 0.75]) {
    for (const z of [z0 + 0.05, z1 - 0.05]) {
      const t = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 20);
      t.rotateX(Math.PI / 2); t.translate(x, 0.32, z);
      g.add(mesh(t, '#222426'));
    }
  }
  g.add(box(x1 - 0.02, 0.55, z0 + 0.12, x1, 0.68, z0 + 0.4, 'warmLight'), box(x1 - 0.02, 0.55, z1 - 0.4, x1, 0.68, z1 - 0.12, 'warmLight'));
  g.add(box(x0, 0.58, z0 + 0.12, x0 + 0.02, 0.7, z0 + 0.38, '#b33a2e'), box(x0, 0.58, z1 - 0.38, x0 + 0.02, 0.7, z1 - 0.12, '#b33a2e'));
  return g;
}

export function wheelieBin(w, d, o = {}) {
  const { c = '#2f62b5' } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0 + 0.03, 0.05, z0 + 0.03, x1 - 0.03, 1.0, z1 - 0.03, c));
  g.add(box(x0, 1.0, z0, x1, 1.06, z1 + 0.03, c));
  for (const x of [x0 + 0.08, x1 - 0.08]) {
    const t = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 14);
    t.rotateZ(Math.PI / 2); t.translate(x, 0.1, z0 + 0.08);
    g.add(mesh(t, '#222426'));
  }
  return g;
}

export function tree(o = {}) {
  const { h = 3.2, r = 1.3, seed = 3, leaves = ['foliage', 'foliageRed', 'foliageDark'] } = o;
  const rand = rng(seed);
  const g = new THREE.Group();
  g.add(cyl(0, 0, 0, 0.09, h * 0.55, 'bark', 10, 0.06));
  g.add(rod([0, h * 0.4, 0], [0.4, h * 0.65, 0.2], 0.04, 'bark'));
  g.add(rod([0, h * 0.45, 0], [-0.35, h * 0.7, -0.2], 0.04, 'bark'));
  for (let i = 0; i < 7; i++) {
    const a = rand() * Math.PI * 2, d = rand() * r * 0.6;
    g.add(sphere(Math.cos(a) * d, h * 0.68 + rand() * h * 0.25, Math.sin(a) * d, r * (0.45 + rand() * 0.3), leaves[i % leaves.length], 0));
  }
  return g;
}

export function shrub(o = {}) {
  const { r = 0.35, seed = 1, leaves = ['foliage', 'foliageDark'] } = o;
  const rand = rng(seed);
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    g.add(sphere((rand() - 0.5) * r, r * 0.7 + rand() * r * 0.3, (rand() - 0.5) * r, r * (0.6 + rand() * 0.4), leaves[i % leaves.length], 0));
  }
  return g;
}

// ---------------------------------------------------------------------------
// Added for 22 Ellan Park
// ---------------------------------------------------------------------------

// White marble fire surround with a black insert and a marble hearth in front.
export function fireSurround(w, d) {
  const { g, x0, x1, z0 } = frame(w, d);
  const back = z0, face = z0 + 0.12;
  g.add(box(x0 - 0.05, 0, back, x1 + 0.05, 0.05, back + d, 'marble'));
  g.add(box(x0, 0, back, x0 + 0.16, 1.08, face, 'white'), box(x1 - 0.16, 0, back, x1, 1.08, face, 'white'));
  g.add(box(x0 - 0.04, 1.08, back, x1 + 0.04, 1.16, face + 0.04, 'white'));
  g.add(box(x0 + 0.16, 0.88, back, x1 - 0.16, 1.08, face, 'white'));
  g.add(box(x0 + 0.16, 0.05, back, x1 - 0.16, 0.88, back + 0.06, 'marble'));
  g.add(box(x0 + 0.3, 0.05, back + 0.06, x1 - 0.3, 0.62, back + 0.08, '#1d1f22'));
  return g;
}

// Built-in alcove unit: cupboard below, arched open niche with glass shelves above.
export function alcoveUnit(w, d, o = {}) {
  const { h = 2.15, cupboard = 0.86 } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, cupboard, z1, 'white'));
  g.add(box(x0 + 0.05, 0.08, z1, x1 - 0.05, cupboard - 0.05, z1 + 0.01, '#f7f6f2'));
  g.add(box(x0, cupboard, z0, x1, cupboard + 0.03, z1 + 0.02, 'white'));
  g.add(box(x0, cupboard, z0, x1, h, z0 + 0.02, '#e9e3d8'));
  for (const y of [cupboard + 0.38, cupboard + 0.72]) g.add(box(x0 + 0.03, y, z0 + 0.02, x1 - 0.03, y + 0.012, z1 - 0.04, 'glass'));
  const r = w / 2 - 0.05;
  const shape = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(w / 2, r + 0.12), new THREE.Vector2(-w / 2, r + 0.12)]);
  const hole = new THREE.Path();
  hole.absarc(0, 0, r, 0, Math.PI, false);
  hole.lineTo(r, 0);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d - 0.02, bevelEnabled: false, curveSegments: 16 });
  geo.translate(0, h - r - 0.12, z0 + 0.02);
  g.add(mesh(geo, 'white'));
  g.add(box(x0, cupboard, z0, x0 + 0.05, h - r, z1, 'white'), box(x1 - 0.05, cupboard, z0, x1, h - r, z1, 'white'));
  g.add(cyl(-0.08, cupboard + 0.4, 0, 0.06, 0.12, '#2d2f33'), sphere(0.1, cupboard + 0.78, 0, 0.05, '#d9c9a5', 0));
  return g;
}

export function wallClock(w) {
  const g = new THREE.Group();
  g.add(disc(0, 0, 0.02, w / 2, 0.04, 'black', 32));
  g.add(disc(0, 0, 0.042, w / 2 - 0.03, 0.005, '#f7f6f2', 32));
  g.add(box(-0.006, 0, 0.045, 0.006, w * 0.32, 0.05, 'black'));
  g.add(box(0, -0.006, 0.045, w * 0.22, 0.006, 0.05, 'black'));
  return g;
}

export function monitors(w, d) {
  const g = new THREE.Group();
  for (const x of [-0.3, 0.3]) {
    g.add(box(x - 0.12, 0, -0.08, x + 0.12, 0.015, 0.06, 'black'));
    g.add(box(x - 0.02, 0.015, -0.05, x + 0.02, 0.14, -0.02, 'black'));
    g.add(box(x - 0.28, 0.12, -0.06, x + 0.28, 0.45, -0.03, 'black'));
    g.add(box(x - 0.265, 0.135, -0.03, x + 0.265, 0.435, -0.027, 'blackGlass'));
  }
  return g;
}

export function ladderShelf(w, d, o = {}) {
  const { h = 1.75 } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  for (const x of [x0 + 0.02, x1 - 0.02]) {
    g.add(rod([x, 0, z1 - 0.03], [x, h, z0 + 0.05], 0.018, 'black'));
    g.add(rod([x, 0, z0 + 0.02], [x, h, z0 + 0.03], 0.014, 'black'));
  }
  for (let i = 0; i < 4; i++) {
    const t = i / 4;
    const y = 0.15 + t * (h - 0.35);
    const depth = (d - 0.05) * (1 - t * 0.85);
    g.add(box(x0 + 0.03, y, z0 + 0.03, x1 - 0.03, y + 0.025, z0 + 0.03 + depth, '#8a6b4a'));
    g.add(box(x0 + 0.1, y + 0.025, z0 + 0.05, x0 + 0.24, y + 0.16, z0 + 0.15, i % 2 ? '#d9c9a5' : '#2d2f33'));
  }
  return g;
}

export function roundMirror(w, o = {}) {
  const { frameC = 'gold' } = o;
  const g = new THREE.Group();
  const t = new THREE.TorusGeometry(w / 2 - 0.015, 0.018, 8, 40);
  t.translate(0, 0, 0.02);
  g.add(mesh(t, frameC));
  g.add(disc(0, 0, 0.012, w / 2 - 0.02, 0.01, 'mirror', 40));
  return g;
}

// Tall ornate mirror leaning against the wall it is placed on.
export function floorMirror(w, d, o = {}) {
  const { h = 1.8 } = o;
  const g = new THREE.Group();
  const lean = new THREE.Group();
  lean.add(box(-w / 2, 0, -0.03, w / 2, h, 0.03, '#c6c8cb'));
  lean.add(box(-w / 2 + 0.1, 0.1, 0.03, w / 2 - 0.1, h - 0.1, 0.035, 'mirrorSoft'));
  for (const [x, y] of [[-w / 2 + 0.05, h - 0.05], [w / 2 - 0.05, h - 0.05], [-w / 2 + 0.05, 0.05], [w / 2 - 0.05, 0.05], [0, h - 0.04]]) lean.add(sphere(x, y, 0.035, 0.06, 'silver', 0));
  lean.position.z = -d / 2 + 0.3;
  lean.rotation.x = -0.14;
  g.add(lean);
  return g;
}

// L-shaped sofa: long run with its back on -z, chaise along the +x end coming forward.
export function cornerSofa(w, d, o = {}) {
  const { body = 'velvetTaupe', leg = 0.95, pillows = [] } = o;
  const g = new THREE.Group();
  const longD = Math.min(0.95, d);
  const long = sofa(w, longD, { body, seats: 3, pillows, legs: 'gold' });
  long.position.z = -d / 2 + longD / 2;
  g.add(long);
  const x0 = w / 2 - leg, x1 = w / 2, za = -d / 2 + longD, zb = d / 2;
  g.add(box(x0, 0.08, za - 0.05, x1, 0.3, zb, body));
  g.add(box(x0 + 0.02, 0.3, za - 0.05, x1 - 0.2, 0.44, zb - 0.02, body));
  g.add(box(x1 - 0.2, 0.3, za - 0.05, x1, 0.82, zb, body));
  g.add(box(x0, 0.3, zb - 0.18, x1 - 0.2, 0.62, zb, body));
  for (const [x, z] of [[x0 + 0.06, zb - 0.06], [x1 - 0.06, zb - 0.06]]) g.add(box(x - 0.025, 0, z - 0.025, x + 0.025, 0.08, z + 0.025, 'gold'));
  return g;
}

export function ottoman(w, d, o = {}) {
  const { c = 'mustard', legs = 'gold' } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  for (const [x, z] of [[x0 + 0.06, z0 + 0.06], [x1 - 0.06, z0 + 0.06], [x0 + 0.06, z1 - 0.06], [x1 - 0.06, z1 - 0.06]]) g.add(rod([x, 0, z], [x * 0.96, 0.18, z * 0.96], 0.012, legs));
  g.add(box(x0, 0.18, z0, x1, 0.42, z1, c));
  return g;
}

export function pouffe(w, d, o = {}) {
  const { c = 'mustard' } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, 0.38, z1, c));
  return g;
}

export function sideTableRound(w) {
  const g = new THREE.Group();
  g.add(cyl(0, 0, 0, w / 2 - 0.04, 0.012, 'gold', 20));
  g.add(cyl(0, 0, 0, 0.012, 0.6, 'gold', 8));
  g.add(cyl(0, 0.6, 0, w / 2, 0.025, '#5d4433', 24));
  return g;
}

export function tvPanel(w) {
  const g = new THREE.Group();
  g.add(box(-w / 2, 0, 0, w / 2, w * 0.57, 0.04, 'black'));
  g.add(box(-w / 2 + 0.015, 0.015, 0.04, w / 2 - 0.015, w * 0.57 - 0.015, 0.044, 'blackGlass'));
  return g;
}

// Picture-frame wall mouldings above a dado rail, as seen in the living room.
export function wallPanels(w, d, o = {}) {
  const { n = Math.max(1, Math.round(w / 1.1)), y0 = 1.05, y1 = 2.05, dado = 0.88, c = '#fbf9f4' } = o;
  const g = new THREE.Group();
  g.add(box(-w / 2, dado, 0, w / 2, dado + 0.05, 0.025, c));
  const pw = w / n;
  for (let i = 0; i < n; i++) {
    const a = -w / 2 + i * pw + 0.18, b = a + pw - 0.36, t = 0.02;
    g.add(box(a, y0, 0, b, y0 + t, 0.015, c), box(a, y1 - t, 0, b, y1, 0.015, c));
    g.add(box(a, y0, 0, a + t, y1, 0.015, c), box(b - t, y0, 0, b, y1, 0.015, c));
  }
  return g;
}

// Tiled floating shelf with a vessel basin and wall-mounted tap.
export function basinShelf(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0.68, z0, x1, 0.86, z1, 'metro'));
  g.add(cyl(0, 0.86, 0.02, 0.19, 0.13, 'porcelain', 28, 0.21));
  g.add(cyl(0, 0.96, 0.02, 0.16, 0.035, '#e3e8ea', 28));
  g.add(rod([0, 1.12, z0], [0, 1.12, z0 + 0.15], 0.012, 'gold'));
  g.add(cyl(x1 - 0.2, 0.86, z0 + 0.12, 0.05, 0.14, '#f2efe8'));
  g.add(sphere(x1 - 0.2, 1.08, z0 + 0.12, 0.09, '#e58aa6', 0));
  return g;
}

// Wall-hung WC with the cistern boxed in behind a tiled panel.
export function toiletWall(w, d, o = {}) {
  const { panel = 'beigeTile', plate = 'chrome' } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, 1.0, z0 + 0.18, panel));
  g.add(box(-0.12, 0.78, z0 + 0.18, 0.12, 0.92, z0 + 0.19, plate));
  const pan = new THREE.CylinderGeometry(0.18, 0.15, 0.3, 22);
  pan.scale(1, 1, 1.4); pan.translate(0, 0.3, Math.min(z1 - 0.26, z0 + 0.46));
  g.add(mesh(pan, 'porcelain'));
  g.add(box(-0.17, 0.27, z0 + 0.18, 0.17, 0.45, z0 + 0.3, 'porcelain'));
  const seat = new THREE.CylinderGeometry(0.185, 0.185, 0.035, 22);
  seat.scale(1, 1, 1.4); seat.translate(0, 0.46, Math.min(z1 - 0.26, z0 + 0.46));
  g.add(mesh(seat, '#f4f4f2'));
  return g;
}

export function basinWall(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0.7, z0, x1, 0.86, z1, 'porcelain'));
  g.add(box(x0 + 0.06, 0.8, z0 + 0.06, x1 - 0.06, 0.865, z1 - 0.05, '#e3e8ea'));
  g.add(cyl(0, 0.45, z0 + 0.12, 0.022, 0.25, 'chrome'));
  g.add(cyl(0, 0.86, z0 + 0.04, 0.016, 0.14, 'chrome'));
  return g;
}

// Straight bath with a frosted screen and a riser rail at the +x end.
export function bathStraight(w, d, o = {}) {
  const { panel = 'porcelain' } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, 0.55, z1, panel));
  g.add(box(x0 + 0.06, 0.5, z0 + 0.06, x1 - 0.06, 0.555, z1 - 0.06, '#e4ecef'));
  g.add(box(x1 - 0.85, 0.55, z1 - 0.025, x1 - 0.02, 2.0, z1 - 0.015, 'obscure'));
  g.add(rod([x1 - 0.85, 2.0, z1 - 0.02], [x1 - 0.02, 2.0, z1 - 0.02], 0.008, 'chrome'));
  g.add(rod([x1 - 0.03, 0.95, z0 + 0.3], [x1 - 0.03, 1.9, z0 + 0.3], 0.012, 'chrome'));
  g.add(cyl(x1 - 0.07, 1.65, z0 + 0.3, 0.035, 0.12, 'chrome'));
  g.add(box(x1 - 0.06, 0.9, z0 + 0.22, x1, 0.98, z0 + 0.38, 'chrome'));
  return g;
}

export function evCharger() {
  const g = new THREE.Group();
  g.add(box(-0.12, -0.18, 0, 0.12, 0.18, 0.12, '#f2f2ef'));
  g.add(box(-0.08, -0.06, 0.12, 0.08, 0.12, 0.125, '#2b2e31'));
  g.add(rod([0.05, -0.18, 0.08], [0.15, -0.6, 0.15], 0.015, 'black'));
  return g;
}

export function meterBox() {
  const g = new THREE.Group();
  g.add(box(-0.22, 0, 0, 0.22, 0.55, 0.2, '#f2f2ef'));
  g.add(box(-0.2, 0.02, 0.2, 0.2, 0.53, 0.205, '#e3e3df'));
  return g;
}

export function gardenSwing(w, d) {
  const { g, x0, x1, z0, z1 } = frame(w, d);
  const top = 1.95, c = '#c9cdd1';
  for (const x of [x0 + 0.05, x1 - 0.05]) {
    g.add(rod([x, 0, z0], [x, top, 0], 0.025, c), rod([x, 0, z1], [x, top, 0], 0.025, c));
  }
  g.add(rod([x0 + 0.05, top, 0], [x1 - 0.05, top, 0], 0.03, c));
  for (const x of [x0 + 0.35, x1 - 0.35]) g.add(rod([x, top, 0], [x, 0.55, 0], 0.01, c));
  g.add(box(x0 + 0.3, 0.45, -0.25, x1 - 0.3, 0.52, 0.25, '#2d3035'));
  g.add(box(x0 + 0.3, 0.52, -0.27, x1 - 0.3, 1.05, -0.22, '#2d3035'));
  return g;
}

export function storeBox(w, d, o = {}) {
  const { c = '#3a3d41' } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  g.add(box(x0, 0, z0, x1, 0.75, z1, c));
  g.add(box(x0 - 0.02, 0.75, z0 - 0.02, x1 + 0.02, 0.8, z1 + 0.02, '#2c2f33'));
  return g;
}

// Vertical slatted screen beside a stair, from the pitch line up to the ceiling.
export function slatScreen(len, o = {}) {
  const { rise = 0.927, top = 2.4, start = 0.9, gap = 0.11 } = o;
  const g = new THREE.Group();
  for (let x = 0.05; x < len; x += gap) {
    const y0 = start + x * rise;
    if (y0 >= top - 0.1) break;
    g.add(box(x - 0.02, y0, -0.02, x + 0.02, top, 0.02, 'white'));
  }
  return g;
}

// Apex garden studio (Shire 10 x 7 ft Superlap): glazed double doors and two windows
// on the long front (+z), gables at the short ends. Sizes follow the maker's drawing.
export function gardenStudio(w, d, o = {}) {
  const { eaves = 2.125, ridge = 2.553, overhang = [0.067, 0.119] } = o;
  const { g, x0, x1, z0, z1 } = frame(w, d);
  const trim = 'anthracite', base = 0.09;
  g.add(box(x0 - 0.12, 0, z0 - 0.12, x1 + 0.12, 0.05, z1 + 0.12, 'concrete'));
  g.add(box(x0, 0.05, z0, x1, base, z1, '#7a5a35'));
  g.add(box(x0, base, z0, x1, eaves, z1, 'superlap'));
  for (const [xa, xb] of [[x0, x0 + 0.02], [x1 - 0.02, x1]]) g.add(prismX([[z0, eaves], [z1, eaves], [0, ridge]], xa, xb, 'superlap'));

  // Felt roof: two slabs falling from the ridge, with barge boards on the gables.
  const [ox, oz] = overhang;
  const pitch = (ridge - eaves) / (d / 2), run = d / 2 + oz, L = Math.hypot(run, run * pitch), ang = Math.atan(pitch);
  for (const s of [-1, 1]) {
    const slab = mesh(worldUV(new THREE.BoxGeometry(w + 2 * ox, 0.04, L).translate(0, 0.02, (s * L) / 2)), 'felt');
    slab.position.set(0, ridge, 0);
    slab.rotation.x = s * ang;
    g.add(slab);
    for (const xe of [x0 - ox, x1 + ox]) {
      const barge = mesh(new THREE.BoxGeometry(0.03, 0.12, L).translate(xe, -0.04, (s * L) / 2), trim);
      barge.position.set(0, ridge, 0);
      barge.rotation.x = s * ang;
      g.add(barge);
    }
  }
  g.add(box(x0 - ox, ridge, -0.05, x1 + ox, ridge + 0.05, 0.05, 'felt'));

  for (const x of [x0, x1]) for (const z of [z0, z1]) g.add(box(x - 0.035, base, z - 0.035, x + 0.035, eaves, z + 0.035, trim));

  // Double doors to the left of the front, then a trim post and two windows.
  const dA = x0 + 0.12, dB = dA + 1.424, dY0 = base + 0.02, dY1 = dY0 + 1.805, mid = (dA + dB) / 2;
  g.add(box(dA - 0.05, dY0, z1, dB + 0.05, dY1 + 0.05, z1 + 0.02, trim));
  for (const [a, b] of [[dA, mid - 0.005], [mid + 0.005, dB]]) {
    g.add(box(a, dY0, z1 + 0.02, b, dY1, z1 + 0.04, trim));
    g.add(box(a + 0.08, dY0 + 0.25, z1 + 0.04, b - 0.08, dY1 - 0.08, z1 + 0.045, 'blackGlass'));
  }
  g.add(box(mid + 0.02, dY0 + 0.95, z1 + 0.045, mid + 0.05, dY0 + 1.05, z1 + 0.07, 'chrome'));
  const post = dB + 0.12;
  g.add(box(post - 0.035, base, z1, post + 0.035, eaves, z1 + 0.015, trim));
  const ww = (x1 - post - 0.2) / 2;
  for (const a of [post + 0.08, post + 0.12 + ww]) {
    g.add(box(a, 1.12, z1, a + ww, 1.94, z1 + 0.03, trim));
    g.add(box(a + 0.05, 1.17, z1 + 0.03, a + ww - 0.05, 1.89, z1 + 0.035, 'blackGlass'));
  }
  return g;
}
