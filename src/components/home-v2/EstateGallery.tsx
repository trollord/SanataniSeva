import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

const PF = "font-[family-name:var(--font-playfair)]";

/**
 * Photos of Hiranandani Estate, read from /public/images at request time.
 * Drop a file with one of the names below into public/images/ and it appears
 * here automatically — no code change needed. Any slot whose file is missing
 * is skipped, so the section never renders a broken image.
 *
 * Accepted extensions are tried in order (.jpg, .jpeg, .png, .webp).
 */
const SLOTS: { base: string; alt: string; caption: string }[] = [
  {
    base: "estate-diwali-1",
    alt: "Diwali lights across Hiranandani Estate, Thane",
    caption: "Diwali nights in the estate",
  },
  {
    base: "estate-diwali-2",
    alt: "Diyas and rangoli during Diwali in Hiranandani Estate",
    caption: "Diyas on every doorstep",
  },
  {
    base: "estate-diwali-3",
    alt: "Festive decorations in Hiranandani Estate during Diwali",
    caption: "The estate dressed for the festival",
  },
  {
    base: "estate-1",
    alt: "Towers and tree-lined streets of Hiranandani Estate, Thane",
    caption: "Tree-lined streets",
  },
  {
    base: "estate-2",
    alt: "Neoclassical architecture of Hiranandani Estate, Thane",
    caption: "The architecture it is known for",
  },
  {
    base: "estate-3",
    alt: "Open spaces and gardens in Hiranandani Estate, Thane",
    caption: "Gardens and open spaces",
  },
];

const EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

/** Returns the public URL for a slot if a matching file exists on disk. */
function resolveSlot(base: string): string | null {
  const dir = path.join(process.cwd(), "public", "images");
  for (const ext of EXTENSIONS) {
    if (fs.existsSync(path.join(dir, base + ext))) return `/images/${base}${ext}`;
  }
  return null;
}

/** Guards the dev hint below so it is logged once per server process, not once
    per request. Module scope on purpose: this component is server-only. */
let warnedOnce = false;

export default function EstateGallery() {
  const photos = SLOTS.map((slot) => ({ ...slot, src: resolveSlot(slot.base) })).filter(
    (p): p is typeof p & { src: string } => p.src !== null,
  );

  /**
   * Nothing on disk: render nothing, in every environment.
   *
   * This slot used to print the accepted filenames to the page when
   * NODE_ENV !== "production" so a developer could see what to drop in. That
   * put a white, dashed, monospaced developer instruction panel into the
   * middle of the home page's numbered entry sequence on localhost and on
   * every preview deploy — the one block on the page that read as machine
   * output rather than design. The hint now goes to the server log, where it
   * belongs, and the section is silent wherever the photos are absent.
   */
  if (photos.length === 0) {
    if (process.env.NODE_ENV === "development" && !warnedOnce) {
      warnedOnce = true;
      console.info(
        `[EstateGallery] No photos found in public/images. Drop any of these in to render the mosaic: ${SLOTS.map(
          (s) => `${s.base}.jpg`,
        ).join(", ")}`,
      );
    }
    return null;
  }

  // A 2×2 hero tile only tiles a 3-column grid without gaps at 6 photos.
  const heroTile = photos.length === 6;

  return (
    <section className="py-16 sm:py-24 lg:py-32 px-5 sm:px-8 bg-[#FAF8F5]">
      <div className="max-w-[1440px] mx-auto">

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-14">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-8 shrink-0 bg-[#C8541A]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A8410F]">
                Life in the Estate
              </span>
            </div>
            <h2 className={`${PF} text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight`}>
              The neighbourhood,{" "}
              <em className="text-[#C8541A]">at its best.</em>
            </h2>
          </div>
          <p className="text-[#6B6B6B] text-sm sm:text-base leading-relaxed lg:max-w-sm">
            Tree-lined streets, open gardens and a Diwali the whole estate turns out for —
            this is the neighbourhood behind every listing on this platform.
          </p>
        </div>

        {/* Mosaic: with the full set the first photo takes a 2×2 hero tile, which
            tiles a 3-column grid exactly (4 + 5 = 9 cells). At any other count a
            uniform grid is used so the last row never orphans a single tile. */}
        <div className="grid grid-cols-2 lg:grid-cols-3 auto-rows-[160px] sm:auto-rows-[220px] gap-3 sm:gap-4">
          {photos.map((photo, i) => (
            <figure
              key={photo.base}
              className={`relative rounded-2xl overflow-hidden bg-[#F0E9DF] group ${
                heroTile && i === 0 ? "lg:col-span-2 lg:row-span-2" : ""
              }`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes={heroTile && i === 0 ? "(max-width: 1024px) 50vw, 66vw" : "(max-width: 1024px) 50vw, 33vw"}
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                priority={i === 0}
              />
              {/* caption scrim */}
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/65 to-transparent">
                <figcaption className="text-white text-[11px] sm:text-xs font-medium leading-snug">
                  {photo.caption}
                </figcaption>
              </div>
            </figure>
          ))}
        </div>

      </div>
    </section>
  );
}
