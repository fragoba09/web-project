// house.js - builds 22 Ellan Park from the Metropix floor plan in the listing.
//
// A mid-terrace house with a single-storey living-room extension at the back.
// Coordinates are metres. x runs from the front wall (x = 0) to the back of the
// extension (x = 11.44); the two-storey part is 7.35 m deep. z runs across the
// house between the two party walls (z = 0 on the left seen from the street,
// z = 6.25 on the right). y is up; the ground floor is at y = 0, and the
// extension floor sits one step lower, as the living-room photos show.
// The plan is marked "not to scale", so its two floors disagree on depth by
// about 25 cm; the model splits the difference.
import * as THREE from 'three';
import { box, cyl, rod, prismX, prismZ, M, worldUV } from '../../tour-kit/kit.js';
import * as F from '../../tour-kit/furniture.js';
import { createHouse, slopeX, slopeZ, fenceRun } from '../../tour-kit/model.js';

export const FLOOR_Y = [0, 2.65];
const T = 0.25;
const LIVING_Y = -0.15;

export const ROOMS = {
  kitchen: { floor: 0, rect: [0.25, 0.25, 3.86, 3.89], floors: [[0.125, 0.125, 3.91, 3.94]], mat: 'oakGrey', label: [2.1, 2.1] },
  hall: { floor: 0, rect: [0.25, 3.99, 2.52, 6.0], floors: [[0.125, 3.94, 2.57, 6.125]], mat: 'oakGrey', label: [0.95, 4.75], base: [[-0.05, 3.69, 2.82, 6.3], [2.82, 4.9, 4.16, 6.3]], fit: [-0.05, 3.7, 4.0, 6.3] },
  wc: { floor: 0, rect: [2.62, 3.99, 3.86, 6.0], floors: [[2.57, 3.94, 3.91, 6.125]], mat: 'oakGrey', label: [3.2, 4.5] },
  dining: { floor: 0, rect: [3.96, 0.25, 7.1, 6.0], floors: [[3.91, 0.125, 7.225, 6.125]], mat: 'oakGrey', label: [5.4, 2.2] },
  living: { floor: 0, y: LIVING_Y, rect: [7.35, 0.25, 11.19, 6.0], floors: [[7.225, 0.125, 11.315, 6.125]], mat: 'oakGrey', label: [9.2, 2.6] },
  landing: { floor: 1, rect: [3.1, 3.53, 4.75, 6.0], floors: [[3.05, 3.48, 4.8, 5.25], [3.84, 5.25, 4.8, 6.125], [2.45, 3.48, 3.05, 4.3]], mat: 'carpetBeige', label: [4.15, 4.35], base: [[2.15, 3.2, 5.1, 5.25], [3.84, 5.25, 5.1, 6.4]], fit: [2.2, 3.2, 5.1, 6.3] },
  bed1: { floor: 1, rect: [0.25, 0.25, 3.81, 3.43], floors: [[0.125, 0.125, 3.86, 3.48]], mat: 'carpetBeige', label: [1.6, 1.75] },
  bed2: { floor: 1, rect: [3.91, 0.25, 7.1, 3.43], floors: [[3.86, 0.125, 7.225, 3.48]], mat: 'carpetBeige', label: [5.0, 1.75] },
  bed3: { floor: 1, rect: [4.85, 3.53, 7.1, 6.0], floors: [[4.8, 3.48, 7.225, 6.125]], mat: 'carpetBeige', label: [5.95, 4.75] },
  bath: { floor: 1, rect: [0.25, 3.53, 2.4, 6.0], floors: [[0.125, 3.48, 2.45, 6.125], [2.45, 4.3, 3.05, 5.25]], mat: 'beigeFloor', label: [1.35, 4.75] },
};

export const ROOM_VIEW = { kitchen: 'kitchen', hall: 'hallway', wc: 'wc', dining: 'dining-room', living: 'living-room', landing: 'landing', bed1: 'bedroom-1', bed2: 'bedroom-2', bed3: 'bedroom-3', bath: 'bathroom' };

const FLOORING = {
  kitchen: ['Light oak-effect laminate', 'photo'],
  hall: ['Light oak-effect laminate', 'photo'],
  wc: ['Light oak-effect laminate', 'photo'],
  dining: ['Light oak-effect laminate', 'photo'],
  living: ['Light oak-effect laminate, one step down from the dining room', 'photo'],
  landing: ['Beige carpet', 'photo'],
  bed1: ['Carpet, assumed to match the other bedrooms', 'inferred'],
  bed2: ['Beige carpet', 'photo'],
  bed3: ['Beige carpet', 'photo'],
  bath: ['Large beige floor tiles', 'photo'],
};

const HOUSE = createHouse({
  floorY: FLOOR_Y,
  wallY: [[-0.12, 2.65], [2.65, 5.15]],
  rooms: ROOMS,
  roomView: ROOM_VIEW,
  flooring: FLOORING,
  finishes: { kitchen: 'wall22', hall: 'wall22', wc: 'wc22', dining: 'dining22', living: 'living22', landing: 'landing22', storage: 'white', bed1: 'bed1w22', bed2: 'bedWhite', bed3: 'bed3pink', bath: 'beigeTile' },
  alias: { storage: 'landing' },
  extMat: 'render22',
  frames: { out: 'anthracite', in: 'upvc' },
  sill: 'concrete',
});
const { wall, door, win, gap } = HOUSE;
const pvc = (o) => ({ label: 'Anthracite uPVC window', src: 'photo', ...o });

// ---------------------------------------------------------------------------
// Ground floor
// ---------------------------------------------------------------------------

wall('gf-front-kitchen', 0, 'z', [0, T], [0, 3.94], { neg: 'ext', pos: 'kitchen' }, {
  out: '-x', holes: [win(0.55, 1.66, 0.95, 2.05, pvc({ label: 'Kitchen window to the front' })), win(2.32, 3.37, 0.95, 2.05, pvc({ label: 'Kitchen window to the front' }))],
});
wall('gf-front-hall', 0, 'z', [0, T], [3.94, 6.25], { neg: 'ext', pos: 'hall' }, {
  out: '-x', holes: [door(4.55, 5.33, { y: [0, 2.05], leaf: 'extFront', label: 'Front door', src: 'photo' })],
});
wall('gf-party-l-kitchen', 0, 'x', [0, T], [0.25, 3.91], { neg: 'party', pos: 'kitchen:metro' }, { out: '-z' });
wall('gf-party-l-dining', 0, 'x', [0, T], [3.91, 7.35], { neg: 'party', pos: 'dining' }, { out: '-z' });
wall('gf-party-r-hall', 0, 'x', [6.0, 6.25], [0.25, 2.57], { neg: 'hall', pos: 'party' }, { out: '+z' });
wall('gf-party-r-wc', 0, 'x', [6.0, 6.25], [2.57, 3.91], { neg: 'wc', pos: 'party' }, { out: '+z' });
wall('gf-party-r-dining', 0, 'x', [6.0, 6.25], [3.91, 7.35], { neg: 'dining', pos: 'party' }, { out: '+z' });
// The original back wall, now between the dining room and the extension.
wall('gf-dining-living', 0, 'z', [7.1, 7.35], [0.25, 6.0], { neg: 'dining', pos: 'living' }, {
  y: [-0.27, 2.65],
  holes: [
    { kind: 'french', s: [1.34, 2.98], y: [0, 2.05], leaf: 'glazedInt', swing: { side: 'neg', angle: 80 }, label: 'Glazed double doors to the living room', src: 'photo' },
    win(4.41, 5.42, 0.85, 2.1, { label: 'Arched internal window', src: 'plan' }),
  ],
});
wall('gf-kitchen-dining', 0, 'z', [3.86, 3.96], [0.25, 3.94], { neg: 'kitchen', pos: 'dining' }, { holes: [gap(0.92, 2.84, 2.1)] });
wall('gf-wc-dining', 0, 'z', [3.86, 3.96], [3.94, 6.0], { neg: 'wc', pos: 'dining' });
wall('gf-kitchen-hall', 0, 'x', [3.89, 3.99], [0.25, 2.57], { neg: 'kitchen:metro', pos: 'hall' }, { holes: [gap(0.4, 1.4, 2.05)] });
wall('gf-kitchen-wc', 0, 'x', [3.89, 3.99], [2.57, 3.86], { neg: 'kitchen:metro', pos: 'wc' });
wall('gf-hall-wc', 0, 'z', [2.52, 2.62], [3.99, 5.2], { neg: 'hall', pos: 'wc' }, {
  holes: [door(4.18, 5.0, { swing: { hinge: 0, side: 'pos', angle: 80 }, label: 'Door to the WC' })],
});

// Rear extension (single storey, floor one step down)
const EY = [-0.34, 2.5];
wall('ext-rear', 0, 'z', [11.19, 11.44], [0, 6.25], { neg: 'living', pos: 'ext' }, {
  y: EY, fy: LIVING_Y, out: '+x', ends: ['ext', 'ext'],
  holes: [
    { kind: 'french', s: [1.53, 3.04], y: [LIVING_Y, 1.95], label: 'French doors to the garden', src: 'photo' },
    door(5.0, 5.8, { y: [LIVING_Y, 1.95], leaf: 'cottage', color: 'navyDoor', label: 'Navy door to the garden', src: 'photo' }),
  ],
});
wall('ext-side-l', 0, 'x', [0, T], [7.35, 11.19], { neg: 'ext', pos: 'living' }, { y: EY, fy: LIVING_Y, out: '-z' });
wall('ext-side-r', 0, 'x', [6.0, 6.25], [7.35, 11.19], { neg: 'living', pos: 'ext' }, { y: EY, fy: LIVING_Y, out: '+z' });

// ---------------------------------------------------------------------------
// First floor
// ---------------------------------------------------------------------------

wall('ff-front-bed1', 1, 'z', [0, T], [0, 3.48], { neg: 'ext', pos: 'bed1' }, {
  out: '-x', holes: [win(1.04, 2.55, 3.55, 4.75, pvc({ panes: 3, label: 'Front window' }))],
});
wall('ff-front-bath', 1, 'z', [0, T], [3.48, 6.25], { neg: 'ext', pos: 'bath:beigeTile' }, {
  out: '-x', holes: [win(4.12, 5.21, 3.72, 4.75, pvc({ label: 'Bathroom window', src: 'plan' }))],
});
wall('ff-rear-bed2', 1, 'z', [7.1, 7.35], [0, 3.48], { neg: 'bed2', pos: 'ext' }, {
  out: '+x', holes: [win(1.04, 2.55, 3.55, 4.75, pvc({ panes: 3, label: 'Window over the garden' }))],
});
wall('ff-rear-bed3', 1, 'z', [7.1, 7.35], [3.48, 6.25], { neg: 'bed3', pos: 'ext' }, {
  out: '+x', holes: [win(4.52, 5.57, 3.55, 4.75, pvc({ label: 'Window over the garden' }))],
});
wall('ff-party-l-bed1', 1, 'x', [0, T], [0.25, 3.86], { neg: 'party', pos: 'bed1' }, { out: '-z' });
wall('ff-party-l-bed2', 1, 'x', [0, T], [3.86, 7.1], { neg: 'party', pos: 'bed2' }, { out: '-z' });
wall('ff-party-r-bath', 1, 'x', [6.0, 6.25], [0.25, 2.45], { neg: 'bath', pos: 'party' }, { out: '+z' });
wall('ff-party-r-landing', 1, 'x', [6.0, 6.25], [2.45, 4.8], { neg: 'landing', pos: 'party' }, { out: '+z' });
wall('ff-party-r-bed3', 1, 'x', [6.0, 6.25], [4.8, 7.1], { neg: 'bed3', pos: 'party' }, { out: '+z' });
wall('ff-bed12', 1, 'z', [3.81, 3.91], [0.25, 3.43], { neg: 'bed1', pos: 'bed2' });
wall('ff-corr-bath', 1, 'x', [3.43, 3.53], [0.25, 2.45], { neg: 'bed1', pos: 'bath' });
wall('ff-corr-store', 1, 'x', [3.43, 3.53], [2.45, 3.05], { neg: 'bed1', pos: 'storage' });
wall('ff-corr-landing1', 1, 'x', [3.43, 3.53], [3.05, 3.86], { neg: 'bed1', pos: 'landing' }, {
  holes: [door(3.12, 3.78, { swing: { hinge: 0, side: 'neg', angle: 80 }, label: 'Door to bedroom 1' })],
});
wall('ff-corr-landing2', 1, 'x', [3.43, 3.53], [3.86, 4.8], { neg: 'bed2', pos: 'landing' }, {
  holes: [door(4.02, 4.72, { swing: { hinge: 1, side: 'neg', angle: 80 }, label: 'Door to bedroom 2' })],
});
wall('ff-corr-bed3', 1, 'x', [3.43, 3.53], [4.8, 7.1], { neg: 'bed2', pos: 'bed3' });
wall('ff-bed3', 1, 'z', [4.75, 4.85], [3.53, 6.0], { neg: 'landing', pos: 'bed3' }, {
  holes: [door(3.98, 4.72, { swing: { hinge: 1, side: 'pos', angle: 80 }, label: 'Door to bedroom 3' })],
});
wall('ff-store-landing', 1, 'z', [3.0, 3.1], [3.53, 4.3], { neg: 'storage', pos: 'landing' }, {
  holes: [door(3.58, 4.22, { y: [2.65, 4.55], leaf: 'plain', label: 'Storage cupboard', src: 'plan' })],
});
wall('ff-bath-landing', 1, 'z', [3.0, 3.1], [4.3, 5.2], { neg: 'bath', pos: 'landing' }, {
  holes: [door(4.38, 5.14, { swing: { hinge: 1, side: 'neg', angle: 80 }, label: 'Door to the bathroom' })],
});
wall('ff-store-bath', 1, 'z', [2.4, 2.5], [3.53, 4.35], { neg: 'bath', pos: 'storage' });
wall('ff-store-bath2', 1, 'x', [4.25, 4.35], [2.5, 3.0], { neg: 'storage', pos: 'bath' });
wall('ff-stair-bath', 1, 'x', [5.2, 5.3], [2.5, 3.0], { neg: 'bath', pos: 'landing' });
wall('ff-stair-bath2', 1, 'z', [2.4, 2.5], [5.2, 6.0], { neg: 'bath', pos: 'landing' });

// ---------------------------------------------------------------------------
// Model assembly
// ---------------------------------------------------------------------------

export function buildModel() {
  const { reg, put, finish } = HOUSE.start();
  buildStair(reg);
  buildRoofs(reg);
  buildSite(reg, put);
  buildNeighbours(reg);
  furnish(put);
  return finish();
}

// ---------------------------------------------------------------------------
// Stairs: 13 risers from the hall, rising towards the back over the WC.
// ---------------------------------------------------------------------------

function buildStair(reg) {
  const start = 1.2, going = 0.22, rise = FLOOR_Y[1] / 13, pitch = rise / going;
  const z0 = 5.2, z1 = 6.0;
  const groups = [new THREE.Group(), new THREE.Group(), new THREE.Group()];
  const skin = ['carpetGrey', 'white', 'carpetGrey', 'white', 'white', 'white'];
  for (let i = 1; i <= 12; i++) {
    const xa = start + (i - 1) * going, xb = start + i * going;
    const top = i * rise;
    const bottom = (xa + xb) / 2 < 2.6 ? 0 : top - 0.34;
    groups[i <= 6 ? 0 : i <= 9 ? 1 : 2].add(box(xa, bottom, z0, xb, top, z1, skin));
  }
  // Painted soffit under the part of the flight that runs over the WC.
  const sx = 2.62, sy = (2.62 - start) * pitch - 0.3, ex = 3.84, ey = (3.84 - start) * pitch - 0.3;
  const L = Math.hypot(ex - sx, ey - sy);
  const soffit = new THREE.Mesh(worldUV(new THREE.BoxGeometry(L, 0.03, z1 - z0).translate(L / 2, -0.015, (z0 + z1) / 2)), M('white'));
  soffit.position.set(sx, sy, 0);
  soffit.rotation.z = Math.atan2(ey - sy, ex - sx);
  soffit.receiveShadow = true;
  groups[1].add(soffit);
  // Under-stairs cupboard door in the white panel facing the hall.
  groups[0].add(box(1.75, 0.05, z0 - 0.012, 2.4, 1.05, z0, 'white'));
  groups[0].add(box(2.3, 0.5, z0 - 0.03, 2.33, 0.6, z0 - 0.012, 'chrome'));
  const meta = { layer: 'item', floors: [0, 1], label: 'Stairs to the first floor', src: 'plan', note: 'A straight 13-riser flight rising towards the back. It passes over the WC, which fits both floor plans.' };
  reg(groups[0], { ...meta, rooms: ['hall'] });
  reg(groups[1], { ...meta, rooms: ['hall', 'wc'] });
  reg(groups[2], { ...meta, rooms: ['hall', 'wc', 'landing'] });

  const screen = F.slatScreen(1.32, { rise: pitch, start: 0.28, top: 2.4 });
  screen.position.set(start, 0, z0 - 0.03);
  reg(screen, { layer: 'item', floors: [0], rooms: ['hall'], label: 'White slatted screen beside the stairs', src: 'photo' });
}

// ---------------------------------------------------------------------------
// Roofs: a shallow terrace roof (pitch estimated at 25 degrees) over the main
// house, a lean-to over the extension with a small gable above the back door,
// and a canopy over the front door.
// ---------------------------------------------------------------------------

const PITCH = Math.tan((25 * Math.PI) / 180);
const EAVES = 5.15, DEPTH = 7.35, RIDGE = EAVES + (DEPTH / 2) * PITCH;

function terraceRoof(za, zb, roof) {
  const g = new THREE.Group();
  const lowY = EAVES - 0.3 * PITCH, mid = DEPTH / 2;
  g.add(slopeX(-0.3, lowY, mid, RIDGE, za, zb, 0.12, roof));
  g.add(slopeX(mid, RIDGE, DEPTH + 0.3, lowY, za, zb, 0.12, roof));
  g.add(box(mid - 0.12, RIDGE + 0.02, za, mid + 0.12, RIDGE + 0.15, zb, '#55504a'));
  for (const [fa, fb, ga, gb] of [[-0.33, -0.3, -0.45, -0.33], [DEPTH + 0.3, DEPTH + 0.33, DEPTH + 0.33, DEPTH + 0.45]]) {
    g.add(box(fa, lowY - 0.18, za, fb, lowY + 0.02, zb, 'fascia'));
    g.add(box(ga, lowY - 0.17, za, gb, lowY - 0.07, zb, 'anthracite'));
  }
  g.add(box(-0.3, lowY - 0.03, za, 0, lowY, zb, 'fascia'), box(DEPTH, lowY - 0.03, za, DEPTH + 0.3, lowY, zb, 'fascia'));
  return g;
}

function chimney(g, z) {
  const x0 = 3.25, x1 = 4.1;
  g.add(box(x0, RIDGE - 0.6, z - 0.4, x1, RIDGE + 0.75, z + 0.4, 'render22'));
  g.add(box(x0 - 0.05, RIDGE + 0.75, z - 0.45, x1 + 0.05, RIDGE + 0.83, z + 0.45, 'concrete'));
  g.add(cyl(3.5, RIDGE + 0.83, z - 0.15, 0.09, 0.3, '#a9643f'), cyl(3.85, RIDGE + 0.83, z + 0.15, 0.09, 0.3, '#a9643f'));
}

function buildRoofs(reg) {
  const main = terraceRoof(0, 6.25, 'roofMoss');
  chimney(main, 0);
  main.add(rod([3.7, RIDGE + 0.8, 0], [3.7, RIDGE + 1.7, 0], 0.016, '#9aa0a6'));
  main.add(rod([3.7, RIDGE + 1.5, -0.4], [3.7, RIDGE + 1.5, 0.4], 0.01, '#9aa0a6'));
  for (const [x, z, y1] of [[-0.4, 0.12, EAVES - 0.2], [DEPTH + 0.4, 6.13, EAVES - 0.2]]) main.add(rod([x, x > 0 ? 3.2 : -0.12, z], [x, y1, z], 0.04, 'anthracite'));
  reg(main, { layer: 'roof', rooms: [], floors: [1], label: 'Concrete tile terrace roof (pitch estimated at 25°)', src: 'photo' });

  // Lean-to over the living-room extension.
  const ext = new THREE.Group();
  const hiY = 3.35, loY = 2.5, x0 = DEPTH, x1 = 11.44;
  const slope = (hiY - loY) / (x1 - x0);
  ext.add(slopeX(x0, hiY, x1 + 0.2, loY - 0.2 * slope, 0, 6.25, 0.1, 'roofBrown'));
  for (const [za, zb] of [[0, T], [6.0, 6.25]]) ext.add(prismZ([[x0, loY], [x1, loY], [x0, hiY]], za, zb, 'render22'));
  ext.add(box(x1 + 0.2, loY - 0.22, 0, x1 + 0.23, loY - 0.05, 6.25, 'fascia'));
  ext.add(box(x1 + 0.23, loY - 0.21, 0, x1 + 0.35, loY - 0.11, 6.25, 'anthracite'));
  ext.add(box(x0, hiY - 0.05, 0, x0 + 0.06, hiY + 0.1, 6.25, 'lead'));
  ext.add(rod([x1 + 0.3, -0.12, 0.12], [x1 + 0.3, loY - 0.12, 0.12], 0.04, 'anthracite'));
  // Small gable over the navy back door.
  const ga = 4.65, gb = 6.15, gm = (ga + gb) / 2, gy = 3.15;
  ext.add(prismX([[ga, loY], [gb, loY], [gm, gy]], 11.19, x1, 'render22'));
  ext.add(slopeZ(ga - 0.12, loY - 0.1, gm, gy, 10.5, x1 + 0.2, 0.08, 'roofBrownZ'));
  ext.add(slopeZ(gm, gy, gb + 0.12, loY - 0.1, 10.5, x1 + 0.2, 0.08, 'roofBrownZ'));
  ext.add(slopeZ(ga - 0.12, loY - 0.22, gm, gy - 0.12, x1 + 0.2, x1 + 0.23, 0.17, 'fascia'));
  ext.add(slopeZ(gm, gy - 0.12, gb + 0.12, loY - 0.22, x1 + 0.2, x1 + 0.23, 0.17, 'fascia'));
  reg(ext, { layer: 'roof', rooms: [], floors: [0], label: 'Lean-to roof over the living-room extension', src: 'photo' });

  // Canopy over the front door.
  const can = new THREE.Group();
  const ca = 4.42, cb = 5.46, cm = (ca + cb) / 2, cy0 = 2.3, cy1 = 2.75;
  can.add(slopeZ(ca, cy0, cm, cy1, -0.75, 0, 0.05, 'anthracite'));
  can.add(slopeZ(cm, cy1, cb, cy0, -0.75, 0, 0.05, 'anthracite'));
  can.add(prismX([[ca + 0.04, cy0], [cb - 0.04, cy0], [cm, cy1 - 0.03]], -0.74, -0.7, '#4a5057'));
  for (const z of [ca + 0.08, cb - 0.08]) can.add(rod([0, 1.75, z], [-0.62, cy0, z], 0.02, 'anthracite'));
  reg(can, { layer: 'roof', rooms: [], floors: [0], label: 'Gabled canopy over the front door', src: 'photo' });

  const steps = new THREE.Group();
  steps.add(box(-0.45, -0.15, 4.4, 0, -0.02, 5.5, 'concrete'));
  steps.add(box(11.44, -0.3, 1.45, 11.75, -0.17, 3.12, 'concrete'));
  steps.add(box(11.44, -0.3, 4.9, 11.75, -0.17, 5.9, 'concrete'));
  reg(steps, { layer: 'site', rooms: [], floors: [0, 1] });
}

// ---------------------------------------------------------------------------
// Plot: block-paved drive at the front, south-facing garden behind.
// The listing gives no plot sizes; these are estimated from the photos.
// ---------------------------------------------------------------------------

function buildSite(reg, put) {
  const ground = new THREE.Group();
  ground.add(box(-10, -0.8, -6.5, DEPTH, -0.16, 12.75, ['board', 'board', 'lawnPlain', 'board', 'board', 'board']));
  // The garden sits a step below the drive, level with the patio outside the extension.
  ground.add(box(DEPTH, -0.8, -6.5, 23.4, -0.33, 12.75, ['board', 'board', 'lawnPlain', 'board', 'board', 'board']));
  ground.add(box(-10, -0.16, -6.5, -8.2, -0.145, 12.75, 'road'));
  ground.add(box(-8.2, -0.16, -6.5, -8.0, -0.09, 12.75, 'concrete'));
  ground.add(box(-8.0, -0.16, -6.5, -6.45, -0.135, 12.75, 'redPath'));
  ground.add(box(-6.45, -0.16, 0, 0, -0.13, 6.25, 'blockPaving'));
  ground.add(box(-6.45, -0.16, 0, -6.35, -0.11, 6.25, 'concrete'));
  // Neighbours' fronts, kept plain.
  ground.add(box(-6.45, -0.16, -6.25, 0, -0.13, -0.06, 'concrete'));
  ground.add(box(-6.45, -0.16, 6.31, 0, -0.13, 12.5, 'blockPaving'));
  // Back garden: patio, side path, artificial lawn with weedy edges.
  ground.add(box(11.44, -0.33, 0, 12.4, -0.3, 6.25, 'flags'));
  ground.add(box(12.4, -0.33, 5.25, 22.45, -0.3, 6.2, 'concrete'));
  ground.add(box(12.4, -0.33, 0.06, 22.45, -0.31, 5.25, 'lawnPlain'));
  ground.add(box(12.65, -0.33, 0.35, 22.15, -0.305, 5.05, 'astro'));
  reg(ground, { layer: 'site', rooms: [], floors: [0, 1] });

  const bounds = new THREE.Group();
  fenceRun(bounds, -6.2, -0.02, 'x', 0, 1.55, 'fenceWeathered', '#7f766b');
  fenceRun(bounds, -6.2, -0.02, 'x', 6.25, 1.55, 'fenceWeathered', '#7f766b');
  for (const z of [0, 6.25]) fenceRun(bounds, 11.44, 22.5, 'x', z, 1.8, 'fenceWeathered', '#7f766b', 1.83, -0.33);
  fenceRun(bounds, 0, 6.25, 'z', 22.5, 1.8, 'fenceWeathered', '#7f766b', 1.83, -0.33);
  reg(bounds, { layer: 'site', tall: true, rooms: [], floors: [0, 1], label: 'Timber boundary fencing', src: 'photo', note: 'The garden is described as south-facing and good-sized.' });

  const site = { layer: 'site', floors: [0, 1], y: -0.13 };
  const back = { ...site, y: -0.3 };
  put(null, 'Car, shown for scale on the driveway', 'inferred', [-5.9, 0.6, -1.3, 2.4], '+z', (w, d) => F.car(w, d, { c: '#4d5560' }), { ...site, tall: true, note: 'The listing says the driveway gives ample off-road parking for multiple vehicles.' });
  put(null, 'Electric vehicle charging point', 'listing', [0, 3.62, 0, 3.86], '-x', () => F.evCharger(), { ...site, y: 1.25, attach: 'gf-front-kitchen' });
  put(null, 'Meter box', 'photo', [0, 3.15, 0, 3.6], '-x', () => F.meterBox(), { ...site, y: 0.2, attach: 'gf-front-kitchen' });
  put(null, 'Garden swing', 'photo', [13.6, 1.0, 14.8, 2.8], '-x', (w, d) => F.gardenSwing(w, d), { ...back, tall: true, note: 'Moved nearer the house to leave room for the proposed garden studio.' });
  // Proposed addition, not part of the sale: a Shire 10 x 7 ft Superlap garden studio
  // (3.02 x 2.23 m) in the far corner, across the lawn from the side path, doors facing the house.
  put(null, 'Shire Superlap garden studio, 10 × 7 ft', 'proposed', [19.92, 0.3, 22.15, 3.32], '-x', (w, d) => F.gardenStudio(w, d), {
    ...back, tall: true, note: '3.02 × 2.23 m, 2.55 m to the ridge. Shown on a slab base with its doors facing the house.',
  });
  put(null, 'Garden storage box', 'photo', [11.5, 0.35, 12.1, 1.3], '-x', (w, d) => F.storeBox(w, d), back);
  const shrubs = [[21.9, 4.7], [14.5, 0.4], [17.2, 0.4]];
  shrubs.forEach(([x, z], i) => put(null, 'Border planting', 'photo', [x - 0.3, z - 0.3, x + 0.3, z + 0.3], '+z', () => F.shrub({ r: 0.28, seed: i + 7 }), back));
}

// ---------------------------------------------------------------------------
// The neighbouring houses in the terrace, simplified and mirrored.
// ---------------------------------------------------------------------------

function buildNeighbours(reg) {
  const g = new THREE.Group();
  const decal = (x, sa, sb, ya, yb, frameC = 'upvc') => {
    const front = x === 0;
    const out = front ? [-0.03, 0] : [DEPTH, DEPTH + 0.03];
    const glass = front ? [-0.036, -0.03] : [DEPTH + 0.03, DEPTH + 0.036];
    g.add(box(out[0], ya, sa, out[1], yb, sb, frameC));
    g.add(box(glass[0], ya + 0.06, sa + 0.06, glass[1], yb - 0.06, sb - 0.06, 'blackGlass'));
  };
  const mirror = (z, pivot) => 2 * pivot - z;
  for (const [pivot, render, zFar] of [[0, 'renderBeige', -6.25], [6.25, 'renderCream', 12.5]]) {
    const [za, zb] = pivot === 0 ? [zFar, 0] : [6.25, zFar];
    g.add(box(0, -0.33, za, DEPTH, EAVES, zb, render));
    const gz = pivot === 0 ? [zFar, zFar + T] : [zFar - T, zFar];
    g.add(prismZ([[0, EAVES], [DEPTH, EAVES], [DEPTH / 2, RIDGE]], gz[0], gz[1], render));
    g.add(terraceRoof(pivot === 0 ? zFar - 0.3 : za, pivot === 0 ? zb : zFar + 0.3, 'roofMoss'));
    const m = (a, b) => [Math.min(mirror(a, pivot), mirror(b, pivot)), Math.max(mirror(a, pivot), mirror(b, pivot))];
    for (const [a, b, ya, yb] of [[0.55, 1.66, 0.95, 2.05], [2.32, 3.37, 0.95, 2.05], [1.04, 2.55, 3.55, 4.75], [4.12, 5.21, 3.72, 4.75]]) decal(0, ...m(a, b), ya, yb);
    decal(0, ...m(4.55, 5.33), 0, 2.05);
    for (const [a, b] of [[1.04, 2.55], [4.52, 5.57]]) decal(DEPTH, ...m(a, b), 3.55, 4.75);
    for (const [a, b] of [[1.2, 2.9], [4.4, 5.6]]) decal(DEPTH, ...m(a, b), 0.85, 2.05);
  }
  chimney(g, 6.25);
  reg(g, { layer: 'neighbour', rooms: [], floors: [], label: 'Neighbouring homes in the terrace (not part of the sale)', src: 'photo' });
}

// ---------------------------------------------------------------------------
// Furnishings. Rooms follow the listing photos; bedroom 1 has no photo.
// ---------------------------------------------------------------------------

function furnish(put) {
  const P = 'photo', L = 'listing', I = 'inferred';
  const onWall = (attach, y, extra = {}) => ({ attach, y, ...extra });
  const blue = { door: 'duckEgg', panel: 'duckEggPanel', top: 'oakTop' };

  // Kitchen -------------------------------------------------------------------
  put('kitchen', 'Duck-egg blue shaker units under the front windows', P, [0.25, 0.85, 0.85, 3.3], '+x', (w, d) => F.sinkRun(w, d, { sinkAt: 0.7, upstand: 0, ceramic: true, tap: 'gold', units: blue }), { note: 'White ceramic sink with a brass tap under the window.' });
  put('kitchen', 'Duck-egg blue base units', P, [0.25, 0.25, 1.45, 0.85], '+z', (w, d) => F.baseUnits(w, d, { ...blue, drawers: [1] }));
  put('kitchen', 'Stainless range cooker', P, [1.45, 0.25, 2.45, 0.9], '+z', (w, d) => F.rangeCooker(w, d));
  put('kitchen', 'Duck-egg blue base units', P, [2.45, 0.25, 3.6, 0.85], '+z', (w, d) => F.baseUnits(w, d, blue));
  put('kitchen', 'Chimney extractor hood', P, [1.5, 0.25, 2.4, 0.75], '+z', (w, d) => F.hood(w, d, { flue: 0.66, splash: null }), onWall('gf-party-l-kitchen', 0.9));
  put('kitchen', 'Glazed wall cabinets', P, [0.55, 0.25, 1.4, 0.58], '+z', (w, d) => F.wallUnits(w, d, { door: 'duckEgg', glazed: true, h: 1.05 }), onWall('gf-party-l-kitchen', 1.1));
  put('kitchen', 'Glazed wall cabinets', P, [2.5, 0.25, 3.4, 0.58], '+z', (w, d) => F.wallUnits(w, d, { door: 'duckEgg', glazed: true }), onWall('gf-party-l-kitchen', 1.45));
  put('kitchen', 'Duck-egg blue base units', P, [2.0, 3.29, 3.2, 3.89], '-z', (w, d) => F.baseUnits(w, d, blue));
  put('kitchen', 'Freestanding fridge freezer', P, [3.2, 3.24, 3.84, 3.89], '-z', (w, d) => F.fridge(w, d));
  put('kitchen', 'Open shelf', P, [2.0, 3.65, 3.2, 3.89], '-z', (w, d) => F.shelf(w, d, { c: 'oakTop', bracket: 'oakTop' }), onWall('gf-kitchen-hall', 1.55));
  put('kitchen', 'Vertical radiator', P, [1.5, 3.79, 1.95, 3.89], '-z', (w) => F.radiator(w, 0, { h: 1.6 }), onWall('gf-kitchen-hall', 0));
  put('kitchen', 'Air fryer', P, [2.15, 3.45, 2.45, 3.8], '-z', (w, d) => F.microwave(w, d), { y: 0.9 });

  // Hall ----------------------------------------------------------------------
  put('hall', 'Column radiator', P, [0.25, 4.05, 0.35, 4.45], '+x', (w) => F.radiator(w, 0, { h: 1.55 }), onWall('gf-front-hall', 0));
  put('hall', 'Round brass mirror', P, [1.5, 3.99, 2.1, 3.99], '+z', (w) => F.roundMirror(w), onWall('gf-kitchen-hall', 1.6));
  put('hall', 'Doormat', I, [0.3, 4.6, 0.8, 5.3], '+x', (w, d) => F.rug(w, d, { c: '#3a3530' }));

  // WC ------------------------------------------------------------------------
  put('wc', 'Vessel basin on a tiled shelf', P, [3.55, 4.05, 3.86, 5.1], '-x', (w, d) => F.basinShelf(w, d));
  put('wc', 'Round brass mirror', P, [3.86, 4.3, 3.86, 4.9], '-x', (w) => F.roundMirror(w), onWall('gf-wc-dining', 1.6));
  put('wc', 'Wall-hung WC', P, [3.3, 5.3, 3.86, 5.78], '-x', (w, d) => F.toiletWall(w, d, { panel: 'metro', plate: 'gold' }));

  // Dining room ---------------------------------------------------------------
  put('dining', 'Chimney breast', I, [5.05, 0.25, 6.05, 0.62], '+z', (w, d) => F.chimneyBreast(w, d, { paper: 'dining22', recess: 0.6, recessH: 0.9, recessC: '#d9d4cb' }), { attach: 'gf-party-l-dining' });
  put('dining', 'White marble fire surround', P, [5.0, 0.62, 6.1, 1.02], '+z', (w, d) => F.fireSurround(w, d));
  put('dining', 'TV above the fireplace', P, [5.15, 0.62, 5.95, 0.62], '+z', (w) => F.tvPanel(w), onWall('gf-party-l-dining', 1.45));
  put('dining', 'Arched alcove shelving', P, [4.05, 0.25, 5.05, 0.62], '+z', (w, d) => F.alcoveUnit(w, d), { attach: 'gf-party-l-dining' });
  put('dining', 'Arched alcove niche', P, [6.05, 0.25, 7.0, 0.55], '+z', (w, d) => F.alcoveUnit(w, d, { cupboard: 0.95 }), { attach: 'gf-party-l-dining' });
  put('dining', 'Herringbone oak dining table', P, [4.85, 3.35, 6.65, 4.35], '+z', (w, d) => F.table(w, d, { top: 'herringbone', leg: 'black' }), { note: 'Also used as a home office in the photos.' });
  for (const x of [4.95, 5.55, 6.15]) {
    put('dining', 'Tan dining chair', P, [x, 2.93, x + 0.45, 3.35], '+z', (w, d) => F.chair(w, d, { c: 'black', seatC: 'tanLeather' }));
    put('dining', 'Tan dining chair', P, [x, 4.35, x + 0.45, 4.77], '-z', (w, d) => F.chair(w, d, { c: 'black', seatC: 'tanLeather' }));
  }
  put('dining', 'Two monitors', P, [6.0, 3.5, 6.5, 4.2], '-x', (w, d) => F.monitors(w, d), { y: 0.75 });
  put('dining', 'Brass-framed mirror', P, [4.9, 6.0, 6.1, 6.0], '-z', (w) => F.picture(w, 0.72, { frameC: 'gold', art: 'mirror' }), onWall('gf-party-r-dining', 1.35));
  put('dining', 'Wall clock', P, [7.1, 3.35, 7.1, 3.85], '-x', (w) => F.wallClock(w), onWall('gf-dining-living', 1.75));
  put('dining', 'Radiator', P, [7.0, 3.2, 7.1, 4.25], '-x', (w) => F.radiator(w, 0, { h: 0.45 }), onWall('gf-dining-living', 0));
  put('dining', 'Black ladder shelf', P, [6.55, 5.5, 7.05, 6.0], '-z', (w, d) => F.ladderShelf(w, d));
  put('dining', 'Large potted plant', P, [4.05, 2.95, 4.45, 3.35], '+z', () => F.plant({ h: 0.9, r: 0.18, pot: '#f2efe8' }));

  // Living room ---------------------------------------------------------------
  put('living', 'Taupe velvet corner sofa', P, [7.95, 3.95, 10.5, 6.0], '-z', (w, d) => F.cornerSofa(w, d, { pillows: ['#e7c6c2', '#cdb9a5'] }), { flip: true });
  put('living', 'Glass coffee table', P, [8.5, 3.55, 9.4, 4.65], '+z', (w, d) => F.table(w, d, { h: 0.45, glass: true, leg: 'gold' }));
  put('living', 'Abstract grey rug', P, [8.0, 3.05, 9.9, 5.15], '+z', (w, d) => F.rug(w, d));
  put('living', 'Mustard pouffe', P, [7.95, 4.3, 8.35, 4.7], '+z', (w, d) => F.pouffe(w, d));
  put('living', 'TV on the wall', P, [7.35, 3.3, 7.35, 4.35], '+x', (w) => F.tvPanel(w), onWall('gf-dining-living', 1.3));
  put('living', 'Radiator cover', P, [7.9, 0.25, 9.3, 0.5], '+z', (w, d) => F.radiatorCover(w, d));
  put('living', 'Brass-framed mirror', P, [8.0, 0.25, 9.2, 0.25], '+z', (w) => F.picture(w, 0.72, { frameC: 'gold', art: 'mirror' }), onWall('ext-side-l', 1.2));
  put('living', 'Mustard velvet ottoman', P, [8.1, 0.65, 9.1, 1.15], '+z', (w, d) => F.ottoman(w, d));
  put('living', 'Mustard tub chair', P, [10.35, 0.35, 11.0, 1.0], '+z', (w, d) => F.tubChair(w, d, { c: 'mustard', cushion: '#f2ece2', legs: 'gold' }));
  put('living', 'Side table', P, [7.45, 0.35, 7.8, 0.7], '+z', (w) => F.sideTableRound(w));
  put('living', 'Abstract gold wall art', P, [8.5, 6.0, 9.9, 6.0], '-z', (w) => F.picture(w, 0.75, { frameC: '#f3f2ee', art: '#cbb68a' }), onWall('ext-side-r', 1.25));
  put('living', 'Wall panelling and dado rail', P, [7.35, 0.25, 11.19, 0.25], '+z', (w) => F.wallPanels(w, 0, { n: 3 }), onWall('ext-side-l', 0));
  put('living', 'Wall panelling and dado rail', P, [7.35, 6.0, 11.19, 6.0], '-z', (w) => F.wallPanels(w, 0, { n: 3 }), onWall('ext-side-r', 0));
  for (const [z, wallId, f] of [[0.25, 'ext-side-l', '+z'], [6.0, 'ext-side-r', '-z']]) {
    for (const x of [7.75, 9.6]) put('living', 'Brass wall light', P, [x, z, x + 0.1, z], f, () => F.wallLight(), onWall(wallId, 1.75));
  }

  // Landing ---------------------------------------------------------------
  put('landing', 'Stair balustrade', P, [3.1, 5.23, 3.84, 5.27], '+z', (w, d) => F.balustrade(w, d));
  put('landing', 'Shelves in the storage cupboard', I, [2.5, 3.53, 3.0, 4.25], '+x', (w, d) => F.cupboardShelves(w, d));

  // Bedroom 1 (front, no photo) -------------------------------------------
  put('bed1', 'Double bed', I, [1.7, 0.95, 3.81, 2.45], '-x', (w, d) => F.bed(w, d, { head: '#bfb6aa', throwC: '#c9b8a3' }));
  put('bed1', 'Bedside table', I, [3.36, 0.5, 3.81, 0.92], '-x', (w, d) => F.chest(w, d, { h: 0.5, rows: 2 }));
  put('bed1', 'Bedside table', I, [3.36, 2.48, 3.81, 2.9], '-x', (w, d) => F.chest(w, d, { h: 0.5, rows: 2 }));
  put('bed1', 'Wardrobe', I, [0.55, 0.25, 1.6, 0.85], '+z', (w, d) => F.wardrobe(w, d));
  put('bed1', 'Chest of drawers', I, [0.45, 2.98, 1.45, 3.43], '-z', (w, d) => F.chest(w, d, { h: 0.8, rows: 3, cols: 2 }));
  put('bed1', 'Radiator', I, [0.25, 1.2, 0.35, 2.4], '+x', (w) => F.radiator(w, 0, { h: 0.45 }), onWall('ff-front-bed1', 0));
  put('bed1', 'Blind', I, [0.3, 1.1, 0.3, 2.49], '+x', (w) => F.blind(w, 2.1, { drop: 0.45 }), onWall('ff-front-bed1', 0));

  // Bedroom 2 (rear) --------------------------------------------------------
  put('bed2', 'Chimney breast', I, [5.1, 0.25, 6.0, 0.6], '+z', (w, d) => F.chimneyBreast(w, d, { paper: 'bedWhite' }), { attach: 'ff-party-l-bed2', note: 'Stacked over the dining-room fireplace.' });
  put('bed2', 'Wall-mounted TV in the alcove', P, [6.15, 0.25, 6.95, 0.25], '+z', (w) => F.tvPanel(w), onWall('ff-party-l-bed2', 1.25));
  put('bed2', 'Double bed', P, [5.15, 1.4, 6.65, 3.43], '-z', (w, d) => F.bed(w, d, { head: '#d9d2c4', base: '#d6cfc1' }));
  put('bed2', 'Mirrored bedside chest', P, [6.68, 2.95, 7.08, 3.43], '-z', (w, d) => F.chest(w, d, { h: 0.6, rows: 3, body: 'silver', front: 'mirror' }));
  put('bed2', 'Pink accent chair', P, [4.0, 0.35, 4.6, 0.95], '+z', (w, d) => F.tubChair(w, d, { c: 'pinkVelvet', cushion: '#f2e6e3', legs: 'darkWood' }));
  put('bed2', 'Brass-framed mirror', P, [4.05, 0.25, 4.55, 0.25], '+z', (w) => F.picture(w, 0.6, { frameC: 'gold', art: 'mirror' }), onWall('ff-party-l-bed2', 1.3));
  put('bed2', 'Radiator', P, [7.0, 1.2, 7.1, 2.4], '-x', (w) => F.radiator(w, 0, { h: 0.45 }), onWall('ff-rear-bed2', 0));
  put('bed2', 'Blind', P, [7.06, 1.1, 7.06, 2.49], '-x', (w) => F.blind(w, 2.1, { drop: 0.4 }), onWall('ff-rear-bed2', 0));

  // Bedroom 3 ---------------------------------------------------------------
  put('bed3', 'Mirrored dressing table', P, [6.62, 4.45, 7.1, 5.6], '-x', (w, d) => F.dressingTable(w, d, { lit: false, body: 'silver', top: 'mirror' }));
  put('bed3', 'Dressing stool', P, [6.15, 4.82, 6.5, 5.22], '-x', (w, d) => F.stool(w, d, { c: '#cfc4b3' }));
  put('bed3', 'Ornate silver floor mirror', P, [5.35, 3.53, 6.3, 3.9], '+z', (w, d) => F.floorMirror(w, d));
  put('bed3', 'White wardrobe', P, [5.25, 5.42, 6.3, 6.0], '-z', (w, d) => F.wardrobe(w, d));
  put('bed3', 'Blind', P, [7.06, 4.58, 7.06, 5.51], '-x', (w) => F.blind(w, 2.1, { drop: 0.35 }), onWall('ff-rear-bed3', 0));

  // Bathroom ----------------------------------------------------------------
  put('bath', 'Tiled ledge under the window', P, [0.25, 4.23, 0.45, 6.0], '+x', (w, d) => { const g = new THREE.Group(); g.add(box(-w / 2, 0, -d / 2, w / 2, 1.05, d / 2, 'beigeTile')); return g; });
  put('bath', 'Bath with frosted screen and handheld shower', P, [0.25, 3.53, 1.95, 4.23], '+z', (w, d) => F.bathStraight(w, d, { panel: 'beigeTile' }), { flip: true });
  put('bath', 'Wall-hung basin', P, [0.45, 5.25, 0.85, 5.8], '+x', (w, d) => F.basinWall(w, d));
  put('bath', 'Round brass mirror', P, [0.25, 5.25, 0.25, 5.85], '+x', (w) => F.roundMirror(w), onWall('ff-front-bath', 1.62));
  put('bath', 'Wall-hung WC', P, [0.95, 5.4, 1.5, 6.0], '-z', (w, d) => F.toiletWall(w, d));
  put('bath', 'Roman blind', P, [0.3, 4.18, 0.3, 5.15], '+x', (w) => F.blind(w, 2.08, { drop: 0.3, c: '#b9bcc0' }), onWall('ff-front-bath', 0));
}
