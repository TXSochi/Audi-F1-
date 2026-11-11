import type Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let lenis: Lenis | null = null;
export const setLenis = (l: Lenis | null) => { lenis = l; (window as unknown as { __lenis?: Lenis | null }).__lenis = l; };
export const getLenis = () => lenis;

/** Smooth-scroll to a section. Pinned sections are addressed through their ScrollTrigger. */
export function scrollToId(id: string) {
  let y = 0;
  if (id !== "top") {
    const st = ScrollTrigger.getById(id === "car" ? "story" : `nav-${id}`);
    const el = document.getElementById(id);
    if (st) y = st.start + (id === "car" ? 2 : 0);
    else if (el) y = el.getBoundingClientRect().top + window.scrollY;
  }
  if (lenis) lenis.scrollTo(y, { duration: 1.6, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
  else window.scrollTo({ top: y, behavior: "smooth" });
}
