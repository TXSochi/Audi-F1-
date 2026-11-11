import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Rotate3d } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { OFFICIAL_URL, img } from "@/data/content";
import { applyColorway, applyFinish, setConfigView } from "@/lib/paint";
import { COLORWAYS, FINISHES, rig } from "@/lib/rig";

const VIEWS = [
  { id: "config", name: "3/4", photo: "angular.webp" },
  { id: "config-side", name: "Side", photo: "left.webp" },
  { id: "config-front", name: "Front", photo: "front.webp" },
  { id: "config-top", name: "Top", photo: "top.webp" },
  { id: "config-rear", name: "Rear", photo: "rear34.webp" },
];

/** Segmented control with a sliding glass thumb. */
function Segmented({ label, options, value, onChange }: { label: string; options: readonly { id: string; name: string }[]; value: number; onChange: (i: number) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const place = () => {
      const btn = wrap.current?.querySelectorAll("button")[value];
      if (!btn || !thumb.current) return;
      thumb.current.style.width = `${btn.offsetWidth}px`;
      thumb.current.style.transform = `translateX(${btn.offsetLeft}px)`;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [value]);
  return (
    <div className="ga-segmented max-w-full" ref={wrap} role="group" aria-label={label}>
      <span className="ga-thumb" ref={thumb} />
      {options.map((o, i) => (
        <button key={o.id} type="button" aria-pressed={i === value} onClick={() => onChange(i)}>
          {o.name}
        </button>
      ))}
    </div>
  );
}

export function Configurator() {
  const root = useRef<HTMLElement>(null);
  const [color, setColor] = useState(0);
  const [finish, setFinish] = useState(1);
  const [view, setView] = useState(0);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ id: "config", trigger: root.current, start: "top top", end: "bottom top" });
      ScrollTrigger.create({ id: "nav-configure", trigger: root.current, start: "top top" });
      ScrollTrigger.create({ trigger: root.current, start: "top 55%", end: "bottom 45%", onToggle: (self) => { rig.configOn = self.isActive; } });
      gsap.from("[data-c]", { autoAlpha: 0, y: 26, duration: 0.9, stagger: 0.07, ease: "power3.out", scrollTrigger: { trigger: root.current, start: "top 62%" } });
    }, root);
    return () => ctx.revert();
  }, []);

  // drag to rotate
  const drag = useRef({ id: -1, x: 0, t: 0, v: 0 });
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { id: e.pointerId, x: e.clientX, t: performance.now(), v: 0 };
    rig.dragging = true;
    rig.userVel = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d.id !== e.pointerId) return;
    const now = performance.now();
    const dx = e.clientX - d.x;
    const deg = -dx * (360 / Math.max(420, window.innerWidth)) * 0.7;
    rig.userAz += deg;
    d.v = deg / Math.max(0.008, (now - d.t) / 1000);
    d.x = e.clientX;
    d.t = now;
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current.id !== e.pointerId) return;
    rig.userVel = performance.now() - drag.current.t < 80 ? gsap.utils.clamp(-260, 260, drag.current.v) : 0;
    rig.dragging = false;
    drag.current.id = -1;
  };

  const c = COLORWAYS[color];
  return (
    <section id="configure" className="window config gutter" ref={root}>
      <div className="config__drag" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} aria-hidden="true" />
      <img className="poster pointer-events-none absolute right-[4%] top-1/2 w-[52%] -translate-y-1/2" src={img(VIEWS[view].photo)} alt="" />

      <div className="config__panel ga-glass" data-c>
        <span className="chapter__index">Configurator</span>
        <h2 className="display mt-2 lg:mt-3" style={{ fontSize: "clamp(1.45rem,2.9vw,2.75rem)" }}>
          Build your R26.
        </h2>
        <p className="mt-3 hidden text-[0.95rem] lg:block" style={{ color: "var(--ink-2)" }}>
          Repaint the car in real time, change the finish and pick an angle. Drag the car to turn it.
        </p>

        <div className="mt-2 lg:mt-4">
          <div className="config__row">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="label">Colourway</span>
              <span className="text-[13px]" style={{ color: "var(--ink-2)" }} aria-live="polite">
                <b className="font-semibold text-white">{c.name}</b> · {c.note}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 pl-1" role="group" aria-label="Colourway">
              {COLORWAYS.map((w, i) => (
                <button
                  key={w.id}
                  type="button"
                  className="swatchbtn"
                  style={{ background: w.swatch }}
                  aria-label={w.name}
                  aria-pressed={i === color}
                  onClick={() => { setColor(i); applyColorway(i); }}
                />
              ))}
            </div>
          </div>
          <div className="config__row">
            <span className="label mb-2 block lg:mb-3">Finish</span>
            <Segmented label="Finish" options={FINISHES} value={finish} onChange={(i) => { setFinish(i); applyFinish(i); }} />
          </div>
          <div className="config__row">
            <span className="label mb-2 block lg:mb-3">View</span>
            <Segmented label="View" options={VIEWS} value={view} onChange={(i) => { setView(i); setConfigView(VIEWS[i].id); }} />
          </div>
          <div className="config__row flex flex-wrap items-center justify-between gap-4">
            <p className="m-0 max-w-[15ch] text-[12.5px] leading-snug sm:max-w-[24ch]" style={{ color: "var(--ink-2)" }}>
              Concept colours. <span className="hidden sm:inline">The official configurator has the real options.</span>
            </p>
            <span className="lmb-link">
              <LiquidMetalButton label="Official Site" />
              <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" aria-label="Open the official Audi F1 configurator in a new tab" />
            </span>
          </div>
        </div>
      </div>

      <div className="config__hint hidden lg:block" data-c>
        <div className="hint ga-glass ga-glass--clear">
          <Rotate3d size={15} /> Drag to rotate
        </div>
      </div>
    </section>
  );
}
