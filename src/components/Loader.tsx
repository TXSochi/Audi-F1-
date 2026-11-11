import gsap from "gsap";
import { useEffect, useRef } from "react";
import { onProgress, onReady } from "@/lib/rig";

/** Black curtain with a counter. Calls `onDone` once the car is loaded (or has failed) and the count reaches 100. */
export function Loader({ onDone }: { onDone: (ok: boolean) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const state = { v: 0 };
    let result: boolean | null = null;
    let finished = false;
    const render = () => {
      if (count.current) count.current.textContent = String(Math.round(state.v)).padStart(3, "0");
      if (bar.current) bar.current.style.transform = `scaleX(${state.v / 100})`;
      if (!finished && result !== null && state.v >= 99.5) {
        finished = true;
        gsap.to(root.current, {
          yPercent: -100,
          duration: 1.1,
          ease: "power4.inOut",
          delay: 0.15,
          onStart: () => onDone(result as boolean),
          onComplete: () => { if (root.current) root.current.style.display = "none"; },
        });
      }
    };
    const to = (v: number, duration: number) => gsap.to(state, { v, duration, ease: "power2.out", overwrite: true, onUpdate: render });
    to(8, 0.8);
    const offP = onProgress((p) => { if (result === null) to(Math.max(state.v, 8 + p * 84), 0.5); });
    const offR = onReady((ok) => { result = ok; to(100, 0.7); });
    return () => { offP(); offR(); gsap.killTweensOf(state); };
  }, [onDone]);

  return (
    <div className="loader" ref={root} role="status" aria-label="Loading the R26">
      <div className="gutter flex flex-col justify-between py-8">
        <div className="flex items-center justify-between">
          <span className="label">R26 · Season 2026</span>
          <span className="label">Design concept by Michael C</span>
        </div>
        <div className="flex items-end justify-between gap-6">
          <p className="display" style={{ fontSize: "clamp(1.1rem,2.2vw,1.8rem)", maxWidth: "14ch" }}>
            Building the R26
          </p>
          <span ref={count} className="num" style={{ fontSize: "clamp(4.5rem,17vw,15rem)", lineHeight: 0.8 }}>
            000
          </span>
        </div>
      </div>
      <div className="loader__bar">
        <i ref={bar} />
      </div>
    </div>
  );
}
