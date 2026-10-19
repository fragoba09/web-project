// house.js - builds 16 Ellan Park from the Giraffe360 floor plans in the listing.
//
// Coordinates are metres. x runs from the front wall (x = 0) to the rear wall
// (x = 7.2); z runs from the garage-side gable (z = 0) to the party wall shared
// with the attached neighbour (z = 6.4). y is up; the ground floor is at y = 0.
// Room sizes come from the floor plan; anything the listing does not show
// (ceiling heights, roof pitch, plot size, furniture in unphotographed rooms)
// is filled in and tagged 'inferred'.
import * as THREE from 'three';
import { box, cyl, rod, prismX, prismZ, mesh, M, worldUV } from './kit.js';
import * as F from './furniture.js';

export const FLOOR_Y = [0, 2.65];
export const CUT = 0.32;
const T = 0.27;

// Room footprints. rect = interior; floors = slabs drawn to wall centre lines.
export const ROOMS = {
  porch: { floor: 0, rect: [-1.63, 0.27, 0, 1.64], floors: [[-1.765, 0.135, 0.135, 1.775]], mat: 'greyLam', label: [-0.82, 0.95], base: [[-2.2, -0.3, 0.4, 2.2]], fit: [-2.0, -0.1, 0.35, 2.0] },
  lounge: { floor: 0, rect: [0.27, 0.27, 3.25, 6.13], floors: [[0.135, 0.135, 3.325, 6.265], [-0.55, 3.5, 0.135, 5.5]], mat: 'oakGrey', label: [1.75, 3.15], base: [[-0.05, -0.05, 3.6, 6.45], [-0.95, 3.15, 0, 5.85]], fit: [-0.8, 0, 3.5, 6.4] },
  kitchen: { floor: 0, rect: [3.4, 0.27, 6.93, 6.13], floors: [[3.325, 1.25, 7.065, 6.265], [3.325, 0.135, 5.03, 1.25]], mat: 'oakGrey', label: [5.4, 4.6] },
  hall: { floor: 0, rect: [5.13, 0.27, 6.93, 1.2], floors: [[5.03, 0.135, 7.065, 1.25]], mat: 'oakGrey', label: [6.55, 0.72], base: [[3.2, -0.15, 7.45, 1.6]], fit: [3.3, 0, 7.3, 1.5] },
  garage: { floor: 0, rect: [0.62, -2.36, 5.88, 0], floors: [[0.485, -2.495, 6.015, 0.135]], mat: 'oakMid', label: [3.3, -1.25] },
  landing: { floor: 1, rect: [2.5, 0.27, 4.53, 2.75], floors: [[2.44, 0.135, 3.5, 2.815], [3.5, 1.26, 4.53, 2.815], [4.53, 2.05, 5.27, 2.815]], mat: 'carpet', label: [3.05, 2.1], base: [[2.14, -0.15, 3.5, 3.1], [3.5, 1.26, 5.57, 3.1]], fit: [2.2, 0, 5.4, 3.0] },
  bed1: { floor: 1, rect: [0.27, 2.88, 3.58, 6.13], floors: [[0.135, 2.815, 3.64, 6.265]], mat: 'oak', label: [1.6, 4.2] },
  bed2: { floor: 1, rect: [3.7, 2.88, 6.93, 6.13], floors: [[3.64, 2.815, 7.065, 6.265]], mat: 'oak', label: [5.3, 4.2] },
  bed3: { floor: 1, rect: [0.27, 0.27, 2.38, 2.75], floors: [[0.135, 0.135, 2.44, 2.815]], mat: 'oak', label: [1.3, 1.5] },
  bath: { floor: 1, rect: [4.65, 0.27, 6.93, 2.75], floors: [[4.53, 0.135, 7.065, 2.05], [5.27, 2.05, 7.065, 2.815]], mat: 'vinyl', label: [5.95, 1.55] },
};

export const ROOM_VIEW = { porch: 'porch', lounge: 'lounge', kitchen: 'kitchen', hall: 'hallway', garage: 'garage', landing: 'landing', bed1: 'bedroom-1', bed2: 'bedroom-2', bed3: 'bedroom-3', bath: 'bathroom' };

const FLOORING = {
  porch: ['Laminate wood-effect flooring', 'listing'],
  lounge: ['Laminate wood-effect flooring', 'listing'],
  kitchen: ['Laminate wood flooring', 'listing'],
  hall: ['Laminate flooring, assumed to run through from the kitchen', 'inferred'],
  garage: ['Laminate flooring', 'listing'],
  landing: ['Carpet, as seen on the stairs and landing', 'photo'],
  bed1: ['Laminate wood flooring', 'listing'],
  bed2: ['Laminate flooring', 'listing'],
  bed3: ['Wood-effect laminate under a patterned rug', 'photo'],
  bath: ['Tile-effect vinyl flooring', 'listing'],
};

const DEFAULT_FINISH = { porch: 'porch', lounge: 'lounge', kitchen: 'kitchen', hall: 'hall', garage: 'garage', landing: 'landing', cupboard: 'cupboard', bed1: 'bed1', bed2: 'bed2', bed3: 'bed3', bath: 'bath' };
const ALIAS = { cupboard: 'landing' };

function side(s) {
  if (s === 'ext' || s === 'party') return { room: null, mat: s };
  const [room, fin] = s.split(':');
  return { room: ALIAS[room] ?? room, mat: fin ?? DEFAULT_FINISH[room] };
}

const ROT = { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 };
const OUT = { '+x': [1, 0], '-x': [-1, 0], '+z': [0, 1], '-z': [0, -1] };

// ---------------------------------------------------------------------------
// Wall definitions
// ---------------------------------------------------------------------------

const WALLS = [];
function wall(id, floor, dir, at, span, sides, o = {}) {
  WALLS.push({
    id, floor, dir, at, span, sides,
    y: o.y ?? (floor === 0 ? [-0.12, 2.65] : [2.65, 5.15]),
    out: o.out ?? null, holes: o.holes ?? [], ends: o.ends ?? [], profile: o.profile ?? null, also: o.also ?? [],
  });
}
const door = (s0, s1, o = {}) => ({ kind: 'door', s: [s0, s1], leaf: 'int', label: 'Internal door', src: 'plan', ...o });
const win = (s0, s1, y0, y1, o = {}) => ({ kind: 'window', s: [s0, s1], y: [y0, y1], panes: 2, label: 'uPVC double-glazed window', src: 'listing', ...o });
const gap = (s0, s1, y1) => ({ kind: 'open', s: [s0, s1], y: [-1, y1] });

// Ground floor, main house
wall('gf-front-porch', 0, 'z', [0, T], [0, 1.91], { neg: 'porch', pos: 'lounge' }, {
  holes: [door(0.6, 1.4, { swing: { hinge: 0, side: 'neg', angle: 78 }, label: 'Inner door to the lounge', src: 'listing' })], ends: ['ext'],
});
wall('gf-front', 0, 'z', [0, T], [1.91, 6.4], { neg: 'ext', pos: 'lounge' }, { out: '-x', holes: [gap(3.45, 5.55, 2.1)] });
wall('gf-rear-hall', 0, 'z', [6.93, 7.2], [0, 1.26], { neg: 'hall', pos: 'ext' }, {
  out: '+x', ends: ['ext'], holes: [door(0.36, 1.14, { y: [0, 2.05], leaf: 'extGlazed', label: 'uPVC door to the garden', src: 'listing' })],
});
wall('gf-rear', 0, 'z', [6.93, 7.2], [1.26, 6.4], { neg: 'kitchen', pos: 'ext' }, {
  out: '+x',
  holes: [
    win(1.7, 3.45, 0.6, 2.05, { label: 'uPVC window overlooking the rear garden' }),
    win(3.95, 5.35, 0.6, 2.05, { label: 'uPVC window overlooking the rear garden' }),
  ],
});
wall('gf-gable-lounge', 0, 'x', [0, T], [0.27, 3.33], { neg: 'garage', pos: 'lounge' });
// Also shown in the hallway scene as the backdrop to the upper flight.
wall('gf-gable-kitchen', 0, 'x', [0, T], [3.33, 5.08], { neg: 'garage', pos: 'kitchen' }, { also: ['hall'] });
wall('gf-gable-hall', 0, 'x', [0, T], [5.08, 6.15], { neg: 'garage', pos: 'hall:diamond' });
wall('gf-gable-end', 0, 'x', [0, T], [6.15, 6.93], { neg: 'ext', pos: 'hall:diamond' }, { out: '-z' });
wall('gf-party-lounge', 0, 'x', [6.13, 6.4], [0.27, 3.33], { neg: 'lounge', pos: 'party' }, { out: '+z' });
wall('gf-party-kitchen', 0, 'x', [6.13, 6.4], [3.33, 6.93], { neg: 'kitchen', pos: 'party' }, { out: '+z' });
wall('gf-divide', 0, 'z', [3.25, 3.4], [0.27, 6.13], { neg: 'lounge', pos: 'kitchen' }, { holes: [gap(3.8, 6.13, 2.15)] });
wall('gf-hall', 0, 'x', [1.2, 1.3], [5.03, 6.93], { neg: 'hall', pos: 'kitchen' }, {
  holes: [door(6.14, 6.86, { leaf: 'slide', label: 'Sliding door to the rear hallway', src: 'listing' })],
});
// Stud wall enclosing the flight above the under-stairs nook (the sloped soffit seen in the kitchen photos).
wall('gf-stair-side', 0, 'x', [1.2, 1.3], [3.5, 5.03], { neg: 'hall', pos: 'kitchen' }, {
  profile: [[3.5, 2.17], [5.03, 0.75], [5.03, 2.65], [3.5, 2.65]],
});

// Porch
const PY = [-0.12, 2.35];
wall('porch-front', 0, 'z', [-1.9, -1.63], [0, 1.91], { neg: 'ext', pos: 'porch' }, {
  y: PY, out: '-x', ends: ['ext', 'ext'],
  holes: [door(0.55, 1.4, { y: [0, 2.05], leaf: 'extFront', label: 'uPVC front door', src: 'listing' })],
});
wall('porch-n', 0, 'x', [0, T], [-1.63, 0], { neg: 'ext', pos: 'porch' }, {
  y: PY, out: '-z', holes: [win(-1.5, -0.55, 0.95, 2.0, { panes: 1, label: 'Porch side window (one of a pair)' })],
});
wall('porch-s', 0, 'x', [1.64, 1.91], [-1.63, 0], { neg: 'porch', pos: 'ext' }, {
  y: PY, out: '+z', holes: [win(-1.5, -0.45, 0.95, 2.0, { panes: 1, label: 'Porch side window (one of a pair)' })],
});

// Lounge bay
const BY = [-0.12, 2.1];
wall('bay-front', 0, 'z', [-0.6, -0.5], [3.45, 5.55], { neg: 'ext', pos: 'lounge' }, {
  y: BY, out: '-x', ends: ['ext', 'ext'], holes: [win(3.5, 5.5, 0.7, 2.0, { panes: 3, transom: true, label: 'Feature bay window', src: 'listing' })],
});
wall('bay-n', 0, 'x', [3.45, 3.55], [-0.5, 0], { neg: 'ext', pos: 'lounge' }, {
  y: BY, out: '-z', holes: [win(-0.46, -0.04, 0.7, 2.0, { panes: 1, transom: true, label: 'Bay side light', src: 'photo' })],
});
wall('bay-s', 0, 'x', [5.45, 5.55], [-0.5, 0], { neg: 'lounge', pos: 'ext' }, {
  y: BY, out: '+z', holes: [win(-0.46, -0.04, 0.7, 2.0, { panes: 1, transom: true, label: 'Bay side light', src: 'photo' })],
});

// Garage / workshop (single storey, lean-to roof)
const GY = [-0.12, 2.5];
wall('gar-front', 0, 'z', [0.35, 0.62], [-2.63, 0], { neg: 'ext', pos: 'garage' }, {
  y: GY, out: '-x', ends: ['ext', 'ext'], holes: [{ kind: 'french', s: [-2.0, -0.45], y: [0, 2.05], label: 'Patio doors to the front aspect', src: 'listing' }],
});
wall('gar-rear', 0, 'z', [5.88, 6.15], [-2.63, 0], { neg: 'garage', pos: 'ext' }, {
  y: GY, out: '+x', ends: ['ext', 'ext'], holes: [door(-1.35, -0.5, { y: [0, 2.05], leaf: 'extGlazed', label: 'uPVC door from the rear garden', src: 'listing' })],
});
wall('gar-side', 0, 'x', [-2.63, -2.36], [0.62, 5.88], { neg: 'ext', pos: 'garage' }, { y: GY, out: '-z' });

// First floor
wall('ff-front-bed3', 1, 'z', [0, T], [0, 2.815], { neg: 'ext', pos: 'bed3' }, {
  out: '-x', ends: ['ext'], holes: [win(0.55, 1.45, 3.55, 4.7, { label: 'Front-aspect window', src: 'plan' })],
});
wall('ff-front-bed1', 1, 'z', [0, T], [2.815, 6.4], { neg: 'ext', pos: 'bed1:navy' }, {
  out: '-x', holes: [win(3.65, 5.3, 3.55, 4.7, { panes: 3, transom: true, label: 'Front-aspect window', src: 'plan' })],
});
wall('ff-rear-bath', 1, 'z', [6.93, 7.2], [0, 2.815], { neg: 'bath:bathTile', pos: 'ext' }, {
  out: '+x', ends: ['ext'], holes: [win(1.75, 2.55, 3.75, 4.7, { panes: 1, obscure: true, label: 'Opaque uPVC window', src: 'listing' })],
});
wall('ff-rear-bed2', 1, 'z', [6.93, 7.2], [2.815, 6.4], { neg: 'bed2', pos: 'ext' }, {
  out: '+x', holes: [win(3.9, 5.75, 3.55, 4.7, { panes: 3, transom: true, label: 'Window with rear garden views', src: 'listing' })],
});
wall('ff-gable-bed3', 1, 'x', [0, T], [0.27, 2.44], { neg: 'ext', pos: 'bed3' }, { out: '-z' });
wall('ff-gable-landing', 1, 'x', [0, T], [2.44, 4.59], { neg: 'ext', pos: 'landing:diamond' }, { out: '-z' });
wall('ff-gable-bath', 1, 'x', [0, T], [4.59, 6.93], { neg: 'ext', pos: 'bath:bathTeal' }, { out: '-z' });
wall('ff-party-bed1', 1, 'x', [6.13, 6.4], [0.27, 3.64], { neg: 'bed1:bed1Toile', pos: 'party' }, { out: '+z' });
wall('ff-party-bed2', 1, 'x', [6.13, 6.4], [3.64, 6.93], { neg: 'bed2', pos: 'party' }, { out: '+z' });
wall('ff-bed3', 1, 'z', [2.38, 2.5], [0.27, 2.75], { neg: 'bed3', pos: 'landing' }, {
  holes: [door(1.98, 2.7, { swing: { hinge: 0, side: 'neg', angle: 85 }, label: 'Door to bedroom 3' })],
});
wall('ff-corr-bed3', 1, 'x', [2.75, 2.88], [0.27, 2.44], { neg: 'bed3', pos: 'bed1' });
wall('ff-corr-landing1', 1, 'x', [2.75, 2.88], [2.44, 3.64], { neg: 'landing', pos: 'bed1' }, {
  holes: [door(2.68, 3.46, { swing: { hinge: 1, side: 'pos', angle: 85 }, label: 'Door to bedroom 1' })],
});
wall('ff-corr-landing2', 1, 'x', [2.75, 2.88], [3.64, 4.59], { neg: 'landing', pos: 'bed2' }, {
  holes: [door(3.75, 4.45, { swing: { hinge: 1, side: 'pos', angle: 85 }, label: 'Door to bedroom 2' })],
});
wall('ff-corr-cupboard', 1, 'x', [2.75, 2.88], [4.59, 5.27], { neg: 'cupboard', pos: 'bed2' });
wall('ff-corr-bath', 1, 'x', [2.75, 2.88], [5.27, 6.93], { neg: 'bath:bathTile', pos: 'bed2' });
wall('ff-bed12', 1, 'z', [3.58, 3.7], [2.88, 6.13], { neg: 'bed1', pos: 'bed2' });
wall('ff-bath', 1, 'z', [4.53, 4.65], [0.27, 2.1], { neg: 'landing', pos: 'bath' }, {
  holes: [door(1.3, 2.02, { swing: { hinge: 1, side: 'pos', angle: 80 }, label: 'Door to the bathroom' })],
});
wall('ff-cup-door', 1, 'z', [4.53, 4.65], [2.1, 2.75], { neg: 'landing', pos: 'cupboard' }, {
  holes: [door(2.14, 2.71, { y: [2.65, 4.55], leaf: 'plain', label: 'Landing cupboard door', src: 'plan' })],
});
wall('ff-cup-n', 1, 'x', [2.0, 2.1], [4.65, 5.32], { neg: 'bath', pos: 'cupboard' });
wall('ff-cup-e', 1, 'z', [5.22, 5.32], [2.1, 2.75], { neg: 'cupboard', pos: 'bath:bathTile' });

// ---------------------------------------------------------------------------
// Model assembly
// ---------------------------------------------------------------------------

export function buildModel() {
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
    const floor = room ? ROOMS[room].floor : 0;
    holder.position.set((x0 + x1) / 2, (o.y ?? 0) + (room ? FLOOR_Y[floor] : 0), (z0 + z1) / 2);
    return reg(holder, {
      layer: o.layer ?? 'item', tall: !!o.tall, rooms: o.rooms ?? (room ? [room] : []), floors: o.floors ?? [floor],
      attach: o.attach ?? null, label, src, note: o.note ?? null,
    });
  }

  // --- walls ---------------------------------------------------------------
  for (const def of WALLS) {
    const w = buildWall(def);
    walls.push(w);
    wallById.set(def.id, w);
    reg(w.group, { layer: 'wall', rooms: w.rooms, floors: [def.floor], wallId: def.id, ext: !!def.out });
  }

  // --- floors and room bases ----------------------------------------------
  for (const [id, r] of Object.entries(ROOMS)) {
    const fy = FLOOR_Y[r.floor];
    const g = new THREE.Group();
    const [y0, y1] = r.floor === 0 ? [-0.12, 0] : [2.4, fy];
    for (const [a, b, c, d] of r.floors) g.add(box(a, y0, b, c, y1, d, ['cap', 'cap', r.mat, 'cap', 'cap', 'cap']));
    const [label, src] = FLOORING[id];
    reg(g, { layer: 'floor', rooms: [id], floors: [r.floor], label, src, goto: ROOM_VIEW[id], room: id });

    const base = new THREE.Group();
    const [ry0, ry1] = r.floor === 0 ? [-0.45, -0.12] : [2.02, 2.4];
    const rects = r.base ?? [[r.rect[0] - 0.3, r.rect[1] - 0.3, r.rect[2] + 0.3, r.rect[3] + 0.3]];
    for (const [a, b, c, d] of rects) base.add(box(a, ry0, b, c, ry1, d, ['baseSide', 'baseSide', 'base', 'baseSide', 'baseSide', 'baseSide']));
    reg(base, { layer: 'base', rooms: [id], floors: [] });
  }

  buildStair(reg);
  buildRoofs(reg);
  buildSite(reg, put);
  buildNeighbour(reg);
  furnish(put);

  for (const n of nodes) {
    if (n.userData.attach) {
      const w = wallById.get(n.userData.attach);
      if (!w) throw new Error(`Unknown wall ${n.userData.attach}`);
      w.items.push(n);
    }
  }
  return { root, nodes, walls, wallById };
}

// ---------------------------------------------------------------------------
// Walls with openings
// ---------------------------------------------------------------------------

function buildWall(def) {
  const { dir, at: [a0, a1], span: [s0, s1], y: [y0, y1] } = def;
  const neg = side(def.sides.neg), pos = side(def.sides.pos);
  const rooms = [...new Set([neg.room, pos.room, ...def.also].filter(Boolean))];
  const fy = FLOOR_Y[def.floor];
  const group = new THREE.Group();
  const full = new THREE.Group(); full.name = 'full';
  const cut = new THREE.Group(); cut.name = 'cut';
  group.add(full, cut);

  const extSide = neg.mat === 'ext' ? 'neg' : pos.mat === 'ext' ? 'pos' : null;

  // Box in wall space: s along the wall, t across it (absolute), y up.
  const wbox = (sa, sb, ya, yb, ta, tb, m) => (dir === 'z' ? box(ta, ya, sa, tb, yb, sb, m) : box(sa, ya, ta, sb, yb, tb, m));
  const faceMats = (endA, endB) => (dir === 'z'
    ? [pos.mat, neg.mat, 'cap', 'cap', endB, endA]
    : [endB, endA, 'cap', 'cap', pos.mat, neg.mat]);

  if (def.profile) {
    const mid = (a0 + a1) / 2;
    const pts = def.profile;
    full.add(prismZ(pts, a0, mid, [neg.mat, 'white']));
    full.add(prismZ(pts, mid, a1, [pos.mat, 'white']));
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

  for (const h of holes) {
    if (h.kind === 'window') full.add(windowFrame(h, wbox, frameT, extSide, a0, a1, innerFace));
    else if (h.kind === 'door' || h.kind === 'french') full.add(doorway(h, def, wbox, frameT, a0, a1, fy));
  }
  return { def, group, full, cut, rooms, items: [], isFull: true };
}

function windowFrame(h, wbox, [ta, tb], extSide, a0, a1, innerFace) {
  const g = new THREE.Group();
  const [s0, s1] = h.s, y0 = h.ya, y1 = h.yb, fw = 0.06;
  const tm = (ta + tb) / 2;
  g.add(wbox(s0, s0 + fw, y0, y1, ta, tb, 'upvc'), wbox(s1 - fw, s1, y0, y1, ta, tb, 'upvc'));
  g.add(wbox(s0, s1, y0, y0 + fw, ta, tb, 'upvc'), wbox(s0, s1, y1 - fw, y1, ta, tb, 'upvc'));
  const panes = h.panes ?? 2;
  for (let i = 1; i < panes; i++) {
    const s = s0 + (i * (s1 - s0)) / panes;
    g.add(wbox(s - 0.03, s + 0.03, y0, y1, ta, tb, 'upvc'));
  }
  if (h.transom) {
    const y = y1 - (y1 - y0) * 0.3;
    g.add(wbox(s0, s1, y - 0.025, y + 0.025, ta, tb, 'upvc'));
  }
  g.add(wbox(s0 + fw, s1 - fw, y0 + fw, y1 - fw, tm - 0.006, tm + 0.006, h.obscure ? 'obscure' : 'glass'));
  if (extSide) {
    const [oa, ob] = extSide === 'neg' ? [a0 - 0.06, a0 + 0.06] : [a1 - 0.06, a1 + 0.06];
    g.add(wbox(s0 - 0.05, s1 + 0.05, y0 - 0.05, y0, oa, ob, 'upvc'));
    const [ia, ib] = extSide === 'neg' ? [tb, innerFace + 0.03] : [innerFace - 0.03, ta];
    g.add(wbox(s0 - 0.04, s1 + 0.04, y0 - 0.025, y0, ia, ib, 'white'));
  }
  g.userData = { label: h.label, src: h.src };
  return g;
}

function doorLeaf(kind, w, hgt) {
  const g = new THREE.Group();
  const t = 0.022;
  if (kind === 'extFront' || kind === 'extGlazed' || kind === 'french') {
    g.add(box(0, 0, -t, w, hgt, t, 'upvc'));
    if (kind === 'extFront') {
      g.add(box(w * 0.3, hgt * 0.55, -t - 0.003, w * 0.7, hgt * 0.85, t + 0.003, 'obscure'));
      g.add(box(w * 0.33, hgt * 0.38, -t - 0.006, w * 0.67, hgt * 0.42, t + 0.006, '#c9c9c4'));
    } else {
      const top = kind === 'french' ? 0.12 : hgt * 0.45;
      g.add(box(0.09, top, -t - 0.003, w - 0.09, hgt - 0.09, t + 0.003, kind === 'french' ? 'glass' : 'obscure'));
    }
    g.add(box(w - 0.1, hgt * 0.47, t, w - 0.05, hgt * 0.5, t + 0.05, 'chrome'));
    return g;
  }
  g.add(box(0, 0, -t, w, hgt, t, 'white'));
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

function doorway(h, def, wbox, [ta, tb], a0, a1, fy) {
  const g = new THREE.Group();
  const [s0, s1] = h.s;
  const yb = h.yb;
  const ext = h.leaf?.startsWith('ext') || h.kind === 'french';
  const fm = ext ? 'upvc' : 'white';
  const [fa, fb] = ext ? [ta, tb] : [a0 - 0.012, a1 + 0.012];
  g.add(wbox(s0, s0 + 0.04, fy, yb, fa, fb, fm), wbox(s1 - 0.04, s1, fy, yb, fa, fb, fm), wbox(s0, s1, yb - 0.04, yb, fa, fb, fm));

  const dir = def.dir;
  const along = dir === 'z' ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
  const perp = dir === 'z' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
  const place = (leaf, s, t, heading) => {
    const p = new THREE.Group();
    p.add(leaf);
    p.position.copy(along.clone().multiplyScalar(s).add(perp.clone().multiplyScalar(t))).setY(fy);
    p.rotation.y = Math.atan2(-heading.z, heading.x);
    g.add(p);
  };

  const lw = s1 - s0 - 0.08, lh = yb - fy - 0.05;
  if (h.kind === 'french') {
    const half = lw / 2;
    place(doorLeaf('french', half, lh), s0 + 0.04, (ta + tb) / 2, along);
    place(doorLeaf('french', half, lh), s1 - 0.04, (ta + tb) / 2, along.clone().negate());
  } else if (h.leaf === 'slide') {
    // Slid two-thirds open along the kitchen face of the wall.
    const t = a1 + 0.03;
    place(doorLeaf('slide', lw, lh), s0 + 0.04 - lw * 0.65, t, along);
    g.add(wbox(s0 - lw * 0.75, s1, yb, yb + 0.05, a1 + 0.005, a1 + 0.05, 'chrome'));
  } else {
    const sw = h.swing;
    const hingeS = sw && sw.hinge === 1 ? s1 - 0.04 : s0 + 0.04;
    const toFree = sw && sw.hinge === 1 ? along.clone().negate() : along.clone();
    let t = (ta + tb) / 2;
    let heading = toFree;
    if (sw) {
      const openDir = perp.clone().multiplyScalar(sw.side === 'neg' ? -1 : 1);
      t = sw.side === 'neg' ? a0 - 0.022 : a1 + 0.022;
      const a = (sw.angle * Math.PI) / 180;
      heading = toFree.clone().multiplyScalar(Math.cos(a)).add(openDir.multiplyScalar(Math.sin(a)));
    }
    place(doorLeaf(h.leaf, lw, lh), hingeS, t, heading);
  }
  g.userData = { label: h.label, src: h.src };
  return g;
}

// ---------------------------------------------------------------------------
// Stairs: 13 risers from the rear hallway, climbing towards the front.
// ---------------------------------------------------------------------------

function buildStair(reg) {
  const start = 6.14, going = 0.22, rise = FLOOR_Y[1] / 13;
  const z0 = 0.27, z1 = 1.2;
  const lower = new THREE.Group(), upper = new THREE.Group();
  const skin = ['carpet', 'white', 'carpet', 'white', 'white', 'white'];
  for (let i = 1; i <= 12; i++) {
    const xa = start - i * going, xb = start - (i - 1) * going;
    const top = i * rise;
    const bottom = (xa + xb) / 2 >= 5.03 ? 0 : top - 0.34;
    (i <= 8 ? lower : upper).add(box(xa, bottom, z0, xb, top, z1, skin));
  }
  // Painted soffit under the floating part of the flight.
  const sx = 5.03, sy = 0.75, ex = 3.5, ey = 2.17;
  const L = Math.hypot(sx - ex, ey - sy);
  const soffit = new THREE.Mesh(worldUV(new THREE.BoxGeometry(L, 0.03, z1 - z0).translate(L / 2, -0.015, (z0 + z1) / 2)), M('white'));
  soffit.position.set(sx, sy, 0);
  soffit.rotation.z = Math.PI - Math.atan2(ey - sy, sx - ex);
  soffit.receiveShadow = true;
  lower.add(soffit);
  const meta = { layer: 'item', floors: [0, 1], label: 'Stairs to the first floor', src: 'listing', note: 'Drawn as a straight 13-riser flight rising towards the front, which fits the stair positions and the low-headroom zone on both floor plans.' };
  reg(lower, { ...meta, rooms: ['hall', 'kitchen'] });
  reg(upper, { ...meta, rooms: ['hall', 'kitchen', 'landing'] });
  const rail = new THREE.Group();
  rail.add(rod([6.05, 0.98, 0.31], [4.36, 2.55, 0.31], 0.025, 'oakWood'));
  reg(rail, { layer: 'item', floors: [0, 1], rooms: ['hall', 'kitchen'], attach: 'gf-gable-hall', label: 'Stair handrail', src: 'inferred' });
}

// ---------------------------------------------------------------------------
// Roofs: main dual-pitch roof (pitch inferred at 32 degrees), gabled porch,
// lean-to over the garage and a small lead roof over the bay.
// ---------------------------------------------------------------------------

// Slab whose underside runs from (xa, ya) to (xb, yb) in the x-y plane.
function slopeX(xa, ya, xb, yb, za, zb, th, m) {
  const L = Math.hypot(xb - xa, yb - ya);
  const g = worldUV(new THREE.BoxGeometry(L, th, zb - za).translate(L / 2, th / 2, (za + zb) / 2));
  const s = mesh(g, m);
  s.position.set(xa, ya, 0);
  s.rotation.z = Math.atan2(yb - ya, xb - xa);
  return s;
}

// Slab whose underside runs from (za, ya) to (zb, yb) in the z-y plane (za < zb).
function slopeZ(za, ya, zb, yb, xa, xb, th, m) {
  const L = Math.hypot(zb - za, yb - ya);
  const g = worldUV(new THREE.BoxGeometry(xb - xa, th, L).translate((xa + xb) / 2, th / 2, L / 2));
  const s = mesh(g, m);
  s.position.set(0, ya, za);
  s.rotation.x = -Math.atan2(yb - ya, zb - za);
  return s;
}

const PITCH = Math.tan((32 * Math.PI) / 180);
const EAVES = 5.15, RIDGE = EAVES + 3.6 * PITCH;

function mainRoof(za, zb, mats) {
  const { roof, wallM } = mats;
  const g = new THREE.Group();
  const lowY = EAVES - 0.3 * PITCH;
  g.add(slopeX(-0.3, lowY, 3.6, RIDGE, za, zb, 0.12, roof));
  g.add(slopeX(3.6, RIDGE, 7.5, lowY, za, zb, 0.12, roof));
  g.add(box(3.47, RIDGE + 0.02, za, 3.73, RIDGE + 0.17, zb, '#44484e'));
  for (const [fa, fb, ga, gb] of [[-0.33, -0.3, -0.46, -0.33], [7.5, 7.53, 7.53, 7.66]]) {
    g.add(box(fa, lowY - 0.18, za, fb, lowY + 0.02, zb, 'upvc'));
    g.add(box(ga, lowY - 0.17, za, gb, lowY - 0.07, zb, 'upvc'));
  }
  g.add(box(-0.3, lowY - 0.03, za, 0, lowY, zb, 'upvc'), box(7.2, lowY - 0.03, za, 7.5, lowY, zb, 'upvc'));
  return { g, wallM };
}

function porchRoof(za, zb, mats = {}) {
  const roof = mats.roof ?? 'roofZ';
  const wallM = mats.wallM ?? 'ext';
  const g = new THREE.Group();
  const mid = (za + zb) / 2, eave = 2.35, pitch = 0.7, ridge = eave + (mid - za) * pitch;
  const lo = eave - 0.15 * pitch;
  g.add(slopeZ(za - 0.15, lo, mid, ridge, -2.05, 0, 0.1, roof));
  g.add(slopeZ(mid, ridge, zb + 0.15, lo, -2.05, 0, 0.1, roof));
  g.add(box(-2.05, ridge + 0.01, mid - 0.1, 0, ridge + 0.13, mid + 0.1, '#44484e'));
  g.add(prismX([[za, eave], [zb, eave], [mid, ridge]], -1.9, -1.63, wallM));
  g.add(slopeZ(za - 0.15, lo - 0.14, mid, ridge - 0.14, -2.08, -2.05, 0.2, 'upvc'));
  g.add(slopeZ(mid, ridge - 0.14, zb + 0.15, lo - 0.14, -2.08, -2.05, 0.2, 'upvc'));
  return g;
}

function buildRoofs(reg) {
  // Main roof over this half (the neighbour's half is built with the neighbour).
  const { g } = mainRoof(-0.3, 6.4, { roof: 'roof' });
  g.add(prismZ([[0, EAVES], [7.2, EAVES], [3.6, RIDGE]], 0, T, 'ext'));
  g.add(slopeX(-0.3, EAVES - 0.3 * PITCH - 0.12, 3.6, RIDGE - 0.12, -0.33, -0.3, 0.2, 'upvc'));
  g.add(slopeX(3.6, RIDGE - 0.12, 7.5, EAVES - 0.3 * PITCH - 0.12, -0.33, -0.3, 0.2, 'upvc'));
  // Chimney stack on the party wall, with pots and the TV aerial seen in the photos.
  g.add(box(2.7, 6.6, 5.95, 3.4, 8.05, 6.85, 'ext'));
  g.add(box(2.65, 8.05, 5.9, 3.45, 8.13, 6.9, 'concrete'));
  g.add(cyl(2.9, 8.13, 6.18, 0.1, 0.35, '#b5653f'), cyl(3.2, 8.13, 6.62, 0.1, 0.35, '#b5653f'));
  g.add(rod([3.05, 8.1, 6.4], [3.05, 9.15, 6.4], 0.018, '#9aa0a6'));
  for (const y of [8.75, 8.95]) g.add(rod([3.05, y, 6.0], [3.05, y, 6.8], 0.01, '#9aa0a6'));
  g.add(rod([2.7, 9.05, 6.4], [3.4, 9.05, 6.4], 0.01, '#9aa0a6'));
  for (const [x, z] of [[7.62, 0.2], [7.62, 3.62], [-0.42, 6.25]]) g.add(rod([x, -0.12, z], [x, 4.85, z], 0.04, 'upvc'));
  reg(g, { layer: 'roof', rooms: [], floors: [1], label: 'Pitched tiled roof (pitch estimated at 32°)', src: 'photo' });

  const porch = porchRoof(0, 1.91);
  reg(porch, { layer: 'roof', rooms: [], floors: [0], label: 'Gabled porch roof', src: 'photo' });

  // Lean-to over the garage, rising to meet the house gable.
  const gar = new THREE.Group();
  const gLow = 2.5, gHigh = 3.25, gPitch = (gHigh - gLow) / 2.63;
  gar.add(slopeZ(-2.83, gLow - 0.2 * gPitch, 0, gHigh, 0.2, 6.3, 0.1, 'roofZ'));
  for (const [xa, xb] of [[0.35, 0.62], [5.88, 6.15]]) gar.add(prismX([[-2.63, gLow], [0, gLow], [0, gHigh]], xa, xb, 'ext'));
  gar.add(box(0.2, gLow - 0.2, -2.86, 6.3, gLow - 0.05, -2.83, 'upvc'));
  gar.add(box(0.2, gLow - 0.19, -2.98, 6.3, gLow - 0.09, -2.86, 'upvc'));
  gar.add(box(0.2, gHigh - 0.05, 0, 6.3, gHigh + 0.08, 0.05, 'lead'));
  for (const x of [0.17, 6.3]) gar.add(slopeZ(-2.83, gLow - 0.2 * gPitch - 0.12, 0, gHigh - 0.12, x, x + 0.03, 0.2, 'upvc'));
  reg(gar, { layer: 'roof', rooms: [], floors: [0], label: 'Lean-to roof over the garage/workshop', src: 'photo' });

  const bay = new THREE.Group();
  bay.add(prismZ([[-0.7, 2.08], [0, 2.08], [0, 2.42]], 3.38, 5.62, 'lead'));
  reg(bay, { layer: 'roof', rooms: [], floors: [0], label: 'Bay window roof', src: 'photo' });

  const steps = new THREE.Group();
  steps.add(box(-2.3, -0.15, 0.45, -1.9, -0.02, 1.5, 'concrete'));
  steps.add(box(7.2, -0.15, 0.3, 7.6, -0.02, 1.2, 'concrete'));
  steps.add(box(6.15, -0.15, -1.45, 6.5, -0.02, -0.4, 'concrete'));
  reg(steps, { layer: 'site', rooms: [], floors: [0, 1] });
}

// ---------------------------------------------------------------------------
// Plot: driveway and front garden, enclosed rear garden. Boundaries and
// garden sizes are estimated from the photos.
// ---------------------------------------------------------------------------

function fenceRun(g, a, b, axis, at, h, m, postM, postEvery = 1.83) {
  const [lo, hi] = a < b ? [a, b] : [b, a];
  if (axis === 'x') g.add(box(lo, -0.14, at - 0.03, hi, h, at + 0.03, m));
  else g.add(box(at - 0.03, -0.14, lo, at + 0.03, h, hi, m));
  for (let s = lo; s <= hi + 0.01; s += postEvery) {
    const p = Math.min(s, hi);
    if (axis === 'x') g.add(box(p - 0.05, -0.14, at - 0.05, p + 0.05, h + 0.08, at + 0.05, postM));
    else g.add(box(at - 0.05, -0.14, p - 0.05, at + 0.05, h + 0.08, p + 0.05, postM));
  }
}

function buildSite(reg, put) {
  const ground = new THREE.Group();
  ground.add(box(-13, -0.8, -5.2, 19.6, -0.16, 13.6, ['board', 'board', 'lawnPlain', 'board', 'board', 'board']));
  ground.add(box(-13, -0.16, -5.2, -8.2, -0.145, 13.6, 'road'));
  ground.add(box(-8.2, -0.16, -5.2, -8.0, -0.09, 13.6, 'concrete'));
  // Front: tarmac drive to the garage, concrete pad by the porch, lawn in front of the bay.
  ground.add(box(-8.0, -0.16, -3.6, 0.35, -0.13, -0.2, 'tarmac'));
  ground.add(box(-8.0, -0.16, -0.2, -1.9, -0.13, 2.5, 'concrete'));
  ground.add(box(-1.9, -0.16, 1.91, -0.6, -0.13, 2.5, 'concrete'));
  ground.add(box(-8.0, -0.16, 2.5, -0.7, -0.135, 6.37, 'lawn'));
  ground.add(box(-0.7, -0.16, 2.5, 0, -0.13, 6.37, 'gravel'));
  // Rear: paved patio, path to the shed, lawn and planted borders.
  ground.add(box(6.15, -0.16, -3.57, 10.2, -0.13, 0, 'flags'));
  ground.add(box(7.2, -0.16, 0, 10.2, -0.13, 6.37, 'flags'));
  ground.add(box(10.2, -0.16, -3.3, 16.6, -0.13, -2.45, 'flags'));
  ground.add(box(10.2, -0.16, -2.45, 17.95, -0.135, 5.9, 'lawn'));
  ground.add(box(10.2, -0.16, -3.57, 18.45, -0.13, -3.3, 'soil'));
  ground.add(box(16.6, -0.16, -3.3, 18.45, -0.13, -2.45, 'soil'));
  ground.add(box(10.2, -0.16, 5.9, 18.45, -0.13, 6.37, 'soil'));
  ground.add(box(17.95, -0.16, -2.45, 18.45, -0.13, 5.9, 'soil'));
  // Neighbour's plot, kept plain.
  ground.add(box(-8.0, -0.16, 10.0, -1.9, -0.13, 13.6, 'concrete'));
  ground.add(box(7.2, -0.16, 6.43, 9.6, -0.13, 12.8, 'concrete'));
  reg(ground, { layer: 'site', rooms: [], floors: [0, 1] });

  const bounds = new THREE.Group();
  // Tall conifer hedge along the drive, with a slightly uneven top.
  const hh = [2.1, 2.22, 2.02, 2.18, 2.08, 2.25, 2.12, 2.05];
  const hx = (6.15 + 8.0) / hh.length;
  hh.forEach((h, i) => bounds.add(box(-8.0 + i * hx, -0.14, -4.45 + (i % 2) * 0.06, -8.0 + (i + 1) * hx, h, -3.6, 'hedge')));
  fenceRun(bounds, -8.0, -0.05, 'x', 6.4, 1.45, 'fenceTimber', '#9b7a50');
  fenceRun(bounds, 3.7, 6.37, 'z', -7.95, 1.15, 'fenceTimber', '#9b7a50');
  fenceRun(bounds, 7.2, 18.5, 'x', 6.4, 1.8, 'fenceGreen', 'post');
  fenceRun(bounds, 6.15, 18.5, 'x', -3.6, 1.8, 'fenceGreen', 'post');
  fenceRun(bounds, -3.6, 6.4, 'z', 18.5, 1.8, 'fenceGreen', 'post');
  bounds.add(box(0.38, -0.14, -3.6, 0.44, 1.8, -2.63, 'fenceTimber'));
  reg(bounds, { layer: 'site', tall: true, rooms: [], floors: [0, 1], label: 'Boundary hedge and fencing', src: 'photo', note: 'Enclosed rear garden described as suitable for children and pets.' });

  const site = { layer: 'site', floors: [0, 1], y: -0.13 };
  const tall = { ...site, tall: true };
  put(null, 'Ornamental tree in the front lawn', 'photo', [-6.6, 4.7, -5.4, 5.9], '+z', () => F.tree({ h: 3.4, r: 1.25 }), tall);
  put(null, 'Wheelie bin', 'photo', [-1.5, 1.95, -0.9, 2.45], '-x', (w, d) => F.wheelieBin(w, d), site);
  put(null, 'Car, shown for scale on the driveway', 'inferred', [-7.2, -3.25, -2.6, -1.45], '+z', (w, d) => F.car(w, d), { ...tall, note: 'The listing mentions a driveway but not how many cars it takes. The tarmac and concrete areas look wide enough for two.' });
  put(null, 'Garden shed', 'photo', [16.6, -3.5, 18.3, -1.7], '-x', (w, d) => F.shed(w, d), tall);
  put(null, 'Rattan patio table', 'photo', [8.25, 2.55, 9.15, 3.45], '+z', (w) => F.patioTable(w), site);
  const chairs = [[[8.4, 1.75, 9.0, 2.37], '+z'], [[8.4, 3.63, 9.0, 4.25], '-z'], [[7.43, 2.7, 8.05, 3.3], '+x'], [[9.35, 2.7, 9.97, 3.3], '-x']];
  for (const [r, f] of chairs) put(null, 'Rattan patio chair', 'photo', r, f, (w, d) => F.tubChair(w, d), site);
  put(null, 'Timber garden bench', 'photo', [7.7, 5.82, 9.3, 6.32], '-z', (w, d) => F.gardenBench(w, d), site);
  put(null, 'Potted plant', 'photo', [9.6, 1.3, 10.0, 1.7], '+z', () => F.plant({ pot: '#2f62b5', h: 0.95, r: 0.2 }), site);
  put(null, 'Raised timber planter', 'photo', [6.4, -3.52, 8.0, -2.97], '+z', (w, d) => F.planter(w, d), site);
  const shrubs = [[11.5, -3.45], [13.6, -3.45], [15.4, 6.15], [12.2, 6.15], [18.2, 1.0], [18.2, 3.8], [-4.0, 6.1]];
  shrubs.forEach(([x, z], i) => put(null, 'Border planting', 'photo', [x - 0.3, z - 0.3, x + 0.3, z + 0.3], '+z', () => F.shrub({ r: 0.32, seed: i + 2 }), site));

  // Bunting along the party fence, as in the garden photos.
  const bunting = new THREE.Group();
  const colors = ['#d9534f', '#f0ad4e', '#5bc0de', '#5cb85c', '#9b6bd1', '#f7f3e8'];
  const pts = [];
  for (let x = 7.6; x <= 16.01; x += 0.35) {
    const t = ((x - 7.6) % 2.8) / 2.8;
    pts.push(new THREE.Vector3(x, 2.15 - Math.sin(t * Math.PI) * 0.25, 6.3));
  }
  for (let i = 0; i < pts.length - 1; i++) bunting.add(rod(pts[i], pts[i + 1], 0.005, '#f7f3e8', 4));
  pts.forEach((p, i) => {
    const tri = new THREE.Shape([new THREE.Vector2(-0.09, 0), new THREE.Vector2(0.09, 0), new THREE.Vector2(0, -0.2)]);
    const geo = new THREE.ShapeGeometry(tri);
    const m = new THREE.Mesh(geo, M(colors[i % colors.length]));
    m.material.side = THREE.DoubleSide;
    m.position.copy(p);
    m.castShadow = true;
    bunting.add(m);
  });
  reg(bunting, { layer: 'site', tall: true, rooms: [], floors: [0, 1], label: 'Garden bunting', src: 'photo' });
}

// ---------------------------------------------------------------------------
// The attached neighbour, simplified and mirrored about the party wall.
// ---------------------------------------------------------------------------

function buildNeighbour(reg) {
  const g = new THREE.Group();
  const zA = 6.4, zB = 12.8;
  g.add(box(0, -0.12, zA, 7.2, EAVES, zB, 'neighbour'));
  g.add(prismZ([[0, EAVES], [7.2, EAVES], [3.6, RIDGE]], zB - T, zB, 'neighbour'));
  g.add(mainRoof(zA, zB + 0.3, { roof: 'roofNeighbour' }).g);
  g.add(box(-1.9, -0.12, 10.89, 0, 2.35, zB, 'neighbour'));
  g.add(porchRoof(10.89, zB, { roof: 'roofNeighbour', wallM: 'neighbour' }));
  const decal = (face, sa, sb, ya, yb) => {
    const out = face === 'front' ? [-0.03, 0] : [7.2, 7.23];
    const glass = face === 'front' ? [-0.036, -0.03] : [7.23, 7.236];
    g.add(box(out[0], ya, sa, out[1], yb, sb, 'upvc'));
    g.add(box(glass[0], ya + 0.06, sa + 0.06, glass[1], yb - 0.06, sb - 0.06, 'blackGlass'));
  };
  decal('front', 7.25, 9.35, 0.85, 2.05);
  decal('front', 7.5, 9.15, 3.55, 4.7);
  decal('front', 11.35, 12.25, 3.55, 4.7);
  decal('rear', 9.35, 11.1, 0.6, 2.05);
  decal('rear', 7.45, 8.85, 0.6, 2.05);
  decal('rear', 11.66, 12.44, 0, 2.05);
  decal('rear', 7.05, 8.9, 3.55, 4.7);
  decal('rear', 10.25, 11.05, 3.75, 4.7);
  g.add(box(-1.936, 0, 11.35, -1.9, 2.05, 12.2, 'upvc'));
  reg(g, { layer: 'neighbour', rooms: [], floors: [], label: 'Attached neighbouring home (not part of the sale)', src: 'photo' });
}

// ---------------------------------------------------------------------------
// Furnishings. Rooms that were photographed follow the photos; the garage and
// a few details are inferred and tagged as such.
// ---------------------------------------------------------------------------

function furnish(put) {
  const P = 'photo', L = 'listing', I = 'inferred', PL = 'plan';
  const onWall = (attach, y, extra = {}) => ({ attach, y, ...extra });

  // Porch -------------------------------------------------------------------
  put('porch', 'Doormat', I, [-1.6, 0.6, -1.1, 1.35], '+x', (w, d) => F.rug(w, d, { c: '#6b5a45' }));
  put('porch', 'Shoe rack', I, [-0.8, 1.3, -0.15, 1.62], '-z', (w, d) => F.shoeRack(w, d));
  put('porch', 'Coat hooks', L, [-1.35, 1.64, -0.55, 1.64], '-z', (w) => F.coatHooks(w), onWall('porch-s', 2.08));
  put('porch', 'Wall-mounted light', L, [0, 1.5, 0, 1.5], '-x', () => F.wallLight(), onWall('gf-front-porch', 1.95));
  put('porch', 'Photo frame on the sill', P, [-1.25, 0.14, -1.05, 0.22], '+z', () => F.picture(0.2, 0.25, { art: '#7d8a99' }), onWall('porch-n', 0.95));
  put('porch', 'Plant on the sill', P, [-0.8, 0.12, -0.62, 0.3], '+z', () => F.plant({ h: 0.3, r: 0.06, pot: '#d8c6d2' }), onWall('porch-n', 0.95));

  // Lounge ------------------------------------------------------------------
  put('lounge', 'TV on a pine media unit', P, [0.27, 1.75, 0.72, 2.95], '+x', (w, d) => F.tvUnit(w, d));
  put('lounge', 'Blush velvet two-seater sofa', P, [2.35, 1.75, 3.25, 3.45], '-x', (w, d) => F.sofa(w, d, { body: '#c9aba2', pillows: ['#e9c6c4', '#d9b8b1'] }));
  put('lounge', 'Floral two-seater sofa', P, [0.95, 4.45, 2.45, 5.35], '-z', (w, d) => F.sofa(w, d, { body: 'floralSofa', pillows: ['#e7c3c6', '#d8b3ad'] }));
  put('lounge', 'Glass coffee table', P, [1.15, 2.55, 1.85, 3.65], '+x', (w, d) => F.table(w, d, { h: 0.45, glass: true, leg: '#d9d6cf', shelf: true }));
  put('lounge', 'Grey rug', P, [0.85, 1.95, 2.25, 4.45], '+x', (w, d) => F.rug(w, d));
  put('lounge', 'Low bookcase', P, [2.95, 0.88, 3.25, 1.7], '-x', (w, d) => F.bookcase(w, d, { h: 1.0, shelves: 3 }));
  put('lounge', 'Floor lamp', P, [2.92, 0.38, 3.18, 0.64], '-x', () => F.lampFloor());
  put('lounge', 'Digital piano', P, [2.86, 4.85, 3.22, 6.0], '-x', (w, d) => F.piano(w, d));
  put('lounge', 'Piano stool', I, [2.48, 5.2, 2.8, 5.6], '-x', (w, d) => F.stool(w, d, { c: '#2a2d30' }));
  put('lounge', 'Chimney breast with floral wallpaper', P, [1.0, 5.78, 2.4, 6.13], '-z', (w, d) => F.chimneyBreast(w, d, { recess: 0.72, recessH: 1.0 }), { attach: 'gf-party-lounge' });
  put('lounge', 'Log-burning stove', L, [1.45, 5.72, 1.95, 6.1], '-z', (w, d) => F.stove(w, d));
  put('lounge', 'Tiled hearth', L, [1.25, 5.4, 2.15, 6.1], '-z', (w, d) => F.hearth(w, d));
  put('lounge', 'Octagonal mirror', P, [1.35, 5.78, 2.05, 5.78], '-z', (w) => F.octMirror(w), onWall('gf-party-lounge', 1.35));
  put('lounge', 'White chest of drawers', P, [0.32, 5.66, 0.94, 6.13], '-z', (w, d) => F.chest(w, d, { h: 0.86, rows: 3 }));
  put('lounge', 'Globe', P, [0.5, 5.8, 0.75, 6.05], '-z', () => F.globe(), { y: 0.86 });
  put('lounge', 'Venetian blind', P, [-0.48, 3.52, -0.48, 5.48], '+x', (w) => F.blind(w, 1.3, { drop: 0.55 }), onWall('bay-front', 0.7));
  put('lounge', 'Grey curtains', P, [0.3, 3.45, 0.3, 5.55], '+x', (w) => F.curtains(w, 2.12, { c: '#a3a1a3' }), onWall('gf-front', 0));
  put('lounge', 'Radiator in the bay', I, [-0.5, 3.9, -0.4, 5.1], '+x', (w) => F.radiator(w, 0, { h: 0.45 }), onWall('bay-front', 0));
  put('lounge', 'Framed print', P, [3.25, 2.2, 3.25, 3.0], '-x', (w) => F.picture(w, 0.55, { art: '#c4b8a6' }), onWall('gf-divide', 1.35));

  // Dining kitchen ----------------------------------------------------------
  put('kitchen', 'Cream base units', L, [3.4, 0.27, 4.0, 1.98], '+x', (w, d) => F.baseUnits(w, d, { drawers: [3] }));
  put('kitchen', 'Kenwood electric range cooker: five-ring hob, double oven', L, [3.4, 1.98, 4.05, 2.92], '+x', (w, d) => F.rangeCooker(w, d));
  put('kitchen', 'Cream base units', L, [3.4, 2.92, 4.0, 3.8], '+x', (w, d) => F.baseUnits(w, d, { drawers: [0] }));
  put('kitchen', 'Extractor hood and splashback', L, [3.4, 2.0, 3.9, 2.9], '+x', (w, d) => F.hood(w, d, { flue: 0.66 }), onWall('gf-divide', 0.9));
  put('kitchen', 'Cream wall units with countertop lighting', L, [3.4, 1.3, 3.73, 1.95], '+x', (w, d) => F.wallUnits(w, d), onWall('gf-divide', 1.45));
  put('kitchen', 'Cream wall units with countertop lighting', L, [3.4, 2.95, 3.73, 3.8], '+x', (w, d) => F.wallUnits(w, d), onWall('gf-divide', 1.45));
  put('kitchen', 'Microwave', P, [3.45, 0.42, 3.85, 0.92], '+x', (w, d) => F.microwave(w, d), { y: 0.9 });
  put('kitchen', 'Stainless sink and drainer on the peninsula', L, [3.4, 4.66, 4.0, 6.13], '+x', (w, d) => F.sinkRun(w, d, { sinkAt: -0.35 }), { note: 'The floor plan draws the sink here, on the counter-height return that faces the lounge.' });
  put('kitchen', 'Space for a tumble dryer', L, [4.0, 5.53, 4.6, 6.13], '-z', (w, d) => F.washer(w, d, { ring: '#d9d9d6', glass: '#9ea4aa' }));
  put('kitchen', 'Washing machine (plumbed in)', L, [4.6, 5.53, 5.2, 6.13], '-z', (w, d) => F.washer(w, d));
  put('kitchen', 'Worktop over the appliances', L, [4.0, 5.53, 5.2, 6.13], '-z', (w, d) => F.worktop(w, d));
  put('kitchen', 'Cream base unit', L, [5.2, 5.53, 5.95, 6.13], '-z', (w, d) => F.baseUnits(w, d, { n: 1 }));
  put('kitchen', 'American-style fridge freezer', L, [5.95, 5.4, 6.88, 6.13], '-z', (w, d) => F.fridge(w, d));
  put('kitchen', 'Cream wall units', P, [4.0, 5.8, 5.95, 6.13], '-z', (w, d) => F.wallUnits(w, d, { n: 4 }), onWall('gf-party-kitchen', 1.45));
  put('kitchen', 'Dining table with floral cloth', P, [5.0, 2.7, 6.4, 3.55], '+z', (w, d) => F.table(w, d, { cloth: 'tablecloth' }));
  for (const [r, f] of [[[5.2, 2.22, 5.65, 2.67], '+z'], [[5.8, 2.22, 6.25, 2.67], '+z'], [[5.2, 3.58, 5.65, 4.03], '-z'], [[5.8, 3.58, 6.25, 4.03], '-z']]) {
    put('kitchen', 'Ladder-back dining chair', P, r, f, (w, d) => F.chair(w, d));
  }
  put('kitchen', 'Vase of sunflowers', P, [5.6, 3.0, 5.8, 3.2], '+z', () => F.plant({ pot: '#f4f4f1', h: 0.42, r: 0.07, leaf: '#e3b230' }), { y: 0.755 });
  put('kitchen', 'Radiator', P, [6.83, 1.9, 6.93, 3.2], '-x', (w) => F.radiator(w, 0, { h: 0.38 }), onWall('gf-rear', 0));
  put('kitchen', 'Radiator', P, [6.83, 4.1, 6.93, 5.2], '-x', (w) => F.radiator(w, 0, { h: 0.38 }), onWall('gf-rear', 0));
  put('kitchen', 'Pink roller blind', P, [6.86, 1.76, 6.86, 3.39], '-x', (w) => F.blind(w, 2.0, { drop: 0.45, c: '#d9b3c4' }), onWall('gf-rear', 0));
  put('kitchen', 'Pink roller blind', P, [6.86, 4.01, 6.86, 5.29], '-x', (w) => F.blind(w, 2.0, { drop: 0.45, c: '#d9b3c4' }), onWall('gf-rear', 0));
  put('kitchen', 'Patterned runner', P, [4.15, 1.9, 4.75, 3.1], '+x', (w, d) => F.rug(w, d, { c: 'rugPattern' }));
  put('kitchen', 'Kitchen bins', P, [4.15, 0.35, 4.45, 0.65], '+x', () => F.bin({ h: 0.6, r: 0.13 }));

  // Rear hallway ------------------------------------------------------------
  put('hall', 'High-level cupboard housing the fuse board', L, [6.2, 0.27, 6.85, 0.57], '+z', (w, d) => F.fuseCupboard(w, d), { y: 1.9, attach: 'gf-gable-end' });
  put('hall', 'Doormat', I, [6.25, 0.4, 6.85, 1.1], '+x', (w, d) => F.rug(w, d, { c: '#6b5a45' }));

  // Garage / workshop / hobbies room (no interior photos) ---------------------
  put('garage', 'Large built-in cupboard housing the gas boiler', L, [0.65, -0.5, 2.7, 0], '-z', (w, d) => F.boilerCupboard(w, d, { h: 2.3 }), { note: 'The floor plan shows a deep built-in block along the house wall; the listing says it houses the boiler.' });
  put('garage', 'Workbench', I, [2.4, -2.36, 4.2, -1.72], '+z', (w, d) => F.workbench(w, d));
  put('garage', 'Tool pegboard', I, [2.5, -2.36, 4.1, -2.36], '+z', (w) => F.pegboard(w, 0.8), onWall('gar-side', 1.05));
  put('garage', 'Storage shelving', I, [4.4, -2.36, 5.5, -1.9], '+z', (w, d) => F.rack(w, d));
  put('garage', 'Bike', I, [3.1, -0.42, 4.8, -0.1], '-z', (w) => F.bike(w));
  put('garage', 'Exercise mat and weights', I, [0.9, -2.15, 1.55, -0.85], '+z', (w, d) => F.yogaMat(w, d), { note: 'The listing suggests a garage, workshop, gym or studio; this scene shows a mix.' });
  put('garage', 'Radiator (power and heating)', L, [0.8, -2.36, 1.9, -2.26], '+z', (w) => F.radiator(w, 0, { h: 0.45 }), onWall('gar-side', 0));

  // Landing -----------------------------------------------------------------
  put('landing', 'Stair balustrade', P, [3.5, 1.24, 4.53, 1.28], '+z', (w, d) => F.balustrade(w, d));
  put('landing', 'Radiator cover', P, [2.5, 0.42, 2.78, 1.32], '+x', (w, d) => F.radiatorCover(w, d));
  put('landing', 'Table lamp', P, [2.55, 0.55, 2.75, 0.75], '+x', () => F.lampTable(), { y: 0.85 });
  put('landing', 'Framed print', P, [2.5, 0.7, 2.5, 1.2], '+x', (w) => F.picture(w, 0.4, { art: '#b8876a' }), onWall('ff-bed3', 1.35));
  put('landing', 'Linen shelves in the landing cupboard', I, [4.65, 2.1, 5.22, 2.75], '-x', (w, d) => F.cupboardShelves(w, d));

  // Bedroom 1 ---------------------------------------------------------------
  put('bed1', 'Double bed with upholstered headboard', P, [0.7, 2.88, 2.25, 4.93], '+z', (w, d) => F.bed(w, d, { head: '#a3a4a8', throwC: '#8f9aa8' }));
  put('bed1', 'Bedside table', I, [0.3, 2.9, 0.66, 3.28], '+z', (w, d) => F.chest(w, d, { h: 0.5, rows: 2 }));
  put('bed1', 'Bedside lamp', P, [0.38, 2.98, 0.58, 3.18], '+z', () => F.lampTable({ base: '#d9d9d6', shade: '#ececea' }), { y: 0.5 });
  put('bed1', 'Chimney breast in toile wallpaper', P, [1.96, 5.78, 2.54, 6.13], '-z', (w, d) => F.chimneyBreast(w, d, { paper: 'bed1Toile' }), { attach: 'ff-party-bed1', note: 'Stacked over the lounge fireplace below.' });
  put('bed1', 'White wardrobe', P, [2.62, 5.53, 3.55, 6.13], '-z', (w, d) => F.wardrobe(w, d));
  put('bed1', 'White chest of drawers', P, [0.35, 5.68, 1.15, 6.13], '-z', (w, d) => F.chest(w, d, { h: 0.78, rows: 3, cols: 2 }));
  put('bed1', 'Alcove shelving with books', P, [0.3, 5.88, 1.9, 6.13], '-z', (w, d) => F.bookcase(w, d, { h: 0.7, shelves: 2, seed: 9 }), onWall('ff-party-bed1', 1.4));
  put('bed1', 'Grey curtains', P, [0.3, 3.65, 0.3, 5.3], '+x', (w) => F.curtains(w, 2.15, { c: '#9b9a9d' }), onWall('ff-front-bed1', 0));
  put('bed1', 'Radiator', I, [0.27, 3.95, 0.37, 5.0], '+x', (w) => F.radiator(w, 0, { h: 0.45 }), onWall('ff-front-bed1', 0));
  put('bed1', 'Sheepskin rug', P, [0.9, 5.0, 1.7, 5.5], '+z', (w, d) => F.rug(w, d, { c: '#ecebe7' }));

  // Bedroom 2 ---------------------------------------------------------------
  put('bed2', 'Desk set up as a home office', P, [5.55, 5.5, 6.8, 6.13], '-z', (w, d) => F.desk(w, d));
  put('bed2', 'Office chair', P, [5.9, 4.85, 6.5, 5.45], '+z', (w, d) => F.officeChair(w, d));
  put('bed2', 'Grey sofa bed', P, [3.7, 3.9, 4.6, 5.75], '+x', (w, d) => F.sofa(w, d, { body: '#9fa2a6', pillows: ['#d6d3cd', '#bfc3c8'] }));
  put('bed2', 'Radiator', P, [6.83, 4.2, 6.93, 5.4], '-x', (w) => F.radiator(w, 0, { h: 0.45 }), onWall('ff-rear-bed2', 0));
  put('bed2', 'Venetian blind', P, [6.87, 3.96, 6.87, 5.69], '-x', (w) => F.blind(w, 1.08, { drop: 0.5 }), onWall('ff-rear-bed2', 3.58 - FLOOR_Y[1]));
  put('bed2', 'Mirror', P, [4.3, 6.13, 4.9, 6.13], '-z', (w) => F.picture(w, 0.85, { frameC: '#f3f2ee', art: 'mirror' }), onWall('ff-party-bed2', 1.0));
  put('bed2', 'Colourful prints', P, [5.6, 2.88, 6.1, 2.88], '+z', (w) => F.picture(w, 0.38, { art: '#e07a5f', frameC: '#f3f2ee' }), onWall('ff-corr-bath', 1.45));
  put('bed2', 'Storage ottoman', P, [6.3, 3.15, 6.85, 3.6], '-x', (w, d) => F.chest(w, d, { h: 0.38, rows: 1, body: '#5d6066' }));

  // Bedroom 3 ---------------------------------------------------------------
  put('bed3', 'Dressing table with lit mirror', P, [0.7, 2.27, 1.8, 2.75], '-z', (w, d) => F.dressingTable(w, d));
  put('bed3', 'Velvet stool', P, [1.05, 1.85, 1.45, 2.2], '-z', (w, d) => F.stool(w, d));
  put('bed3', 'Wooden chest of drawers', P, [0.35, 0.27, 1.25, 0.72], '+z', (w, d) => F.chest(w, d, { h: 0.8, rows: 3, cols: 2, body: 'darkWood', front: '#7d6655' }));
  put('bed3', 'Clothes rail', P, [1.3, 0.3, 2.25, 0.75], '+z', (w, d) => clothesRail(w, d));
  put('bed3', 'Floating shelf on brackets', P, [0.85, 2.6, 1.85, 2.75], '-z', (w, d) => F.shelf(w, d, { c: '#f3f2ee' }), onWall('ff-corr-bed3', 1.7));
  put('bed3', 'Radiator', P, [0.27, 0.62, 0.37, 1.38], '+x', (w) => F.radiator(w, 0, { h: 0.45 }), onWall('ff-front-bed3', 0));
  put('bed3', 'Roman blind', P, [0.3, 0.55, 0.3, 1.45], '+x', (w) => F.blind(w, 2.08, { drop: 0.32, c: '#b9bcc0' }), onWall('ff-front-bed3', 0));
  put('bed3', 'Patterned rug', P, [0.6, 0.85, 2.0, 2.05], '+z', (w, d) => F.rug(w, d, { c: 'rugSage' }));

  // Bathroom ----------------------------------------------------------------
  put('bath', 'Raised boxing over the stair head', PL, [4.65, 0.27, 5.4, 1.24], '+x', (w, d) => { const g = new THREE.Group(); g.add(box(-w / 2, 0, -d / 2, w / 2, 0.22, d / 2, 'vinyl')); return g; }, { note: 'The floor plan marks reduced headroom here, where the stairs pass underneath.' });
  put('bath', 'Wash hand basin with vanity cupboard', L, [4.65, 0.35, 5.1, 1.05], '+x', (w, d) => F.vanity(w, d), { y: 0.22, note: 'Position taken from the basin symbol on the floor plan.' });
  put('bath', 'Mirror', I, [4.65, 0.45, 4.65, 0.95], '+x', (w) => F.picture(w, 0.65, { frameC: '#f3f2ee', art: 'mirror' }), onWall('ff-bath', 1.4));
  put('bath', 'Boxed-in pipework', P, [5.5, 0.27, 6.93, 0.47], '+z', (w, d) => { const g = new THREE.Group(); g.add(box(-w / 2, 0, -d / 2, w / 2, 1.0, d / 2, 'bathTeal')); return g; });
  put('bath', 'WC', L, [6.0, 0.47, 6.45, 1.15], '+z', (w, d) => F.toilet(w, d));
  put('bath', 'Boxed soil stack', PL, [6.68, 1.04, 6.93, 1.62], '-x', (w, d) => { const g = new THREE.Group(); g.add(box(-w / 2, 0, -d / 2, w / 2, 2.4, d / 2, 'bathTeal')); return g; }, { attach: 'ff-rear-bath' });
  put('bath', 'Heated towel rail', L, [6.68, 1.08, 6.68, 1.58], '-x', (w) => F.towelRail(w, 1.1), onWall('ff-rear-bath', 0));
  put('bath', 'P-shaped bath with shower over and glazed screen', L, [5.32, 2.05, 6.93, 2.75], '-z', (w, d) => F.bathP(w, d), { flip: true, note: 'Described as "pea-shaped" in the listing.' });
  put('bath', 'Extractor fan', L, [5.0, 0.27, 5.2, 0.27], '+z', () => F.extractorFan(), onWall('ff-gable-bath', 2.15));
  put('bath', 'Bath mat', P, [5.6, 1.5, 6.3, 1.98], '+z', (w, d) => F.rug(w, d, { c: '#24577a' }));
}

// Kept here rather than in furniture.js because it is the only garment piece.
function clothesRail(w, d) {
  const g = new THREE.Group();
  const x0 = -w / 2, x1 = w / 2;
  for (const x of [x0 + 0.03, x1 - 0.03]) {
    g.add(rod([x, 0.05, -d / 2 + 0.05], [x, 0.05, d / 2 - 0.05], 0.012, 'chrome'));
    g.add(rod([x, 0.05, 0], [x, 1.6, 0], 0.012, 'chrome'));
  }
  g.add(rod([x0 + 0.03, 1.6, 0], [x1 - 0.03, 1.6, 0], 0.012, 'chrome'));
  const colors = ['#2b2d42', '#8d99ae', '#ef8a87', '#3d5a80', '#e0c3a8', '#6d597a', '#1f1f1f'];
  colors.forEach((c, i) => {
    const x = x0 + 0.12 + i * ((w - 0.24) / (colors.length - 1));
    const len = 0.55 + (i % 3) * 0.2;
    g.add(box(x - 0.02, 1.55 - len, -0.2, x + 0.02, 1.55, 0.2, c));
  });
  return g;
}
