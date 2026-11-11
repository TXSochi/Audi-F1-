import { NodeIO, Document } from '@gltf-transform/core';
import { weld, simplify, prune, dedup, quantize } from '@gltf-transform/functions';
import { KHRMeshQuantization } from '@gltf-transform/extensions';
import { MeshoptSimplifier } from 'meshoptimizer';
import fs from 'fs';

const RATIO = +(process.argv[2] || 0.115);
const io = new NodeIO().registerExtensions([KHRMeshQuantization]);
const doc = await io.read('../raw/AudiF1.glb');
const root = doc.getRoot();
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) p.setMaterial(null);
for (const t of root.listTextures()) t.dispose();
for (const m of root.listMaterials()) m.dispose();
await MeshoptSimplifier.ready;
await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: 0.002 }), prune(), dedup());

const prim = root.listMeshes()[0].listPrimitives()[0];
const S = root.listNodes()[0].getScale()[0];
const pos = prim.getAttribute('POSITION').getArray();
const nor = prim.getAttribute('NORMAL').getArray();
const uv = prim.getAttribute('TEXCOORD_0').getArray();
const idx = prim.getIndices().getArray();
const nV = pos.length / 3;
// bake scale, ground at y=0
let min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
const P = new Float32Array(pos.length);
for (let i = 0; i < pos.length; i++) { P[i] = pos[i] * S; const a = i % 3; if (P[i] < min[a]) min[a] = P[i]; if (P[i] > max[a]) max[a] = P[i]; }
const off = [-(min[0] + max[0]) / 2, -min[1], -(min[2] + max[2]) / 2];
for (let i = 0; i < nV; i++) { P[i * 3] += off[0]; P[i * 3 + 1] += off[1]; P[i * 3 + 2] += off[2]; }
const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
console.log('size', size, 'verts', nV, 'tris', idx.length / 3);

// --- wheel detection
const wheels = [];
for (const sx of [1, -1]) for (const sz of [1, -1]) {
  let zOut = 0, top = 0;
  for (let i = 0; i < nV; i++) { const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; if (x * sx > 0.5 && z * sz > 0.5) { if (y > 0.3 && z * sz > zOut) zOut = z * sz; } }
  // top of tyre: verts near outer face (within 0.1 of zOut)
  for (let i = 0; i < nV; i++) { const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; if (x * sx > 0.5 && z * sz > zOut - 0.12 && y > top) top = y; }
  const R = top / 2;
  // centre x: mean x of verts near the top of the tyre
  let sxm = 0, n = 0;
  for (let i = 0; i < nV; i++) { const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; if (x * sx > 0.5 && z * sz > zOut - 0.12 && y > top - 0.02) { sxm += x; n++; } }
  const cx = sxm / n;
  // refine: x extent at axle height
  let xmin = 1e9, xmax = -1e9;
  for (let i = 0; i < nV; i++) { const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; if (Math.abs(x - cx) < R * 1.3 && z * sz > zOut - 0.12 && Math.abs(y - R) < 0.03) { if (x < xmin) xmin = x; if (x > xmax) xmax = x; } }
  const cx2 = (xmin + xmax) / 2, R2 = (xmax - xmin) / 2;
  // tread z-range: verts at radius ~R
  let zIn = 1e9;
  for (let i = 0; i < nV; i++) { const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; const r = Math.hypot(x - cx2, y - R); if (r > R * 0.93 && r < R * 1.03 && z * sz > 0.3 && y > R * 1.2) { if (z * sz < zIn) zIn = z * sz; } }
  console.log({ sx, sz, zOut: +zOut.toFixed(3), top: +top.toFixed(3), R: +R.toFixed(3), cx: +cx.toFixed(3), cx2: +cx2.toFixed(3), R2: +R2.toFixed(3), zIn: +zIn.toFixed(3) });
  wheels.push({ name: `wheel_${sx > 0 ? 'f' : 'r'}${sz > 0 ? 'l' : 'r'}`, sx, sz, c: [cx2, (R + R2) / 2, 0], R: Math.max(R, R2), zOut, zIn });
}
fs.writeFileSync('../model/wheels.json', JSON.stringify({ wheels, size }, null, 1));
fs.writeFileSync('../model/geom.bin', Buffer.concat([Buffer.from(P.buffer), Buffer.from(new Float32Array(nor).buffer), Buffer.from(new Float32Array(uv).buffer), Buffer.from(new Uint32Array(idx).buffer)]));
fs.writeFileSync('../model/geom.json', JSON.stringify({ nV, nI: idx.length }));
