import { NodeIO, Document } from '@gltf-transform/core';
import { quantize, prune, dedup, reorder } from '@gltf-transform/functions';
import { KHRMeshQuantization } from '@gltf-transform/extensions';
import { MeshoptEncoder } from 'meshoptimizer';
import fs from 'fs';

const { nV, nI } = JSON.parse(fs.readFileSync('../model/geom.json'));
const buf = fs.readFileSync('../model/geom.bin');
let o = 0;
const take = (T, n) => { const a = new T(buf.buffer.slice(buf.byteOffset + o, buf.byteOffset + o + n * T.BYTES_PER_ELEMENT)); o += n * T.BYTES_PER_ELEMENT; return a; };
const P = take(Float32Array, nV * 3), N = take(Float32Array, nV * 3), UV = take(Float32Array, nV * 2), I = take(Uint32Array, nI);
const meta = JSON.parse(fs.readFileSync('../model/wheels.json'));

// refine wheels: tread z-range via histogram (contiguous from the outer face inwards)
for (const w of meta.wheels) {
  const R = w.sx > 0 ? 0.293 : 0.297; w.R = R; w.c[1] = R; w.kx = w.sx > 0 ? 1 : 0.297 / 0.312;
  const bins = new Array(40).fill(0);
  for (let i = 0; i < nV; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2] * w.sz;
    const r = Math.hypot(x - w.c[0], y - w.c[1]);
    if (r > R * 0.9 && r < R * 1.04 && z > 0.2 && y > R * 0.5) bins[Math.min(39, Math.floor((z - 0.2) / 0.0175))]++;
  }
  let b = Math.min(39, Math.floor((w.zOut - 0.2) / 0.0175));
  while (b > 0 && bins[b] === 0) b--;
  let e = b; while (e > 0 && bins[e - 1] > 0) e--;
  w.zIn = w.sx > 0 ? 0.2 + e * 0.0175 : 0.455;
  w.c[2] = w.sz * (w.zIn + w.zOut) / 2;
  console.log(w.name, 'zIn', w.zIn.toFixed(3), 'zOut', w.zOut.toFixed(3), 'width', (w.zOut - w.zIn).toFixed(3), bins.join(','));
}

// classify vertices
const HUB = +(process.argv[2] || 0.62);
const vw = new Int8Array(nV).fill(-1);
meta.wheels.forEach((w, wi) => {
  const zMid = (w.zIn + w.zOut) / 2;
  for (let i = 0; i < nV; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2] * w.sz;
    const r = Math.hypot((x - w.c[0]) * w.kx, y - w.c[1]);
    if (r > w.R * 1.035 || z < w.zIn - 0.004 || z > w.zOut + 0.02) continue;
    // tyre + rim lip rotate everywhere; inside the hub radius only the outboard half rotates
    if (r > w.R * HUB || z > zMid + 0.01) vw[i] = wi;
  }
});
const groups = [[], [], [], [], []]; // body, 4 wheels
for (let t = 0; t < nI; t += 3) {
  const a = vw[I[t]], b = vw[I[t + 1]], c = vw[I[t + 2]];
  const g = a >= 0 && a === b && b === c ? a + 1 : 0;
  groups[g].push(I[t], I[t + 1], I[t + 2]);
}
console.log('tris body/wheels', groups.map((g) => g.length / 3));

const doc = new Document();
doc.createExtension(KHRMeshQuantization).setRequired(true);
const buffer = doc.createBuffer();
const scene = doc.createScene('car');
const rootNode = doc.createNode('car'); scene.addChild(rootNode);
const names = ['body', ...meta.wheels.map((w) => w.name)];
groups.forEach((tri, gi) => {
  const remap = new Map(); const pos = [], nor = [], uv = [], idx = [];
  const c = gi === 0 ? [0, 0, 0] : meta.wheels[gi - 1].c;
  for (const v of tri) {
    let n = remap.get(v);
    if (n === undefined) { n = remap.size; remap.set(v, n); pos.push((P[v * 3] - c[0]) * (gi === 0 ? 1 : meta.wheels[gi - 1].kx), P[v * 3 + 1] - c[1], P[v * 3 + 2] - c[2]); nor.push(N[v * 3], N[v * 3 + 1], N[v * 3 + 2]); uv.push(UV[v * 2], UV[v * 2 + 1]); }
    idx.push(n);
  }
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(pos)).setBuffer(buffer))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nor)).setBuffer(buffer))
    .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(uv)).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(remap.size > 65535 ? new Uint32Array(idx) : new Uint16Array(idx)).setBuffer(buffer));
  const mesh = doc.createMesh(names[gi] + '_mesh').addPrimitive(prim);
  const pivot = doc.createNode(names[gi]).setTranslation(c);
  const child = doc.createNode(names[gi] + '_geo').setMesh(mesh);
  pivot.addChild(child); rootNode.addChild(pivot);
  console.log(names[gi], 'verts', remap.size, 'tris', idx.length / 3);
});
await MeshoptEncoder.ready;
await doc.transform(reorder({ encoder: MeshoptEncoder }), quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 13 }), prune());
const io = new NodeIO().registerExtensions([KHRMeshQuantization]);
await io.write('../site/public/model/car.glb', doc);
fs.mkdirSync('../site/src/data', { recursive: true });
fs.writeFileSync('../site/src/data/car-meta.json', JSON.stringify({ size: meta.size, wheels: meta.wheels.map((w) => ({ name: w.name, c: w.c.map((v) => +v.toFixed(4)), R: w.R })) }, null, 1));
console.log('glb bytes', fs.statSync('../site/public/model/car.glb').size);
