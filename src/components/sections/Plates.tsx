import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MapPin } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { DRIVERS, GALLERY, SITES, TIMELINE, img } from "@/data/content";
import { rig } from "@/lib/rig";

const reveal = (scope: Element | null, selector = "[data-r]") =>
  gsap.utils.toArray<HTMLElement>(selector, scope).forEach((el) => {
    gsap.from(el, { autoAlpha: 0, y: 34, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
  });

function Drivers() {
  return (
    <section id="drivers" className="gutter py-[clamp(72px,12vh,150px)]">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <div data-r>
          <p className="eyebrow">Drivers</p>
          <h2 className="display h2 mt-4">Experience and the future.</h2>
        </div>
        <p className="lede lg:justify-self-end" data-r>
          A Le Mans winner with more than 250 Grands Prix, and a driver who won Formula 3 and Formula 2 back to back. One car each.
        </p>
      </div>
      <div className="mt-10 grid gap-[clamp(12px,1.4vw,22px)] md:grid-cols-2">
        {DRIVERS.map((d) => (
          <article className="driver ga-material" key={d.no} data-r>
            <div className="driver__visual" aria-hidden="true">
              <span className="driver__no">{d.no}</span>
              <img className="driver__car" src={img(d.photo)} alt="" loading="lazy" />
            </div>
            <p className="label">
              {d.country} · #{d.no}
            </p>
            <h3 className="display mt-2" style={{ fontSize: "clamp(1.7rem,3.2vw,3rem)" }}>
              {d.first}
              <br />
              {d.last}
            </h3>
            <p className="mt-3 max-w-[44ch] text-[0.95rem]" style={{ color: "var(--ink-2)" }}>
              {d.bio}
            </p>
            <dl className="stats">
              {d.stats.map((s) => (
                <div key={s.label}>
                  <dd className="num m-0">{s.value}</dd>
                  <dt className="label mt-2">{s.label}</dt>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function Team() {
  const [de, ch, uk] = SITES;
  // the map box is 16:7, so percentages map onto a 160 x 70 drawing
  const P = (s: { x: number; y: number }) => [s.x * 1.6, s.y * 0.7];
  const [ux, uy] = P(uk), [cx, cy] = P(ch), [dx, dy] = P(de);
  const path = `M ${ux} ${uy} C ${ux + 40} ${uy + 2}, ${cx - 44} ${cy + 6}, ${cx} ${cy} S ${dx - 8} ${dy + 8}, ${dx} ${dy}`;
  return (
    <section id="team" className="gutter py-[clamp(72px,12vh,150px)]">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <div data-r>
          <p className="eyebrow">Team</p>
          <h2 className="display h2 mt-4">Three sites. One car.</h2>
        </div>
        <p className="lede lg:justify-self-end" data-r>
          The engine comes from Germany, the chassis from Switzerland, and a technical centre in England keeps the team close to the sport's supply chain.
        </p>
      </div>

      <div className="map mt-10" data-r>
        <svg viewBox="0 0 160 70" aria-hidden="true">
          <path className="map__route" d={path} fill="none" stroke="#E60042" strokeWidth="0.5" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset="1" />
        </svg>
        {SITES.map((s) => (
          <div key={s.code} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
            <span className="grid h-6 w-6 place-items-center rounded-full" style={{ background: "var(--red)", boxShadow: "0 0 0 5px rgba(230,0,66,.2), 0 0 22px var(--red)" }}>
              <MapPin size={13} color="#fff" />
            </span>
            <span
              className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold tracking-[0.08em]"
              style={s.code === "DE" ? { bottom: "calc(100% + 9px)" } : { top: "calc(100% + 9px)" }}
            >
              {s.city.split(" ")[0]}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-[clamp(12px,1.4vw,22px)] grid gap-[clamp(12px,1.4vw,22px)] md:grid-cols-3">
        {[uk, ch, de].map((s) => (
          <article className="site ga-material" key={s.code} data-r>
            <span className="site__code" aria-hidden="true">
              {s.code}
            </span>
            <h3 className="h3 m-0">{s.city}</h3>
            <span className="tag">{s.role}</span>
            <p className="m-0 text-[0.95rem]" style={{ color: "var(--ink-2)" }}>
              {s.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Timeline() {
  return (
    <section id="roadmap" className="tl flex min-h-[100svh] flex-col justify-center overflow-hidden py-[clamp(64px,10vh,120px)]">
      <div className="gutter grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <div data-r>
          <p className="eyebrow">Road to 2030</p>
          <h2 className="display h2 mt-4">From announcement to title fight.</h2>
        </div>
        <p className="lede lg:justify-self-end" data-r>
          Four years from the decision to the grid, and a stated goal of fighting for the championship by the end of the decade.
        </p>
      </div>
      <div className="gutter mt-[clamp(36px,7vh,80px)]">
        <ol className="tl__track m-0 list-none p-0">
          {TIMELINE.map((t) => (
            <li className={`tl__item ${t.goal ? "tl__item--goal" : ""}`} key={t.title}>
              <span className="label">{t.date}</span>
              <div className="tl__year mt-3">{t.when}</div>
              <h3 className="h3 mb-2 mt-4">{t.title}</h3>
              <p className="m-0 max-w-[34ch] text-[0.95rem]" style={{ color: "var(--ink-2)" }}>
                {t.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Gallery() {
  return (
    <section id="studio" className="gutter py-[clamp(72px,12vh,150px)]">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <div data-r>
          <p className="eyebrow">Studio</p>
          <h2 className="display h2 mt-4">Every angle, lit.</h2>
        </div>
        <p className="lede lg:justify-self-end" data-r>
          Six plates from the studio, cut out and set on black.
        </p>
      </div>
      <div className="shots mt-10">
        {GALLERY.map((g, i) => (
          <figure className={`shot m-0 ${g.cls} ${g.bleed ? "shot--bleed" : ""}`} key={g.src} data-r>
            <img src={img(g.src)} alt={`Audi R26, ${g.label.toLowerCase()}`} loading="lazy" />
            <figcaption>
              <span>{g.label}</span>
              <b>{String(i + 1).padStart(2, "0")} / 06</b>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** The opaque black sections. While they cover the viewport the 3D stage stops rendering. */
export function Plates() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ id: "plates", trigger: root.current, start: "top top", end: "bottom bottom", onToggle: (self) => { rig.active = !self.isActive; } });
      ["drivers", "team", "roadmap", "studio"].forEach((id) => ScrollTrigger.create({ id: `nav-${id}`, trigger: `#${id}`, start: "top top" }));
      reveal(root.current);
      gsap.to(".map__route", { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".map", start: "top 80%", end: "bottom 55%", scrub: 0.6 } });

      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        const track = root.current!.querySelector<HTMLElement>(".tl__track")!;
        const dist = () => Math.max(0, track.scrollWidth - track.parentElement!.clientWidth);
        gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: { trigger: "#roadmap", start: "top top", end: () => `+=${dist() + window.innerHeight * 0.4}`, pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true },
        });
      });
      mm.add("(max-width: 899px)", () => {
        gsap.utils.toArray<HTMLElement>(".tl__item").forEach((el) => {
          gsap.from(el, { autoAlpha: 0, x: -18, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div className="plate" ref={root}>
      <Drivers />
      <div className="gutter"><div className="hair" /></div>
      <Team />
      <div className="gutter"><div className="hair" /></div>
      <Timeline />
      <div className="gutter"><div className="hair" /></div>
      <Gallery />
    </div>
  );
}
