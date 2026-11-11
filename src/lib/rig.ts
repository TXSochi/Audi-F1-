/**
 * Shared, mutable camera rig.
 * The DOM (GSAP / ScrollTrigger / Lenis) writes into this object, the WebGL
 * scene reads from it every frame. No React state is involved, so scrolling
 * never triggers a re-render.
 */
import meta from "@/data/car-meta.json";

export type Shot = {
  /** azimuth in degrees. 0 = side view with the nose pointing right, 90 = head on */
  az: number;
  /** elevation in degrees. 0 = ground level, 90 = straight down */
  el: number;
  /** camera distance. Filled in by `resolve()` when the shot uses `fill` */
  dist: number;
  tx: number;
  ty: number;
  tz: number;
  /** screen-space shift of the car, as a fraction of the viewport (+x right, +y up) */
  ox: number;
  oy: number;
  fov: number;
  /** 0..1 strength of the airflow streaks drawn on the bodywork */
  flow: number;
  /** 0..1 strength of the power-unit glow */
  heat: number;
};

type ShotDef = Partial<Shot> & {
  /** fit the car inside this fraction of the viewport [width, height] */
  fill?: [number, number];
};

const BASE: Shot = { az: 0, el: 8, dist: 8, tx: 0, ty: 0.42, tz: 0, ox: 0, oy: 0, fov: 30, flow: 0, heat: 0 };

/** Every camera position on the page: `d` for landscape, `m` overrides for portrait screens. */
export const SHOTS: Record<string, { d: ShotDef; m?: ShotDef }> = {
  hero: { d: { az: 38, el: 9, fill: [0.56, 0.5], ox: 0.13, oy: 0.02 }, m: { az: 64, el: 13, fill: [0.98, 0.3], oy: 0.11 } },
  livery: { d: { az: 4, el: 5, fill: [0.56, 0.5], ox: 0.17, oy: -0.02 }, m: { az: 16, el: 12, fill: [0.96, 0.3], ox: 0, oy: 0.2 } },
  aero: { d: { az: 62, el: 26, fill: [0.5, 0.6], ox: 0.19, flow: 1 }, m: { az: 74, el: 24, fill: [0.9, 0.27], ox: 0, oy: 0.24, flow: 1 } },
  power: { d: { az: 0, el: 87, fill: [0.56, 0.6], ox: 0.18, heat: 1 }, m: { az: -90, el: 87, fill: [0.5, 0.28], ox: 0, oy: 0.215, heat: 1 } },
  cockpit: { d: { az: 58, el: 30, dist: 4.1, tx: 0.2, ty: 0.6, ox: 0.16 }, m: { az: 90, el: 26, dist: 8.2, tx: 0.2, ty: 0.6, ox: 0, oy: 0.24 } },
  rear: { d: { az: 150, el: 10, fill: [0.52, 0.52], ox: 0.18 }, m: { az: 164, el: 14, fill: [0.92, 0.3], ox: 0, oy: 0.22 } },
  config: { d: { az: 36, el: 11, fill: [0.54, 0.5], ox: 0.16, oy: -0.02 }, m: { az: 60, el: 14, fill: [0.94, 0.3], ox: 0, oy: 0.25 } },
  "config-side": { d: { az: 2, el: 5, fill: [0.54, 0.5], ox: 0.16 }, m: { az: 8, el: 8, fill: [0.94, 0.3], ox: 0, oy: 0.25 } },
  "config-front": { d: { az: 90, el: 6, fill: [0.5, 0.5], ox: 0.16 }, m: { az: 90, el: 9, fill: [0.86, 0.26], ox: 0, oy: 0.25 } },
  "config-top": { d: { az: 0, el: 87, fill: [0.54, 0.56], ox: 0.16 }, m: { az: 0, el: 87, fill: [0.92, 0.3], ox: 0, oy: 0.25 } },
  "config-rear": { d: { az: 152, el: 10, fill: [0.52, 0.5], ox: 0.16 }, m: { az: 164, el: 12, fill: [0.92, 0.3], ox: 0, oy: 0.25 } },
  finalePre: { d: { az: 126, el: 20, fill: [0.5, 0.42], oy: -0.1 }, m: { az: 118, el: 20, fill: [0.8, 0.3], oy: -0.12 } },
  finale: { d: { az: 90, el: 3.5, fill: [0.4, 0.25], oy: -0.2 }, m: { az: 90, el: 6, fill: [0.78, 0.2], oy: -0.17 } },
};

const [LEN, HEI, WID] = meta.size as [number, number, number];
const CORNERS: [number, number, number][] = [];
for (const x of [-LEN / 2, LEN / 2]) for (const y of [0, HEI]) for (const z of [-WID / 2, WID / 2]) CORNERS.push([x, y, z]);

const rad = (d: number) => (d * Math.PI) / 180;

/** Camera position for a shot, in world space. */
export function shotPosition(s: Pick<Shot, "az" | "el" | "dist" | "tx" | "ty" | "tz">): [number, number, number] {
  const ce = Math.cos(rad(s.el));
  return [s.tx + s.dist * ce * Math.sin(rad(s.az)), s.ty + s.dist * Math.sin(rad(s.el)), s.tz + s.dist * ce * Math.cos(rad(s.az))];
}

/** Smallest distance at which the whole car fits inside `fill` of the viewport. */
function fitDistance(s: Shot, fill: [number, number], aspect: number): number {
  const th = Math.tan(rad(s.fov) / 2);
  const fits = (dist: number) => {
    const [px, py, pz] = shotPosition({ ...s, dist });
    // camera basis
    let fx = s.tx - px, fy = s.ty - py, fz = s.tz - pz;
    const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
    let rx = -fz, ry = 0, rz = fx; // cross(f, up)
    const rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl;
    const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
    for (const [cx, cy, cz] of CORNERS) {
      const vx = cx - px, vy = cy - py, vz = cz - pz;
      const depth = vx * fx + vy * fy + vz * fz;
      if (depth < 0.2) return false;
      const nx = (vx * rx + vy * ry + vz * rz) / (depth * th * aspect);
      const ny = (vx * ux + vy * uy + vz * uz) / (depth * th);
      if (Math.abs(nx) > fill[0] || Math.abs(ny) > fill[1]) return false;
    }
    return true;
  };
  let lo = 1.5, hi = 80;
  for (let i = 0; i < 26; i++) { const mid = (lo + hi) / 2; if (fits(mid)) hi = mid; else lo = mid; }
  return hi;
}

/** Stacked layout (car on top, panel below): portrait screens and anything narrower than 900px. Mirrors the CSS breakpoint. */
export const isStacked = () => typeof window !== "undefined" && (window.innerWidth < 900 || window.innerWidth / window.innerHeight < 0.95);

export function resolve(name: string, aspect: number): Shot {
  const def = SHOTS[name];
  const stacked = isStacked();
  const src: ShotDef = stacked && def.m ? { ...def.d, ...def.m } : def.d;
  const { fill, ...rest } = src;
  const shot: Shot = { ...BASE, ...rest };
  const beside = !stacked && shot.ox >= 0.1; // the car sits to the right of a text panel
  const W = typeof window !== "undefined" ? window.innerWidth : 1440;
  if (fill) {
    let fw = fill[0];
    if (beside) {
      // keep the car clear of the panel (430px wide plus the page gutter) as the window narrows
      const gutter = Math.min(72, Math.max(16, W * 0.044));
      const left = (gutter + 470) / W;
      fw = Math.min(fw, 0.97 - left);
      if (0.5 + shot.ox - fw / 2 < left) shot.ox = left + fw / 2 - 0.5;
    }
    shot.dist = fitDistance(shot, [fw, fill[1]], aspect);
  } else if (beside) {
    shot.dist *= Math.min(1.35, Math.max(1, 1440 / W));
  }
  return shot;
}

export type Key = { y: number; shot: Shot };

export const COLORWAYS = [
  { id: "titanium", name: "Titanium", note: "The 2026 race livery", body: "#b3b7bc", accent: "#ee1c2e", tint: 0.85, accentAmt: 0, swatch: "linear-gradient(135deg,#eef0f2,#9a9da1)" },
  { id: "arctic", name: "Arctic", note: "Pearl white, red intakes", body: "#f7f8fa", accent: "#ee1c2e", tint: 0.9, accentAmt: 0, swatch: "linear-gradient(135deg,#ffffff,#cfd3d8)" },
  { id: "lava", name: "Lava", note: "Red body, carbon intakes", body: "#d4002f", accent: "#0c0c0e", tint: 1, accentAmt: 1, swatch: "linear-gradient(135deg,#ff2a55,#8f0020)" },
  { id: "stealth", name: "Stealth", note: "Bare carbon, red intakes", body: "#17181b", accent: "#ff1f3d", tint: 1, accentAmt: 0.6, swatch: "linear-gradient(135deg,#3a3c41,#0a0a0b)" },
  { id: "heritage", name: "Heritage", note: "Silver Arrow polish", body: "#dfe5ec", accent: "#b5bcc6", tint: 1, accentAmt: 1, swatch: "linear-gradient(135deg,#f4f7fb,#7d8794)" },
] as const;

export const FINISHES = [
  { id: "gloss", name: "Gloss", rough: 0.55, metal: 1.15 },
  { id: "satin", name: "Satin", rough: 1, metal: 1 },
  { id: "matte", name: "Matte", rough: 1.7, metal: 0.55 },
] as const;

export const rig = {
  /** false while an opaque section covers the canvas: the scene stops rendering */
  active: true,
  ready: false,
  failed: false,
  scrollY: 0,
  aspect: 1.6,
  keys: [] as Key[],
  /** live shot used by the configurator, tweened when a view button is pressed */
  cfgShot: { ...BASE } as Shot,
  cfgView: "config",
  // intro offsets, tweened to zero after the loader
  introAz: -64,
  introEl: 16,
  introDist: 1.55,
  /** x position of the laser scan plane. +3 = car hidden, -3 = fully built */
  reveal: 3,
  /** extra wheel rotation (radians), used by the intro */
  spin: -9,
  // pointer
  mx: 0,
  my: 0,
  /** user rotation in the configurator (degrees) */
  userAz: 0,
  userVel: 0,
  dragging: false,
  configOn: false,
  // paint, tweened by the configurator
  body: { r: 0.54, g: 0.56, b: 0.59 },
  accent: { r: 0.85, g: 0.01, b: 0.03 },
  tint: 0.62,
  accentAmt: 0,
  rough: 1,
  metal: 1,
};

export type Rig = typeof rig;

type Listener = (p: number) => void;
const progressListeners = new Set<Listener>();
export const onProgress = (fn: Listener) => { progressListeners.add(fn); return () => { progressListeners.delete(fn); }; };
export const emitProgress = (p: number) => progressListeners.forEach((fn) => fn(p));

const readyListeners = new Set<(ok: boolean) => void>();
export const onReady = (fn: (ok: boolean) => void) => {
  if (rig.ready || rig.failed) fn(rig.ready);
  readyListeners.add(fn);
  return () => { readyListeners.delete(fn); };
};
export const emitReady = (ok: boolean) => {
  if (rig.ready || rig.failed) return;
  rig.ready = ok;
  rig.failed = !ok;
  readyListeners.forEach((fn) => fn(ok));
};

const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const FIELDS: (keyof Shot)[] = ["az", "el", "dist", "tx", "ty", "tz", "ox", "oy", "fov", "flow", "heat"];

/** The shot the camera should be at for a given scroll position. */
export function sample(keys: Key[], y: number, out: Shot): Shot {
  if (!keys.length) return out;
  if (y <= keys[0].y) return Object.assign(out, keys[0].shot);
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (y <= b.y) {
      const t = smooth((y - a.y) / Math.max(1, b.y - a.y));
      for (const f of FIELDS) out[f] = a.shot[f] + (b.shot[f] - a.shot[f]) * t;
      return out;
    }
  }
  return Object.assign(out, keys[keys.length - 1].shot);
}
