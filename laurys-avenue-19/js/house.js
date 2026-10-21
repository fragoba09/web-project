// house.js - builds 19 Laurys Avenue, a detached extended bungalow.
//
// The listing could not be reached with its floor plan or photos, so the layout
// is reasoned from the description alone: three bedrooms (the main one with an
// en-suite shower room), a family bathroom, a lounge with a woodburner opening
// into a sun room added in 2018, and a kitchen the sun room leads into. Behind
// the house is a split-level raised deck above a south-facing garden.
//
// Coordinates are metres. x runs from the front wall (x = 0) to the back of the
// bungalow (x = 9.0); the sun room adds 3.4 m more. z runs across the house,
// from the left gable (z = 0, seen from the road) to the right gable (z = 12.4),
// which faces the driveway. y is up; the floor is at y = 0. The garden behind
// the deck sits about a metre lower, held back by a stone retaining wall.
import * as THREE from 'three';
import { box, cyl, rod, prismZ } from '../../tour-kit/kit.js';
import * as F from '../../tour-kit/furniture.js';
import { createHouse, slopeX, fenceRun, hipRoof } from '../../tour-kit/model.js';

export const FLOOR_Y = [0];
const T = 0.3;
const DEPTH = 9.0, WIDTH = 12.4;
const PITCH = 30, EAVE = 2.7 - 0.35 * Math.tan((PITCH * Math.PI) / 180);
const LAWN_Y = -1.0;
const GUTTER = '#2b2d30';

export const ROOMS = {
  hall: { floor: 0, rect: [0.3, 3.1, 4.6, 8.2], floors: [[0.15, 3.05, 4.65, 4.75], [3.45, 4.75, 4.65, 8.25]], mat: 'oak', label: [1.6, 3.9], base: [[-0.05, 2.8, 4.9, 5.05], [3.15, 5.05, 4.9, 8.5]], fit: [-0.1, 2.8, 5.0, 8.5] },
  bed2: { floor: 0, rect: [0.3, 0.3, 4.6, 3.0], floors: [[0.15, 0.15, 4.65, 3.05]], mat: 'carpetGrey', label: [1.5, 1.65] },
  bed3: { floor: 0, rect: [0.3, 4.8, 3.4, 8.2], floors: [[0.15, 4.75, 3.45, 8.25]], mat: 'carpet', label: [1.2, 6.5] },
  bed1: { floor: 0, rect: [0.3, 8.3, 4.6, 12.1], floors: [[0.15, 8.25, 4.65, 10.25], [0.15, 10.25, 2.55, 12.25]], mat: 'carpetBeige', label: [0.9, 9.0], base: [[0.0, 8.0, 4.9, 10.25], [0.0, 10.25, 2.55, 12.4]] },
  ensuite: { floor: 0, rect: [2.6, 10.3, 4.6, 12.1], floors: [[2.55, 10.25, 4.65, 12.25]], mat: 'beigeFloor', label: [3.5, 11.0] },
  lounge: { floor: 0, rect: [4.7, 0.3, 8.7, 4.7], floors: [[4.65, 0.15, 8.85, 4.75]], mat: 'oak', label: [6.7, 2.7] },
  bath: { floor: 0, rect: [4.7, 4.8, 7.2, 7.0], floors: [[4.65, 4.75, 7.25, 7.05]], mat: 'beigeFloor', label: [5.6, 5.9] },
  utility: { floor: 0, rect: [7.3, 4.8, 8.7, 7.0], floors: [[7.25, 4.75, 8.85, 7.05]], mat: 'vinyl', label: [7.75, 6.4] },
  kitchen: { floor: 0, rect: [4.7, 7.1, 8.7, 12.1], floors: [[4.65, 7.05, 8.85, 12.25]], mat: 'greyLam', label: [6.6, 10.4] },
  sun: { floor: 0, rect: [9.0, 1.2, 12.2, 8.2], floors: [[8.85, 1.1, 12.3, 8.3]], mat: 'sunTile', label: [10.5, 4.6], base: [[8.7, 0.7, 12.7, 8.7]] },
};

export const ROOM_VIEW = { hall: 'hallway', lounge: 'lounge', sun: 'sun-room', kitchen: 'kitchen', utility: 'utility', bath: 'bathroom', bed1: 'bedroom-1', ensuite: 'en-suite', bed2: 'bedroom-2', bed3: 'bedroom-3' };

const FLOORING = {
  hall: ['Oak-effect flooring', 'inferred'],
  bed2: ['Grey carpet', 'inferred'],
  bed3: ['Carpet', 'inferred'],
  bed1: ['Carpet', 'inferred'],
  ensuite: ['Tiled floor', 'inferred'],
  lounge: ['Oak-effect flooring', 'inferred'],
  bath: ['Tiled floor', 'inferred'],
  utility: ['Vinyl flooring', 'inferred'],
  kitchen: ['Grey laminate flooring', 'inferred'],
  sun: ['Large stone-effect floor tiles', 'inferred'],
};

const HOUSE = createHouse({
  floorY: FLOOR_Y,
  wallY: [[-0.12, 2.7]],
  rooms: ROOMS,
  roomView: ROOM_VIEW,
  flooring: FLOORING,
  finishes: { hall: 'hall19', lounge: 'lounge19', kitchen: 'kitchen19', sun: 'sun19', bed1: 'bed1w19', bed2: 'bed2w19', bed3: 'bed3w19', utility: 'utility19', bath: 'bathTile', ensuite: 'metro' },
  extMat: 'renderWhite',
  frames: { out: 'upvc', in: 'upvc' },
  sill: 'concrete',
});
const { wall, door, win, gap } = HOUSE;
const I = 'inferred', L = 'listing';
const pvc = (o) => ({ label: 'White uPVC double-glazed window', src: L, ...o });

// ---------------------------------------------------------------------------
// Outside walls of the bungalow
// ---------------------------------------------------------------------------

wall('front-bed2', 0, 'z', [0, T], [0, 3.05], { neg: 'ext', pos: 'bed2' }, { out: '-x', ends: ['ext'], holes: [win(0.9, 2.4, 0.9, 2.1, pvc())] });
wall('front-hall', 0, 'z', [0, T], [3.05, 4.75], { neg: 'ext', pos: 'hall' }, {
  out: '-x',
  holes: [
    door(3.25, 4.15, { y: [0, 2.05], leaf: 'extFront', color: 'compositeDoor', label: 'Front door', src: I }),
    win(4.25, 4.6, 0.1, 2.05, { panes: 1, obscure: true, label: 'Obscure-glazed side light', src: I }),
  ],
});
wall('front-bed3', 0, 'z', [0, T], [4.75, 8.25], { neg: 'ext', pos: 'bed3' }, { out: '-x', holes: [win(5.8, 7.2, 0.9, 2.1, pvc())] });
wall('front-bed1', 0, 'z', [0, T], [8.25, WIDTH], { neg: 'ext', pos: 'bed1' }, { out: '-x', ends: [null, 'ext'], holes: [win(9.4, 11.0, 0.9, 2.1, pvc({ panes: 3 }))] });

wall('gable-l-bed2', 0, 'x', [0, T], [0.3, 4.65], { neg: 'ext', pos: 'bed2' }, { out: '-z' });
wall('gable-l-lounge', 0, 'x', [0, T], [4.65, 8.7], { neg: 'ext', pos: 'lounge' }, { out: '-z', holes: [win(4.95, 5.85, 0.9, 2.1, pvc())] });
wall('gable-r-bed1', 0, 'x', [WIDTH - T, WIDTH], [0.3, 2.55], { neg: 'bed1', pos: 'ext' }, { out: '+z' });
wall('gable-r-ensuite', 0, 'x', [WIDTH - T, WIDTH], [2.55, 4.65], { neg: 'ensuite', pos: 'ext' }, {
  out: '+z', holes: [win(3.0, 3.6, 1.35, 2.05, pvc({ panes: 1, obscure: true, label: 'Obscure-glazed en-suite window', src: I }))],
});
wall('gable-r-kitchen', 0, 'x', [WIDTH - T, WIDTH], [4.65, 8.7], { neg: 'kitchen', pos: 'ext' }, {
  out: '+z', holes: [win(6.2, 7.6, 1.05, 2.1, pvc({ label: 'Kitchen window over the sink', src: I }))],
});

// The back wall: outside at either end, inside the sun room in the middle.
wall('rear-lounge', 0, 'z', [8.7, DEPTH], [0, 1.1], { neg: 'lounge', pos: 'ext' }, { out: '+x', ends: ['ext'] });
wall('rear-lounge-sun', 0, 'z', [8.7, DEPTH], [1.1, 4.75], { neg: 'lounge', pos: 'sun' }, { holes: [gap(1.4, 4.4, 2.1)] });
wall('rear-utility-sun', 0, 'z', [8.7, DEPTH], [4.75, 7.05], { neg: 'utility', pos: 'sun' });
wall('rear-kitchen-sun', 0, 'z', [8.7, DEPTH], [7.05, 8.3], { neg: 'kitchen', pos: 'sun' }, {
  holes: [door(7.25, 8.05, { leaf: 'extGlazed', swing: { hinge: 0, side: 'neg', angle: 75 }, label: 'Glazed door from the sun room to the kitchen', src: L })],
});
wall('rear-kitchen', 0, 'z', [8.7, DEPTH], [8.3, WIDTH], { neg: 'kitchen', pos: 'ext' }, { out: '+x', ends: [null, 'ext'], holes: [win(10.5, 11.5, 1.05, 2.1, pvc())] });

// ---------------------------------------------------------------------------
// Inside walls
// ---------------------------------------------------------------------------

wall('bed2-hall', 0, 'x', [3.0, 3.1], [0.3, 4.6], { neg: 'bed2', pos: 'hall' }, {
  holes: [door(3.65, 4.45, { swing: { hinge: 1, side: 'neg', angle: 80 }, label: 'Door to bedroom 2', src: I })],
});
wall('hall-bed3', 0, 'x', [4.7, 4.8], [0.3, 3.4], { neg: 'hall', pos: 'bed3' }, {
  holes: [door(2.45, 3.25, { swing: { hinge: 1, side: 'pos', angle: 80 }, label: 'Door to bedroom 3', src: I })],
});
wall('bed3-corr', 0, 'z', [3.4, 3.5], [4.7, 8.3], { neg: 'bed3', pos: 'hall' });
wall('bed3-bed1', 0, 'x', [8.2, 8.3], [0.3, 3.4], { neg: 'bed3', pos: 'bed1' });
wall('corr-bed1', 0, 'x', [8.2, 8.3], [3.4, 4.6], { neg: 'hall', pos: 'bed1' }, {
  holes: [door(3.6, 4.4, { swing: { hinge: 0, side: 'pos', angle: 80 }, label: 'Door to the main bedroom', src: I })],
});
wall('bed1-ensuite', 0, 'x', [10.2, 10.3], [2.5, 4.6], { neg: 'bed1', pos: 'ensuite' }, {
  holes: [door(2.75, 3.45, { swing: { hinge: 0, side: 'pos', angle: 80 }, label: 'Door to the en-suite', src: I })],
});
wall('bed1-ensuite2', 0, 'z', [2.5, 2.6], [10.3, 12.1], { neg: 'bed1', pos: 'ensuite' });
wall('bed2-lounge', 0, 'z', [4.6, 4.7], [0.3, 3.05], { neg: 'bed2', pos: 'lounge' });
wall('hall-lounge', 0, 'z', [4.6, 4.7], [3.05, 4.75], { neg: 'hall', pos: 'lounge' }, {
  holes: [door(3.3, 4.1, { leaf: 'glazedInt', swing: { hinge: 0, side: 'pos', angle: 80 }, label: 'Glazed door to the lounge', src: I })],
});
wall('corr-bath', 0, 'z', [4.6, 4.7], [4.75, 7.05], { neg: 'hall', pos: 'bath' }, {
  holes: [door(5.1, 5.9, { swing: { hinge: 0, side: 'pos', angle: 80 }, label: 'Door to the bathroom', src: I })],
});
wall('corr-kitchen', 0, 'z', [4.6, 4.7], [7.05, 8.25], { neg: 'hall', pos: 'kitchen' }, {
  holes: [door(7.3, 8.1, { leaf: 'glazedInt', swing: { hinge: 1, side: 'pos', angle: 80 }, label: 'Glazed door to the kitchen', src: I })],
});
wall('bed1-kitchen', 0, 'z', [4.6, 4.7], [8.25, 10.25], { neg: 'bed1', pos: 'kitchen' });
wall('ensuite-kitchen', 0, 'z', [4.6, 4.7], [10.25, 12.1], { neg: 'ensuite', pos: 'kitchen' });
wall('lounge-bath', 0, 'x', [4.7, 4.8], [4.7, 7.25], { neg: 'lounge', pos: 'bath' });
wall('lounge-utility', 0, 'x', [4.7, 4.8], [7.25, 8.7], { neg: 'lounge', pos: 'utility' });
wall('bath-utility', 0, 'z', [7.2, 7.3], [4.8, 7.0], { neg: 'bath', pos: 'utility' });
wall('bath-kitchen', 0, 'x', [7.0, 7.1], [4.7, 7.25], { neg: 'bath', pos: 'kitchen' });
wall('utility-kitchen', 0, 'x', [7.0, 7.1], [7.25, 8.7], { neg: 'utility', pos: 'kitchen' }, {
  holes: [door(7.5, 8.3, { swing: { hinge: 0, side: 'pos', angle: 80 }, label: 'Door to the utility room', src: I })],
});

// ---------------------------------------------------------------------------
// Sun room (2018): rendered dwarf walls, big uPVC windows, a lean-to roof
// ---------------------------------------------------------------------------

const SUN_Y = [-0.12, 2.14];
const sunWin = (s0, s1) => win(s0, s1, 0.55, 2.0, pvc({ panes: 3, label: 'Sun-room window', src: I }));
wall('sun-rear', 0, 'z', [12.2, 12.4], [1.0, 8.4], { neg: 'sun', pos: 'ext' }, {
  y: SUN_Y, out: '+x', ends: ['ext', 'ext'],
  holes: [sunWin(1.35, 3.75), { kind: 'french', s: [3.95, 5.45], y: [0, 2.0], label: 'French doors to the deck', src: I }, sunWin(5.65, 8.05)],
});
wall('sun-side-l', 0, 'x', [1.0, 1.2], [9.0, 12.2], { neg: 'ext', pos: 'sun' }, { y: SUN_Y, out: '-z', holes: [sunWin(9.5, 11.9)] });
wall('sun-side-r', 0, 'x', [8.2, 8.4], [9.0, 12.2], { neg: 'sun', pos: 'ext' }, { y: SUN_Y, out: '+z', holes: [sunWin(9.6, 11.9)] });

// ---------------------------------------------------------------------------
// Model assembly
// ---------------------------------------------------------------------------

export function buildModel() {
  const { reg, put, finish } = HOUSE.start();
  buildRoofs(reg);
  buildSite(reg, put);
  buildNeighbours(reg);
  furnish(put);
  return finish();
}

// ---------------------------------------------------------------------------
// Roofs: a hipped concrete-tile roof over the bungalow (pitch estimated at 30°)
// and a shallow lean-to with roof lights over the sun room.
// ---------------------------------------------------------------------------

const SUN_ROOF = { y0: 2.38, fall: 0.07, x1: 12.6 };
const sunRoofY = (x) => SUN_ROOF.y0 - SUN_ROOF.fall * (x - DEPTH);

function eaves(g, x0, x1, z0, z1, skip) {
  // Fascia, soffit and gutter along each eave; `skip` leaves out the back run over the sun room.
  const fy0 = EAVE - 0.2, fy1 = EAVE + 0.02;
  const runs = [
    ['x', x0, z0, z1, -1], ['x', x1, z0, z1, 1], ['z', z0, x0, x1, -1], ['z', z1, x0, x1, 1],
  ];
  for (const [axis, at, a, b, s] of runs) {
    const parts = axis === 'x' && s === 1 && skip ? [[a, skip[0]], [skip[1], b]] : [[a, b]];
    for (const [p, q] of parts) {
      const f = [at, at + s * 0.03].sort((u, v) => u - v), gt = [at + s * 0.03, at + s * 0.15].sort((u, v) => u - v);
      const so = [at - s * 0.35, at].sort((u, v) => u - v);
      if (axis === 'x') {
        g.add(box(f[0], fy0, p, f[1], fy1, q, 'fascia'), box(gt[0], fy0 + 0.02, p, gt[1], fy0 + 0.12, q, GUTTER), box(so[0], EAVE - 0.03, p, so[1], EAVE, q, 'fascia'));
      } else {
        g.add(box(p, fy0, f[0], q, fy1, f[1], 'fascia'), box(p, fy0 + 0.02, gt[0], q, fy0 + 0.12, gt[1], GUTTER), box(p, EAVE - 0.03, so[0], q, EAVE, so[1], 'fascia'));
      }
    }
  }
}

function buildRoofs(reg) {
  const main = new THREE.Group();
  const [x0, x1, z0, z1] = [-0.35, DEPTH + 0.35, -0.35, WIDTH + 0.35];
  const { g: hip, top, ridge } = hipRoof(x0, x1, z0, z1, EAVE, PITCH, 'roof');
  main.add(hip);
  const cap = '#3a3e44';
  main.add(rod([ridge[0][0], top + 0.03, ridge[0][1]], [ridge[1][0], top + 0.03, ridge[1][1]], 0.06, cap));
  for (const [cx, cz, r] of [[x0, z0, 0], [x1, z0, 0], [x0, z1, 1], [x1, z1, 1]]) {
    main.add(rod([cx, EAVE + 0.03, cz], [ridge[r][0], top + 0.03, ridge[r][1]], 0.05, cap));
  }
  eaves(main, x0, x1, z0, z1, [0.85, 8.55]);
  // Chimney for the lounge woodburner, on the left gable.
  main.add(box(6.35, 2.55, -0.05, 7.05, 4.0, 0.65, 'renderWhite'));
  main.add(box(6.3, 4.0, -0.1, 7.1, 4.08, 0.7, 'concrete'));
  main.add(cyl(6.55, 4.08, 0.3, 0.09, 0.3, '#a9643f'), cyl(6.85, 4.08, 0.3, 0.09, 0.3, '#a9643f'));
  // Vertical flue for the oil boiler in the utility room.
  main.add(cyl(8.4, 2.9, 4.95, 0.06, 0.75, GUTTER), cyl(8.4, 3.65, 4.95, 0.1, 0.14, GUTTER));
  for (const [x, z] of [[x0 - 0.1, z0 + 0.12], [x1 + 0.1, z1 - 0.12], [x0 - 0.1, z1 - 0.12]]) main.add(rod([x, -0.15, z], [x, EAVE - 0.12, z], 0.04, GUTTER));
  reg(main, { layer: 'roof', rooms: [], floors: [0], label: 'Hipped concrete-tile roof (pitch estimated at 30°)', src: I, note: 'Many bungalows of this age in Ramsey have hipped roofs. The listing does not describe the roof.' });

  const sun = new THREE.Group();
  const { x1: sx1 } = SUN_ROOF;
  const [za, zb] = [0.8, 8.6];
  sun.add(slopeX(DEPTH, SUN_ROOF.y0, sx1, sunRoofY(sx1), za, zb, 0.1, 'sunRoof'));
  for (const [ra, rb] of [[1.9, 3.5], [5.7, 7.3]]) {
    sun.add(slopeX(9.6, sunRoofY(9.6) + 0.1, 11.8, sunRoofY(11.8) + 0.1, ra - 0.06, rb + 0.06, 0.03, 'upvc'));
    sun.add(slopeX(9.66, sunRoofY(9.66) + 0.13, 11.74, sunRoofY(11.74) + 0.13, ra, rb, 0.012, 'glass'));
  }
  // Rendered infills between the side walls and the sloping roof.
  for (const [a, b] of [[1.0, 1.2], [8.2, 8.4]]) sun.add(prismZ([[DEPTH, SUN_Y[1]], [12.4, SUN_Y[1]], [DEPTH, SUN_ROOF.y0]], a, b, 'renderWhite'));
  sun.add(box(DEPTH, SUN_ROOF.y0 + 0.09, za, DEPTH + 0.08, SUN_ROOF.y0 + 0.24, zb, 'lead'));
  const ey = sunRoofY(sx1);
  sun.add(box(sx1, ey - 0.12, za, sx1 + 0.03, ey + 0.1, zb, 'fascia'), box(sx1 + 0.03, ey - 0.1, za, sx1 + 0.15, ey, zb, GUTTER));
  sun.add(rod([sx1 + 0.1, -0.15, zb - 0.1], [sx1 + 0.1, ey - 0.05, zb - 0.1], 0.04, GUTTER));
  reg(sun, { layer: 'roof', rooms: [], floors: [0], label: 'Lean-to sun-room roof with two roof lights', src: I, note: 'The sun room was added by the owner in 2018. Its roof type is not described, so a light solid roof with roof lights is shown.' });

  const steps = new THREE.Group();
  steps.add(box(-0.55, -0.16, 3.15, 0, -0.04, 4.7, 'concrete'));
  reg(steps, { layer: 'site', rooms: [], floors: [0] });
}

// ---------------------------------------------------------------------------
// Plot: lawn and a tarmac drive at the front, a split-level deck and a lower
// lawn behind. The listing gives no plot sizes; these are estimates.
// ---------------------------------------------------------------------------

const FENCE = 'fenceTimber', FENCE_POST = '#9b7a50';

function buildSite(reg, put) {
  const ground = new THREE.Group();
  // Upper level (house, drive, front garden); its back edge is a stone retaining wall.
  ground.add(box(-12, -1.4, -12.5, 12.4, -0.16, 25, ['stoneWall', 'board', 'lawnPlain', 'board', 'board', 'board']));
  ground.add(box(12.4, -1.4, -12.5, 30, LAWN_Y, 25, ['board', 'board', 'lawnPlain', 'board', 'board', 'board']));
  ground.add(box(-12, -0.16, -12.5, -9.2, -0.145, 25, 'road'));
  ground.add(box(-9.2, -0.16, -12.5, -9.0, -0.09, 25, 'concrete'));
  ground.add(box(-9.0, -0.16, -12.5, -7.6, -0.135, 25, 'concrete'));
  // Front: tarmac drive up the right-hand side, a lawn and a path to the door.
  ground.add(box(-7.6, -0.16, 4.95, 0, -0.13, 14.0, 'tarmac'));
  ground.add(box(0, -0.16, 12.4, 3.0, -0.13, 14.0, 'tarmac'));
  ground.add(box(-7.6, -0.16, -1.6, -0.9, -0.135, 4.95, 'lawn'));
  ground.add(box(-0.9, -0.16, -1.6, 0, -0.13, 4.95, 'flags'));
  // Side passages and the patio behind the kitchen.
  ground.add(box(0, -0.16, -1.6, 12.4, -0.13, 0, 'gravel'));
  ground.add(box(3.0, -0.16, 12.4, DEPTH, -0.13, 14.0, 'gravel'));
  ground.add(box(DEPTH, -0.16, 8.4, 12.4, -0.13, 14.0, 'flags'));
  ground.add(box(DEPTH, -0.16, 0, 12.4, -0.13, 1.0, 'gravel'));
  // Lower garden: lawn with planted borders.
  ground.add(box(17.6, LAWN_Y, -1.55, 28.0, LAWN_Y + 0.015, 13.95, 'lawn'));
  ground.add(box(28.0, LAWN_Y, -1.55, 28.75, LAWN_Y + 0.02, 13.95, 'soil'));
  ground.add(box(12.4, LAWN_Y, 10.0, 17.6, LAWN_Y + 0.015, 13.95, 'lawn'));
  ground.add(box(12.4, LAWN_Y, -1.55, 17.6, LAWN_Y + 0.02, 0.3, 'soil'));
  ground.add(box(15.4, LAWN_Y, 6.0, 17.6, LAWN_Y + 0.015, 10.0, 'lawn'));
  // Low rendered wall along the front lawn.
  ground.add(box(-7.6, -0.16, -1.6, -7.35, 0.5, 4.95, 'renderWhite'), box(-7.65, 0.5, -1.65, -7.3, 0.56, 4.95, 'concrete'));
  reg(ground, { layer: 'site', rooms: [], floors: [0] });

  // Split-level raised deck: upper level off the sun room, a lower level, steps to the lawn.
  const deck = new THREE.Group();
  const skirt = ['fenceTimber', 'fenceTimber', 'deck', 'fenceTimber', 'fenceTimber', 'fenceTimber'];
  deck.add(box(12.4, LAWN_Y, 0.3, 15.4, -0.05, 10.0, skirt));
  deck.add(box(15.4, LAWN_Y, 0.3, 17.6, -0.5, 6.0, skirt));
  deck.add(box(15.4, -0.5, 1.6, 15.75, -0.27, 4.6, skirt));
  deck.add(box(17.6, LAWN_Y, 2.4, 17.9, -0.67, 3.6, skirt), box(17.9, LAWN_Y, 2.4, 18.2, -0.84, 3.6, skirt));
  reg(deck, { layer: 'site', rooms: [], floors: [0], label: 'Split-level raised timber deck', src: L, note: 'The listing describes an extensive split-level raised deck. Its size and shape here are estimates.' });

  const rail = (rect, facing, y) => put(null, 'Deck balustrade', I, rect, facing, (w, d) => F.balustrade(w, d, { c: '#7a5c3e', rail: '#7a5c3e', h: 0.95 }), { layer: 'site', floors: [0], y });
  rail([12.45, 0.3, 15.4, 0.36], '+z', -0.05);
  rail([12.45, 9.94, 15.4, 10.0], '-z', -0.05);
  rail([15.34, 6.0, 15.4, 9.94], '+x', -0.05);
  rail([15.45, 0.3, 17.6, 0.36], '+z', -0.5);
  rail([15.45, 5.94, 17.6, 6.0], '-z', -0.5);
  rail([17.54, 0.36, 17.6, 2.4], '+x', -0.5);
  rail([17.54, 3.6, 17.6, 5.94], '+x', -0.5);

  const bounds = new THREE.Group();
  for (const z of [-1.6, 14.0]) {
    fenceRun(bounds, 0, 12.4, 'x', z, 1.65, FENCE, FENCE_POST, 1.83, -0.16);
    fenceRun(bounds, 12.4, 28.8, 'x', z, LAWN_Y + 1.8, FENCE, FENCE_POST, 1.83, LAWN_Y);
  }
  fenceRun(bounds, -1.6, 14.0, 'z', 28.8, LAWN_Y + 1.8, FENCE, FENCE_POST, 1.83, LAWN_Y);
  // Side gates.
  bounds.add(box(0.95, -0.14, -1.6, 1.01, 1.6, 0, FENCE), box(2.95, -0.14, 12.4, 3.01, 1.6, 14.0, FENCE));
  reg(bounds, { layer: 'site', tall: true, rooms: [], floors: [0], label: 'Timber boundary fencing and side gates', src: I, note: 'The listing describes an enclosed south-facing rear garden.' });

  const site = { layer: 'site', floors: [0], y: -0.13 };
  const tall = { ...site, tall: true };
  const lawn = { ...site, y: LAWN_Y + 0.015 };
  const upper = { ...site, y: -0.05 };
  const lower = { ...site, y: -0.5 };
  put(null, 'Car, shown for scale on the driveway', I, [-6.3, 6.3, -1.8, 8.1], '+z', (w, d) => F.car(w, d, { c: '#6d7480' }), { ...tall, note: 'The listing mentions a large driveway with parking for two or more vehicles.' });
  put(null, 'Car, shown for scale on the driveway', I, [-6.3, 9.6, -1.8, 11.4], '+z', (w, d) => F.car(w, d, { c: '#8c2f2b' }), tall);
  put(null, 'Ornamental tree in the front lawn', I, [-5.6, 0.2, -4.2, 1.6], '+z', () => F.tree({ h: 3.0, r: 1.1, seed: 9 }), tall);
  for (const [z, i] of [[-1.1, 0], [0.5, 1], [2.2, 2]]) put(null, 'Planting by the front path', I, [-1.5, z - 0.3, -0.9, z + 0.3], '+z', () => F.shrub({ r: 0.3, seed: i + 11 }), site);
  put(null, 'Wheelie bins', I, [1.5, 13.3, 2.1, 13.95], '-z', (w, d) => F.wheelieBin(w, d), site);
  put(null, 'Wheelie bins', I, [2.15, 13.3, 2.75, 13.95], '-z', (w, d) => F.wheelieBin(w, d, { c: '#3d5a8a' }), site);
  put(null, 'Bunded heating-oil tank', L, [9.8, 12.95, 11.8, 13.85], '-z', (w, d) => F.oilTank(w, d), { ...site, note: 'Oil-fired central heating is listed. The tank position is a guess.' });

  // Garden furniture on the decks.
  put(null, 'Patio table', I, [13.3, 6.6, 14.2, 7.5], '+z', (w) => F.patioTable(w), upper);
  for (const [r, f] of [[[13.45, 5.85, 14.05, 6.45], '+z'], [[13.45, 7.65, 14.05, 8.25], '-z'], [[12.55, 6.75, 13.15, 7.35], '+x'], [[14.35, 6.75, 14.95, 7.35], '-x']]) {
    put(null, 'Patio chair', I, r, f, (w, d) => F.tubChair(w, d), upper);
  }
  for (const z of [4.2, 5.05]) put(null, 'Sun lounger', I, [15.85, z, 17.45, z + 0.7], '+x', (w, d) => F.lounger(w, d), lower);
  put(null, 'Potted plant', I, [12.5, 0.45, 12.9, 0.85], '+z', () => F.plant({ h: 0.8, r: 0.2, pot: '#7d4a33' }), upper);
  put(null, 'Potted plant', I, [12.5, 9.45, 12.9, 9.85], '+z', () => F.plant({ h: 0.8, r: 0.2, pot: '#7d4a33' }), upper);

  // Lower garden.
  put(null, 'Timber garden shed', L, [26.2, 10.4, 28.2, 13.2], '-x', (w, d) => F.shed(w, d, { body: 'fenceTimber', trim: '#6d5136' }), { ...lawn, tall: true, note: 'The listing mentions a timber shed. Its size and position are estimates.' });
  put(null, 'Tree at the bottom of the garden', I, [27.0, -1.0, 28.6, 0.6], '+z', () => F.tree({ h: 3.6, r: 1.3, seed: 4 }), { ...lawn, tall: true });
  const shrubs = [[28.3, 2.5], [28.3, 5.0], [28.3, 7.6], [14.0, -0.6], [16.2, -0.9], [20.0, 13.5], [23.0, 13.5]];
  shrubs.forEach(([x, z], i) => put(null, 'Border planting', I, [x - 0.3, z - 0.3, x + 0.3, z + 0.3], '+z', () => F.shrub({ r: 0.32, seed: i + 3 }), lawn));
}

// ---------------------------------------------------------------------------
// Neighbouring bungalows in the cul-de-sac, kept plain.
// ---------------------------------------------------------------------------

function buildNeighbours(reg) {
  const g = new THREE.Group();
  for (const [za, zb, render] of [[-11.0, -3.6, 'renderBeige'], [16.0, 23.4, 'renderCream']]) {
    g.add(box(0.5, -0.16, za, 9.5, 2.6, zb, render));
    g.add(hipRoof(0.15, 9.85, za - 0.35, zb + 0.35, 2.6 - 0.35 * Math.tan((PITCH * Math.PI) / 180), PITCH, 'roofNeighbour').g);
    for (const [a, b] of [[za + 1.0, za + 2.4], [zb - 2.4, zb - 1.0]]) {
      g.add(box(0.47, 0.9, a, 0.5, 2.1, b, 'upvc'), box(0.465, 0.96, a + 0.06, 0.47, 2.04, b - 0.06, 'blackGlass'));
    }
    g.add(box(0.47, 0, (za + zb) / 2 - 0.45, 0.5, 2.05, (za + zb) / 2 + 0.45, 'upvc'));
    g.add(box(-6.5, -0.16, za, 0.5, -0.13, za + 3.2, 'tarmac'));
  }
  reg(g, { layer: 'neighbour', rooms: [], floors: [], label: 'Neighbouring bungalows (not part of the sale)', src: I });
}

// ---------------------------------------------------------------------------
// Furnishings. Nothing here comes from photos: appliances and fittings named in
// the listing are tagged 'listing', and everything else is a plausible guess.
// ---------------------------------------------------------------------------

const GREY = { door: 'kitchenGrey', panel: 'kitchenGreyPanel', top: 'quartz' };

// Full-height kitchen housing: an integrated fridge freezer, or a built-in oven.
function tallUnit(w, d, oven) {
  const g = new THREE.Group();
  const x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2;
  g.add(box(x0, 0, z0, x1, 2.15, z1 - 0.02, 'kitchenGrey'));
  const panels = oven ? [[0.08, 0.84], [1.52, 2.1]] : [[0.08, 1.0], [1.04, 2.1]];
  for (const [a, b] of panels) {
    g.add(box(x0 + 0.03, a, z1 - 0.02, x1 - 0.03, b, z1 - 0.01, 'kitchenGreyPanel'));
    g.add(box(x1 - 0.08, oven ? b - 0.12 : a + 0.06, z1 - 0.01, x1 - 0.06, oven ? b - 0.04 : a + 0.4, z1 + 0.02, 'steel'));
  }
  if (oven) {
    g.add(box(x0 + 0.03, 0.88, z1 - 0.02, x1 - 0.03, 1.48, z1, 'blackGlass'));
    g.add(box(x0 + 0.08, 1.38, z1, x1 - 0.08, 1.4, z1 + 0.03, 'steel'));
  }
  return g;
}

function furnish(put) {
  const onWall = (attach, y, extra = {}) => ({ attach, y, ...extra });
  const blind = (room, rect, facing, wallId, o = {}) => put(room, 'Roller blind', I, rect, facing, (w) => F.blind(w, 2.1, { drop: 0.4, ...o }), onWall(wallId, 0));
  const rad = (room, rect, facing, wallId, h = 0.5) => put(room, 'Radiator', L, rect, facing, (w) => F.radiator(w, 0, { h }), onWall(wallId, 0, { note: 'Oil-fired central heating is listed.' }));

  // Lounge -----------------------------------------------------------------
  put('lounge', 'Stone chimney breast', I, [6.0, 0.3, 7.4, 0.75], '+z', (w, d) => F.chimneyBreast(w, d, { paper: 'stoneBreast', recess: 0.8, recessH: 1.0, recessC: '#2b2c2e' }), { attach: 'gable-l-lounge' });
  put('lounge', 'Woodburning stove', L, [6.43, 0.34, 6.97, 0.76], '+z', () => F.stove(), { note: 'The listing describes a spacious lounge with a woodburner.' });
  put('lounge', 'Slate hearth', I, [6.05, 0.75, 7.35, 1.2], '+z', (w, d) => F.hearth(w, d));
  put('lounge', 'TV on a low unit', I, [7.6, 0.3, 8.6, 0.72], '+z', (w, d) => F.tvUnit(w, d));
  put('lounge', 'Three-seater sofa', I, [5.4, 3.75, 7.8, 4.7], '-z', (w, d) => F.sofa(w, d, { body: '#8f8a84', seats: 3, pillows: ['#c9a97e', '#d8d2c6'] }));
  put('lounge', 'Armchair', I, [4.8, 1.55, 5.65, 2.45], '+x', (w, d) => F.sofa(w, d, { body: '#8f8a84', seats: 1 }));
  put('lounge', 'Coffee table', I, [6.1, 2.15, 7.3, 2.8], '+z', (w, d) => F.table(w, d, { h: 0.45, top: 'oakWood', leg: 'oakWood' }));
  put('lounge', 'Rug', I, [5.7, 1.55, 7.8, 3.45], '+z', (w, d) => F.rug(w, d, { c: 'rugSage' }));
  put('lounge', 'Log basket', I, [7.45, 0.85, 7.85, 1.17], '+z', (w, d) => { const g = new THREE.Group(); g.add(box(-w / 2, 0, -d / 2, w / 2, 0.32, d / 2, 'rattan')); for (const x of [-0.1, 0, 0.1]) g.add(cyl(x, 0.32, 0, 0.05, 0.06, '#8a6a48')); return g; });
  put('lounge', 'Floor lamp', I, [8.2, 3.95, 8.5, 4.25], '+z', () => F.lampFloor());
  rad('lounge', [4.95, 0.3, 5.85, 0.4], '+z', 'gable-l-lounge');
  put('lounge', 'Curtains', I, [4.95, 0.33, 5.85, 0.33], '+z', (w) => F.curtains(w, 2.2, { c: '#b7a58a' }), onWall('gable-l-lounge', 0));

  // Sun room ---------------------------------------------------------------
  put('sun', 'Sofa facing into the room', I, [11.3, 1.45, 12.2, 3.75], '-x', (w, d) => F.sofa(w, d, { body: '#c8c0b3', seats: 3, pillows: ['#7f9a8c', '#e0c48f'] }));
  put('sun', 'Rattan armchair', I, [9.55, 1.35, 10.25, 2.05], '+x', (w, d) => F.tubChair(w, d), {});
  put('sun', 'Rattan armchair', I, [9.55, 2.85, 10.25, 3.55], '+x', (w, d) => F.tubChair(w, d), {});
  put('sun', 'Coffee table', I, [10.4, 2.1, 11.05, 3.2], '+z', (w, d) => F.table(w, d, { h: 0.42, glass: true, leg: 'black' }));
  put('sun', 'Dining table', I, [10.0, 5.85, 11.4, 6.85], '+z', (w, d) => F.table(w, d, { top: 'oakWood', leg: 'oakWood' }));
  for (const x of [10.1, 10.75]) {
    put('sun', 'Dining chair', I, [x, 5.43, x + 0.45, 5.85], '+z', (w, d) => F.chair(w, d, { c: 'oakWood', seatC: '#d8d2c6' }));
    put('sun', 'Dining chair', I, [x, 6.85, x + 0.45, 7.27], '-z', (w, d) => F.chair(w, d, { c: 'oakWood', seatC: '#d8d2c6' }));
  }
  put('sun', 'Large potted plant', I, [11.7, 7.6, 12.1, 8.0], '+z', () => F.plant({ h: 1.0, r: 0.22, pot: '#f2efe8' }));
  put('sun', 'Large potted plant', I, [9.15, 1.35, 9.5, 1.7], '+z', () => F.plant({ h: 0.9, r: 0.18, pot: '#f2efe8' }));
  put('sun', 'Rug', I, [9.5, 1.5, 11.25, 3.55], '+z', (w, d) => F.rug(w, d, { c: 'rugPattern' }));

  // Kitchen ----------------------------------------------------------------
  put('kitchen', 'Integrated fridge freezer', L, [4.72, 11.5, 5.37, 12.1], '-z', (w, d) => tallUnit(w, d, false));
  put('kitchen', 'Built-in oven', L, [5.37, 11.5, 5.97, 12.1], '-z', (w, d) => tallUnit(w, d, true));
  put('kitchen', 'Grey handleless units with a sink under the side window', I, [5.97, 11.5, 8.1, 12.1], '-z', (w, d) => F.sinkRun(w, d, { sinkAt: 0.1, upstand: 0, units: GREY }));
  put('kitchen', 'Corner unit', I, [8.1, 11.5, 8.7, 12.1], '-z', (w, d) => F.baseUnits(w, d, GREY));
  put('kitchen', 'Space and plumbing for a washing machine', L, [8.1, 8.2, 8.7, 8.8], '-x', (w, d) => F.washer(w, d));
  put('kitchen', 'Worktop over the washing machine', I, [8.1, 8.2, 8.7, 8.8], '-x', (w, d) => { const g = new THREE.Group(); g.add(box(-w / 2, 0.86, -d / 2, w / 2, 0.9, d / 2, 'quartz')); return g; });
  put('kitchen', 'Integrated dishwasher', L, [8.1, 8.8, 8.7, 9.4], '-x', (w, d) => F.baseUnits(w, d, { ...GREY, n: 1 }));
  put('kitchen', 'Base units', I, [8.1, 9.4, 8.7, 10.3], '-x', (w, d) => F.baseUnits(w, d, { ...GREY, drawers: [0, 1] }));
  put('kitchen', 'Integrated gas hob', L, [8.15, 9.55, 8.65, 10.15], '-x', (w, d) => F.hob(w, d), { y: 0.9 });
  put('kitchen', 'Extractor hood', L, [8.25, 9.45, 8.7, 10.25], '-x', (w, d) => F.hood(w, d, { flue: 0.6, splash: 'blackGlass' }), onWall('rear-kitchen', 0.9));
  put('kitchen', 'Base units under the back window', I, [8.1, 10.3, 8.7, 11.5], '-x', (w, d) => F.baseUnits(w, d, GREY));
  put('kitchen', 'Wall cabinets', I, [8.35, 8.3, 8.7, 9.4], '-x', (w, d) => F.wallUnits(w, d, { door: 'kitchenGrey', panel: 'kitchenGreyPanel' }), onWall('rear-kitchen', 1.45));
  put('kitchen', 'Wall cabinets', I, [7.6, 11.75, 8.35, 12.1], '-z', (w, d) => F.wallUnits(w, d, { door: 'kitchenGrey', panel: 'kitchenGreyPanel' }), onWall('gable-r-kitchen', 1.45));
  put('kitchen', 'Kitchen table', I, [5.5, 8.6, 6.9, 9.5], '+z', (w, d) => F.table(w, d, { top: 'oakWood', leg: 'black' }));
  for (const x of [5.6, 6.3]) {
    put('kitchen', 'Kitchen chair', I, [x, 8.18, x + 0.45, 8.6], '+z', (w, d) => F.chair(w, d, { c: 'black', seatC: '#8f8a84' }));
    put('kitchen', 'Kitchen chair', I, [x, 9.5, x + 0.45, 9.92], '-z', (w, d) => F.chair(w, d, { c: 'black', seatC: '#8f8a84' }));
  }
  rad('kitchen', [5.0, 7.1, 6.4, 7.2], '+z', 'bath-kitchen', 0.45);
  blind('kitchen', [6.2, 12.06, 7.6, 12.06], '-z', 'gable-r-kitchen', { drop: 0.35 });

  // Utility ------------------------------------------------------------------
  put('utility', 'Oil-fired boiler', L, [7.95, 4.8, 8.55, 5.4], '+z', (w, d) => F.oilBoiler(w, d), { note: 'The listing says a new boiler was fitted about two years before the sale. Its position is a guess: here it has a vertical flue through the roof.' });
  put('utility', 'Storage shelving', I, [7.3, 4.85, 7.75, 5.75], '+x', (w, d) => F.rack(w, d, { h: 1.8 }));
  put('utility', 'Coat hooks', I, [7.3, 6.0, 7.3, 6.8], '+x', (w) => F.coatHooks(w), onWall('bath-utility', 1.65));

  // Bathroom -----------------------------------------------------------------
  put('bath', 'Bath with a shower over', L, [6.5, 5.3, 7.2, 7.0], '-x', (w, d) => F.bathStraight(w, d));
  put('bath', 'WC', I, [5.0, 6.4, 5.55, 7.0], '-z', (w, d) => F.toilet(w, d));
  put('bath', 'Vanity basin', I, [5.85, 4.8, 6.45, 5.28], '+z', (w, d) => F.vanity(w, d));
  put('bath', 'Mirror', I, [5.85, 4.8, 6.45, 4.8], '+z', (w) => F.picture(w, 0.7, { frameC: 'chrome', art: 'mirror' }), onWall('lounge-bath', 1.15));
  put('bath', 'Towel radiator', I, [4.7, 6.05, 4.8, 6.55], '+x', (w) => F.towelRail(w, 0.9), onWall('corr-bath', 0));
  put('bath', 'Extractor fan', I, [6.0, 7.0, 6.0, 7.0], '-z', () => F.extractorFan(), onWall('bath-kitchen', 2.2, { note: 'The bathroom is placed in the middle of the house, so it has no window.' }));

  // Hall ---------------------------------------------------------------------
  put('hall', 'Coat hooks', I, [1.0, 3.1, 1.8, 3.1], '+z', (w) => F.coatHooks(w), onWall('bed2-hall', 1.65));
  put('hall', 'Shoe rack', I, [0.4, 3.1, 0.95, 3.42], '+z', (w, d) => F.shoeRack(w, d));
  put('hall', 'Doormat', I, [0.3, 3.3, 0.8, 4.1], '+x', (w, d) => F.rug(w, d, { c: '#3a3530' }));
  put('hall', 'Hall runner', I, [3.7, 5.1, 4.4, 7.9], '+z', (w, d) => F.rug(w, d, { c: 'rugGrey' }));
  rad('hall', [1.0, 4.6, 1.9, 4.7], '-z', 'hall-bed3');
  put('hall', 'Mirror', I, [3.5, 6.0, 3.5, 6.7], '+x', (w) => F.picture(w, 0.9, { frameC: '#2b2b2b', art: 'mirror' }), onWall('bed3-corr', 1.2));

  // Bedroom 1 (main, with en-suite) ---------------------------------------------
  put('bed1', 'Double bed', I, [0.72, 10.05, 2.12, 12.1], '-z', (w, d) => F.bed(w, d, { head: '#a7adb3', base: '#b8bdc2', throwC: '#6f7f91' }));
  put('bed1', 'Bedside table', I, [0.32, 11.68, 0.68, 12.1], '-z', (w, d) => F.chest(w, d, { h: 0.5, rows: 2 }));
  put('bed1', 'Bedside table', I, [2.14, 11.68, 2.5, 12.1], '-z', (w, d) => F.chest(w, d, { h: 0.5, rows: 2 }));
  put('bed1', 'Double wardrobe', I, [4.0, 9.15, 4.6, 10.2], '-x', (w, d) => F.wardrobe(w, d, { h: 2.1 }));
  put('bed1', 'Chest of drawers', I, [0.3, 8.4, 0.75, 9.25], '+x', (w, d) => F.chest(w, d, { h: 0.8, rows: 3 }));
  rad('bed1', [0.3, 9.6, 0.4, 10.8], '+x', 'front-bed1');
  blind('bed1', [0.3, 9.4, 0.3, 11.0], '+x', 'front-bed1');

  // En-suite -------------------------------------------------------------------
  put('ensuite', 'Shower cubicle', L, [3.7, 11.2, 4.6, 12.1], '-z', (w, d) => F.showerCubicle(w, d), { flip: true, note: 'The listing describes the main bedroom\'s en-suite as a shower room.' });
  put('ensuite', 'WC', I, [2.62, 11.45, 3.17, 12.1], '-z', (w, d) => F.toilet(w, d));
  put('ensuite', 'Vanity basin', I, [4.12, 10.35, 4.6, 10.95], '-x', (w, d) => F.vanity(w, d));
  put('ensuite', 'Mirror', I, [4.6, 10.35, 4.6, 10.95], '-x', (w) => F.picture(w, 0.65, { frameC: 'chrome', art: 'mirror' }), onWall('ensuite-kitchen', 1.15));
  put('ensuite', 'Towel radiator', I, [2.6, 10.45, 2.7, 10.95], '+x', (w) => F.towelRail(w, 0.9), onWall('bed1-ensuite2', 0));

  // Bedroom 2 (front left) -----------------------------------------------------
  put('bed2', 'Double bed', I, [2.0, 0.3, 3.5, 2.35], '+z', (w, d) => F.bed(w, d, { head: '#c9c2b6', base: '#d6cfc1', throwC: '#b48a78' }));
  put('bed2', 'Bedside table', I, [1.52, 0.3, 1.97, 0.72], '+z', (w, d) => F.chest(w, d, { h: 0.5, rows: 2 }));
  put('bed2', 'Bedside table', I, [3.53, 0.3, 3.98, 0.72], '+z', (w, d) => F.chest(w, d, { h: 0.5, rows: 2 }));
  put('bed2', 'Wardrobe', I, [4.0, 0.9, 4.6, 2.05], '-x', (w, d) => F.wardrobe(w, d));
  put('bed2', 'Chest of drawers', I, [0.32, 2.42, 0.77, 2.98], '+x', (w, d) => F.chest(w, d, { h: 0.75, rows: 3 }));
  rad('bed2', [0.3, 1.15, 0.4, 2.15], '+x', 'front-bed2');
  blind('bed2', [0.3, 0.9, 0.3, 2.4], '+x', 'front-bed2');

  // Bedroom 3 (front middle) ---------------------------------------------------
  put('bed3', 'Double bed', I, [1.5, 5.95, 3.4, 7.35], '-x', (w, d) => F.bed(w, d, { head: '#9aa3ad', base: '#aeb5bc', throwC: '#d9c29a' }));
  put('bed3', 'Bedside table', I, [3.0, 7.4, 3.4, 7.82], '-x', (w, d) => F.chest(w, d, { h: 0.5, rows: 2 }));
  put('bed3', 'Wardrobe', I, [0.45, 7.6, 1.45, 8.2], '-z', (w, d) => F.wardrobe(w, d));
  put('bed3', 'Desk', I, [0.4, 4.8, 1.6, 5.35], '+z', (w, d) => F.desk(w, d));
  put('bed3', 'Desk chair', I, [0.75, 5.35, 1.25, 5.85], '-z', (w, d) => F.officeChair(w, d));
  rad('bed3', [0.3, 5.9, 0.4, 7.1], '+x', 'front-bed3');
  blind('bed3', [0.3, 5.8, 0.3, 7.2], '+x', 'front-bed3');
}
