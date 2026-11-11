import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useCallback, useEffect, useState } from "react";
import { Loader } from "@/components/Loader";
import { Nav } from "@/components/Nav";
import { Stage } from "@/components/scene/Stage";
import { Configurator } from "@/components/sections/Configurator";
import { Finale } from "@/components/sections/Finale";
import { Hero } from "@/components/sections/Hero";
import { Plates } from "@/components/sections/Plates";
import { Story } from "@/components/sections/Story";
import { CHAPTERS, NAV } from "@/data/content";
import { applyColorway, applyFinish } from "@/lib/paint";
import { resolve, rig, type Key } from "@/lib/rig";
import { setLenis } from "@/lib/scroll";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(window.location.search).has("skip");

/** Turn the page layout into camera keyframes: scroll position -> shot. */
function buildKeys() {
  const vh = window.innerHeight;
  rig.aspect = window.innerWidth / vh;
  const R = (name: string) => resolve(name, rig.aspect);
  Object.assign(rig.cfgShot, R(rig.cfgView));

  const story = ScrollTrigger.getById("story");
  const config = ScrollTrigger.getById("config");
  const plates = ScrollTrigger.getById("plates");
  const finale = ScrollTrigger.getById("finale");
  if (!story || !config || !plates || !finale) return;

  const n = CHAPTERS.length;
  const S = story.start, E = story.end, U = (E - S) / n;
  const shots = CHAPTERS.map((c) => R(c.shot));
  const hero = R("hero");
  const keys: Key[] = [{ y: 0, shot: hero }, { y: vh * 0.1, shot: hero }, { y: S, shot: shots[0] }];
  for (let i = 1; i < n; i++) keys.push({ y: S + i * U, shot: shots[i - 1] }, { y: S + i * U + U * 0.4, shot: shots[i] });
  keys.push({ y: E, shot: shots[n - 1] }, { y: config.start, shot: rig.cfgShot }, { y: plates.start, shot: rig.cfgShot });
  keys.push({ y: Math.max(plates.start + 1, finale.start - vh), shot: R("finalePre") }, { y: finale.start, shot: R("finale") });
  rig.keys = keys;
}

export default function App() {
  const [active, setActive] = useState("");

  useEffect(() => {
    applyColorway(0, true);
    applyFinish(1, true);

    const lenis = reduced() ? null : new Lenis({ lerp: 0.1, smoothWheel: true });
    setLenis(lenis);
    lenis?.stop();
    document.documentElement.classList.add("is-loading");

    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenis?.on("scroll", ScrollTrigger.update);

    // which section the nav highlights: the last one whose start has passed the middle of the screen
    let current = "";
    const onScroll = () => {
      rig.scrollY = window.scrollY;
      const mid = window.scrollY + window.innerHeight / 2;
      let next = "";
      for (const n of NAV) {
        const st = ScrollTrigger.getById(n.id === "car" ? "story" : `nav-${n.id}`);
        if (st && mid >= st.start) next = n.id;
      }
      const studio = ScrollTrigger.getById("nav-studio");
      if (studio && mid >= studio.start) next = "";
      if (next !== current) { current = next; setActive(next); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    buildKeys();
    ScrollTrigger.addEventListener("refresh", buildKeys);

    // a scrollbar appearing or leaving changes the layout width without a window resize
    let lastWidth = document.documentElement.clientWidth;
    let refreshTimer = 0;
    const ro = new ResizeObserver(() => {
      const w = document.documentElement.clientWidth;
      if (w === lastWidth) return;
      lastWidth = w;
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 160);
    });
    ro.observe(document.documentElement);
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      ScrollTrigger.removeEventListener("refresh", buildKeys);
      ro.disconnect();
      window.clearTimeout(refreshTimer);
      window.removeEventListener("scroll", onScroll);
      gsap.ticker.remove(tick);
      lenis?.destroy();
      setLenis(null);
    };
  }, []);

  /** Curtain is on its way up: build the car with the laser scan and swing the camera in. */
  const intro = useCallback((ok: boolean) => {
    const html = document.documentElement;
    html.classList.remove("is-loading");
    if (!ok) html.classList.add("no-webgl");
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();

    const quick = reduced();
    const tl = gsap.timeline({ onComplete: () => html.classList.add("is-live") });
    tl.to(rig, { reveal: -3, duration: quick ? 0.01 : 2.5, ease: "power2.inOut" }, 0.35)
      .to(rig, { introAz: 0, introEl: 0, introDist: 1, spin: 0, duration: quick ? 0.01 : 3.8, ease: "power3.out" }, 0.2)
      .from(".backdrop__word span", { yPercent: 14, autoAlpha: 0, duration: 1.8, ease: "power3.out" }, 0.5)
      .from(".nav [data-in]", { y: -24, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: "power3.out" }, 0.9)
      .from(".hero [data-in]", { y: 44, autoAlpha: 0, duration: 1.1, stagger: 0.09, ease: "power3.out" }, 1.1)
      .add(() => {
        const l = (window as unknown as { __lenis?: Lenis | null }).__lenis;
        l?.start();
      }, quick ? 0.1 : 1.6);

    // the giant R26 drifts up and fades as the hero leaves
    gsap.fromTo(".backdrop__word", { yPercent: 0, opacity: 1 }, { yPercent: -30, opacity: 0, ease: "none", scrollTrigger: { trigger: "#top", start: "top top", end: "bottom 30%", scrub: true } });
    gsap.fromTo(".backdrop__grid", { opacity: 0.7 }, { opacity: 0.3, ease: "none", scrollTrigger: { trigger: "#top", start: "top top", end: "bottom top", scrub: true } });
  }, []);

  return (
    <>
      <div className="backdrop" aria-hidden="true">
        <div className="backdrop__grid" />
        <div className="backdrop__word">
          <span>R26</span>
        </div>
      </div>
      <Stage />
      <div className="grain" aria-hidden="true" />
      <Nav active={active} />
      <main>
        <Hero />
        <Story />
        <Configurator />
        <Plates />
        <Finale />
      </main>
      <Loader onDone={intro} />
    </>
  );
}
