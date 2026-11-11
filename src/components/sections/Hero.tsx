import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { SPECS, img } from "@/data/content";
import { scrollToId } from "@/lib/scroll";

export function Hero() {
  return (
    <section id="top" className="window hero gutter">
      <img className="poster mx-auto mb-6 w-[min(900px,100%)]" src={img("angular.webp")} alt="Audi R26 in titanium, carbon and red, front three-quarter view" />
      <div className="flex items-end justify-between gap-8">
        <div className="min-w-0">
          <p className="eyebrow" data-in>
            Audi Revolut F1 Team · Season 2026
          </p>
          <h1 className="hero__title mt-4" data-in>
            The first Formula&nbsp;1 car Audi has ever built.
          </h1>
          <p className="lede mt-4" data-in>
            Titanium, carbon and red, driven by a hybrid that is almost half electric.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3" data-in>
            <LiquidMetalButton label="Explore R26" onClick={() => scrollToId("car")} />
            <LiquidMetalButton label="Configure" onClick={() => scrollToId("configure")} />
          </div>
        </div>
        <div className="scrollcue hidden md:inline-flex" data-in aria-hidden="true">
          Scroll <i />
        </div>
      </div>
      <dl className="specs mt-7" data-in>
        {SPECS.map((s) => (
          <div key={s.label}>
            <dd className="num m-0">
              {s.value}
              {s.unit && <small>{s.unit}</small>}
            </dd>
            <dt className="label mt-2">
              <span className="sm:hidden">{s.short}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
