import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";
import { CHAPTERS, img } from "@/data/content";

/** One pinned screen. Scroll moves the camera around the car and swaps the glass panel. */
export function Story() {
  const root = useRef<HTMLElement>(null);
  const index = useRef<HTMLSpanElement>(null);
  const n = CHAPTERS.length;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>(".chapter__panel");
      const photos = gsap.utils.toArray<HTMLElement>(".chapter__photo");
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          id: "story",
          trigger: root.current,
          start: "top top",
          end: () => `+=${window.innerHeight * n}`,
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            root.current?.style.setProperty("--p", self.progress.toFixed(4));
            if (index.current) index.current.textContent = String(Math.min(n, Math.floor(self.progress * n) + 1)).padStart(2, "0");
          },
        },
      });
      panels.forEach((panel, i) => {
        const at = i === 0 ? 0.02 : i + 0.3;
        tl.fromTo(panel, { autoAlpha: 0, y: 48 }, { autoAlpha: 1, y: 0, duration: 0.28, ease: "power2.out" }, at);
        tl.fromTo(panel.querySelectorAll("[data-s]"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.2, stagger: 0.035, ease: "power2.out" }, at + 0.05);
        if (photos[i]) tl.fromTo(photos[i], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.28 }, at);
        if (i < n - 1) {
          tl.to(panel, { autoAlpha: 0, y: -34, duration: 0.18, ease: "power2.in" }, i + 0.98);
          if (photos[i]) tl.to(photos[i], { autoAlpha: 0, duration: 0.18 }, i + 0.98);
        }
      });
      tl.to({}, { duration: 0.001 }, n);
    }, root);
    return () => ctx.revert();
  }, [n]);

  return (
    <section id="car" className="window story" ref={root} aria-label="The car, chapter by chapter">
      <div className="rail" aria-hidden="true">
        <span className="num" ref={index}>
          01
        </span>
        <span className="rail__track">
          <i />
        </span>
        <span className="num">{String(n).padStart(2, "0")}</span>
      </div>
      {CHAPTERS.map((c, i) => (
        <article className="chapter gutter" key={c.shot}>
          <img className="chapter__photo" src={img(c.photo)} alt="" loading="lazy" />
          <div className="chapter__panel ga-glass">
            <span className="chapter__index" data-s>
              {String(i + 1).padStart(2, "0")} · {c.kicker}
            </span>
            <h2 className="display" data-s>
              {c.title}
            </h2>
            <p data-s>{c.body}</p>
            {c.swatches && (
              <div className="swatches" data-s>
                {c.swatches.map((s) => (
                  <span key={s.name}>
                    <i style={{ background: s.color }} />
                    {s.name}
                  </span>
                ))}
              </div>
            )}
            {c.split && (
              <div className="split" data-s>
                <div className="split__bar">
                  <i />
                  <i />
                </div>
                <div className="split__legend">
                  <span className="label">Combustion ~400 kW</span>
                  <span className="label" style={{ color: "var(--ink)" }}>
                    Electric 350 kW
                  </span>
                </div>
              </div>
            )}
            {c.facts && (
              <dl className="facts" data-s>
                {c.facts.map((f) => (
                  <div key={f.label}>
                    <dd className="num m-0">
                      {f.value}
                      {f.unit && <small>{f.unit}</small>}
                    </dd>
                    <dt className="label">{f.label}</dt>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
