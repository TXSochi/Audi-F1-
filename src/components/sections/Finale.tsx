import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { NAV, OFFICIAL_URL, PARTNERS, img } from "@/data/content";
import { scrollToId } from "@/lib/scroll";

export function Finale() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ id: "finale", trigger: root.current, start: "top top" });
      gsap.from("[data-f]", { autoAlpha: 0, y: 40, duration: 1.1, stagger: 0.09, ease: "power3.out", scrollTrigger: { trigger: root.current, start: "top 55%" } });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="finale" className="window finale" ref={root}>
      <div className="gutter text-center">
        <p className="eyebrow" data-f>
          Season 2026
        </p>
        <h2 className="display finale__title mt-5" data-f>
          Vorsprung, <br className="sm:hidden" />
          now in <em>F1.</em>
        </h2>
        <p className="lede mx-auto mt-5" data-f>
          Audi's first season in Formula 1, told through its first car.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3" data-f>
          <LiquidMetalButton label="Replay" onClick={() => scrollToId("top")} />
          <span className="lmb-link">
            <LiquidMetalButton label="audif1.com" />
            <a href={OFFICIAL_URL} target="_blank" rel="noreferrer" aria-label="Open audif1.com in a new tab" />
          </span>
        </div>
      </div>
      <div className="finale__gap grid place-items-center" aria-hidden="true">
        <img className="poster w-[min(420px,70%)]" src={img("front.webp")} alt="" />
      </div>

      <div>
        <div className="gutter pb-6">
          <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-3 border-t pt-5" style={{ borderColor: "var(--line)" }}>
            <span className="label">Partners</span>
            <div className="partners">
              {PARTNERS.map((p) => (
                <span key={p}>{p}</span>
              ))}
            </div>
          </div>
        </div>
        <footer className="footer">
          <div className="gutter flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
            <p className="m-0">
              <b className="font-semibold text-white">© 2026 Michael C.</b> Web design concept.
            </p>
            <nav className="flex flex-wrap gap-x-5 gap-y-1" aria-label="Footer">
              {NAV.map((n) => (
                <a key={n.id} href={`#${n.id}`} onClick={(e) => { e.preventDefault(); scrollToId(n.id); }} className="hover:text-white">
                  {n.label}
                </a>
              ))}
            </nav>
            <p className="m-0 basis-full text-[11.5px]" style={{ color: "var(--ink-3)" }}>
              Fan-made design study. Not affiliated with or endorsed by Audi AG, Revolut or the Audi Revolut F1 Team. Names and marks belong to their owners.
            </p>
          </div>
        </footer>
      </div>
    </section>
  );
}
