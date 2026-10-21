// model.js - the parts of a house model every tour shares: walls with door and
// window openings (each with a full-height and a cut-down variant for the
// dollhouse cutaway), room floors and display bases, roof slabs, fences, and the
// registry that tags every object with the rooms and floors it belongs to.
//
// Coordinates are metres, y up. Each house picks its own x/z layout.
import * as THREE from 'three';
import { box, mesh, prismX, prismZ, worldUV } from './kit.js';

export const CUT = 0.32;
export const ROT = { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 };
export const OUT = { '+x': [1, 0], '-x': [-1, 0], '+z': [0, 1], '-z': [0, -1] };

// cfg: {
//   floorY: [ground, first], wallY: [[y0, y1] per floor], rooms, roomView, flooring,
//   finishes: { roomId: wallMaterial }, alias: { roomId: roomIdItBelongsTo },
//   extMat: material for 'ext' faces, frames: { out, in } for windows and outside doors,
//   sill: material for outside window sills,
// }
export function createHouse(cfg) {
  const floorY = cfg.floorY;
  const frames = { out: 'upvc', in: 'upvc', ...cfg.frames };
  const extMat = cfg.extMat ?? 'ext';
  const roomY = (id) => cfg.rooms[id].y ?? floorY[cfg.rooms[id].floor];
  const WALLS = [];

  function side(s) {
    if (s === 'party') return { room: null, mat: 'party' };
    if (s === 'ext' || s.startsWith('ext:')) return { room: null, mat: s === 'ext' ? extMat : s.slice(4), ext: true };
    const [room, fin] = s.split(':');
    return { room: cfg.alias?.[room] ?? room, mat: fin ?? cfg.finishes[room] };
  }

  function wall(id, floor, dir, at, span, sides, o = {}) {
    WALLS.push({
      id, floor, dir, at, span, sides,
      y: o.y ?? cfg.wallY[floor], fy: o.fy ?? floorY[floor],
      out: o.out ?? null, holes: o.holes ?? [], ends: (o.ends ?? []).map((e) => (e === 'ext' ? extMat : e)),
      profile: o.profile ?? null, also: o.also ?? [],
    });
  }
  const door = (s0, s1, o = {}) => ({ kind: 'door', s: [s0, s1], leaf: 'int', label: 'Internal door', src: 'plan', ...o });
  const win = (s0, s1, y0, y1, o = {}) => ({ kind: 'window', s: [s0, s1], y: [y0, y1], panes: 2, label: 'uPVC double-glazed window', src: 'listing', ...o });
  const gap = (s0, s1, y1) => ({ kind: 'open', s: [s0, s1], y: [-9, y1] });

  // -------------------------------------------------------------------------
  // Walls
  // -------------------------------------------------------------------------

  function buildWall(def) {
    const { dir, at: [a0, a1], span: [s0, s1], y: [y0, y1], fy } = def;
    const neg = side(def.sides.neg), pos = side(def.sides.pos);
    const rooms = [...new Set([neg.room, pos.room, ...def.also].filter(Boolean))];
    const group = new THREE.Group();
    const full = new THREE.Group(); full.name = 'full';
    const cut = new THREE.Group(); cut.name = 'cut';
    group.add(full, cut);
    const extSide = neg.ext ? 'neg' : pos.ext ? 'pos' : null;

    // Box in wall space: s along the wall, t across it (absolute), y up.
    const wbox = (sa, sb, ya, yb, ta, tb, m) => (dir === 'z' ? box(ta, ya, sa, tb, yb, sb, m) : box(sa, ya, ta, sb, yb, tb, m));
    const faceMats = (endA, endB) => (dir === 'z'
      ? [pos.mat, neg.mat, 'cap', 'cap', endB, endA]
      : [endB, endA, 'cap', 'cap', pos.mat, neg.mat]);

    if (def.profile) {
      const mid = (a0 + a1) / 2;
      const make = dir === 'x' ? prismZ : prismX;
      full.add(make(def.profile, a0, mid, [neg.mat, 'white']));
      full.add(make(def.profile, mid, a1, [pos.mat, 'white']));
      return { def, group, full, cut: null, rooms, items: [], isFull: true };
    }

    const holes = def.holes.map((h) => {
      const hy = h.y ?? [fy, fy + 2.0];
      const low = hy[0] <= fy + 0.01;
      return { ...h, ya: low ? y0 - 0.01 : hy[0], yb: hy[1], low };
    });

    const build = (target, top, list) => {
      const xs = [...new Set([s0, s1, ...list.flatMap((h) => h.s)])].filter((v) => v >= s0 && v <= s1).sort((p, q) => p - q);
      for (let i = 0; i < xs.length - 1; i++) {
        const ca = xs[i], cb = xs[i + 1];
        if (cb - ca < 1e-4) continue;
        let spans = [[y0, top]];
        for (const h of list) {
          if (h.s[0] <= ca + 1e-4 && h.s[1] >= cb - 1e-4) {
            spans = spans.flatMap(([p, q]) => {
              const out = [];
              if (h.ya > p) out.push([p, Math.min(h.ya, q)]);
              if (h.yb < q) out.push([Math.max(h.yb, p), q]);
              return out.filter(([u, v]) => v - u > 1e-3);
            });
          }
        }
        const endA = ca === s0 ? def.ends[0] ?? 'reveal' : 'reveal';
        const endB = cb === s1 ? def.ends[1] ?? 'reveal' : 'reveal';
        for (const [p, q] of spans) target.add(wbox(ca, cb, p, q, a0, a1, faceMats(endA, endB)));
      }
    };
    build(full, y1, holes);
    build(cut, fy + CUT, holes.filter((h) => h.low));
    cut.visible = false;

    const thick = a1 - a0;
    const frameT = !extSide || thick < 0.2
      ? [(a0 + a1) / 2 - 0.035, (a0 + a1) / 2 + 0.035]
      : extSide === 'neg' ? [a0 + 0.05, a0 + 0.12] : [a1 - 0.12, a1 - 0.05];
    const innerFace = extSide === 'neg' ? a1 : a0;
    const ctx = { def, wbox, frameT, extSide, a0, a1, innerFace, fy };

    for (const h of holes) {
      if (h.kind === 'window') full.add(windowFrame(h, ctx));
      else if (h.kind === 'door' || h.kind === 'french') full.add(doorway(h, ctx));
    }
    return { def, group, full, cut, rooms, items: [], isFull: true };
  }

  // Frame bars; on outside walls the outer half takes frames.out and the inner half frames.in.
  function bars(ctx, sa, sb, ya, yb) {
    const { wbox, frameT: [ta, tb], extSide } = ctx;
    if (!extSide || frames.out === frames.in) return [wbox(sa, sb, ya, yb, ta, tb, extSide ? frames.out : 'upvc')];
    const tm = (ta + tb) / 2;
    const [outer, inner] = extSide === 'neg' ? [[ta, tm], [tm, tb]] : [[tm, tb], [ta, tm]];
    return [wbox(sa, sb, ya, yb, outer[0], outer[1], frames.out), wbox(sa, sb, ya, yb, inner[0], inner[1], frames.in)];
  }

  function windowFrame(h, ctx) {
    const { wbox, frameT: [ta, tb], extSide, a0, a1, innerFace } = ctx;
    const g = new THREE.Group();
    const [s0, s1] = h.s, y0 = h.ya, y1 = h.yb, fw = 0.06;
    const tm = (ta + tb) / 2;
    g.add(...bars(ctx, s0, s0 + fw, y0, y1), ...bars(ctx, s1 - fw, s1, y0, y1));
    g.add(...bars(ctx, s0, s1, y0, y0 + fw), ...bars(ctx, s0, s1, y1 - fw, y1));
    const panes = h.panes ?? 2;
    for (let i = 1; i < panes; i++) {
      const s = s0 + (i * (s1 - s0)) / panes;
      g.add(...bars(ctx, s - 0.03, s + 0.03, y0, y1));
    }
    if (h.transom) {
      const y = y1 - (y1 - y0) * 0.3;
      g.add(...bars(ctx, s0, s1, y - 0.025, y + 0.025));
    }
    g.add(wbox(s0 + fw, s1 - fw, y0 + fw, y1 - fw, tm - 0.006, tm + 0.006, h.obscure ? 'obscure' : 'glass'));
    if (extSide) {
      const [oa, ob] = extSide === 'neg' ? [a0 - 0.06, a0 + 0.06] : [a1 - 0.06, a1 + 0.06];
      g.add(wbox(s0 - 0.05, s1 + 0.05, y0 - 0.05, y0, oa, ob, cfg.sill ?? 'upvc'));
      const [ia, ib] = extSide === 'neg' ? [tb, innerFace + 0.03] : [innerFace - 0.03, ta];
      g.add(wbox(s0 - 0.04, s1 + 0.04, y0 - 0.025, y0, ia, ib, 'white'));
    }
    g.userData = { label: h.label, src: h.src };
    return g;
  }

  function doorLeaf(kind, w, hgt, color) {
    const g = new THREE.Group();
    const t = 0.022;
    if (kind === 'extFront' || kind === 'extGlazed' || kind === 'french' || kind === 'cottage') {
      const c = color ?? frames.out;
      g.add(box(0, 0, -t, w, hgt, t, c));
      if (kind === 'extFront') {
        g.add(box(w * 0.3, hgt * 0.55, -t - 0.003, w * 0.7, hgt * 0.85, t + 0.003, 'obscure'));
        g.add(box(w * 0.33, hgt * 0.38, -t - 0.006, w * 0.67, hgt * 0.42, t + 0.006, '#c9c9c4'));
      } else if (kind === 'cottage') {
        g.add(box(0.1, hgt * 0.5, -t - 0.003, w - 0.1, hgt - 0.1, t + 0.003, 'glass'));
        for (const f of [1 / 3, 2 / 3]) {
          g.add(box(0.1 + (w - 0.2) * f - 0.012, hgt * 0.5, -t - 0.006, 0.1 + (w - 0.2) * f + 0.012, hgt - 0.1, t + 0.006, c));
          g.add(box(0.1, hgt * 0.5 + (hgt * 0.5 - 0.1) * f - 0.012, -t - 0.006, w - 0.1, hgt * 0.5 + (hgt * 0.5 - 0.1) * f + 0.012, t + 0.006, c));
        }
        for (const [a, b] of [[0.1, 0.24], [0.28, 0.44]]) g.add(box(0.12, hgt * a, t, w - 0.12, hgt * b, t + 0.008, c));
      } else {
        const top = kind === 'french' ? 0.12 : hgt * 0.45;
        g.add(box(0.09, top, -t - 0.003, w - 0.09, hgt - 0.09, t + 0.003, kind === 'french' ? 'glass' : 'obscure'));
      }
      g.add(box(w - 0.1, hgt * 0.47, t, w - 0.05, hgt * 0.5, t + 0.05, 'chrome'));
      return g;
    }
    if (kind === 'glazedInt') {
      // White internal door with a grid of small glass panes.
      g.add(box(0, 0, -t, 0.07, hgt, t, 'white'), box(w - 0.07, 0, -t, w, hgt, t, 'white'));
      g.add(box(0, 0, -t, w, 0.14, t, 'white'), box(0, hgt - 0.08, -t, w, hgt, t, 'white'));
      g.add(box(0.07, 0.14, -0.004, w - 0.07, hgt - 0.08, 0.004, 'glass'));
      const cols = 3, rows = 5;
      for (let c = 1; c < cols; c++) { const x = 0.07 + ((w - 0.14) * c) / cols; g.add(box(x - 0.012, 0.14, -0.014, x + 0.012, hgt - 0.08, 0.014, 'white')); }
      for (let r = 1; r < rows; r++) { const y = 0.14 + ((hgt - 0.22) * r) / rows; g.add(box(0.07, y - 0.012, -0.014, w - 0.07, y + 0.012, 0.014, 'white')); }
      g.add(box(w - 0.1, hgt * 0.47, t, w - 0.06, hgt * 0.49, t + 0.04, '#c9a45c'));
      return g;
    }
    g.add(box(0, 0, -t, w, hgt, t, color ?? 'white'));
    if (kind === 'int' || kind === 'slide') {
      const rows = [[0.08, 0.36], [0.42, 0.66], [0.72, 0.94]];
      for (const [a, b] of rows) {
        for (const [l, r] of [[0.1, 0.47], [0.53, 0.9]]) {
          g.add(box(w * l, hgt * a, t, w * r, hgt * b, t + 0.008, '#ecebe6'));
          g.add(box(w * l, hgt * a, -t - 0.008, w * r, hgt * b, -t, '#ecebe6'));
        }
      }
    }
    g.add(box(w - 0.11, hgt * 0.47, t, w - 0.04, hgt * 0.49, t + 0.05, 'chrome'));
    g.add(box(w - 0.11, hgt * 0.47, -t - 0.05, w - 0.04, hgt * 0.49, -t, 'chrome'));
    return g;
  }

  function doorway(h, ctx) {
    const { def, wbox, frameT: [ta, tb], a0, a1, fy, extSide } = ctx;
    const g = new THREE.Group();
    const [s0, s1] = h.s;
    const yb = h.yb;
    const outside = !!extSide && (h.leaf?.startsWith('ext') || h.leaf === 'cottage' || h.kind === 'french');
    const [fa, fb] = outside ? [ta, tb] : [a0 - 0.012, a1 + 0.012];
    if (outside) g.add(...bars(ctx, s0, s0 + 0.04, fy, yb), ...bars(ctx, s1 - 0.04, s1, fy, yb), ...bars(ctx, s0, s1, yb - 0.04, yb));
    else g.add(wbox(s0, s0 + 0.04, fy, yb, fa, fb, 'white'), wbox(s1 - 0.04, s1, fy, yb, fa, fb, 'white'), wbox(s0, s1, yb - 0.04, yb, fa, fb, 'white'));

    const along = def.dir === 'z' ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
    const perp = def.dir === 'z' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
    const place = (leaf, s, t, heading) => {
      const p = new THREE.Group();
      p.add(leaf);
      p.position.copy(along.clone().multiplyScalar(s).add(perp.clone().multiplyScalar(t))).setY(fy);
      p.rotation.y = Math.atan2(-heading.z, heading.x);
      g.add(p);
    };
    const swung = (toFree, sw) => {
      if (!sw) return toFree;
      const openDir = perp.clone().multiplyScalar(sw.side === 'neg' ? -1 : 1);
      const a = (sw.angle * Math.PI) / 180;
      return toFree.clone().multiplyScalar(Math.cos(a)).add(openDir.multiplyScalar(Math.sin(a)));
    };
    const faceT = (sw) => (sw ? (sw.side === 'neg' ? a0 - 0.022 : a1 + 0.022) : (ta + tb) / 2);

    const lw = s1 - s0 - 0.08, lh = yb - fy - 0.05;
    if (h.kind === 'french') {
      const half = lw / 2, kind = h.leaf === 'glazedInt' ? 'glazedInt' : 'french';
      place(doorLeaf(kind, half, lh, h.color), s0 + 0.04, faceT(h.swing), swung(along, h.swing));
      place(doorLeaf(kind, half, lh, h.color), s1 - 0.04, faceT(h.swing), swung(along.clone().negate(), h.swing));
    } else if (h.leaf === 'slide') {
      // Slid two-thirds open along the positive face of the wall.
      const t = a1 + 0.03;
      place(doorLeaf('slide', lw, lh), s0 + 0.04 - lw * 0.65, t, along);
      g.add(wbox(s0 - lw * 0.75, s1, yb, yb + 0.05, a1 + 0.005, a1 + 0.05, 'chrome'));
    } else {
      const sw = h.swing;
      const hingeS = sw && sw.hinge === 1 ? s1 - 0.04 : s0 + 0.04;
      const toFree = sw && sw.hinge === 1 ? along.clone().negate() : along.clone();
      place(doorLeaf(h.leaf, lw, lh, h.color), hingeS, faceT(sw), swung(toFree, sw));
    }
    g.userData = { label: h.label, src: h.src };
    return g;
  }

  // -------------------------------------------------------------------------
  // Model registry
  // -------------------------------------------------------------------------

  function start() {
    const root = new THREE.Group();
    const nodes = [];
    const walls = [];
    const wallById = new Map();

    function reg(obj, meta) {
      Object.assign(obj.userData, meta);
      root.add(obj);
      nodes.push(obj);
      return obj;
    }

    // Places a builder's local footprint (w along x, d along z, front +z) into a world rect.
    function put(room, label, src, rect, facing, build, o = {}) {
      const [x0, z0, x1, z1] = rect;
      const along = facing === '+z' || facing === '-z';
      const w = along ? x1 - x0 : z1 - z0;
      const d = along ? z1 - z0 : x1 - x0;
      const inner = build(w, d);
      inner.rotation.y = ROT[facing];
      if (o.flip) inner.scale.x = -1;
      const holder = new THREE.Group();
      holder.add(inner);
      const floor = room ? cfg.rooms[room].floor : 0;
      holder.position.set((x0 + x1) / 2, (o.y ?? 0) + (room ? roomY(room) : 0), (z0 + z1) / 2);
      return reg(holder, {
        layer: o.layer ?? 'item', tall: !!o.tall, rooms: o.rooms ?? (room ? [room] : []), floors: o.floors ?? [floor],
        attach: o.attach ?? null, label, src, note: o.note ?? null,
      });
    }

    for (const def of WALLS) {
      const w = buildWall(def);
      walls.push(w);
      wallById.set(def.id, w);
      reg(w.group, { layer: 'wall', rooms: w.rooms, floors: [def.floor], wallId: def.id, ext: !!def.out });
    }

    for (const [id, r] of Object.entries(cfg.rooms)) {
      const fy = roomY(id);
      const g = new THREE.Group();
      const [y0, y1] = r.floor === 0 ? [fy - 0.12, fy] : [floorY[1] - 0.25, fy];
      for (const [a, b, c, d] of r.floors) g.add(box(a, y0, b, c, y1, d, ['cap', 'cap', r.mat, 'cap', 'cap', 'cap']));
      const [label, src] = cfg.flooring[id];
      reg(g, { layer: 'floor', rooms: [id], floors: [r.floor], label, src, goto: cfg.roomView[id], room: id });

      const base = new THREE.Group();
      const [ry0, ry1] = r.floor === 0 ? [fy - 0.45, fy - 0.12] : [floorY[1] - 0.63, floorY[1] - 0.25];
      const rects = r.base ?? [[r.rect[0] - 0.3, r.rect[1] - 0.3, r.rect[2] + 0.3, r.rect[3] + 0.3]];
      for (const [a, b, c, d] of rects) base.add(box(a, ry0, b, c, ry1, d, ['baseSide', 'baseSide', 'base', 'baseSide', 'baseSide', 'baseSide']));
      reg(base, { layer: 'base', rooms: [id], floors: [] });
    }

    function finish() {
      for (const n of nodes) {
        if (!n.userData.attach) continue;
        const w = wallById.get(n.userData.attach);
        if (!w) throw new Error(`Unknown wall ${n.userData.attach}`);
        w.items.push(n);
      }
      return { root, nodes, walls, wallById };
    }

    return { reg, put, finish };
  }

  return { wall, door, win, gap, start, roomY };
}

// ---------------------------------------------------------------------------
// Roof slabs and fences
// ---------------------------------------------------------------------------

// Slab whose underside runs from (xa, ya) to (xb, yb) in the x-y plane.
export function slopeX(xa, ya, xb, yb, za, zb, th, m) {
  const L = Math.hypot(xb - xa, yb - ya);
  const g = worldUV(new THREE.BoxGeometry(L, th, zb - za).translate(L / 2, th / 2, (za + zb) / 2));
  const s = mesh(g, m);
  s.position.set(xa, ya, 0);
  s.rotation.z = Math.atan2(yb - ya, xb - xa);
  return s;
}

// Slab whose underside runs from (za, ya) to (zb, yb) in the z-y plane (za < zb).
export function slopeZ(za, ya, zb, yb, xa, xb, th, m) {
  const L = Math.hypot(zb - za, yb - ya);
  const g = worldUV(new THREE.BoxGeometry(xb - xa, th, L).translate((xa + xb) / 2, th / 2, L / 2));
  const s = mesh(g, m);
  s.position.set(0, ya, za);
  s.rotation.x = -Math.atan2(yb - ya, zb - za);
  return s;
}

export function fenceRun(g, a, b, axis, at, h, m, postM, postEvery = 1.83, y0 = -0.14) {
  const [lo, hi] = a < b ? [a, b] : [b, a];
  if (axis === 'x') g.add(box(lo, y0, at - 0.03, hi, h, at + 0.03, m));
  else g.add(box(at - 0.03, y0, lo, at + 0.03, h, hi, m));
  for (let s = lo; s <= hi + 0.01; s += postEvery) {
    const p = Math.min(s, hi);
    if (axis === 'x') g.add(box(p - 0.05, y0, at - 0.05, p + 0.05, h + 0.08, at + 0.05, postM));
    else g.add(box(at - 0.05, y0, p - 0.05, at + 0.05, h + 0.08, p + 0.05, postM));
  }
}

// Hipped roof over a rectangle (the eave outline, overhang included), all four
// slopes at the same pitch, ridge along the longer side. Faces carry slope/eave
// UVs in metres so roof-tile textures run with the eaves.
export function hipRoof(x0, x1, z0, z1, eave, pitchDeg, m) {
  const t = Math.tan((pitchDeg * Math.PI) / 180);
  const alongZ = z1 - z0 >= x1 - x0;
  const half = (alongZ ? x1 - x0 : z1 - z0) / 2;
  const top = eave + half * t;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  let faces;
  if (alongZ) {
    const xm = (x0 + x1) / 2, ra = V(xm, top, z0 + half), rb = V(xm, top, z1 - half);
    faces = [[V(x0, eave, z0), V(x0, eave, z1), rb, ra], [V(x1, eave, z1), V(x1, eave, z0), ra, rb], [V(x1, eave, z0), V(x0, eave, z0), ra], [V(x0, eave, z1), V(x1, eave, z1), rb]];
  } else {
    const zm = (z0 + z1) / 2, ra = V(x0 + half, top, zm), rb = V(x1 - half, top, zm);
    faces = [[V(x1, eave, z0), V(x0, eave, z0), ra, rb], [V(x0, eave, z1), V(x1, eave, z1), rb, ra], [V(x0, eave, z0), V(x0, eave, z1), ra], [V(x1, eave, z1), V(x1, eave, z0), rb]];
  }
  const pos = [], nor = [], uv = [];
  for (const f of faces) {
    const tris = f.length === 4 ? [[f[0], f[1], f[2]], [f[0], f[2], f[3]]] : [f];
    const e = f[1].clone().sub(f[0]).normalize();
    let n = f[1].clone().sub(f[0]).cross(f[2].clone().sub(f[0])).normalize();
    const flip = n.y < 0;
    if (flip) n = n.negate();
    const s = n.clone().cross(e).normalize();
    if (s.y < 0) s.negate();
    for (let tri of tris) {
      if (flip) tri = [tri[0], tri[2], tri[1]];
      for (const p of tri) {
        const d = p.clone().sub(f[0]);
        pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); uv.push(d.dot(s), d.dot(e));
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const g = new THREE.Group();
  g.add(mesh(geo, m));
  return { g, top, ridge: alongZ ? [[(x0 + x1) / 2, z0 + half], [(x0 + x1) / 2, z1 - half]] : [[x0 + half, (z0 + z1) / 2], [x1 - half, (z0 + z1) / 2]] };
}
