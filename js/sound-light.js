/* Light at the Sound: sun, sky and lens planner for The Sound Café, Isle of Man.
 * Everything is computed in the browser from window.SOUND_DATA (js/sound-data.js):
 * NOAA sun positions, the terrain skyline seen from the café, and MET Norway forecast hours.
 * Map coordinates are metres east (x) and north (y) of the café. */
(function () {
  "use strict";

  const D = window.SOUND_DATA;
  const RAD = Math.PI / 180;
  const DEG = 180 / Math.PI;
  const TZ = "Europe/London"; // the Isle of Man keeps UK clock time
  const SUN_R = 0.266; // apparent radius of the sun, degrees
  const EARTH_R = 6371000;
  const K_REFR = 0.13; // terrestrial refraction coefficient
  const MPH = 2.23694; // m/s to mph
  const GROUND = D.site.ground; // café terrace, metres above sea level
  const RANGE = [360, 1140]; // scrubber: 06:00 to 19:00

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mod = (a, n) => ((a % n) + n) % n;
  const wrap180 = (a) => mod(a + 180, 360) - 180;
  const round = (v, d = 0) => Math.round(v * 10 ** d) / 10 ** d;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem("sound-light:" + key);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem("sound-light:" + key, JSON.stringify(value));
      } catch (e) {
        /* storage unavailable: the page still works, it just forgets */
      }
    },
  };

  // ---------------------------------------------------------------- clock time

  function tzOffsetMin(ms) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(new Date(ms));
    const get = (type) => Number(parts.find((p) => p.type === type).value);
    const local = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
    return Math.round((local - Math.floor(ms / 60000) * 60000) / 60000);
  }
  const midnight = (day) => Date.parse(day + "T00:00:00Z") - tzOffsetMin(Date.parse(day + "T12:00:00Z")) * 60000;
  const atMin = (day, min) => midnight(day) + min * 60000;

  function hm(min) {
    if (min == null || !isFinite(min)) return "—";
    const m = Math.floor(min + 1e-6); // truncate to the minute, like published almanacs
    return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(mod(m, 60)).padStart(2, "0");
  }
  function dayLabel(day, long) {
    const opts = long
      ? { weekday: "long", day: "numeric", month: "long", year: "numeric" }
      : { weekday: "short", day: "numeric", month: "short" };
    return new Intl.DateTimeFormat("en-GB", Object.assign({ timeZone: "UTC" }, opts)).format(new Date(day + "T12:00:00Z"));
  }
  function localClock(ms) {
    const t = new Date(ms + tzOffsetMin(ms) * 60000);
    return { day: t.toISOString().slice(0, 10), min: t.getUTCHours() * 60 + t.getUTCMinutes() };
  }

  // ---------------------------------------------------------------- sun

  function sunPosition(ms) {
    const T = (ms / 86400000 + 2440587.5 - 2451545) / 36525;
    const L0 = mod(280.46646 + T * (36000.76983 + T * 0.0003032), 360);
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T))
      + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * RAD) * 0.000289;
    const omega = 125.04 - 1934.136 * T;
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * RAD);
    const eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60
      + 0.00256 * Math.cos(omega * RAD);
    const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD));
    const y = Math.tan((eps / 2) * RAD) ** 2;
    const eqTime = 4 * DEG * (y * Math.sin(2 * L0 * RAD) - 2 * e * Math.sin(M * RAD)
      + 4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) - 0.5 * y * y * Math.sin(4 * L0 * RAD)
      - 1.25 * e * e * Math.sin(2 * M * RAD));
    const ha = (mod(mod(ms / 60000, 1440) + eqTime + 4 * D.site.lon, 1440) / 4 - 180) * RAD;
    const lat = D.site.lat * RAD;
    const cosZ = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(ha);
    const alt = 90 - Math.acos(clamp(cosZ, -1, 1)) * DEG;
    const az = mod(Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat)) * DEG + 180, 360);
    return { alt, az };
  }

  // NOAA's refraction correction (degrees) for a true altitude h
  function refraction(h) {
    if (h > 85) return 0;
    const t = Math.tan(h * RAD);
    let r;
    if (h > 5) r = 58.1 / t - 0.07 / t ** 3 + 0.000086 / t ** 5;
    else if (h > -0.575) r = 1735 + h * (-518.2 + h * (103.4 + h * (-12.79 + h * 0.711)));
    else r = -20.774 / t;
    return r / 3600;
  }

  // terrain skyline seen from the café terrace, degrees above the horizontal
  function skyline(az) {
    const a = D.horizon.alt;
    const f = mod(az, 360) / D.horizon.step;
    const i = Math.floor(f) % a.length;
    return lerp(a[i], a[(i + 1) % a.length], f - Math.floor(f));
  }

  const PHASES = [
    [6, "day", "Daylight"], [-4, "golden", "Golden hour"], [-6, "blue", "Blue hour"],
    [-12, "nautical", "Nautical twilight"], [-18, "astro", "Astronomical twilight"], [-91, "night", "Night"],
  ];
  function phaseOf(alt) {
    const p = PHASES.find(([lim]) => alt >= lim);
    return { key: p[1], label: p[2] };
  }

  function sunAt(day, min) {
    const p = sunPosition(atMin(day, min));
    const app = p.alt + refraction(p.alt);
    const sky = skyline(p.az);
    return { min, alt: p.alt, app, az: p.az, sky, visible: app + SUN_R > sky, phase: phaseOf(p.alt) };
  }

  const dayCache = {};
  function sunDay(day) {
    if (dayCache[day]) return dayCache[day];
    const N = 1440;
    const t0 = midnight(day);
    const alt = new Float64Array(N + 1), app = new Float64Array(N + 1), az = new Float64Array(N + 1);
    const top = new Float64Array(N + 1), bottom = new Float64Array(N + 1);
    for (let m = 0; m <= N; m++) {
      const p = sunPosition(t0 + m * 60000);
      const sky = skyline(p.az);
      alt[m] = p.alt;
      az[m] = p.az;
      app[m] = p.alt + refraction(p.alt);
      top[m] = app[m] + SUN_R - sky; // > 0 while any of the disc clears the skyline
      bottom[m] = app[m] - SUN_R - sky; // > 0 while all of it does
    }
    const cross = (arr, level, rising) => {
      const out = [];
      for (let m = 0; m < N; m++) {
        const a = arr[m] - level, b = arr[m + 1] - level;
        if (rising ? a < 0 && b >= 0 : a >= 0 && b < 0) out.push(m + a / (a - b));
      }
      return out;
    };
    const first = (l) => (l.length ? l[0] : null);
    const last = (l) => (l.length ? l[l.length - 1] : null);
    let noon = 0;
    for (let m = 1; m <= N; m++) if (alt[m] > alt[noon]) noon = m;
    const ev = {
      astroDawn: first(cross(alt, -18, true)), nauticalDawn: first(cross(alt, -12, true)),
      civilDawn: first(cross(alt, -6, true)), goldenStartAM: first(cross(alt, -4, true)),
      sunrise: first(cross(alt, -0.833, true)), goldenEndAM: first(cross(alt, 6, true)),
      noon, noonAlt: alt[noon],
      goldenStartPM: last(cross(alt, 6, false)), sunset: last(cross(alt, -0.833, false)),
      blueStartPM: last(cross(alt, -4, false)), civilDusk: last(cross(alt, -6, false)),
      nauticalDusk: last(cross(alt, -12, false)), astroDusk: last(cross(alt, -18, false)),
    };
    ev.firstLight = first(cross(top, 0, true).filter((m) => m > (ev.sunrise ?? 0) - 5));
    ev.lastLight = last(cross(top, 0, false).filter((m) => m < (ev.sunset ?? N) + 5));
    ev.touch = last(cross(bottom, 0, false).filter((m) => ev.lastLight == null || m <= ev.lastLight));
    return (dayCache[day] = { day, alt, app, az, top, ev });
  }

  // ---------------------------------------------------------------- forecast

  const prep = (hours) => hours.map((h) => Object.assign({}, h, { ms: Date.parse(h.t) })).sort((a, b) => a.ms - b.ms);
  let FC = prep(D.forecast.hours);
  let BEAM = D.sunbeam.points.map((p) => Object.assign({}, p, { hours: prep(p.hours) }));
  let FC_META = { source: D.forecast.source, updated: D.forecast.updated, fetched: D.forecast.fetched, live: false, note: "" };
  const GFS = prep(D.gfs.series);

  const NUMERIC = ["temp", "feels", "cc", "lo", "mid", "hi", "fog", "rh", "ws", "gust"];
  function wxAt(hours, ms) {
    if (!hours.length || ms < hours[0].ms - 3600e3 || ms > hours[hours.length - 1].ms + 3600e3) return null;
    let i = 0;
    while (i < hours.length - 1 && hours[i + 1].ms <= ms) i++;
    const a = hours[i], b = hours[Math.min(i + 1, hours.length - 1)];
    const t = b.ms > a.ms ? clamp((ms - a.ms) / (b.ms - a.ms), 0, 1) : 0;
    const out = { ms, rain: a.rain, pop: a.pop, sym: a.sym }; // precipitation covers the hour starting at a
    for (const k of NUMERIC) out[k] = a[k] == null || b[k] == null ? (a[k] ?? b[k] ?? null) : lerp(a[k], b[k], t);
    out.wd = a.wd == null ? null : mod(a.wd + wrap180((b.wd ?? a.wd) - a.wd) * t, 360);
    return out;
  }

  // rough odds that the sun's disc is not hidden by cloud: low and mid cloud block, cirrus mostly filters
  const sunChance = (w) => (w ? clamp((1 - w.lo / 100) * (1 - (0.85 * w.mid) / 100) * (1 - (0.3 * w.hi) / 100), 0, 1) : null);

  const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const cardinal = (deg) => COMPASS[Math.round(mod(deg, 360) / 22.5) % 16];
  const BEAUFORT = [[0.5, "calm"], [1.6, "light air"], [3.4, "light breeze"], [5.5, "gentle breeze"], [8, "moderate breeze"],
    [10.8, "fresh breeze"], [13.9, "strong breeze"], [17.2, "near gale"], [20.8, "gale"], [Infinity, "severe gale"]];
  const beaufort = (v) => BEAUFORT.find(([lim]) => v < lim)[1];

  // ---------------------------------------------------------------- map geometry

  const toPts = (a) => {
    const p = [];
    for (let i = 0; i < a.length; i += 2) p.push([a[i], a[i + 1]]);
    return p;
  };
  const LAND = D.map.land.map(toPts);
  function inPoly(pt, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  const landAt = (pt) => LAND.findIndex((poly) => inPoly(pt, poly));
  const LAND_NAMES = LAND.map((poly) => {
    const hit = D.map.places.find((p) => ["island", "islet", "light"].includes(p.k) && inPoly(p.xy, poly));
    if (hit) return hit.n === "Calf lighthouses" ? "Calf of Man" : hit.n;
    return inPoly([0, 0], poly) ? "the hillside" : "rocks";
  });
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const bearingOf = (a, b) => mod(Math.atan2(b[0] - a[0], b[1] - a[1]) * DEG, 360);

  // what stands behind the couple seen from the camera: land just across the water, and what forms the skyline
  let backdropKey = "", backdropVal = null;
  function backdrop() {
    const key = S.camera.join() + "|" + S.couple.join();
    if (key === backdropKey) return backdropVal;
    const b = bearingOf(S.camera, S.couple), s = Math.sin(b * RAD), c = Math.cos(b * RAD);
    const crossed = [];
    let atSea = false, inland = true;
    for (let d = 3; d < 9000; d += d < 300 ? 3 : d < 3000 ? 15 : 40) {
      const k = landAt([S.couple[0] + s * d, S.couple[1] + c * d]);
      if (k < 0) {
        atSea = true;
        inland = false;
      } else if (atSea) {
        crossed.push({ name: LAND_NAMES[k], dist: d });
        atSea = false;
      } else if (inland && d > 300) break;
    }
    let out = { inland: true };
    if (!inland) {
      const far = crossed.find((x) => x.name === "Calf of Man") || crossed[crossed.length - 1] || null;
      out = { far, near: crossed.find((x) => x !== far && x.dist < 600) || null };
    }
    backdropKey = key;
    return (backdropVal = out);
  }
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  // ---------------------------------------------------------------- optics and exposure

  const SYSTEMS = {
    ff: { name: "Full frame", w: 36, h: 24, crop: 1, coc: 0.03, min: 12, max: 600, chips: [16, 24, 35, 50, 85, 135, 200] },
    apsc: { name: "APS-C (Sony, Nikon, Fujifilm)", w: 23.5, h: 15.6, crop: 1.53, coc: 0.02, min: 8, max: 400, chips: [10, 16, 23, 35, 56, 90, 135] },
    canon: { name: "APS-C (Canon)", w: 22.3, h: 14.9, crop: 1.6, coc: 0.019, min: 8, max: 400, chips: [10, 15, 22, 32, 50, 85, 135] },
    m43: { name: "Micro Four Thirds", w: 17.3, h: 13, crop: 2, coc: 0.015, min: 7, max: 300, chips: [8, 12, 17, 25, 42, 75, 100] },
    phone: { name: "Phone", w: 9.6, h: 7.2, crop: 3.6, coc: 0.0083, min: 3.3, max: 33.4, zooms: [0.5, 1, 2, 3, 5] },
  };
  const FNUMS = [1.4, 1.8, 2, 2.8, 4, 5.6, 8, 11, 16];
  const CAM_HEIGHTS = [1.6, 1.2, 0.8, 0.3];

  function optics() {
    const sys = SYSTEMS[S.sys];
    const f = S.eq / sys.crop;
    const w = S.portrait ? sys.h : sys.w, h = S.portrait ? sys.w : sys.h;
    return { sys, f, hfov: 2 * Math.atan(w / (2 * f)) * DEG, vfov: 2 * Math.atan(h / (2 * f)) * DEG };
  }
  // landscape vertical field of view for an equivalent focal length on the chosen camera
  const vfovFor = (eq, sys) => 2 * Math.atan(sys.h / (2 * (eq / sys.crop))) * DEG;
  const standAt = (frameH, vfov) => frameH / (2 * Math.tan((vfov / 2) * RAD));

  function depthOfField(f, N, coc, s) {
    const sm = s * 1000, H = (f * f) / (N * coc) + f;
    return { near: (sm * (H - f)) / (H + sm - 2 * f) / 1000, far: sm < H ? (sm * (H - f)) / (H - sm) / 1000 : Infinity };
  }
  function lensLabel(eq, sys) {
    if (sys.zooms) return `${round(eq / 24, 1)}× (${Math.round(eq)} mm eq.)`;
    if (sys.crop === 1) return `${Math.round(eq)} mm`;
    return `${Math.round(eq / sys.crop)} mm (${Math.round(eq)} mm eq.)`;
  }
  function framingName(h) {
    if (h < 0.35) return "A detail of hands and ring";
    if (h < 0.8) return "Head and shoulders";
    if (h < 1.4) return "Waist up";
    if (h < 2.8) return "Full length";
    if (h < 7) return "The two of you in the scene";
    return "A wide view where the place is the subject";
  }

  // EV at ISO 100 for a sunlit subject under a clear sky, by apparent sun altitude
  const EV_CLEAR = [[-12, 2.5], [-9, 4.5], [-6, 6.8], [-4, 8.3], [-2, 9.7], [0, 11.2], [2, 12.3], [5, 13.3], [10, 14.2], [20, 15], [90, 15.3]];
  function sceneEV(sun, w) {
    let ev = EV_CLEAR[0][1];
    for (let i = 1; i < EV_CLEAR.length; i++) {
      const [x0, y0] = EV_CLEAR[i - 1], [x1, y1] = EV_CLEAR[i];
      if (sun.app <= x1) { ev = lerp(y0, y1, clamp((sun.app - x0) / (x1 - x0), 0, 1)); break; }
    }
    if (sun.app > -1 && !sun.visible) ev -= 1.3; // sun behind the Calf: open shade under a bright sky
    if (w && sun.app > -3) ev -= Math.min(2.6, (2.2 * w.lo + 0.9 * w.mid + 0.4 * w.hi) / 100) * (sun.visible ? 1 : 0.5);
    return ev;
  }
  const ISOS = [100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6400, 8000, 10000, 12800, 25600];
  const SPEEDS = [8000, 4000, 2000, 1600, 1250, 1000, 800, 640, 500, 400, 320, 250, 200, 160, 125, 100, 80, 60, 50, 40, 30, 25, 20, 15, 10, 8, 4, 2];
  function stills(ev, N, slowest) {
    const t = (N * N) / 2 ** ev; // seconds needed at ISO 100
    if (t <= 1 / slowest) {
      const x = 1 / t;
      const s = SPEEDS.reduce((best, v) => (Math.abs(Math.log(v / x)) < Math.abs(Math.log(best / x)) ? v : best));
      return `f/${N} · 1/${s} s · ISO 100`;
    }
    return `f/${N} · 1/${slowest} s · ISO ${ISOS.find((v) => v >= 100 * t * slowest) ?? 25600}`;
  }
  function video(ev, N) {
    const spare = ev - Math.log2(N * N * 50); // stops of light beyond what 1/50 s at ISO 100 needs
    if (spare > 0.5) return `f/${N} · 1/50 s · ISO 100 · ND filter, ${Math.round(spare)} stops`;
    return `f/${N} · 1/50 s · ISO ${ISOS.find((v) => v >= 100 * 2 ** -spare) ?? 25600}`;
  }

  // ---------------------------------------------------------------- state

  const PRESETS = [
    { id: "backlit", name: "Calf behind you: camera up the slope, backlit", couple: [-70, -10], camera: [-38, 32], eq: 150 },
    { id: "terrace", name: "Camera on the café terrace: side light", couple: [-70, -10], camera: [-9, -6], eq: 100 },
    { id: "frontlit", name: "Camera on the Parade: sun on your faces", couple: [-66, -24], camera: [-56, -84], eq: 135 },
  ];

  function sanitize(o) {
    const out = {};
    if (!o || typeof o !== "object") return out;
    const okPt = (p) => Array.isArray(p) && p.length === 2 && p.every((v) => typeof v === "number" && isFinite(v)) && landAt(p) >= 0;
    if (D.days.includes(o.day)) out.day = o.day;
    if (o.view === "site" || o.view === "sound") out.view = o.view;
    if (okPt(o.couple)) out.couple = o.couple;
    if (okPt(o.camera)) out.camera = o.camera;
    if (typeof o.preset === "string") out.preset = o.preset;
    if (SYSTEMS[o.sys]) out.sys = o.sys;
    if (typeof o.eq === "number" && o.eq >= 10 && o.eq <= 900) out.eq = o.eq;
    if (FNUMS.includes(o.fnum)) out.fnum = o.fnum;
    if (CAM_HEIGHTS.includes(o.camH)) out.camH = o.camH;
    if (typeof o.portrait === "boolean") out.portrait = o.portrait;
    if (typeof o.kneel === "boolean") out.kneel = o.kneel;
    if (o.done && typeof o.done === "object") out.done = o.done;
    return out;
  }

  const S = Object.assign({
    day: D.days[0], min: 960, view: "site", placing: "couple", preset: PRESETS[0].id,
    couple: PRESETS[0].couple.slice(), camera: PRESETS[0].camera.slice(),
    sys: "ff", eq: PRESETS[0].eq, fnum: 2.8, camH: 1.6, portrait: false, kneel: true, done: {},
  }, sanitize(store.get("state", null)));

  function save() {
    const { day, view, couple, camera, preset, sys, eq, fnum, camH, portrait, kneel, done } = S;
    store.set("state", { day, view, couple, camera, preset, sys, eq, fnum, camH, portrait, kneel, done });
  }

  // ---------------------------------------------------------------- drawing helpers

  function fit(svg, height) {
    const w = Math.max(280, Math.round(svg.parentElement.clientWidth || 640));
    const h = Math.round(typeof height === "function" ? height(w) : height);
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    return [w, h];
  }
  const pathD = (pts, close) => (pts.length ? "M" + pts.map((p) => `${round(p[0], 1)},${round(p[1], 1)}`).join("L") + (close ? "Z" : "") : "");
  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, t) => "#" + hex(a).map((v, i) => Math.round(lerp(v, hex(b)[i], t)).toString(16).padStart(2, "0")).join("");

  // ---------------------------------------------------------------- header, key times, verdict

  function renderDays() {
    $("days").innerHTML = D.days.map((d, i) =>
      `<button class="btn" type="button" data-day="${d}" aria-pressed="${d === S.day}">${esc(dayLabel(d))}${i ? " · backup" : ""}</button>`).join("");
    $("day-label").textContent = dayLabel(S.day, true);
    const h = D.site.hours[S.day];
    if (h) $("hours").textContent = `${String(h[0]).padStart(2, "0")}:00–${h[1]}:00`;
  }

  function renderKeys() {
    const ev = sunDay(S.day).ev;
    const end = ev.lastLight ?? ev.blueStartPM;
    const tiles = [
      { label: "Golden light", time: `${hm(ev.goldenStartPM)}–${hm(end)}`, sub: "sun 6° high until it reaches the Calf", cls: "key--sun" },
      { label: "Sun behind the Calf", time: hm(ev.lastLight), sub: `${Math.round(ev.sunset - ev.lastLight)} min before the sea-level sunset`, cls: "key--sun" },
      { label: "Sunset", time: hm(ev.sunset), sub: `at ${Math.round(sunAt(S.day, ev.sunset).az)}°, hidden by the Calf` },
      { label: "Blue hour", time: `${hm(ev.blueStartPM)}–${hm(ev.civilDusk)}`, sub: "café lights against a blue sky" },
    ];
    $("keys").innerHTML = tiles.map((t) => `<div class="key ${t.cls || ""}"><span class="label">${t.label}</span>
      <span class="key__time">${t.time}</span><span class="key__sub">${t.sub}</span></div>`).join("");
  }

  function outlook() {
    const ev = sunDay(S.day).ev;
    const goldenEnd = ev.lastLight ?? ev.sunset;
    const samples = [];
    for (let m = ev.goldenStartPM - 60; m <= ev.sunset + 30; m += 15) {
      const w = wxAt(FC, atMin(S.day, m));
      if (w) samples.push({ m, w });
    }
    if (!samples.length) {
      return { tone: "warn", headline: "No hourly forecast for this day yet", detail: "Check again nearer the time.", items: [] };
    }
    const golden = samples.filter((s) => s.m >= ev.goldenStartPM && s.m <= goldenEnd);
    const set = golden.length ? golden : samples;
    const avg = (k) => set.reduce((a, s) => a + s.w[k], 0) / set.length;
    const chance = set.reduce((a, s) => a + sunChance(s.w), 0) / set.length;
    const rainMax = Math.max(...samples.map((s) => s.w.rain || 0));
    const mid = samples[Math.floor(samples.length / 2)].w;
    const items = [];

    let tone, headline, detail;
    if (rainMax >= 0.3) {
      tone = "bad";
      headline = "Showers possible around golden hour";
      detail = `Up to ${round(rainMax, 1)} mm in an hour. Have a plan inside the café.`;
    } else if (chance >= 0.55) {
      tone = "good";
      headline = "Good odds of direct golden sun";
      detail = "Low cloud looks thin in the last hour of sun.";
    } else if (chance >= 0.25) {
      tone = "warn";
      headline = "Sun in breaks, so be ready when it comes out";
      detail = `Roughly a ${Math.round(chance * 100)}% chance the sun is out at any moment of golden hour.`;
    } else {
      tone = "bad";
      headline = "Mostly soft, diffused light";
      detail = "Flattering for faces. A golden glow is a bonus rather than the plan.";
    }

    items.push(rainMax < 0.1 ? "Dry through the afternoon." : `Rain: up to ${round(rainMax, 1)} mm in an hour.`);
    items.push(`Wind ${cardinal(mid.wd)} ${Math.round(mid.ws * MPH)} mph, a ${beaufort(mid.ws)}${mid.gust ? `, gusting ${Math.round(mid.gust * MPH)} mph` : ""}. It's stronger at the cliff edge, so bring a fur windshield for any microphone.`);
    items.push(`During golden hour: low cloud ${Math.round(avg("lo"))}%, mid ${Math.round(avg("mid"))}%, high ${Math.round(avg("hi"))}%.`);

    let best = null;
    for (let m = 12 * 60; m <= goldenEnd - 10; m += 30) {
      const w = wxAt(FC, atMin(S.day, m));
      if (w && (!best || sunChance(w) > best.c)) best = { m, c: sunChance(w), w };
    }
    if (best) items.push(`Best break for sunshine: around ${hm(best.m)} (low cloud ${Math.round(best.w.lo)}%).`);
    items.push(`${round(mid.temp, 0)}°C, feels like ${round(mid.feels, 0)}°C once the sun drops.`);

    const sunsetBeam = beamTransmission(ev.sunset - 15);
    const overhead = wxAt(FC, atMin(S.day, ev.sunset));
    if (overhead) {
      const canvas = overhead.hi + overhead.mid;
      if (overhead.lo > 70) items.push("Sunset colour is unlikely, because low cloud overhead will stay grey.");
      else if (canvas < 25) items.push("There's little high cloud to catch the light, so expect a clean sunset rather than a colourful one.");
      else if (sunsetBeam != null && sunsetBeam < 0.3) items.push("Thick cloud out to the west sits in the sun's path, so sunset colour looks limited.");
      else items.push("High cloud overhead could turn pink at sunset if a gap opens to the west.");
    }
    const gfs = GFS.filter((g) => g.t.startsWith(S.day) && g.ms >= atMin(S.day, 12 * 60) && g.ms <= atMin(S.day, 18 * 60));
    if (gfs.length) {
      items.push(`Second model (GFS, run ${D.gfs.init.slice(8, 10)}/${D.gfs.init.slice(5, 7)} ${D.gfs.init.slice(11, 16)} UTC): total cloud ${gfs.map((g) => `${g.cc}% at ${g.t.slice(11, 16)}`).join(", ")}.`);
    }
    return { tone, headline, detail, items };
  }

  function renderOutlook() {
    const o = outlook();
    const v = $("verdict");
    v.dataset.tone = o.tone;
    v.innerHTML = `<span class="label">Sky for ${esc(dayLabel(S.day))}</span><strong>${esc(o.headline)}</strong><span>${esc(o.detail)}</span>`;
    $("outlook").innerHTML = o.items.map((t) => `<li>${esc(t)}</li>`).join("");
  }

  // ---------------------------------------------------------------- time scrubber

  const PH_VAR = { night: "--ph-night", astro: "--ph-astro", nautical: "--ph-naut", blue: "--ph-blue", golden: "--ph-golden", day: "--ph-day" };
  const pct = (min) => ((min - RANGE[0]) / (RANGE[1] - RANGE[0])) * 100;

  function renderTrack() {
    const { alt, ev } = sunDay(S.day);
    const stops = [];
    let prev = null;
    for (let m = RANGE[0]; m <= RANGE[1]; m++) {
      const k = phaseOf(alt[m]).key;
      if (k !== prev) {
        if (prev) stops.push(`var(${PH_VAR[prev]}) ${round(pct(m), 2)}%`);
        stops.push(`var(${PH_VAR[k]}) ${round(pct(m), 2)}%`);
        prev = k;
      }
    }
    stops.push(`var(${PH_VAR[prev]}) 100%`);
    $("track-bar").style.background = `linear-gradient(to right, ${stops.join(", ")})`;
    const ticks = [[ev.sunrise, ""], [ev.lastLight, "track__tick--sun"], [ev.sunset, "track__tick--sun"]];
    const now = localClock(Date.now());
    if (now.day === S.day) ticks.push([now.min, ""]);
    $("track-ticks").innerHTML = ticks.filter(([m]) => m != null && m >= RANGE[0] && m <= RANGE[1])
      .map(([m, c]) => `<span class="track__tick ${c}" style="left:${round(pct(m), 2)}%"></span>`).join("");
    let hours = "";
    for (let h = 7; h <= 18; h += 1) {
      hours += `<span style="position:absolute;left:${round(pct(h * 60), 2)}%;transform:translateX(-50%)">${h % 2 ? String(h).padStart(2, "0") : ""}</span>`;
    }
    const box = $("track-hours");
    box.style.position = "relative";
    box.style.height = "1.1em";
    box.innerHTML = hours;
  }

  function renderJumps() {
    const ev = sunDay(S.day).ev;
    const now = localClock(Date.now());
    const jumps = [];
    if (now.day === S.day && now.min >= RANGE[0] && now.min <= RANGE[1]) jumps.push(["Now", now.min]);
    jumps.push(["Golden light", ev.goldenStartPM], ["Best moment", (ev.lastLight ?? ev.sunset) - 25],
      ["Behind the Calf", ev.lastLight], ["Sunset", ev.sunset], ["Blue hour", ev.blueStartPM + 3]);
    $("jumps").innerHTML = jumps.filter(([, m]) => m != null)
      .map(([n, m]) => `<button class="btn btn--quiet" type="button" data-min="${Math.round(m)}">${n} <span class="num">${hm(m)}</span></button>`).join("");
  }

  function renderReadout() {
    const sun = sunAt(S.day, S.min);
    const w = wxAt(FC, atMin(S.day, S.min));
    let status;
    if (sun.alt < -0.833) status = `<span class="pill pill--off">Sun down</span>`;
    else if (sun.visible) status = `<span class="pill pill--ok">Direct sun if clear</span>`;
    else status = `<span class="pill pill--off">Behind the ${sun.az > 180 ? "Calf" : "hills"}</span>`;
    $("readout").innerHTML = `<span class="readout__time">${hm(S.min)}</span>
      <span class="pill" data-phase="${sun.phase.key}">${sun.phase.label}</span>
      <span class="readout__item">Sun <b>${Math.round(sun.az)}°</b> ${cardinal(sun.az)} · <b>${round(sun.app, 1)}°</b> high</span>
      ${status}
      ${w ? `<span class="readout__item">Cloud <b>${Math.round(w.cc)}%</b> · low <b>${Math.round(w.lo)}%</b> · wind <b>${cardinal(w.wd)} ${Math.round(w.ws * MPH)}</b> mph</span>` : ""}`;
    $("time").value = S.min;
  }

  // ---------------------------------------------------------------- map

  const VIEWS = {
    site: { x0: -330, y0: -230, x1: 170, y1: 200, scale: 50, ring: 62 },
    siteNarrow: { x0: -255, y0: -205, x1: 115, y1: 165, scale: 50, ring: 55 },
    sound: { x0: -3150, y0: -3050, x1: 900, y1: 650, scale: 1000, ring: 600 },
  };
  const flip = (a) => {
    const out = [];
    for (let i = 0; i < a.length; i += 2) out.push([a[i], -a[i + 1]]);
    return out;
  };
  const mapWidth = () => Math.max(280, $("map").parentElement.clientWidth || 640);
  const view = () => (S.view === "sound" ? VIEWS.sound : mapWidth() < 520 ? VIEWS.siteNarrow : VIEWS.site);
  const mapScale = () => {
    const v = view();
    return (v.x1 - v.x0) / mapWidth();
  };

  // place labels in screen pixels, skipping any that would cover something more important
  function labelLayer(cands, v, mpp) {
    const W = (v.x1 - v.x0) / mpp, H = (v.y1 - v.y0) / mpp;
    const boxes = [];
    const free = (b) => b.x0 >= 2 && b.x1 <= W - 2 && b.y0 >= 2 && b.y1 <= H - 2
      && !boxes.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
    const at = (sx, sy) => `x="${round(v.x0 + sx * mpp, 1)}" y="${round(-v.y1 + sy * mpp, 1)}"`;
    let s = "";
    for (const c of cands) {
      if (c.box) { // a fixed screen rectangle such as the scale bar
        boxes.push({ x0: c.box[0] < 0 ? W + c.box[0] : c.box[0], x1: c.box[1] <= 0 ? W + c.box[1] : c.box[1], y0: c.box[2] < 0 ? H + c.box[2] : c.box[2], y1: c.box[3] <= 0 ? H + c.box[3] : c.box[3] });
        continue;
      }
      const sx = (c.xy[0] - v.x0) / mpp, sy = (v.y1 - c.xy[1]) / mpp;
      if (c.reserve) {
        boxes.push({ x0: sx - c.reserve, x1: sx + c.reserve, y0: sy - c.reserve, y1: sy + c.reserve });
        continue;
      }
      // try right, left, above, then below the anchor, staying `clear` pixels away from it
      const tw = c.text.length * c.size * (c.wf || 0.56), base = c.size * 0.35, cl = c.clear || 5;
      const tries = c.anchor === "middle"
        ? [["middle", 0, base]]
        : [["start", cl + 3, base], ["end", -(cl + 3), base], ["middle", 0, -(cl + c.size * 0.3 + 3)], ["middle", 0, cl + c.size * 0.85 + 3]];
      for (const [anchor, ox, oy] of tries) {
        const left = anchor === "start" ? sx + ox : anchor === "end" ? sx + ox - tw : sx - tw / 2;
        const b = { x0: left - 2, x1: left + tw + 2, y0: sy + oy - c.size * 0.85, y1: sy + oy + c.size * 0.3 };
        if (!free(b)) continue;
        boxes.push(b);
        if (c.dot) {
          boxes.push({ x0: sx - 3, x1: sx + 3, y0: sy - 3, y1: sy + 3 });
          s += `<circle class="dot" cx="${round(c.xy[0], 1)}" cy="${round(-c.xy[1], 1)}" r="${round(2.4 * mpp, 2)}"/>`;
        }
        s += `<text class="${c.cls}" ${at(sx + ox, sy + oy)} font-size="${round(c.size * mpp, 2)}" stroke-width="${round(3.5 * mpp, 2)}" text-anchor="${anchor}"${c.weight ? ` font-weight="${c.weight}"` : ""}>${esc(c.text)}</text>`;
        break;
      }
    }
    return s;
  }

  function renderMap() {
    const svg = $("map"), v = view(), mpp = mapScale();
    const W = (v.x1 - v.x0) / mpp;
    svg.setAttribute("viewBox", `${v.x0} ${-v.y1} ${v.x1 - v.x0} ${v.y1 - v.y0}`);
    svg.setAttribute("width", Math.round(W));
    svg.setAttribute("height", Math.round((W * (v.y1 - v.y0)) / (v.x1 - v.x0)));
    const px = (n) => round(n * mpp, 2);
    const site = S.view === "site";
    let s = "";
    for (const poly of D.map.land) s += `<path class="land" d="${pathD(flip(poly), true)}"/>`;
    for (const c of D.map.contours) for (const l of c.lines) s += `<path class="contour" d="${pathD(flip(l))}"/>`;
    for (const l of D.map.cliffs) s += `<path class="cliff" d="${pathD(flip(l))}"/>`;
    for (const l of D.map.roads) s += `<path class="road" d="${pathD(flip(l))}"/>`;
    if (site) {
      for (const l of D.map.grass.concat(D.map.parking, D.map.terrace)) s += `<path class="area" d="${pathD(flip(l), true)}"/>`;
      for (const l of D.map.paths) s += `<path class="path" d="${pathD(flip(l))}"/>`;
      for (const l of D.map.buildings) s += `<path class="bldg" d="${pathD(flip(l), true)}"/>`;
    }
    if (!site) s += `<circle class="dot" cx="0" cy="0" r="${px(3.5)}"/>`;

    // north arrow and scale bar
    const nx = v.x1 - px(22), ny = -v.y1 + px(26);
    s += `<path class="north-arrow" d="M${nx},${round(ny - px(13), 1)}L${round(nx + px(6), 1)},${round(ny + px(5), 1)}L${nx},${round(ny + px(1), 1)}L${round(nx - px(6), 1)},${round(ny + px(5), 1)}Z"/>`
      + `<text class="north" x="${nx}" y="${round(ny + px(18), 1)}" font-size="${px(10)}" text-anchor="middle">N</text>`;
    const sx = v.x0 + px(14), sy = -v.y0 - px(16);
    s += `<path class="scale" d="M${sx},${round(sy - px(4), 1)}V${sy}H${sx + v.scale}V${round(sy - px(4), 1)}"/>`
      + `<text class="scale-lbl" x="${sx}" y="${round(sy - px(8), 1)}" font-size="${px(10)}">${v.scale >= 1000 ? v.scale / 1000 + " km" : v.scale + " m"}</text>`;
    s += `<g id="map-overlay"></g>`;
    svg.innerHTML = s;
    for (const b of document.querySelectorAll("#views button")) b.setAttribute("aria-pressed", b.dataset.view === S.view);
    renderMapOverlay();
  }

  function edgePoint(p, b, v, inset) {
    const dx = Math.sin(b * RAD), dy = Math.cos(b * RAD);
    let t = Infinity;
    if (dx > 1e-9) t = Math.min(t, (v.x1 - inset - p[0]) / dx);
    else if (dx < -1e-9) t = Math.min(t, (v.x0 + inset - p[0]) / dx);
    if (dy > 1e-9) t = Math.min(t, (v.y1 - inset - p[1]) / dy);
    else if (dy < -1e-9) t = Math.min(t, (v.y0 + inset - p[1]) / dy);
    t = Math.max(0, t);
    return [p[0] + dx * t, p[1] + dy * t];
  }

  function renderMapOverlay() {
    const g = $("map-overlay");
    if (!g) return;
    const v = view(), mpp = mapScale(), px = (n) => round(n * mpp, 2);
    const site = S.view === "site";
    // reserve the markers, the café, the north arrow and the scale bar before placing any text
    const labels = [{ xy: S.camera, reserve: 10 }, { xy: S.couple, reserve: 10 },
      { box: [-44, 0, 0, 50] }, { box: [0, 14 + v.scale / mpp + 12, -36, 0] }];
    if (site) labels.push({ xy: [0, 0], reserve: 12 });
    labels.push({ xy: S.couple, text: "You two", cls: "mark-lbl", size: 11, clear: 11, weight: 600 },
      { xy: S.camera, text: "Camera", cls: "mark-lbl", size: 11, clear: 11, weight: 600 });
    const sd = sunDay(S.day), sun = sunAt(S.day, S.min), o = optics();
    const C = S.couple, K = S.camera;
    const far = Math.hypot(v.x1 - v.x0, v.y1 - v.y0) * 2;
    const ray = (p, b, len) => [p[0] + Math.sin(b * RAD) * len, p[1] + Math.cos(b * RAD) * len];
    const Q = (p) => `${round(p[0], 1)},${round(-p[1], 1)}`;
    const b = bearingOf(K, C);
    let s = "";

    s += `<path class="fov" d="M${Q(K)}L${Q(ray(K, b - o.hfov / 2, far))}L${Q(ray(K, b + o.hfov / 2, far))}Z"/>`;
    s += `<path class="fov-axis" d="M${Q(K)}L${Q(ray(K, b, far))}"/>`;

    for (const [m, cls] of [[sd.ev.sunrise, "azline"], [sd.ev.sunset, "azline"], [sd.ev.lastLight, "azline azline--last"]]) {
      if (m != null) s += `<path class="${cls}" d="M${Q(C)}L${Q(ray(C, sunAt(S.day, m).az, far))}"/>`;
    }
    const R = v.ring;
    s += `<circle class="hour-ring" cx="${C[0]}" cy="${-C[1]}" r="${R}"/>`;
    for (let hr = 7; hr <= 17; hr++) {
      const p = sunAt(S.day, hr * 60);
      if (p.alt < -0.5) continue;
      const a = ray(C, p.az, R), e = ray(C, p.az, R * 1.12);
      s += `<path class="hour-tick" d="M${Q(a)}L${Q(e)}"/>`;
      labels.push({ xy: ray(C, p.az, R * 1.3), text: String(hr).padStart(2, "0"), cls: "hour-lbl", size: 10, wf: 0.62, anchor: "middle" });
    }
    labels.push({ xy: [0, 0], text: "The Sound Café", cls: "lbl", size: 12, clear: site ? 13 : 5, weight: 600 });
    for (const p of D.map.places) {
      if (!p.v.includes(site ? "s" : "o")) continue;
      if (p.k === "water") labels.push({ xy: p.xy, text: p.n, cls: "lbl lbl--water", size: 13, wf: 0.48, anchor: "middle" });
      else if (p.k === "island") labels.push({ xy: p.xy, text: p.n.toUpperCase(), cls: "lbl lbl--big", size: 15, wf: 0.74, anchor: "middle" });
      else labels.push({ xy: p.xy, text: p.n, cls: "lbl", size: 11, dot: true });
    }

    if (sun.alt > -1) {
      const end = edgePoint(C, sun.az, v, px(16));
      s += `<path class="sunray${sun.visible ? "" : " sunray--off"}" d="M${Q(C)}L${Q(end)}"/>`;
      let glyph = `<circle class="sun-glyph" cx="${round(end[0], 1)}" cy="${round(-end[1], 1)}" r="${px(6)}"/>`;
      for (let k = 0; k < 8; k++) {
        const a = k * 45, p1 = ray(end, a, px(9)), p2 = ray(end, a, px(13));
        glyph += `<path class="sunray" d="M${Q(p1)}L${Q(p2)}"/>`;
      }
      s += glyph;
      if (S.view === "site" && sun.visible && sun.app > 0.5) {
        const L = Math.min(1.7 / Math.tan(sun.app * RAD), 400);
        s += `<path class="shadow" d="M${Q(C)}L${Q(ray(C, sun.az + 180, L))}"/>`;
      }
    }

    // camera: a small body pointing along the line of sight
    const cw = px(8), ch = px(5.5);
    s += `<g transform="translate(${round(K[0], 1)},${round(-K[1], 1)}) rotate(${round(b, 1)})">`
      + `<rect class="mark" x="${-cw}" y="${-ch}" width="${2 * cw}" height="${2 * ch}" rx="${px(2)}"/>`
      + `<circle class="mark mark--fill" cx="0" cy="${-ch}" r="${px(3.2)}"/></g>`;
    s += `<circle class="mark mark--fill" cx="${round(C[0] - px(3.5), 1)}" cy="${-C[1]}" r="${px(4.5)}"/>`
      + `<circle class="mark mark--fill" cx="${round(C[0] + px(3.5), 1)}" cy="${-C[1]}" r="${px(4.5)}"/>`;
    g.innerHTML = s + labelLayer(labels, v, mpp);
  }

  function lightOn(sun, b) {
    if (sun.alt < -0.833) return "The sun is down, so the light is soft and even.";
    if (!sun.visible) return `The sun is behind the ${sun.az > 180 ? "Calf of Man" : "Meayll hills"}, so the light is soft with a bright sky behind.`;
    const rel = wrap180(sun.az - b), a = Math.abs(rel), side = rel < 0 ? "left" : "right";
    if (a < 25) return `Backlit, with the sun ${Math.round(a)}° ${side} of centre. Expect rim light on hair and faces in shade, so expose for faces (+1 to +1.7 EV) or go for silhouettes, and shade the lens.`;
    if (a < 70) return `Back-side light from the ${side} gives glowing edges and some sun on your profiles.`;
    if (a < 110) return `Side light from the ${side} gives lots of shape, with one side of each face in sun.`;
    if (a < 155) return `Warm front-side light from the ${side}, the most flattering light while the sun is this low.`;
    return "The sun is behind the camera, so faces are fully lit but you'll squint. Keep the photographer's shadow out of frame.";
  }

  const distText = (m) => (m >= 1000 ? `${round(m / 1000, 1)} km` : `${Math.round(m)} m`);
  function backdropText(bg) {
    if (bg.inland) return "the hillside, close behind you";
    let s = bg.far ? `${bg.far.name}, ${distText(bg.far.dist)} beyond you` : "open sea to the horizon";
    if (bg.near) s += ` (with ${bg.near.name === "the hillside" ? "the headland across the water" : bg.near.name} ${distText(bg.near.dist)} behind you)`;
    return s;
  }
  // how tall the skyline behind looks next to the couple, which is what a longer lens changes
  function backgroundScale(d) {
    const ridge = skyline(bearingOf(S.camera, S.couple)) - D.horizon.dip;
    if (ridge < 0.3) return "A flat sea horizon, with nothing rising above it behind you.";
    const bg = backdrop();
    const what = bg.inland ? "The hillside" : bg.far ? cap(bg.far.name) : "The skyline";
    const you = Math.atan(1.65 / Math.max(d, 0.5)) * DEG;
    return `${what} rises to <b>${Math.round((100 * ridge) / you)}%</b> of your height. Stand further back and zoom in to make it loom larger.`;
  }

  function renderMapReadout() {
    const d = dist(S.camera, S.couple), b = bearingOf(S.camera, S.couple);
    const sun = sunAt(S.day, S.min);
    $("map-readout").innerHTML = `Camera to you two: <b>${Math.round(d)} m</b>, looking <b>${Math.round(b)}° ${cardinal(b)}</b>. `
      + `Behind you: <b>${esc(backdropText(backdrop()))}</b>. At ${hm(S.min)}: ${esc(lightOn(sun, b))}`;
  }

  // ---------------------------------------------------------------- viewfinder

  // simple silhouettes in metres: x to the right, y up from the feet
  const FIGURES = {
    her: {
      head: [0, 1.545, 0.105],
      polys: [[-0.05, 1.44, -0.2, 1.37, -0.22, 1.1, -0.15, 0.98, -0.2, 0.84, -0.25, 0.46, -0.13, 0.46, -0.11, 0, -0.03, 0, -0.02, 0.44,
        0.02, 0.44, 0.03, 0, 0.11, 0, 0.13, 0.46, 0.25, 0.46, 0.2, 0.84, 0.15, 0.98, 0.22, 1.1, 0.2, 1.37, 0.05, 1.44]],
    },
    him: {
      head: [0, 1.68, 0.115],
      polys: [[-0.055, 1.57, -0.23, 1.5, -0.25, 1.0, -0.19, 0.9, -0.18, 0.5, -0.15, 0, -0.04, 0, -0.02, 0.85, 0.02, 0.85, 0.04, 0,
        0.15, 0, 0.18, 0.5, 0.19, 0.9, 0.25, 1.0, 0.23, 1.5, 0.055, 1.57]],
    },
    kneel: {
      head: [-0.02, 1.13, 0.11],
      polys: [
        [-0.15, 1.03, 0.13, 1.03, 0.17, 0.62, -0.09, 0.6],
        [-0.08, 0.64, 0.17, 0.64, 0.14, 0.1, 0.46, 0.08, 0.46, 0, 0.02, 0, -0.05, 0.12],
        [-0.09, 0.64, 0.06, 0.56, -0.3, 0.52, -0.27, 0, -0.42, 0, -0.43, 0.5],
        [-0.1, 0.97, -0.42, 0.84, -0.44, 0.77, -0.1, 0.87],
      ],
    },
  };
  // sky colour (zenith, horizon) by apparent sun altitude
  const SKY = [[-14, "#070b17", "#121a33"], [-8, "#16224a", "#3a4a7c"], [-5, "#2a3b70", "#9a7fa8"], [-2, "#43578a", "#eb9a63"],
    [1, "#6a83b0", "#f4b46a"], [5, "#7fa3c8", "#f0d3a0"], [12, "#709fce", "#c4d9e8"], [30, "#5f93c9", "#b6d0e6"]];
  function skyColours(app) {
    if (app <= SKY[0][0]) return [SKY[0][1], SKY[0][2]];
    for (let i = 1; i < SKY.length; i++) {
      if (app <= SKY[i][0]) {
        const t = (app - SKY[i - 1][0]) / (SKY[i][0] - SKY[i - 1][0]);
        return [mix(SKY[i - 1][1], SKY[i][1], t), mix(SKY[i - 1][2], SKY[i][2], t)];
      }
    }
    return [SKY[SKY.length - 1][1], SKY[SKY.length - 1][2]];
  }

  function renderViewfinder() {
    const svg = $("viewfinder"), o = optics();
    const ratio = S.portrait ? o.sys.w / o.sys.h : o.sys.h / o.sys.w;
    const [W, H] = fit(svg, (w) => Math.min(w * ratio, 760));
    const sun = sunAt(S.day, S.min), w = wxAt(FC, atMin(S.day, S.min));
    const b = bearingOf(S.camera, S.couple), d = Math.max(0.6, dist(S.camera, S.couple));
    const pitch = Math.atan2(1.1 - S.camH, d); // aim at chest height
    const fpx = W / 2 / Math.tan((o.hfov / 2) * RAD);
    const sb = Math.sin(b * RAD), cb = Math.cos(b * RAD), sp = Math.sin(pitch), cp = Math.cos(pitch);
    const fwd = [sb * cp, cb * cp, sp], right = [cb, -sb, 0], up = [-sb * sp, -cb * sp, cp];
    const dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
    const proj = (vec) => {
      const z = dot(vec, fwd);
      return z > 1e-6 ? [W / 2 + (fpx * dot(vec, right)) / z, H / 2 - (fpx * dot(vec, up)) / z, z] : null;
    };
    const dir = (az, alt) => [Math.cos(alt * RAD) * Math.sin(az * RAD), Math.cos(alt * RAD) * Math.cos(az * RAD), Math.sin(alt * RAD)];
    const eye = GROUND + S.camH;
    const dip = -Math.sqrt((2 * eye * (1 - K_REFR)) / EARTH_R) * DEG;
    const chance = w ? sunChance(w) : 0.5;
    const [zen, hor] = skyColours(sun.app);
    const bg = backdrop();
    let s = `<defs><linearGradient id="vf-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${zen}"/><stop offset="1" stop-color="${hor}"/></linearGradient>
      <radialGradient id="vf-glow"><stop offset="0" stop-color="#fff3cf" stop-opacity="0.95"/><stop offset="0.25" stop-color="#ffd27a" stop-opacity="0.55"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs>`;
    const horizonY = (proj(dir(b, dip)) || [0, H / 2])[1];
    s += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#vf-sky)"/>`;

    // the sun (terrain drawn afterwards hides whatever is below the skyline)
    const sp2 = sun.alt > -8 ? proj(dir(sun.az, sun.app)) : null;
    let sunNote = "";
    if (sp2 && sp2[0] > -W * 0.6 && sp2[0] < W * 1.6 && sp2[1] > -H && sp2[1] < H * 1.5) {
      const r = Math.max(1.5, fpx * Math.tan(SUN_R * RAD));
      const glowR = Math.max(r * 7, W * 0.12);
      const above = sun.app > -1;
      s += `<circle cx="${round(sp2[0], 1)}" cy="${round(sp2[1], 1)}" r="${round(glowR, 1)}" fill="url(#vf-glow)" opacity="${round(above ? 0.35 + 0.65 * chance : 0.35, 2)}"/>`;
      if (above) s += `<circle cx="${round(sp2[0], 1)}" cy="${round(sp2[1], 1)}" r="${round(r, 1)}" fill="#fff6dc" opacity="${round(0.3 + 0.7 * chance, 2)}"/>`;
    }
    const veil = sun.app > 0 ? "#8b96a1" : "#2f3646", veilOpacity = w ? (0.5 * w.cc) / 100 : 0;
    if (w) s += `<rect x="0" y="0" width="${W}" height="${H}" fill="${veil}" opacity="${round(veilOpacity, 2)}"/>`;

    // sea, distant skyline (hazed by a couple of kilometres of air toward the sky colour), near ground
    const skyLow = mix(hor, veil, veilOpacity);
    const farLand = mix("#2c3828", skyLow, 0.34 + (w ? (0.12 * w.cc) / 100 : 0));
    s += `<defs><linearGradient id="vf-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix("#24394a", hor, 0.4)}"/><stop offset="1" stop-color="#14212a"/></linearGradient></defs>`;
    s += `<rect x="0" y="${round(horizonY, 1)}" width="${W}" height="${round(Math.max(0, H - horizonY), 1)}" fill="url(#vf-sea)"/>`;
    const run = [];
    const flush = () => {
      if (run.length > 1) s += `<path d="M${round(run[0][0], 1)},${round(horizonY, 1)}L${run.map((p) => `${round(p[0], 1)},${round(p[1], 1)}`).join("L")}L${round(run[run.length - 1][0], 1)},${round(horizonY, 1)}Z" fill="${farLand}"/>`;
      run.length = 0;
    };
    for (let x = -4; x <= W + 4; x += 3) {
      const az = b + Math.atan((x - W / 2) / fpx) * DEG, al = skyline(az);
      const q = al > dip + 0.01 ? proj(dir(az, al)) : null;
      if (q) run.push(q);
      else flush();
    }
    flush();
    s += `<line x1="0" x2="${W}" y1="${round(horizonY, 1)}" y2="${round(horizonY, 1)}" stroke="#ffffff" stroke-opacity="0.12"/>`;
    if (bg.inland) {
      s += `<rect x="0" y="${round(horizonY, 1)}" width="${W}" height="${round(Math.max(0, H - horizonY), 1)}" fill="#3a3e2c"/>`;
    } else {
      const gq = proj([sb * (d + 8), cb * (d + 8), -S.camH]);
      if (gq) s += `<rect x="0" y="${round(gq[1], 1)}" width="${W}" height="${round(Math.max(0, H - gq[1]), 1)}" fill="#3a3e2c"/>`;
    }

    // the two of you
    const people = S.kneel ? [[-0.38, "her"], [0.38, "kneel"]] : [[-0.3, "her"], [0.3, "him"]];
    const rel = Math.abs(wrap180(sun.az - b));
    const lit = sun.visible && sun.alt > -0.833;
    const fill = lit && rel > 110 ? "#6e5243" : "#15181d";
    const rim = lit && rel < 70 ? ` stroke="#ffcf80" stroke-width="1.2" stroke-opacity="${round(0.4 + 0.6 * chance, 2)}"` : "";
    for (const [lat, kind] of people) {
      const q = proj([S.couple[0] + right[0] * lat - S.camera[0], S.couple[1] + right[1] * lat - S.camera[1], -S.camH]);
      if (!q || q[2] < 0.4) continue;
      const k = fpx / q[2], f = FIGURES[kind];
      const P = (xm, ym) => `${round(q[0] + xm * k, 1)},${round(q[1] - ym * k, 1)}`;
      for (const poly of f.polys) {
        let dd = "";
        for (let i = 0; i < poly.length; i += 2) dd += (i ? "L" : "M") + P(poly[i], poly[i + 1]);
        s += `<path d="${dd}Z" fill="${fill}"${rim}/>`;
      }
      s += `<circle cx="${round(q[0] + f.head[0] * k, 1)}" cy="${round(q[1] - f.head[1] * k, 1)}" r="${round(f.head[2] * k, 1)}" fill="${fill}"${rim}/>`;
    }

    // thirds grid and captions
    s += `<g stroke="#ffffff" stroke-opacity="0.18" stroke-width="1">`
      + `<line x1="${round(W / 3, 1)}" x2="${round(W / 3, 1)}" y1="0" y2="${H}"/><line x1="${round((2 * W) / 3, 1)}" x2="${round((2 * W) / 3, 1)}" y1="0" y2="${H}"/>`
      + `<line y1="${round(H / 3, 1)}" y2="${round(H / 3, 1)}" x1="0" x2="${W}"/><line y1="${round((2 * H) / 3, 1)}" y2="${round((2 * H) / 3, 1)}" x1="0" x2="${W}"/></g>`;
    const txt = (x, y, t, anchor) => `<text x="${round(x, 1)}" y="${round(y, 1)}" font-size="12" fill="#ffffff" stroke="#000000" stroke-opacity="0.55" stroke-width="3" paint-order="stroke" text-anchor="${anchor || "start"}">${esc(t)}</text>`;
    s += txt(10, 20, `${lensLabel(S.eq, o.sys)} · f/${S.fnum}`);
    s += txt(W - 10, 20, `${Math.round(d)} m away`, "end");
    const calfAz = clamp(b, 210, 250);
    const cq = proj(dir(calfAz, skyline(calfAz) + 0.6));
    if (Math.abs(wrap180(b - 230)) < o.hfov / 2 + 25 && cq && cq[0] > 50 && cq[0] < W - 50 && cq[1] > 34 && cq[1] < H - 30) {
      s += `<text x="${round(cq[0], 1)}" y="${round(cq[1] - 4, 1)}" font-size="11" fill="#ffffff" fill-opacity="0.8" text-anchor="middle" font-style="italic">Calf of Man</text>`;
    }
    if (sun.alt < -0.833) sunNote = "Sun below the horizon";
    else if (!sun.visible) sunNote = `Sun behind the ${sun.az > 180 ? "Calf" : "hills"} (${round(sun.app, 1)}° high)`;
    else if (!sp2) sunNote = "Sun behind the camera";
    else if (sp2[0] < 0) sunNote = `◂ Sun ${Math.round(Math.abs(wrap180(sun.az - b)))}° left of centre`;
    else if (sp2[0] > W) sunNote = `Sun ${Math.round(Math.abs(wrap180(sun.az - b)))}° right of centre ▸`;
    else if (sp2[1] < 0) sunNote = "Sun above the frame";
    else sunNote = `Sun in frame, ${round(sun.app, 1)}° high`;
    s += txt(10, H - 12, `${hm(S.min)} · ${sunNote}`);
    svg.innerHTML = s;
  }

  function renderStats() {
    const o = optics(), d = dist(S.camera, S.couple), bg = backdrop();
    const frameH = 2 * d * Math.tan((o.vfov / 2) * RAD), frameW = 2 * d * Math.tan((o.hfov / 2) * RAD);
    const dof = depthOfField(o.f, S.fnum, o.sys.coc, d);
    const sun = sunAt(S.day, S.min), w = wxAt(FC, atMin(S.day, S.min)), ev = sceneEV(sun, w);
    const b = bearingOf(S.camera, S.couple);
    const fullAt = standAt(2.4, o.vfov);
    const farTxt = isFinite(dof.far) ? `${round(dof.far, 1)} m` : "infinity";
    const bgSharp = !bg.far ? "" : isFinite(dof.far) && dof.far < bg.far.dist ? ` ${cap(bg.far.name)} will be soft.` : ` ${cap(bg.far.name)} stays sharp.`;
    const flare = sun.visible && Math.abs(wrap180(sun.az - b)) < o.hfov / 2 + 15 ? " The sun is in or near the frame, so use a lens hood and watch for flare." : "";
    const rows = [
      ["Lens", `<b>${esc(lensLabel(S.eq, o.sys))}</b> at f/${S.fnum}${o.sys.zooms ? `. Background blur is like f/${round(S.fnum * o.sys.crop, 0)} on full frame, so use Portrait mode for softness.` : ""}`],
      ["Field of view", `<b>${round(o.hfov, 1)}° × ${round(o.vfov, 1)}°</b>`],
      [`Frame at ${Math.round(d)} m`, `<b>${round(frameW, 1)} × ${round(frameH, 1)} m</b><br>${framingName(frameH)}`],
      ["For full length", `Stand <b>${Math.round(fullAt)} m</b> away with this lens`],
      ["In focus", `<b>${round(dof.near, 1)} m</b> to <b>${farTxt}</b>.${bgSharp}`],
      ["Background size", backgroundScale(d)],
      ["Light on you", `${esc(lightOn(sun, b))}${flare}`, true],
      [`Settings at ${hm(S.min)} (about EV ${round(ev, 1)})`, `Stills: <b>${stills(ev, S.fnum, 500)}</b><br>Video 25p: <b>${video(ev, S.fnum)}</b>`, true],
    ];
    $("stats").innerHTML = rows.map(([k, v, wide]) => `<div class="stat${wide ? " stat--wide" : ""}"><dt class="label">${k}</dt><dd>${v}</dd></div>`).join("");
  }

  // ---------------------------------------------------------------- the day's light

  function renderSunPath() {
    const svg = $("sunpath");
    const [W, H] = fit(svg, (w) => (w < 520 ? 230 : 270));
    const m = { l: 34, r: 12, t: 14, b: 28 };
    const AZ = [70, 290], AL = [-7, 25];
    const X = (az) => m.l + ((az - AZ[0]) / (AZ[1] - AZ[0])) * (W - m.l - m.r);
    const Y = (al) => m.t + ((AL[1] - al) / (AL[1] - AL[0])) * (H - m.t - m.b);
    const sd = sunDay(S.day), ev = sd.ev, dip = D.horizon.dip;
    const n = (v) => round(v, 1);
    let s = `<rect class="band-golden" x="${m.l}" y="${n(Y(6))}" width="${W - m.l - m.r}" height="${n(Y(-4) - Y(6))}"/>`
      + `<rect class="band-blue" x="${m.l}" y="${n(Y(-4))}" width="${W - m.l - m.r}" height="${n(Y(-6) - Y(-4))}"/>`;
    for (const al of [0, 10, 20]) {
      s += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${n(Y(al))}" y2="${n(Y(al))}"/><text x="${m.l - 6}" y="${n(Y(al) + 4)}" text-anchor="end" font-size="11">${al}°</text>`;
    }
    for (const [az, name] of [[90, "E"], [135, "SE"], [180, "S"], [225, "SW"], [270, "W"]]) {
      s += `<line class="grid" x1="${n(X(az))}" x2="${n(X(az))}" y1="${m.t}" y2="${H - m.b}"/><text x="${n(X(az))}" y="${H - 9}" text-anchor="middle" font-size="11">${W < 420 ? name : `${name} ${az}°`}</text>`;
    }
    let run = [];
    const terrain = () => {
      if (run.length > 1) s += `<path class="terrain" d="M${n(run[0][0])},${n(Y(dip))}L${run.map((p) => `${n(p[0])},${n(p[1])}`).join("L")}L${n(run[run.length - 1][0])},${n(Y(dip))}Z"/>`;
      run = [];
    };
    for (let az = AZ[0]; az <= AZ[1]; az += 0.5) {
      const al = skyline(az);
      if (al > dip + 0.02) run.push([X(az), Y(al)]);
      else terrain();
    }
    terrain();
    s += `<line class="sea-line" x1="${m.l}" x2="${W - m.r}" y1="${n(Y(dip))}" y2="${n(Y(dip))}"/>`;
    // name each ridge inside its own silhouette, clear of the sun's path
    s += `<text class="ann" x="${n(X(219))}" y="${n(Y(0.75))}" text-anchor="middle" font-size="10">Calf of Man</text>`
      + `<text class="ann" x="${n(X(100))}" y="${n(Y(2))}" text-anchor="middle" font-size="10">Meayll hills</text>`;

    const hidden = [], shown = [];
    let seg = null, segVis = null;
    for (let mm = 0; mm <= 1440; mm += 2) {
      const az = sd.az[mm], al = sd.app[mm];
      if (al < AL[0] || az < AZ[0] || az > AZ[1]) { seg = null; continue; }
      const vis = sd.top[mm] > 0;
      if (!seg || vis !== segVis) {
        const prevPt = seg ? seg[seg.length - 1] : null;
        seg = prevPt ? [prevPt] : [];
        (vis ? shown : hidden).push(seg);
        segVis = vis;
      }
      seg.push([X(az), Y(al)]);
    }
    for (const sg of hidden) s += `<path class="sunpath sunpath--hidden" d="${pathD(sg)}"/>`;
    for (const sg of shown) s += `<path class="sunpath" d="${pathD(sg)}"/>`;
    for (let hr = 7; hr <= 17; hr += W < 520 ? 2 : 1) {
      const az = sd.az[hr * 60], al = sd.app[hr * 60];
      if (al < AL[0] + 1) continue;
      s += `<circle cx="${n(X(az))}" cy="${n(Y(al))}" r="2.5" class="sun-glyph" fill="currentColor"/><text x="${n(X(az) + (az > 180 ? 7 : -7))}" y="${n(Y(al) - 4)}" text-anchor="${az > 180 ? "start" : "end"}" font-size="10">${String(hr).padStart(2, "0")}</text>`;
    }
    const key = [];
    if (ev.lastLight != null) {
      const k = Math.round(ev.lastLight);
      s += `<circle cx="${n(X(sd.az[k]))}" cy="${n(Y(sd.app[k]))}" r="5" fill="none" class="cursor"/>`;
      key.push(`<span class="num">○ ${hm(ev.lastLight)}</span> sun gone behind the Calf`);
    }
    if (ev.sunset != null) {
      const x = X(sd.az[Math.round(ev.sunset)]);
      s += `<line class="cursor" x1="${n(x)}" x2="${n(x)}" y1="${n(Y(dip) - 5)}" y2="${n(Y(dip) + 5)}"/>`;
      key.push(`<span class="num">| ${hm(ev.sunset)}</span> sunset at sea level, hidden by the Calf`);
    }
    key.push(`<span class="num">● ${hm(S.min)}</span> the time you've picked`);
    const sun = sunAt(S.day, S.min);
    if (sun.app >= AL[0] && sun.az >= AZ[0] && sun.az <= AZ[1]) {
      s += `<circle class="sun-now" cx="${n(X(sun.az))}" cy="${n(Y(sun.app))}" r="6"/>`;
    }
    svg.innerHTML = s;
    svg.style.color = "var(--sun)";
    $("sunpath-key").innerHTML = key.join(" · ");
  }

  function renderLightNote() {
    const ev = sunDay(S.day).ev;
    const set = sunAt(S.day, ev.sunset).az;
    let hills = "";
    if (ev.firstLight != null) {
      const left = Math.floor(ev.goldenEndAM - ev.firstLight);
      hills = ` In the morning the Meayll hills hide the sun until ${hm(ev.firstLight)}, `
        + (left > 0 ? `which leaves only about ${left} minutes of direct morning golden light.` : "so morning golden hour passes in shade.");
    }
    $("light-note").textContent = `From the café the Calf of Man stands 2–3° above the sea between bearings 203° and 257°. The sun sets at ${Math.round(set)}°, right behind the Calf's summit, so the last direct light on the terrace comes at ${hm(ev.lastLight)}, ${Math.round(ev.sunset - ev.lastLight)} minutes before the official sunset.${hills}`;
  }

  function renderTimes() {
    const sd = sunDay(S.day), ev = sd.ev;
    const azOf = (m) => `${Math.round(sd.az[clamp(Math.round(m), 0, 1440)])}°`;
    const rows = [
      ["Nautical dawn", ev.nauticalDawn], ["Civil dawn", ev.civilDawn], ["Sunrise (sea level)", ev.sunrise, azOf(ev.sunrise)],
      ["Sun clears the Meayll hills", ev.firstLight, ev.firstLight != null ? `${azOf(ev.firstLight)}` : ""],
      ["Solar noon", ev.noon, `${round(ev.noonAlt, 1)}° high`],
      ["Golden hour begins", ev.goldenStartPM, "sun 6° high", true], ["Sun touches the Calf", ev.touch, ev.touch != null ? azOf(ev.touch) : ""],
      ["Sun gone behind the Calf", ev.lastLight, ev.lastLight != null ? azOf(ev.lastLight) : "", true],
      ["Sunset (sea level)", ev.sunset, azOf(ev.sunset), true], ["Blue hour begins", ev.blueStartPM, "sun 4° below", true],
      ["Civil dusk, blue hour ends", ev.civilDusk, "sun 6° below"], ["Nautical dusk", ev.nauticalDusk], ["Dark", ev.astroDusk],
    ];
    $("times").innerHTML = `<tbody>${rows.filter((r) => r[1] != null).map(([label, m, extra, key]) =>
      `<tr data-min="${Math.round(m)}"${key ? ' class="is-key"' : ""}><th scope="row">${label}</th><td>${hm(m)}</td><td class="az">${extra || ""}</td></tr>`).join("")}</tbody>`;
  }

  // ---------------------------------------------------------------- weather charts

  function renderWx() {
    const svg = $("wx");
    const [W, H] = fit(svg, 248);
    const m = { l: 50, r: 10, t: 8, b: 22 };
    const X = (min) => m.l + ((min - RANGE[0]) / (RANGE[1] - RANGE[0])) * (W - m.l - m.r);
    const cx = (v) => round(clamp(v, m.l, W - m.r), 1);
    const rows = [["hi", "High", 8, 24], ["mid", "Mid", 28, 44], ["lo", "Low", 48, 64]];
    const gfsRow = [70, 78], tBox = [96, 150], windY = 186;
    const ev = sunDay(S.day).ev;
    let s = "";
    const goldenEnd = ev.lastLight ?? ev.blueStartPM;
    s += `<rect class="band-golden" x="${cx(X(ev.goldenStartPM))}" y="${m.t}" width="${round(cx(X(goldenEnd)) - cx(X(ev.goldenStartPM)), 1)}" height="${H - m.t - m.b}"/>`;
    s += `<rect class="band-blue" x="${cx(X(ev.blueStartPM))}" y="${m.t}" width="${round(cx(X(ev.civilDusk)) - cx(X(ev.blueStartPM)), 1)}" height="${H - m.t - m.b}"/>`;
    for (const [, label, y0, y1] of rows) s += `<text x="${m.l - 6}" y="${(y0 + y1) / 2 + 4}" text-anchor="end" font-size="10">${label}</text>`;
    s += `<text x="${m.l - 6}" y="${gfsRow[1]}" text-anchor="end" font-size="9">GFS</text>`;
    s += `<text x="${m.l - 6}" y="${tBox[0] + 8}" text-anchor="end" font-size="10">°C</text><text x="${m.l - 6}" y="${windY + 4}" text-anchor="end" font-size="10">mph</text>`;
    const temps = [];
    let rainAny = false;
    const step = W < 480 ? 2 : 1;
    for (let h = 6; h <= 19; h++) {
      const w = wxAt(FC, atMin(S.day, h * 60));
      if (!w) continue;
      const x0 = cx(X(h * 60 - 30)), x1 = cx(X(h * 60 + 30));
      for (const [k, , y0, y1] of rows) s += `<rect class="cloud" x="${x0}" y="${y0}" width="${round(x1 - x0 - 1, 1)}" height="${y1 - y0}" opacity="${round(0.06 + (0.84 * w[k]) / 100, 2)}"/>`;
      temps.push([X(h * 60), w.temp]);
      if (w.rain > 0) {
        rainAny = true;
        const hgt = Math.min(tBox[1] - tBox[0], (w.rain / 2) * (tBox[1] - tBox[0]));
        s += `<rect class="rain" x="${round(X(h * 60 + 5), 1)}" y="${round(tBox[1] - hgt, 1)}" width="${round(X(h * 60 + 55) - X(h * 60 + 5), 1)}" height="${round(hgt, 1)}" opacity="0.6"/>`;
      }
      if (h >= 7 && h % step === 0 && w.wd != null) {
        const to = w.wd + 180; // arrow points where the wind is going
        s += `<g transform="translate(${round(X(h * 60), 1)},${windY - 10}) rotate(${round(to, 0)})"><path class="wind" d="M0,-7L4,3L0,1L-4,3Z"/></g>`
          + `<text x="${round(X(h * 60), 1)}" y="${windY + 12}" text-anchor="middle" font-size="10">${Math.round(w.ws * MPH)}</text>`;
      }
    }
    for (const g of GFS) {
      if (!g.t.startsWith(S.day)) continue;
      const mins = (g.ms - midnight(S.day)) / 60000;
      const x0 = cx(X(mins - 90)), x1 = cx(X(mins + 90));
      if (x1 - x0 > 1) s += `<rect class="gfs" x="${x0}" y="${gfsRow[0]}" width="${round(x1 - x0 - 1, 1)}" height="${gfsRow[1] - gfsRow[0]}" opacity="${round(0.06 + (0.8 * g.cc) / 100, 2)}"/>`;
    }
    if (temps.length) {
      const lo = Math.floor(Math.min(...temps.map((t) => t[1])) - 1), hi = Math.ceil(Math.max(...temps.map((t) => t[1])) + 1);
      const TY = (t) => tBox[1] - ((t - lo) / (hi - lo)) * (tBox[1] - tBox[0]);
      s += `<path class="temp" d="${pathD(temps.map(([x, t]) => [x, TY(t)]))}"/>`;
      s += `<text x="${m.l + 2}" y="${round(TY(hi) + 9, 1)}" font-size="9">${hi}°</text><text x="${m.l + 2}" y="${round(TY(lo) - 2, 1)}" font-size="9">${lo}°</text>`;
      if (!rainAny) s += `<text x="${W - m.r - 4}" y="${tBox[1] - 4}" text-anchor="end" font-size="10">no rain</text>`;
    } else {
      s += `<text x="${(W + m.l) / 2}" y="${tBox[0] + 20}" text-anchor="middle" font-size="12">No forecast hours for this day</text>`;
    }
    for (let h = 6; h <= 19; h += 2) s += `<text x="${round(X(h * 60), 1)}" y="${H - 6}" text-anchor="middle" font-size="10">${String(h).padStart(2, "0")}</text>`;
    if (ev.lastLight != null) s += `<line class="ann-line" x1="${round(X(ev.lastLight), 1)}" x2="${round(X(ev.lastLight), 1)}" y1="${m.t}" y2="${H - m.b}"/>`;
    s += `<line class="cursor" x1="${round(X(S.min), 1)}" x2="${round(X(S.min), 1)}" y1="${m.t}" y2="${H - m.b}"/>`;
    svg.innerHTML = s;
  }

  const LAYERS = [["lo", 0.4, 2, 0.9], ["mid", 2, 6, 0.8], ["hi", 6, 11, 0.35]]; // km above sea level, how much each blocks
  const beamHeight = (km, app) => (GROUND + km * 1000 * Math.tan(app * RAD) + (km * 1000) ** 2 / ((2 * EARTH_R) / (1 - K_REFR))) / 1000;
  function beamColumns(ms) {
    return [{ km: 0, w: wxAt(FC, ms) }].concat(BEAM.map((p) => ({ km: p.km, w: wxAt(p.hours, ms) })));
  }
  // share of direct sunlight that gets through the forecast cloud along the sun's path (very rough)
  function beamTransmission(min) {
    const sun = sunAt(S.day, min);
    if (sun.app < -1) return null;
    let t = 1;
    for (const c of beamColumns(atMin(S.day, min))) {
      if (!c.w || c.km === 0) continue;
      const z = beamHeight(c.km, sun.app);
      const layer = LAYERS.find(([, z0, z1]) => z >= z0 && z < z1);
      if (layer) t *= 1 - (layer[3] * c.w[layer[0]]) / 100;
    }
    const here = wxAt(FC, atMin(S.day, min));
    if (here) t *= 1 - (0.9 * here.lo) / 100; // whatever sits over the café itself
    return t;
  }

  function renderBeam() {
    const svg = $("beam");
    const [W, H] = fit(svg, 212);
    const m = { l: 44, r: 12, t: 10, b: 36 };
    const KM = 160, ZK = 12;
    const X = (km) => m.l + (km / KM) * (W - m.l - m.r);
    const Y = (z) => H - m.b - (z / ZK) * (H - m.t - m.b);
    const sun = sunAt(S.day, S.min), ms = atMin(S.day, S.min);
    const cols = beamColumns(ms);
    let s = "";
    cols.forEach((c, i) => {
      const a = i === 0 ? 0 : (cols[i - 1].km + c.km) / 2, e = i === cols.length - 1 ? KM : (c.km + cols[i + 1].km) / 2;
      if (!c.w) return;
      for (const [k, z0, z1] of LAYERS) {
        s += `<rect class="cloud" x="${round(X(a), 1)}" y="${round(Y(z1), 1)}" width="${round(X(e) - X(a) - 1, 1)}" height="${round(Y(z0) - Y(z1), 1)}" opacity="${round(0.05 + (0.8 * c.w[k]) / 100, 2)}"/>`;
      }
    });
    s += `<rect class="sea" x="${m.l}" y="${round(Y(0), 1)}" width="${W - m.l - m.r}" height="6"/>`;
    s += `<rect class="ground" x="${round(X(98), 1)}" y="${round(Y(0) - 3, 1)}" width="${round(X(KM) - X(98), 1)}" height="9"/>`;
    s += `<rect class="ground" x="${round(X(0), 1)}" y="${round(Y(0) - 3, 1)}" width="${round(Math.max(4, X(2) - X(0)), 1)}" height="9"/>`;
    for (const [z, label] of [[1.2, "low"], [4, "mid"], [8.5, "high"]]) s += `<text x="${m.l - 6}" y="${round(Y(z) + 4, 1)}" text-anchor="end" font-size="10">${label}</text>`;
    for (const km of [0, 25, 50, 100, 150]) {
      s += `<text x="${round(X(km), 1)}" y="${round(Y(0) + 20, 1)}" text-anchor="${km ? "middle" : "start"}" font-size="10"${km ? "" : ' class="lbl-strong"'}>${km ? km + (km === 150 ? " km" : "") : "café"}</text>`;
    }
    s += `<text x="${round(X(60), 1)}" y="${round(Y(0) - 6, 1)}" font-size="10">Irish Sea</text>`
      + `<text x="${round(X(124), 1)}" y="${round(Y(0) - 8, 1)}" font-size="10">Ireland</text>`;
    let note;
    if (sun.app > -1) {
      const pts = [];
      for (let km = 0; km <= KM; km += 2) {
        const z = beamHeight(km, sun.app);
        pts.push([X(km), Y(Math.min(z, ZK))]);
        if (z > ZK) break;
      }
      const t = beamTransmission(S.min);
      s += `<path class="beam${sun.visible ? "" : " beam--blocked"}" d="${pathD(pts)}"/>`;
      const verdict = t > 0.6 ? "mostly clear" : t > 0.3 ? "partly dimmed" : "largely blocked";
      note = `At ${hm(S.min)} the sun is ${round(sun.app, 1)}° up, and roughly ${Math.round(t * 100)}% of its direct light gets through the cloud drawn here (${verdict}).`
        + (sun.visible ? "" : " Seen from the café, the Calf of Man is in the way right now.");
    } else {
      note = `At ${hm(S.min)} the sun is below the horizon. High cloud overhead can glow pink for 10–20 minutes after sunset if the low cloud to the west (25–150 km) is thin.`;
    }
    $("beam-note").textContent = `${note} The slice runs along bearing ${D.sunbeam.bearing}°, toward the sunset, with the height exaggerated.`;
    svg.innerHTML = s;
  }

  function renderSource() {
    const fmt = (iso) => {
      const ms = Date.parse(iso);
      if (!isFinite(ms)) return "—";
      const c = localClock(ms);
      return `${dayLabel(c.day)} ${hm(c.min)}`;
    };
    $("source").innerHTML = `<span>Forecast: ${esc(FC_META.source)}, issued ${fmt(FC_META.updated)}${FC_META.live ? ", fetched live" : `, saved ${fmt(FC_META.fetched)}`}.</span>
      <button class="btn" id="refresh" type="button">Check for a newer forecast</button>
      <a href="https://www.windy.com/54.064/-4.792?clouds,54.064,-4.792,10" target="_blank" rel="noopener">Cloud map on Windy</a>
      <a href="https://www.gov.im/weather/" target="_blank" rel="noopener">Isle of Man forecast</a>
      ${FC_META.note ? `<span class="warnline">${esc(FC_META.note)}</span>` : ""}`;
    $("refresh").addEventListener("click", () => refreshForecast(true));
  }

  // ---------------------------------------------------------------- lens guide and plan

  const SHOTS = [
    { name: "Establishing: café, Sound and Calf", eq: 20, frameH: null, note: "f/8 from the slope above the car park. Get the café, the Sound and the Calf in one frame." },
    { name: "The moment, from a hidden spot", eq: 150, frameH: 2.4, note: "A telephoto pulls the Calf in close behind you and lets the photographer stay out of sight. 1/500 s, continuous burst." },
    { name: "Her reaction", eq: 200, frameH: 0.75, note: "Same spot, zoomed in. Keep shooting through the hug." },
    { name: "The two of you, after", eq: 85, frameH: 1.3, note: "Waist up at f/2 to f/2.8 so the background softens." },
    { name: "Ring and hands", eq: 100, frameH: 0.25, note: "A close-focusing or macro lens. On a phone use 2× and tap to focus on the stone." },
    { name: "Silhouette against the Calf", eq: 135, frameH: 2.6, note: "Once the sun is behind the ridge, get low so you both stand against the bright sky. Underexpose by 1–2 stops." },
    { name: "Video: locked-off wide", eq: 28, frameH: 3.2, note: "Tripod, 4K at 25p, 1/50 s with an ND filter. Use a lav mic with a fur windshield; wind will drown a camera mic." },
  ];

  // a phone only has a few real lenses, so suggest the nearest one rather than a digital zoom
  const shotEq = (eq, sys) => (sys.zooms
    ? 24 * sys.zooms.reduce((best, z) => (Math.abs(Math.log((24 * z) / eq)) < Math.abs(Math.log((24 * best) / eq)) ? z : best))
    : eq);

  function renderGuide() {
    const sys = SYSTEMS[S.sys];
    $("guide-sys").textContent = sys.name;
    $("shots").innerHTML = SHOTS.map((sh, i) => {
      const eq = shotEq(sh.eq, sys);
      const dist = sh.frameH ? ` With this lens, stand about ${Math.round(standAt(sh.frameH, vfovFor(eq, sys)))} m away.` : "";
      return `<div class="shot"><span class="shot__name">${esc(sh.name)}</span><span class="shot__lens">${esc(lensLabel(eq, sys))}</span>
        <span class="shot__note">${esc(sh.note)}${dist}</span>
        <button class="btn btn--quiet shot__use" type="button" data-shot="${i}">Preview this lens</button></div>`;
    }).join("");
  }

  function planItems() {
    const ev = sunDay(S.day).ev;
    const L = ev.lastLight ?? ev.sunset - 20;
    const close = (D.site.hours[S.day] || [10, 17])[1];
    return [
      { id: "arrive", t: L - 100, title: "Arrive, get a table, walk out to the viewpoint", lens: "", note: `The café is open until ${close}:00. Feel how hard the wind blows at the cliff edge and settle on your exact spot.` },
      { id: "hide", t: L - 75, title: "Photographer settles into the hidden spot", lens: "70–200 mm, or phone at 3×–5×", note: "Pre-focus on the spot, set exposure on a stand-in, and agree a signal for “now”." },
      { id: "warm", t: L - 60, title: "A few relaxed photos of the two of you", lens: "35–85 mm", note: "Gets you both easy in front of a camera, and gives the photographer a reason to be there." },
      { id: "moment", t: Math.max(ev.goldenStartPM, L - 40), t2: L - 10, title: "The moment", lens: "135–200 mm, 1/500 s, burst", note: "Low, warm sun over the Calf. Stand so she faces the camera, and kneel side-on to it." },
      { id: "after", t: L - 8, title: "Reaction, hug, ring close-ups", lens: "50–100 mm", note: "Keep shooting. The best frames often come in the ten seconds after." },
      { id: "behind", t: L, title: "Sun slips behind the Calf: silhouettes", lens: "85–200 mm, expose for the sky", note: "Get low so you both stand against the bright rim above the ridge." },
      { id: "sunset", t: ev.sunset, title: "Sunset: look up at the high cloud", lens: "16–35 mm", note: "If the cirrus catches colour, go wide and include the sky." },
      { id: "blue", t: ev.blueStartPM, t2: ev.civilDusk, title: "Blue hour outside the café", lens: "24–50 mm at f/1.8–2.8, tripod", note: `Warm windows against a blue sky. The café shuts at ${close}:00, so these are from outside.` },
    ];
  }

  function renderPlan() {
    $("plan").innerHTML = planItems().map((it) => {
      const key = S.day + ":" + it.id, done = !!S.done[key];
      return `<div class="plan__item${done ? " is-done" : ""}"><input type="checkbox" id="plan-${it.id}" data-done="${key}"${done ? " checked" : ""} aria-label="Done: ${esc(it.title)}">
        <span class="plan__time">${hm(it.t)}${it.t2 ? `–<br>${hm(it.t2)}` : ""}</span>
        <div class="plan__body"><label class="plan__title" for="plan-${it.id}">${esc(it.title)}</label>${it.lens ? `<span class="plan__lens">${esc(it.lens)}</span>` : ""}
        <span class="plan__note">${esc(it.note)}</span><button class="btn btn--quiet plan__go" type="button" data-min="${Math.round(it.t)}">Show the light at ${hm(it.t)}</button></div></div>`;
    }).join("");
  }

  // ---------------------------------------------------------------- controls

  function renderControls() {
    const sys = SYSTEMS[S.sys];
    $("sys").innerHTML = Object.entries(SYSTEMS).map(([k, v]) => `<option value="${k}"${k === S.sys ? " selected" : ""}>${esc(v.name)}</option>`).join("");
    $("fnum").innerHTML = FNUMS.map((f) => `<option value="${f}"${f === S.fnum ? " selected" : ""}>f/${f}</option>`).join("");
    $("camh").value = String(S.camH);
    S.eq = clamp(S.eq, sys.min * sys.crop, sys.max * sys.crop);
    const focal = $("focal");
    focal.value = Math.round((1000 * Math.log(S.eq / sys.crop / sys.min)) / Math.log(sys.max / sys.min));
    $("focal-out").textContent = lensLabel(S.eq, sys);
    const chips = sys.zooms ? sys.zooms.map((z) => [24 * z, `${z}×`]) : sys.chips.map((f) => [f * sys.crop, `${f}`]);
    $("focal-chips").innerHTML = chips.map(([eq, label]) =>
      `<button class="btn" type="button" data-eq="${round(eq, 2)}" aria-pressed="${Math.abs(eq - S.eq) < 0.5}">${label}${sys.zooms ? "" : " mm"}</button>`).join("");
    $("orient").textContent = S.portrait ? "Portrait" : "Landscape";
    $("orient").setAttribute("aria-pressed", S.portrait);
    $("pose").textContent = S.kneel ? "One kneeling" : "Both standing";
    $("pose").setAttribute("aria-pressed", S.kneel);
    for (const b of document.querySelectorAll("#placing button")) b.setAttribute("aria-pressed", b.dataset.placing === S.placing);
    $("preset").innerHTML = PRESETS.map((p) => `<option value="${p.id}"${p.id === S.preset ? " selected" : ""}>${esc(p.name)}</option>`).join("")
      + `<option value="custom"${S.preset === "custom" ? " selected" : ""}>Your own placement</option>`;
  }

  // ---------------------------------------------------------------- live forecast (works outside Claude's viewer)

  function normalizeMet(doc) {
    return doc.properties.timeseries.filter((t) => t.data.next_1_hours).map((t) => {
      const i = t.data.instant.details, n1 = t.data.next_1_hours;
      return {
        t: t.time.slice(0, 16) + "Z", temp: i.air_temperature, feels: i.apparent_air_temperature ?? i.air_temperature,
        cc: i.cloud_area_fraction, lo: i.cloud_area_fraction_low, mid: i.cloud_area_fraction_medium, hi: i.cloud_area_fraction_high,
        fog: i.fog_area_fraction, rh: i.relative_humidity, ws: i.wind_speed, wd: i.wind_from_direction, gust: i.wind_speed_of_gust ?? null,
        rain: n1.details ? n1.details.precipitation_amount : null, pop: n1.details ? n1.details.probability_of_precipitation ?? null : null,
        sym: n1.summary ? n1.summary.symbol_code : null,
      };
    });
  }
  async function getJSON(url) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 12000);
    try {
      const r = await fetch(url, { signal: ctl.signal });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } finally {
      clearTimeout(timer);
    }
  }
  async function refreshForecast(manual) {
    const met = (lat, lon, alt) => `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}${alt ? `&altitude=${alt}` : ""}`;
    if (manual) {
      FC_META.note = "Checking MET Norway…";
      renderSource();
    }
    try {
      const docs = await Promise.all([getJSON(met(D.site.lat, D.site.lon, Math.round(GROUND)))]
        .concat(D.sunbeam.points.map((p) => getJSON(met(p.lat, p.lon)))));
      FC = prep(normalizeMet(docs[0]));
      BEAM = D.sunbeam.points.map((p, i) => Object.assign({}, p, { hours: prep(normalizeMet(docs[i + 1])) }));
      FC_META = { source: "MET Norway Locationforecast 2.0", updated: docs[0].properties.meta.updated_at, fetched: new Date().toISOString(), live: true, note: "" };
      renderOutlook();
      renderSource();
      renderTimeDependent();
    } catch (err) {
      FC_META.note = manual
        ? "Couldn't reach MET Norway. Inside Claude's viewer the page can't load live data; elsewhere, check your connection. The saved forecast above still applies, and the links show the latest."
        : "";
      renderSource();
    }
  }

  // ---------------------------------------------------------------- wiring

  function renderTimeDependent() {
    renderReadout();
    renderMapOverlay();
    renderMapReadout();
    renderViewfinder();
    renderStats();
    renderSunPath();
    renderWx();
    renderBeam();
  }
  function renderAll() {
    renderDays();
    renderKeys();
    renderOutlook();
    renderTrack();
    renderJumps();
    renderControls();
    renderMap();
    renderLightNote();
    renderTimes();
    renderGuide();
    renderPlan();
    renderSource();
    renderTimeDependent();
  }

  let frame = 0;
  function setMin(min) {
    S.min = clamp(Math.round(min), RANGE[0], RANGE[1]);
    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        renderTimeDependent();
      });
    }
  }
  function lensChanged() {
    renderControls();
    renderMapOverlay();
    renderViewfinder();
    renderStats();
    save();
  }

  function bind() {
    $("time").addEventListener("input", (e) => setMin(+e.target.value));
    document.addEventListener("click", (e) => {
      const t = e.target.closest("button, tr[data-min]");
      if (!t) return;
      if (t.dataset.day) {
        S.day = t.dataset.day;
        S.min = clamp(Math.round((sunDay(S.day).ev.lastLight ?? 960) - 25), RANGE[0], RANGE[1]);
        save();
        renderAll();
      } else if (t.dataset.min) {
        setMin(+t.dataset.min);
        if (t.classList.contains("plan__go")) $("scrubber").scrollIntoView({ block: "nearest" });
      } else if (t.dataset.view) {
        S.view = t.dataset.view;
        save();
        renderMap();
      } else if (t.dataset.placing) {
        S.placing = t.dataset.placing;
        renderControls();
      } else if (t.dataset.eq) {
        S.eq = +t.dataset.eq;
        lensChanged();
      } else if (t.dataset.shot) {
        S.eq = shotEq(SHOTS[+t.dataset.shot].eq, SYSTEMS[S.sys]);
        lensChanged();
        $("lens-panel").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    $("map").addEventListener("click", (e) => {
      const svg = $("map"), ctm = svg.getScreenCTM();
      if (!ctm) return;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
      const xy = [round(p.x, 1), round(-p.y, 1)];
      if (landAt(xy) < 0) {
        $("map-warn").textContent = "That spot is in the water. Pick somewhere on land.";
        return;
      }
      $("map-warn").textContent = "";
      S[S.placing] = xy;
      S.preset = "custom";
      if (dist(S.camera, S.couple) < 1) S.camera = [S.couple[0] + 3, S.couple[1] + 3];
      save();
      renderControls();
      renderTimeDependent();
    });
    $("preset").addEventListener("change", (e) => {
      const p = PRESETS.find((x) => x.id === e.target.value);
      if (!p) return;
      S.preset = p.id;
      S.couple = p.couple.slice();
      S.camera = p.camera.slice();
      S.eq = p.eq;
      if (S.view === "sound") S.view = "site";
      save();
      renderControls();
      renderMap();
      renderTimeDependent();
    });
    $("sys").addEventListener("change", (e) => { S.sys = e.target.value; lensChanged(); renderGuide(); });
    $("fnum").addEventListener("change", (e) => { S.fnum = +e.target.value; lensChanged(); });
    $("camh").addEventListener("change", (e) => { S.camH = +e.target.value; lensChanged(); });
    $("focal").addEventListener("input", (e) => {
      const sys = SYSTEMS[S.sys];
      S.eq = sys.min * (sys.max / sys.min) ** (+e.target.value / 1000) * sys.crop;
      $("focal-out").textContent = lensLabel(S.eq, sys);
      renderMapOverlay();
      renderViewfinder();
      renderStats();
    });
    $("focal").addEventListener("change", () => lensChanged());
    $("orient").addEventListener("click", () => { S.portrait = !S.portrait; lensChanged(); });
    $("pose").addEventListener("click", () => { S.kneel = !S.kneel; lensChanged(); });
    $("plan").addEventListener("change", (e) => {
      const key = e.target.dataset.done;
      if (!key) return;
      if (e.target.checked) S.done[key] = true;
      else delete S.done[key];
      e.target.closest(".plan__item").classList.toggle("is-done", e.target.checked);
      save();
    });
    $("copy-coords").addEventListener("click", () => {
      const text = "54.063977, -4.792391";
      const done = () => { $("copy-coords").textContent = "Copied"; };
      const fallback = () => {
        const r = document.createRange();
        r.selectNodeContents($("coords"));
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        $("copy-coords").textContent = "Selected";
      };
      try {
        navigator.clipboard.writeText(text).then(done, fallback);
      } catch (err) {
        fallback();
      }
    });
    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { renderMap(); renderTimeDependent(); }, 150);
    });
  }

  function init() {
    const now = localClock(Date.now());
    const saved = store.get("state", null);
    if (D.days.includes(now.day) && now.min >= RANGE[0] && now.min <= RANGE[1]) {
      S.day = now.day;
      S.min = now.min;
    } else {
      if (!saved) S.day = D.days[0];
      S.min = clamp(Math.round((sunDay(S.day).ev.lastLight ?? 960) - 25), RANGE[0], RANGE[1]);
    }
    bind();
    renderAll();
    if (window.top === window.self && navigator.onLine !== false) refreshForecast(false);
  }

  // exposed for checking the maths outside the page
  window.SoundLight = { sunPosition, sunAt, sunDay, refraction, skyline, depthOfField, sceneEV, stills, video, landAt, LAND_NAMES, hm };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
