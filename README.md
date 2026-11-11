# Audi R26 Experience

Interactive 3D showcase of the Audi R26 (Audi Revolut F1 Team, season 2026).
Web design concept by Michael C. Not affiliated with Audi AG or the team.

## Stack

- Vite + React 18 + TypeScript + Tailwind CSS (shadcn/ui folder layout, `@/components/ui`)
- Three.js through React Three Fiber
- GSAP + ScrollTrigger, Lenis smooth scroll
- `@paper-design/shaders` for the Liquid Metal Button, `lucide-react` for icons

## Run

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm run build    # static site in dist/
npm run preview
```

`dist/` is a plain static site with relative paths. Drop it on Vercel, Netlify or any static host.

## Where things live

| Path | What it is |
| --- | --- |
| `src/lib/rig.ts` | Camera shots, colourways and the scroll-to-camera mapping. Edit `SHOTS` to reframe the car. |
| `src/components/scene/Stage.tsx` | WebGL scene: studio lighting, car material (repaint, laser build, airflow, power-unit glow), floor reflection. |
| `src/components/sections/` | Hero, pinned story, configurator, drivers / team / timeline / gallery, finale. |
| `src/components/ui/liquid-metal-button.tsx` | The Liquid Metal Button, unchanged from the supplied source. |
| `src/index.css` | Design tokens, Liquid Glass (`.ga-*`) and section styles. |
| `src/data/content.ts` | All copy and data. |
| `public/model/` | Optimised car (`car.glb`, about 4 MB, wheels split out so they can spin) and its three textures. |
| `public/img/` | Studio renders with the background removed. |

## Notes

- The source model is one mesh with one baked texture, so the configurator repaints it in the shader: light neutral texels are treated as bodywork, saturated red texels as the intakes.
- `?q=low` renders at half resolution without the floor reflection. `?skip` skips the intro.
- The heading face is Archivo at 125 % width, standing in for Audi Type Extended, which is proprietary.
