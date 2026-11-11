import gsap from "gsap";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { NAV, img } from "@/data/content";
import { scrollToId } from "@/lib/scroll";

export function Nav({ active }: { active: string }) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);

  // hide on the way down, return on the way up
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setHidden(y > last && y > 160);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // the sheet grows out of the menu button, links arrive one after another
  useEffect(() => {
    const el = sheet.current;
    if (!el) return;
    if (open) {
      el.hidden = false;
      gsap.fromTo(el, { autoAlpha: 0, scale: 0.86, y: -10 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.55, ease: "back.out(1.5)" });
      gsap.fromTo(el.querySelectorAll("[data-item]"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power3.out", delay: 0.08 });
    } else if (!el.hidden) {
      gsap.to(el, { autoAlpha: 0, scale: 0.92, y: -8, duration: 0.25, ease: "power2.in", onComplete: () => { el.hidden = true; } });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); setOpen(false); scrollToId(id); };

  return (
    <>
      <header className={`nav gutter ${hidden && !open ? "is-hidden" : ""}`}>
        <div className="flex items-center justify-between gap-3">
          <a href="#top" onClick={go("top")} className="flex items-center gap-3" aria-label="Audi Revolut F1 Team, back to top" data-in>
            <img src={img("logo-white.png")} alt="" width={44} height={40} style={{ height: 40, width: "auto" }} />
            <span className="hidden sm:block label" style={{ color: "var(--ink-2)" }}>
              Design concept · Michael C
            </span>
          </a>

          <nav className="ga-glass ga-bar hidden lg:flex" aria-label="Sections" data-in>
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} onClick={go(n.id)} aria-current={active === n.id ? "true" : undefined}>
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2" data-in>
            <LiquidMetalButton label="Configure" onClick={() => { setOpen(false); scrollToId("configure"); }} />
            <button
              type="button"
              className="ga-glass ga-interactive ga-iconbtn inline-grid lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <div id="menu" ref={sheet} className="menu ga-glass ga-sheet lg:hidden" hidden>
        {NAV.map((n) => (
          <a key={n.id} href={`#${n.id}`} onClick={go(n.id)} data-item>
            {n.label}
            <ArrowUpRight size={18} color="var(--red)" />
          </a>
        ))}
      </div>
    </>
  );
}
