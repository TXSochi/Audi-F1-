import gsap from "gsap";
import * as THREE from "three";
import { COLORWAYS, FINISHES, resolve, rig } from "@/lib/rig";

const tmp = new THREE.Color();
const lin = (hex: string) => { tmp.set(hex); return { r: tmp.r, g: tmp.g, b: tmp.b }; };

export function applyColorway(index: number, immediate = false) {
  const c = COLORWAYS[index];
  const duration = immediate ? 0 : 0.9;
  gsap.to(rig.body, { ...lin(c.body), duration, ease: "power2.out", overwrite: true });
  gsap.to(rig.accent, { ...lin(c.accent), duration, ease: "power2.out", overwrite: true });
  gsap.to(rig, { tint: c.tint, accentAmt: c.accentAmt, duration, ease: "power2.out", overwrite: "auto" });
}

export function applyFinish(index: number, immediate = false) {
  const f = FINISHES[index];
  gsap.to(rig, { rough: f.rough, metal: f.metal, duration: immediate ? 0 : 0.7, ease: "power2.out", overwrite: "auto" });
}

export function setConfigView(name: string, immediate = false) {
  rig.cfgView = name;
  const s = resolve(name, rig.aspect);
  gsap.to(rig.cfgShot, { ...s, duration: immediate ? 0 : 1.5, ease: "power3.inOut", overwrite: true });
  gsap.to(rig, { userAz: 0, userVel: 0, duration: immediate ? 0 : 1, ease: "power2.out", overwrite: "auto" });
}
