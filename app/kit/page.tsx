import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import kit from "@/kit/visual-system.json";
import { BeatHeader } from "@/app/components/ui/beat-header";
import { Figure } from "@/app/components/ui/figure";
import { Stat } from "@/app/components/ui/stat";
import { TextLink } from "@/app/components/ui/text-link";
import { SkillList } from "@/app/components/skill-list";
import { CaseHero } from "@/app/components/modules/case-hero";
import { Beat } from "@/app/components/modules/beat";

/*
 * The kit, browsable: every token and component in every state. Hidden on
 * Production (gregfrye.us); review builds only. Values are read from
 * kit/visual-system.json, so a token change shows up here on the next build.
 * Tailwind only generates classes it can see as literal strings, hence the
 * class maps below: add a row when you add a token.
 */

export const metadata: Metadata = { title: "Kit — Greg Frye", robots: { index: false, follow: false } };

const COLOR_CLASS: Record<string, string> = {
  canvas: "bg-canvas",
  "canvas-home": "bg-canvas-home",
  ink: "bg-ink",
  muted: "bg-muted",
  "muted-home": "bg-muted-home",
  faint: "bg-faint",
  border: "bg-border",
  placeholder: "bg-placeholder",
};
const TYPE_CLASS: Record<string, string> = {
  title: "type-title",
  display: "type-display",
  stat: "type-stat",
  body: "type-body",
  label: "type-label",
  credit: "type-credit",
  meta: "type-meta",
};
const SPACE_CLASS: Record<string, string> = {
  item: "w-item",
  inline: "w-inline",
  block: "w-block",
  gutter: "w-gutter",
  nav: "w-nav",
  section: "w-section",
  marker: "w-marker",
  masthead: "w-masthead",
};
const EASE_CLASS: Record<string, string> = {
  standard: "ease-standard",
  enter: "ease-enter",
  exit: "ease-exit",
  editorial: "ease-editorial",
};
const DURATION_CLASS: Record<string, string> = {
  fast: "motion-fast",
  normal: "motion-normal",
  slow: "motion-slow",
};

const img = (file: string) => `/content-images/clients/hudson-cannabis/images/${file}`;
const rows = <T,>(o: Record<string, T>) => Object.entries(o).filter(([k]) => !k.startsWith("$"));

function KitSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border pt-block">
      <h2 className="type-label text-muted">{title}</h2>
      <div className="mt-block">{children}</div>
    </section>
  );
}

export default function KitPage() {
  if (process.env.VERCEL_ENV === "production") notFound();

  return (
    <main className="mx-auto flex w-full max-w-wide flex-col gap-section px-gutter pt-masthead pb-section">
      <header className="pt-section">
        <h1 className="type-display text-ink">Kit</h1>
        <p className="mt-block max-w-prose type-body text-muted">
          Every token and component, read from kit/visual-system.json. Hidden on gregfrye.us. Start at kit/readme.md.
        </p>
      </header>

      <KitSection title="Color — by job">
        <ul className="grid grid-cols-2 gap-gutter sm:grid-cols-4">
          {rows(kit.semantic.color).map(([name, c]) => (
            <li key={name}>
              <div className={`aspect-square border border-border ${COLOR_CLASS[name] ?? ""}`} />
              <p className="mt-item type-label text-ink">{name}</p>
              <p className="type-meta text-muted">{c.job}</p>
            </li>
          ))}
        </ul>
      </KitSection>

      <KitSection title="Type — roles">
        <ul className="flex flex-col gap-block">
          {rows(kit.type.roles).map(([name, r]) => (
            <li key={name} className="grid grid-cols-1 gap-x-gutter gap-y-item border-b border-border pb-block md:grid-cols-4">
              <div>
                <p className="type-label text-ink">type-{name}</p>
                <p className="type-meta text-muted">
                  {r.size[1]} / {r.size[0]} · {r.family} · {r.lineHeight}
                </p>
                <p className="type-meta text-muted">{r.job}</p>
              </div>
              <p className={`md:col-span-3 text-ink ${TYPE_CLASS[name] ?? ""}`}>
                {name === "meta" ? "2022–2025" : name === "credit" ? "© Adam Whyte, 2023" : name === "stat" ? "$500k" : "A farm entering a market with no rules."}
              </p>
            </li>
          ))}
        </ul>
      </KitSection>

      <KitSection title="Spacing — 9px rhythm, by job">
        <ul className="flex flex-col gap-item">
          {rows(kit.layout.spacing).map(([name, s]) => (
            <li key={name} className="flex items-center gap-inline">
              <span className={`h-inline shrink-0 bg-ink ${SPACE_CLASS[name] ?? ""}`} />
              <span className="type-label text-ink">
                {name} · {s.value}
              </span>
              <span className="type-meta text-muted">{s.job}</span>
            </li>
          ))}
        </ul>
      </KitSection>

      <KitSection title="Motion — hover a row">
        <ul className="flex flex-col gap-item">
          {rows(kit.motion.ease).map(([name, e]) =>
            rows(kit.motion.duration).map(([dur]) => (
              <li key={`${name}-${dur}`} className="group flex items-center gap-inline border-b border-border py-item">
                <span
                  className={`block h-inline w-inline bg-ink transition-transform group-hover:translate-x-masthead ${EASE_CLASS[name] ?? ""} ${DURATION_CLASS[dur] ?? ""}`}
                />
                <span className="ml-masthead type-label text-ink">
                  ease-{name} · motion-{dur}
                </span>
                <span className="type-meta text-muted">{e.job}</span>
              </li>
            )),
          )}
        </ul>
      </KitSection>

      <KitSection title="Line">
        <div className="rule" />
        <p className="mt-item type-meta text-muted">{kit.line.weight.job}</p>
      </KitSection>

      <KitSection title="Components">
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          <div className="flex flex-col gap-block">
            <BeatHeader marker="B" label="Complication" />
            <BeatHeader marker="04" label="Approach" />
            <BeatHeader label="Results" />
          </div>
          <div className="flex flex-col gap-block">
            <Stat value="17" label="SKUs to market" />
            <TextLink href="/work/hudson-cannabis">More Information</TextLink>
            <p className="type-meta text-ink">2022–2025</p>
            <SkillList skills={["narrative-strategy", "brand-identity", "product-development"]} label="Skills" />
          </div>
          <div className="flex flex-col gap-block">
            <Figure src={img("03-plant-sky.jpg")} alt="Cannabis plant against open sky" credit="© Freya Dobson, 2022" />
            <Figure alt="Placeholder: no image yet" credit="© Credit, Year" />
          </div>
        </div>
      </KitSection>

      <KitSection title="Module — case hero">
        <CaseHero
          title="Hudson Hemp"
          image={{ src: img("01-HC-overview.jpg"), alt: "Farm aerial, Hudson Valley" }}
          lede="New York legalized adult-use cannabis before the category had a language. No shelf conventions, no consumer expectations, no agreed vocabulary for effect or potency."
          stats={[
            { value: "17", label: "SKUs to market" },
            { value: "$500k", label: "Monthly sales" },
            { value: "10k", label: "Organic followers" },
          ]}
          chapters={[
            { id: "kit-a", label: "Situation" },
            { id: "kit-b", label: "Complication" },
            { id: "kit-c", label: "Insight" },
            { id: "kit-d", label: "Approach" },
            { id: "kit-e", label: "Results" },
          ]}
        />
      </KitSection>

      <KitSection title="Module — beat · stack">
        <Beat
          id="kit-a"
          marker="A"
          label="Situation"
          statement="A regenerative hemp farm transitioning into the heavily regulated, yet largely undefined NY cannabis market."
          media={<Figure src={img("01-HC-overview.jpg")} alt="Farm aerial, Hudson Valley" />}
        />
      </KitSection>

      <KitSection title="Module — beat · thirds, media first">
        <Beat
          id="kit-b"
          marker="B"
          label="Complication"
          layout="thirds"
          mediaFirst
          statement="With a wellness CBD brand not calibrated for NY's new recreational THC market."
          media={<Figure src={img("06-HC-packaging.jpg")} alt="Hudson Cannabis packaging" />}
        >
          <p>New York legalized adult-use cannabis before the category had a language. No shelf conventions, no consumer expectations, and a regulatory framework still being written.</p>
        </Beat>
      </KitSection>

      <KitSection title="Module — beat · thirds, no body">
        <Beat
          id="kit-c"
          marker="C"
          label="Insight"
          layout="thirds"
          statement="The perfect narrative seed was already on site."
          media={<Figure src={img("04-field-rows.jpg")} alt="Field rows" credit="© Freya Dobson, 2022" />}
        />
      </KitSection>

      <KitSection title="Module — beat · halves, media first">
        <Beat
          id="kit-d"
          marker="04"
          label="Approach"
          layout="halves"
          mediaFirst
          statement="A self-aware farm-first brand and quality product with city appeal."
          media={<Figure src={img("02-canopy.jpg")} alt="Harvest in the canopy" credit="© Adam Whyte, 2023" />}
        />
      </KitSection>

      <KitSection title="Module — beat · thirds, results">
        <Beat
          id="kit-e"
          marker="09"
          label="Results"
          layout="thirds"
          statement="17 SKUs, in 200+ stores, $500k/mo sales, 20k organic followers, brand acquisition."
          media={<Figure src={img("07-dime-pouch.jpg")} alt="Dime pouch" credit="© Adam Whyte, 2024" />}
        >
          <p>Hudson Hemp had a decade of regenerative farming behind it and a CBD business that wouldn&apos;t transfer.</p>
          <TextLink href="/work/hudson-cannabis">More Information</TextLink>
        </Beat>
      </KitSection>
    </main>
  );
}
