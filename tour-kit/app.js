// app.js - renderer, camera, scene switching and the page UI for a 3D house tour.
// Each house page calls startTour() with its model builder and its scene content.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { setEnvMap, setMaxAnisotropy } from './kit.js';
import { OUT } from './model.js';

const D = Math.PI / 180;
const FRUSTUM = 10;
const CAM_R = 120;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const PROVENANCE = {
  plan: { label: 'Floor plan', hint: 'Position or size taken from the floor plan' },
  listing: { label: 'Listing', hint: 'Named in the listing description' },
  photo: { label: 'Photos', hint: 'Seen in the listing photos' },
  inferred: { label: 'Inferred', hint: 'Not shown in the listing; filled in by reasoning' },
};

// config: { buildModel, ROOMS, FLOOR_Y, ROOM_VIEW, VIEWS, PROPERTY, storageKey }
export function startTour({ buildModel, ROOMS, FLOOR_Y, ROOM_VIEW, VIEWS, PROPERTY, storageKey = 'tour-prefs' }) {
  const VIEW_BY_ID = Object.fromEntries(VIEWS.map((v) => [v.id, v]));
  const roomY = (r) => r.y ?? FLOOR_Y[r.floor];

  const els = {
    stage: $('#stage'), canvas: $('#canvas'), labels: $('#labels'), tip: $('#tip'), loading: $('#loading'),
    nav: $('#scene-list'), details: $('#details'), pagerTitle: $('#pager-title'), pagerCount: $('#pager-count'),
    prev: $('#prev'), next: $('#next'), walls: $('#walls'), labelsToggle: $('#labels-toggle'),
  };

  const prefs = { walls: 'cutaway', labels: true };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (['cutaway', 'full', 'low'].includes(saved.walls)) prefs.walls = saved.walls;
    if (typeof saved.labels === 'boolean') prefs.labels = saved.labels;
  } catch { /* storage unavailable */ }
  function savePrefs() {
    try { localStorage.setItem(storageKey, JSON.stringify(prefs)); } catch { /* storage unavailable */ }
  }

  // ---------------------------------------------------------------------------
  // Renderer, lights, model
  // ---------------------------------------------------------------------------

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (err) {
    els.loading.textContent = 'This browser could not start WebGL, so the 3D model cannot be shown. Try a recent version of Chrome, Edge, Firefox or Safari.';
    throw err;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  els.canvas.appendChild(renderer.domElement);
  setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  setEnvMap(pmrem.fromScene(new RoomEnvironment(), 0.04).texture);

  scene.add(new THREE.HemisphereLight('#ffffff', '#b9b1a3', 1.25));
  const sun = new THREE.DirectionalLight('#fff3df', 2.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  const fill = new THREE.DirectionalLight('#dbe6ff', 0.5);
  scene.add(sun, sun.target, fill, fill.target);

  const model = buildModel();
  scene.add(model.root);
  for (const n of model.nodes) {
    if (n.userData.attach) {
      n.userData.swapFull = n.getObjectByName('full') ?? null;
      n.userData.swapCut = n.getObjectByName('cut') ?? null;
    }
  }

  const camera = new THREE.OrthographicCamera(-FRUSTUM, FRUSTUM, FRUSTUM, -FRUSTUM, 0.1, 400);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.screenSpacePanning = true;
  controls.minPolarAngle = 10 * D;
  controls.maxPolarAngle = 84 * D;
  controls.rotateSpeed = 0.7;
  controls.zoomToCursor = true;

  const highlight = new THREE.Box3Helper(new THREE.Box3(), new THREE.Color('#ffae1a'));
  highlight.material.depthTest = false;
  highlight.renderOrder = 10;
  highlight.visible = false;
  scene.add(highlight);

  let dirty = true;

  function stageSize() {
    return { w: Math.max(1, els.canvas.clientWidth), h: Math.max(1, els.canvas.clientHeight) };
  }

  function resize() {
    const { w, h } = stageSize();
    renderer.setSize(w, h, false);
    const a = w / h;
    camera.left = -FRUSTUM * a;
    camera.right = FRUSTUM * a;
    camera.top = FRUSTUM;
    camera.bottom = -FRUSTUM;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  new ResizeObserver(resize).observe(els.canvas);
  resize();

  // ---------------------------------------------------------------------------
  // Camera helpers
  // ---------------------------------------------------------------------------

  function placeCamera(target, az, el, zoom) {
    const phi = (90 - el) * D, th = az * D;
    camera.position.set(
      target.x + CAM_R * Math.sin(phi) * Math.sin(th),
      target.y + CAM_R * Math.cos(phi),
      target.z + CAM_R * Math.sin(phi) * Math.cos(th),
    );
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    controls.target.copy(target);
    camera.lookAt(target);
  }

  function currentPose() {
    const off = new THREE.Vector3().subVectors(camera.position, controls.target);
    const s = new THREE.Spherical().setFromVector3(off);
    return { target: controls.target.clone(), az: s.theta / D, el: 90 - s.phi / D, zoom: camera.zoom };
  }

  function viewBox(view) {
    if (view.box) return view.box;
    const r = ROOMS[view.room];
    const fy = roomY(r);
    const [x0, z0, x1, z1] = r.fit ?? [r.rect[0] - 0.3, r.rect[1] - 0.3, r.rect[2] + 0.3, r.rect[3] + 0.3];
    return [[x0, fy - 0.45, z0], [x1, fy + 2.45, z1]];
  }

  // Target and zoom that frame the view's box from the given angle.
  function fit(view, az, el) {
    const [mn, mx] = viewBox(view);
    const phi = (90 - el) * D, th = az * D;
    const dir = new THREE.Vector3(Math.sin(phi) * Math.sin(th), Math.cos(phi), Math.sin(phi) * Math.cos(th));
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
    const up = new THREE.Vector3().crossVectors(dir, right).normalize();
    const c = new THREE.Vector3((mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const x of [mn[0], mx[0]]) for (const y of [mn[1], mx[1]]) for (const z of [mn[2], mx[2]]) {
      const p = new THREE.Vector3(x, y, z).sub(c);
      const px = p.dot(right), py = p.dot(up);
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    }
    const target = c.addScaledVector(right, (x0 + x1) / 2).addScaledVector(up, (y0 + y1) / 2);
    const { w, h } = stageSize();
    const usableH = Math.max(0.55, (h - 120) / h);
    const zoom = Math.min((FRUSTUM * (w / h)) / (((x1 - x0) / 2) * 1.08), (FRUSTUM * usableH) / (((y1 - y0) / 2) * 1.04));
    return { target, zoom };
  }

  let tween = null;
  function animateTo(to, ms = 750) {
    if (reduceMotion || ms <= 0) {
      placeCamera(to.target, to.az, to.el, to.zoom);
      controls.update();
      onCameraChange();
      return;
    }
    const from = currentPose();
    const dAz = ((((to.az - from.az) % 360) + 540) % 360) - 180;
    tween = { from, to: { ...to, az: from.az + dAz }, t0: performance.now(), ms };
    controls.enabled = false;
  }

  function clearInspect() {
    pinned = null;
    hovered = null;
    showTip(null);
    setHighlight(null);
  }

  function rotateBy(deg) {
    clearInspect();
    const p = currentPose();
    animateTo({ ...p, az: p.az + deg }, 500);
  }

  function zoomBy(f) {
    clearInspect();
    const p = currentPose();
    animateTo({ ...p, zoom: THREE.MathUtils.clamp(p.zoom * f, controls.minZoom, controls.maxZoom) }, 250);
  }

  // ---------------------------------------------------------------------------
  // Visibility and the dollhouse cutaway
  // ---------------------------------------------------------------------------

  let current = null;

  function applyVisibility(view) {
    const f = view.floor;
    for (const n of model.nodes) {
      const u = n.userData;
      let vis;
      if (view.kind === 'exterior') vis = u.layer !== 'base';
      else if (view.kind === 'floor') {
        if (u.layer === 'base' || u.layer === 'neighbour') vis = false;
        else if (u.layer === 'site') vis = !u.tall;
        else if (u.layer === 'roof') vis = u.floors[0] < f;
        else if (u.layer === 'wall') vis = u.floors[0] === f || (u.floors[0] < f && u.ext);
        else if (u.layer === 'floor') vis = u.floors[0] <= f;
        else vis = u.floors.includes(f);
      } else {
        vis = u.layer !== 'site' && u.layer !== 'roof' && u.layer !== 'neighbour' && (u.rooms ?? []).includes(view.room);
      }
      u.viewVisible = vis;
    }
    for (const w of model.walls) w.isFull = null;
    updateCutaway();
  }

  function wallFull(w, view, dir) {
    const def = w.def;
    if (view.kind === 'exterior') return true;
    if (view.kind === 'floor' && def.floor < view.floor) return true;
    if (prefs.walls === 'full') return true;
    if (prefs.walls === 'low') return false;
    let n = def.out ? OUT[def.out] : null;
    if (!n && view.kind === 'room') {
      const r = ROOMS[view.room].rect;
      const mid = (def.at[0] + def.at[1]) / 2;
      n = def.dir === 'z' ? [Math.sign(mid - (r[0] + r[2]) / 2), 0] : [0, Math.sign(mid - (r[1] + r[3]) / 2)];
    }
    if (!n) return false;
    return n[0] * dir.x + n[1] * dir.z < 0.2;
  }

  function updateCutaway() {
    if (!current) return;
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).setY(0).normalize();
    for (const w of model.walls) {
      const vis = w.group.userData.viewVisible;
      w.group.visible = vis;
      if (!vis) continue;
      const full = wallFull(w, current, dir);
      if (full !== w.isFull) {
        w.isFull = full;
        w.full.visible = full;
        if (w.cut) w.cut.visible = !full;
      }
    }
    for (const n of model.nodes) {
      const u = n.userData;
      if (u.layer === 'wall') continue;
      let vis = u.viewVisible;
      if (vis && u.attach) {
        const w = model.wallById.get(u.attach);
        const full = w.isFull !== false;
        if (u.swapFull) { u.swapFull.visible = full; u.swapCut.visible = !full; } else vis = full;
      }
      n.visible = vis;
    }
  }

  function updateLights() {
    const t = controls.target;
    const off = new THREE.Vector3().subVectors(camera.position, t);
    const camAz = Math.atan2(off.x, off.z);
    const a = camAz + 38 * D, e = 54 * D;
    sun.position.set(t.x + 30 * Math.cos(e) * Math.sin(a), t.y + 30 * Math.sin(e), t.z + 30 * Math.cos(e) * Math.cos(a));
    sun.target.position.copy(t);
    const b = camAz - 120 * D;
    fill.position.set(t.x + 20 * Math.sin(b), t.y + 12, t.z + 20 * Math.cos(b));
    fill.target.position.copy(t);
  }

  function setShadowBounds(view) {
    const [mn, mx] = viewBox(view);
    const r = Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) / 2 + 1;
    const cam = sun.shadow.camera;
    cam.left = -r; cam.right = r; cam.top = r; cam.bottom = -r; cam.near = 1; cam.far = 80;
    cam.updateProjectionMatrix();
  }

  function onCameraChange() {
    updateCutaway();
    updateLights();
    dirty = true;
  }

  // ---------------------------------------------------------------------------
  // Labels in the scene
  // ---------------------------------------------------------------------------

  let tags = [];

  function titleOf(id) { return VIEW_BY_ID[id]?.title ?? id; }
  function metricOf(id) { return VIEW_BY_ID[id]?.info?.dims?.met ?? ''; }

  function buildTags(view) {
    els.labels.replaceChildren();
    tags = [];
    const defs = [];
    if (view.kind === 'floor') {
      for (const [id, r] of Object.entries(ROOMS)) {
        if (r.floor !== view.floor) continue;
        const vid = ROOM_VIEW[id];
        defs.push({ text: titleOf(vid), sub: metricOf(vid), pos: [r.label[0], roomY(r) + 0.35, r.label[1]], go: vid });
      }
    } else if (view.labels) defs.push(...view.labels);
    for (const d of defs) {
      const el = document.createElement(d.go ? 'button' : 'span');
      el.className = d.go ? 'tag tag-link' : 'tag';
      el.innerHTML = `<span class="tag-name">${esc(d.text)}</span>${d.sub ? `<span class="tag-dims">${esc(d.sub)}</span>` : ''}`;
      if (d.go) {
        el.type = 'button';
        el.setAttribute('aria-label', `Open ${d.text}`);
        el.addEventListener('click', () => go(d.go));
      }
      els.labels.append(el);
      tags.push({ el, pos: new THREE.Vector3(...d.pos) });
    }
    els.labels.hidden = !prefs.labels;
  }

  function positionTags() {
    if (!prefs.labels || !tags.length) return;
    const { w, h } = stageSize();
    const v = new THREE.Vector3();
    for (const t of tags) {
      v.copy(t.pos).project(camera);
      const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
      t.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
      t.el.style.visibility = x < -40 || x > w + 40 || y < -20 || y > h + 20 ? 'hidden' : 'visible';
    }
  }

  // ---------------------------------------------------------------------------
  // Hover and tap inspection
  // ---------------------------------------------------------------------------

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = null;
  let pinned = null;

  function shown(o) {
    for (let p = o; p; p = p.parent) if (!p.visible) return false;
    return true;
  }

  function tagged(o) {
    for (let p = o; p && p !== model.root; p = p.parent) if (p.userData.label || p.userData.goto) return p;
    return null;
  }

  function pick(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    for (const hit of raycaster.intersectObject(model.root, true)) {
      if (!shown(hit.object)) continue;
      const m = Array.isArray(hit.object.material) ? hit.object.material[hit.face?.materialIndex ?? 0] : hit.object.material;
      if (m?.transparent && m.opacity < 0.5) continue;
      return tagged(hit.object);
    }
    return null;
  }

  function chip(src) {
    const p = PROVENANCE[src];
    return p ? `<span class="chip chip-${src}" title="${esc(p.hint)}">${esc(p.label)}</span>` : '';
  }

  function describe(node) {
    const u = node.userData;
    if (current.kind === 'floor' && u.goto) {
      return { title: titleOf(u.goto), meta: metricOf(u.goto), note: 'Click to open this room.', src: 'plan' };
    }
    return { title: u.label, meta: '', note: u.note, src: u.src };
  }

  function showTip(node, x, y) {
    if (!node) { els.tip.hidden = true; return; }
    const d = describe(node);
    els.tip.innerHTML = `<div class="tip-head"><strong>${esc(d.title)}</strong>${chip(d.src)}</div>${d.meta ? `<div class="tip-meta">${esc(d.meta)}</div>` : ''}${d.note ? `<p>${esc(d.note)}</p>` : ''}`;
    els.tip.hidden = false;
    const { w, h } = stageSize();
    const tw = els.tip.offsetWidth, th = els.tip.offsetHeight;
    const left = Math.min(Math.max(8, x + 14), w - tw - 8);
    const top = y + th + 22 > h ? Math.max(8, y - th - 12) : y + 16;
    els.tip.style.transform = `translate(${left}px, ${top}px)`;
  }

  function setHighlight(node) {
    if (node) {
      highlight.box.setFromObject(node);
      highlight.visible = true;
    } else highlight.visible = false;
    dirty = true;
  }

  let moveQueued = null;
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    moveQueued = { x: e.clientX, y: e.clientY };
  });
  renderer.domElement.addEventListener('pointerleave', () => {
    moveQueued = null;
    if (!pinned) { hovered = null; showTip(null); setHighlight(null); }
  });

  function processHover() {
    if (!moveQueued || tween) return;
    const { x, y } = moveQueued;
    moveQueued = null;
    const node = pick(x, y);
    const rect = els.canvas.getBoundingClientRect();
    if (node !== hovered) {
      hovered = node;
      pinned = null;
      setHighlight(node);
      renderer.domElement.style.cursor = node && current.kind === 'floor' && node.userData.goto ? 'pointer' : '';
    }
    showTip(node, x - rect.left, y - rect.top);
  }

  let downAt = null;
  renderer.domElement.addEventListener('pointerdown', (e) => {
    downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
  });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    const quick = performance.now() - downAt.t < 450;
    downAt = null;
    if (moved > 6 || !quick) return;
    const node = pick(e.clientX, e.clientY);
    if (node && current.kind === 'floor' && node.userData.goto) { go(node.userData.goto); return; }
    const rect = els.canvas.getBoundingClientRect();
    pinned = node;
    hovered = node;
    setHighlight(node);
    showTip(node, e.clientX - rect.left, e.clientY - rect.top);
  });

  controls.addEventListener('start', () => {
    if (!pinned) { showTip(null); setHighlight(null); hovered = null; }
  });

  function focusNode(node) {
    pinned = node;
    hovered = node;
    setHighlight(node);
    const box = new THREE.Box3().setFromObject(node);
    const c = box.getCenter(new THREE.Vector3()).project(camera);
    const { w, h } = stageSize();
    showTip(node, (c.x * 0.5 + 0.5) * w, (-c.y * 0.5 + 0.5) * h);
  }

  // ---------------------------------------------------------------------------
  // Page UI
  // ---------------------------------------------------------------------------

  function renderNav() {
    const groups = [];
    for (const v of VIEWS) {
      let g = groups.find((x) => x.name === v.group);
      if (!g) groups.push((g = { name: v.group, views: [] }));
      g.views.push(v);
    }
    els.nav.innerHTML = groups.map((g) => `
      <li class="scene-group">
        <span class="scene-group-name">${esc(g.name)}</span>
        <ul>${g.views.map((v) => `
          <li><button type="button" class="scene" data-view="${v.id}">
            <span class="scene-no">${String(VIEWS.indexOf(v) + 1).padStart(2, '0')}</span>
            <span class="scene-title">${esc(v.title)}</span>
            <span class="scene-dims">${esc(v.info?.dims?.met ?? '')}</span>
          </button></li>`).join('')}
        </ul>
      </li>`).join('');
    els.nav.addEventListener('click', (e) => {
      const b = e.target.closest('[data-view]');
      if (b) go(b.dataset.view);
    });
  }

  function inventory(view) {
    const counts = new Map();
    const add = (node) => {
      const label = node.userData.label;
      if (!label) return;
      const entry = counts.get(label) ?? { label, src: node.userData.src, nodes: [] };
      entry.nodes.push(node);
      counts.set(label, entry);
    };
    if (view.kind === 'room') {
      for (const n of model.nodes) if (n.userData.layer === 'item' && n.userData.rooms.includes(view.room)) add(n);
      for (const w of model.walls) {
        if (!w.rooms.includes(view.room)) continue;
        for (const c of w.full.children) if (c.userData.label) add(c);
      }
    } else if (view.kind === 'exterior') {
      for (const n of model.nodes) if (['site', 'roof', 'neighbour'].includes(n.userData.layer)) add(n);
    }
    return [...counts.values()];
  }

  let inventoryEntries = [];

  function list(title, src, items) {
    if (!items?.length) return '';
    return `<section class="facts facts-${src}"><h3>${chip(src)}<span>${esc(title)}</span></h3><ul>${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>`;
  }

  function renderDetails(view) {
    const info = view.info ?? {};
    const idx = VIEWS.indexOf(view);
    const eyebrow = info.eyebrow ?? `${view.group} · scene ${idx + 1} of ${VIEWS.length}`;
    const dims = info.dims
      ? `<p class="dims"><span>${esc(info.dims.imp)}</span><span>${esc(info.dims.met)}</span>${info.dims.note ? `<span class="dims-note">${esc(info.dims.note)}</span>` : ''}</p>`
      : '';
    let extra = '';
    if (view.kind === 'floor') {
      const rooms = VIEWS.filter((v) => v.kind === 'room' && ROOMS[v.room].floor === view.floor);
      extra = `<section class="inventory"><h3>Rooms on this floor</h3><ul>${rooms.map((r) => `<li><button type="button" data-go="${r.id}"><span>${esc(r.title)}</span><span class="mono">${esc(r.info.dims.met)}</span></button></li>`).join('')}</ul></section>`;
    } else {
      inventoryEntries = inventory(view);
      if (inventoryEntries.length) {
        extra = `<section class="inventory"><h3>In this scene <span class="count">${inventoryEntries.length}</span></h3><ul>${inventoryEntries.map((e, i) => `<li><button type="button" data-item="${i}"><span>${esc(e.label)}${e.nodes.length > 1 ? ` <span class="mono">×${e.nodes.length}</span>` : ''}</span>${chip(e.src)}</button></li>`).join('')}</ul></section>`;
      }
    }
    els.details.innerHTML = `
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h2>${esc(view.title)}</h2>
      ${dims}
      ${info.summary ? `<p class="summary">${esc(info.summary)}</p>` : ''}
      ${list('From the listing', 'listing', info.listing)}
      ${list('Seen in the photos', 'photo', info.photos)}
      ${list('Filled in by reasoning', 'inferred', info.inferred)}
      ${extra}`;
    els.details.scrollTop = 0;
  }

  els.details.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]');
    if (g) { go(g.dataset.go); return; }
    const it = e.target.closest('[data-item]');
    if (it) {
      const entry = inventoryEntries[Number(it.dataset.item)];
      const node = entry?.nodes.find(shown) ?? entry?.nodes[0];
      if (node) focusNode(node);
    }
  });

  function renderPager(view) {
    const i = VIEWS.indexOf(view);
    els.pagerTitle.textContent = view.title;
    els.pagerCount.textContent = `${i + 1} / ${VIEWS.length}`;
    els.prev.setAttribute('aria-label', `Previous scene: ${VIEWS[(i - 1 + VIEWS.length) % VIEWS.length].title}`);
    els.next.setAttribute('aria-label', `Next scene: ${VIEWS[(i + 1) % VIEWS.length].title}`);
    for (const b of els.nav.querySelectorAll('[data-view]')) {
      const on = b.dataset.view === view.id;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      if (on && window.matchMedia('(max-width: 1080px)').matches) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    els.walls.querySelectorAll('button').forEach((b) => { b.disabled = view.kind === 'exterior'; });
  }

  function go(id, { instant = false } = {}) {
    const view = VIEW_BY_ID[id];
    if (!view) return;
    current = view;
    clearInspect();
    applyVisibility(view);
    setShadowBounds(view);
    const { target, zoom } = fit(view, view.az, view.el);
    controls.minZoom = zoom * 0.45;
    controls.maxZoom = zoom * 7;
    animateTo({ target, az: view.az, el: view.el, zoom }, instant ? 0 : 750);
    buildTags(view);
    renderDetails(view);
    renderPager(view);
    try { history.replaceState(null, '', `#${id}`); } catch { /* sandboxed */ }
    dirty = true;
  }

  function step(d) {
    const i = VIEWS.indexOf(current);
    go(VIEWS[(i + d + VIEWS.length) % VIEWS.length].id);
  }

  function resetView() {
    clearInspect();
    const { target, zoom } = fit(current, current.az, current.el);
    animateTo({ target, az: current.az, el: current.el, zoom }, 600);
  }

  function setWalls(mode) {
    prefs.walls = mode;
    savePrefs();
    for (const b of els.walls.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
    if (current) applyVisibility(current);
    dirty = true;
  }

  function setLabels(on) {
    prefs.labels = on;
    savePrefs();
    els.labelsToggle.setAttribute('aria-pressed', String(on));
    els.labels.hidden = !on;
    dirty = true;
  }

  $('#rot-left').addEventListener('click', () => rotateBy(-90));
  $('#rot-right').addEventListener('click', () => rotateBy(90));
  $('#zoom-in').addEventListener('click', () => zoomBy(1.3));
  $('#zoom-out').addEventListener('click', () => zoomBy(1 / 1.3));
  $('#reset').addEventListener('click', resetView);
  els.prev.addEventListener('click', () => step(-1));
  els.next.addEventListener('click', () => step(1));
  els.walls.addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b && !b.disabled) setWalls(b.dataset.mode); });
  els.labelsToggle.addEventListener('click', () => setLabels(!prefs.labels));

  els.canvas.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { rotateBy(-90); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { rotateBy(90); e.preventDefault(); }
    else if (e.key === '+' || e.key === '=') zoomBy(1.3);
    else if (e.key === '-') zoomBy(1 / 1.3);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select')) return;
    if (e.key === '[') step(-1);
    else if (e.key === ']') step(1);
  });

  // Header facts.
  $('#prop-name').textContent = PROPERTY.name;
  $('#prop-place').textContent = PROPERTY.place;
  $('#prop-price').textContent = PROPERTY.price;
  $('#prop-facts').innerHTML = PROPERTY.facts.map((f) => `<li>${esc(f)}</li>`).join('');
  const source = $('#prop-source');
  if (source) source.href = PROPERTY.source;
  const related = $('#prop-related');
  if (related && PROPERTY.related?.length) {
    related.innerHTML = PROPERTY.related.map((r) => `<a href="${esc(r.href)}">${esc(r.label)} →</a>`).join('');
    related.hidden = false;
  }
  $('#legend').innerHTML = Object.keys(PROVENANCE).map((k) => `<li>${chip(k)}<span>${esc(PROVENANCE[k].hint)}</span></li>`).join('');

  // ---------------------------------------------------------------------------
  // Loop
  // ---------------------------------------------------------------------------

  function loop(now) {
    requestAnimationFrame(loop);
    if (tween) {
      const t = Math.min(1, (now - tween.t0) / tween.ms);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const { from, to } = tween;
      placeCamera(from.target.clone().lerp(to.target, e), from.az + (to.az - from.az) * e, from.el + (to.el - from.el) * e, from.zoom + (to.zoom - from.zoom) * e);
      if (t >= 1) { tween = null; controls.enabled = true; controls.update(); }
      onCameraChange();
    } else if (controls.update()) {
      onCameraChange();
    }
    processHover();
    if (dirty) {
      positionTags();
      renderer.render(scene, camera);
      dirty = false;
    }
  }

  renderNav();
  setWalls(prefs.walls);
  setLabels(prefs.labels);
  const start = location.hash.slice(1);
  go(VIEW_BY_ID[start] ? start : VIEWS[0].id, { instant: true });
  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (VIEW_BY_ID[id] && id !== current?.id) go(id);
  });
  requestAnimationFrame((t) => {
    loop(t);
    els.loading.hidden = true;
  });
}
