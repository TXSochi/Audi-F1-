import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { emitProgress, emitReady, resolve, rig, sample, shotPosition, type Shot } from "@/lib/rig";

const BASE = import.meta.env.BASE_URL;
/** Hosts that only serve text and images get the model as base64 text (build with VITE_MODEL_FORMAT=txt). */
const MODEL_AS_TEXT = import.meta.env.VITE_MODEL_FORMAT === "txt";
const RED = new THREE.Color("#E60042");

/** Uniforms shared by every car material, so one write updates the body, the wheels and the reflection. */
const shared = {
  uReveal: { value: 3 },
  uTime: { value: 0 },
  uFlow: { value: 0 },
  uHeat: { value: 0 },
  uRed: { value: RED.clone() },
  uTint: { value: new THREE.Color() },
  uAccent: { value: new THREE.Color() },
  uTintAmt: { value: 0 },
  uAccentAmt: { value: 0 },
  uRough: { value: 1 },
  uMetal: { value: 1 },
};

const FRAG_HEAD = /* glsl */ `
varying vec3 vWPos;
uniform float uReveal, uTime, uFlow, uHeat, uTintAmt, uAccentAmt, uRough, uMetal, uPaint;
uniform vec3 uRed, uTint, uAccent;
float hash1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float hash3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
`;

const FRAG_MAP = /* glsl */ `
// laser build: everything behind the scan plane is not there yet
float rvEdge = vWPos.x - uReveal + (hash3(floor(vWPos * 70.0)) - 0.5) * 0.09;
if (rvEdge < 0.0) discard;
float rvBand = 1.0 - smoothstep(0.0, 0.2, rvEdge);
// repaint: light neutral texels are bodywork, saturated red texels are the intakes
vec3 pc = diffuseColor.rgb;
float pLum = dot(pc, vec3(0.2126, 0.7152, 0.0722));
float pMax = max(pc.r, max(pc.g, pc.b));
float pMin = min(pc.r, min(pc.g, pc.b));
float pSat = (pMax - pMin) / max(pMax, 1e-4);
float pBody = smoothstep(0.14, 0.40, pLum) * (1.0 - smoothstep(0.10, 0.30, pSat)) * uPaint;
float pRed = smoothstep(0.45, 0.75, pSat) * smoothstep(0.10, 0.28, pc.r) * step(pc.g * 1.7, pc.r) * step(pc.b * 1.7, pc.r) * uPaint;
pc = mix(pc, uTint * clamp(pLum * 1.22 + 0.03, 0.0, 1.25), pBody * uTintAmt);
pc = mix(pc, uAccent * clamp(pMax * 1.25 + 0.04, 0.0, 1.25), pRed * uAccentAmt);
diffuseColor.rgb = pc;
`;

const FRAG_EMISSIVE = /* glsl */ `
totalEmissiveRadiance += uRed * rvBand * 3.0;
{
  float yy = abs(vWPos.y);
  // airflow streaks: thin lines that run nose to tail
  float fv = yy * 12.0 + abs(vWPos.z) * 5.0;
  float fLine = 1.0 - smoothstep(0.015, 0.06, abs(fract(fv) - 0.5));
  float fd = fract(vWPos.x * 0.42 + uTime * 0.5 + hash1(floor(fv)) * 9.0);
  float fDash = (1.0 - smoothstep(0.0, 0.5, fd)) * smoothstep(0.0, 0.03, fd);
  totalEmissiveRadiance += (uRed * 2.0 + vec3(0.35)) * fLine * fDash * uFlow;
  // power unit: a hot core behind the driver
  float hx = (vWPos.x + 0.82) / 0.72;
  float hz = vWPos.z / 0.34;
  float heat = exp(-(hx * hx + hz * hz)) * smoothstep(0.22, 0.5, yy);
  totalEmissiveRadiance += uRed * heat * uHeat * (1.25 + 0.4 * sin(uTime * 2.4));
}
`;

function makeCarMaterial(tex: { base: THREE.Texture; normal: THREE.Texture; orm: THREE.Texture }, paintable: boolean) {
  const m = new THREE.MeshStandardMaterial({
    map: tex.base,
    normalMap: tex.normal,
    roughnessMap: tex.orm,
    metalnessMap: tex.orm,
    metalness: 1,
    roughness: 1,
    envMapIntensity: 1,
  });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shared, { uPaint: { value: paintable ? 1 : 0 } });
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\n" + FRAG_HEAD)
      .replace("#include <map_fragment>", "#include <map_fragment>\n" + FRAG_MAP)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor * mix(1.0, uRough, uPaint), 0.05, 1.0);")
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nmetalnessFactor = clamp(metalnessFactor * mix(1.0, uMetal, uPaint), 0.0, 1.0);")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n" + FRAG_EMISSIVE);
  };
  m.customProgramCacheKey = () => (paintable ? "car-paint" : "car-plain");
  return m;
}

/** A dark studio with a few softboxes: this is what the paint reflects. */
function makeStudioEnv(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(40, 40, 40), new THREE.MeshBasicMaterial({ color: 0x020203, side: THREE.BackSide })));
  const panel = (w: number, h: number, rgb: [number, number, number], pos: [number, number, number]) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(...rgb), side: THREE.DoubleSide }));
    mesh.position.set(...pos);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
  };
  panel(11, 2.6, [7.4, 7.4, 7.8], [0, 9, 0.01]); // overhead strip
  panel(9, 1.1, [5, 5, 5.4], [0, 3.2, 11]); // long side strips
  panel(9, 1.1, [3.2, 3.2, 3.6], [0, 3.2, -11]);
  panel(4, 1.6, [4.5, 4.5, 4.8], [12, 2.6, 0]); // front
  panel(5, 1.2, [7, 0.05, 1.2], [-11, 1.6, 5]); // red kicker behind the car
  panel(3, 0.8, [5, 0.04, 0.9], [-9, 1.2, -7]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(scene, 0.035).texture;
  pmrem.dispose();
  scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); } });
  return env;
}

function radialTexture(stops: [number, string][]) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [o, col] of stops) grad.addColorStop(o, col);
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Scene({ reflection }: { reflection: boolean }) {
  const { gl, scene, camera, size } = useThree();
  const wheels = useRef<THREE.Object3D[]>([]);
  const cur = useRef<Shot>(resolve("hero", rig.aspect));
  const tgt = useRef<Shot>({ ...cur.current });
  const look = useMemo(() => new THREE.Vector3(), []);
  const pointer = useRef({ x: 0, y: 0 });
  const first = useRef(true);

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.98;
    gl.setClearColor(0x000000, 0);
    const env = makeStudioEnv(gl);
    scene.environment = env;

    const root = new THREE.Group();
    scene.add(root);
    let disposed = false;

    // floor: a pool of light, then a dark glossy sheet that lets the reflection through
    const floorGeo = new THREE.CircleGeometry(13, 64);
    const sheet = new THREE.Mesh(
      floorGeo,
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, depthWrite: false, alphaMap: radialTexture([[0, "#d9d9d9"], [0.45, "#bdbdbd"], [0.8, "#2b2b2b"], [1, "#000"]]) }),
    );
    sheet.rotation.x = -Math.PI / 2;
    sheet.renderOrder = 2;
    root.add(sheet);
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(7, 48),
      new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: radialTexture([[0, "rgba(120,124,132,0.34)"], [0.5, "rgba(60,62,68,0.14)"], [1, "rgba(0,0,0,0)"]]) }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.003;
    pool.scale.set(1, 0.62, 1);
    pool.renderOrder = 3;
    root.add(pool);
    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(3.4, 40),
      new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: radialTexture([[0, "rgba(230,0,66,0.42)"], [0.55, "rgba(230,0,66,0.1)"], [1, "rgba(230,0,66,0)"]]) }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(-2.5, 0.004, 0);
    glow.scale.set(1, 0.7, 1);
    glow.renderOrder = 3;
    root.add(glow);

    // loading
    const manager = new THREE.LoadingManager();
    let glbPart = 0, texPart = 0;
    const report = () => emitProgress(Math.min(1, glbPart * 0.7 + texPart * 0.3));
    manager.onProgress = (_u, loaded, total) => { texPart = Math.max(texPart, loaded / Math.max(total, 4)); report(); };
    const tl = new THREE.TextureLoader(manager);
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    const load = (file: string, srgb: boolean) => {
      const t = tl.load(`${BASE}model/${file}`);
      t.flipY = false;
      t.anisotropy = aniso;
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    const tex = { base: load("base.webp", true), normal: load("normal.webp", false), orm: load("orm.webp", false) };
    const paint = makeCarMaterial(tex, true);
    const plain = makeCarMaterial(tex, false);

    const fail = (e: unknown) => { console.warn("[stage] could not load the car", e); emitReady(false); };
    const timeout = window.setTimeout(() => fail("timeout"), 45000);
    const loader = new GLTFLoader(manager);
    const onLoad = (gltf: { scene: THREE.Group }) => {
        if (disposed) return;
        const car = gltf.scene;
        car.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) { mesh.material = /^wheel/.test(mesh.parent?.name ?? "") ? plain : paint; mesh.frustumCulled = false; }
        });
        root.add(car);
        const cars = [car];
        if (reflection) {
          const mirror = car.clone(true);
          mirror.scale.y = -1;
          root.add(mirror);
          cars.push(mirror);
        }
        wheels.current = [];
        for (const c of cars) c.traverse((o) => { if (/^wheel_(fl|fr|rl|rr)$/.test(o.name)) wheels.current.push(o); });
        // compile before the first reveal so the intro does not stutter
        gl.compile(scene, camera);
        glbPart = 1; texPart = 1; report();
        window.clearTimeout(timeout);
        emitReady(true);
    };
    if (MODEL_AS_TEXT) {
      fetch(`${BASE}model/car.txt`)
        .then((r) => { if (!r.ok) throw new Error(`model ${r.status}`); glbPart = 0.35; report(); return r.text(); })
        .then((text) => {
          glbPart = 0.8; report();
          const bin = atob(text.trim());
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          loader.parse(bytes.buffer, `${BASE}model/`, onLoad, fail);
        })
        .catch(fail);
    } else {
      loader.load(`${BASE}model/car.glb`, onLoad, (ev) => { if (ev.total) { glbPart = ev.loaded / ev.total; report(); } }, fail);
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      window.removeEventListener("pointermove", onMove);
      scene.remove(root);
      env.dispose();
    };
  }, [gl, scene, camera, reflection]);

  useFrame((state, delta) => {
    if (!rig.active && !first.current) return;
    const dt = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;
    const cam = camera as THREE.PerspectiveCamera;

    // where the scroll position wants the camera, then ease toward it
    sample(rig.keys, rig.scrollY, tgt.current);
    const k = first.current ? 1 : 1 - Math.exp(-dt * 5.5);
    const c = cur.current, g = tgt.current;
    (Object.keys(c) as (keyof Shot)[]).forEach((f) => { c[f] += (g[f] - c[f]) * k; });
    first.current = false;

    // pointer parallax and the configurator's drag-to-rotate
    const pk = 1 - Math.exp(-dt * 3);
    rig.mx += (pointer.current.x - rig.mx) * pk;
    rig.my += (pointer.current.y - rig.my) * pk;
    if (!rig.dragging) {
      rig.userAz += rig.userVel * dt;
      rig.userVel *= Math.exp(-dt * 2.6);
      if (!rig.configOn) rig.userAz += (0 - rig.userAz) * (1 - Math.exp(-dt * 3));
    }

    const top = THREE.MathUtils.smoothstep(c.el, 60, 86); // no sway when looking straight down
    const az = c.az + rig.introAz + rig.userAz + (rig.mx * 3.2 + Math.sin(t * 0.22) * 1.4) * (1 - top);
    const el = THREE.MathUtils.clamp(c.el + rig.introEl - rig.my * 1.6 * (1 - top), 1.5, 88.5);
    const [px, py, pz] = shotPosition({ az, el, dist: c.dist * rig.introDist, tx: c.tx, ty: c.ty, tz: c.tz });
    cam.position.set(px, py, pz);
    look.set(c.tx, c.ty, c.tz);
    cam.lookAt(look);
    if (Math.abs(cam.fov - c.fov) > 0.01) cam.fov = c.fov;
    cam.setViewOffset(size.width, size.height, -c.ox * size.width, c.oy * size.height, size.width, size.height);

    // wheels roll with the page
    const roll = -(rig.scrollY * 0.0016 + rig.spin);
    for (const w of wheels.current) w.rotation.z = roll;

    shared.uTime.value = t;
    shared.uReveal.value = rig.reveal;
    shared.uFlow.value = c.flow;
    shared.uHeat.value = c.heat;
    shared.uTint.value.setRGB(rig.body.r, rig.body.g, rig.body.b);
    shared.uAccent.value.setRGB(rig.accent.r, rig.accent.g, rig.accent.b);
    shared.uTintAmt.value = rig.tint;
    shared.uAccentAmt.value = rig.accentAmt;
    shared.uRough.value = rig.rough;
    shared.uMetal.value = rig.metal;

    gl.render(scene, cam);
  }, 1);

  return (
    <>
      <ambientLight intensity={0.12} />
      <spotLight position={[3.5, 7, 4.5]} angle={0.5} penumbra={0.9} intensity={205} decay={2} color="#ffffff" />
      <spotLight position={[-5.5, 3.2, -4.5]} angle={0.6} penumbra={1} intensity={170} decay={2} color="#cfe0ff" />
      <spotLight position={[-5, 1.6, 3.6]} angle={0.7} penumbra={1} intensity={150} decay={2} color="#E60042" />
      <pointLight position={[4.5, 0.6, -2.5]} intensity={14} decay={2} color="#ffffff" />
    </>
  );
}

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.warn("[stage] WebGL scene failed", error); emitReady(false); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function Stage() {
  const coarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const small = typeof window !== "undefined" && window.innerWidth < 820;
  // ?q=low renders at half resolution without the floor reflection (weak GPUs, automated screenshots)
  const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") : null;
  const low = q === "low" || q === "mid";
  return (
    <div className="stage" aria-hidden="true">
      <Boundary>
        <Canvas
          dpr={q === "low" ? 0.5 : q === "mid" ? 1 : [1, coarse || small ? 1.5 : 1.75]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ fov: 30, near: 0.1, far: 120, position: [6, 2, 6] }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault());
          }}
          fallback={null}
        >
          <Scene reflection={!(coarse || small || low)} />
        </Canvas>
      </Boundary>
    </div>
  );
}
