import { Layers, Link2, TrendingUp } from "lucide-react";
import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const highlights = [
  { icon: Layers, title: "Build", text: "Mobile apps, websites, web platforms and dashboards on solid, maintainable foundations." },
  { icon: Link2, title: "Connect", text: "AI and automation that link your tools, so information flows without copy-and-paste." },
  { icon: TrendingUp, title: "Grow", text: "Search, paid campaigns and analytics that bring the right people and show what\u2019s working." },
];

export function AboutPreview() {
  return (
    <Section labelledBy="about-preview-title">
      <Container className="grid items-center gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="About Solvera"
            id="about-preview-title"
            title="One Partner, From First Idea to Measurable Growth."
            description={
              <p>
                Most business problems don&apos;t fit neatly into one discipline. A slow website, an app customers abandon, a manual
                follow-up process and unclear marketing data are often the same problem seen from different angles. Solvera brings
                development, AI, automation and marketing under one roof, so the solution fits the way your business actually works and
                nothing gets lost between agencies.
              </p>
            }
          />
          <ul className="grid gap-5">
            {highlights.map(({ icon: Icon, title, text }, i) => (
              <li key={title} data-reveal style={{ "--i": i } as CSSProperties} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand">
                  <Icon aria-hidden className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 leading-relaxed text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div data-reveal>
            <ButtonLink href="/about" variant="secondary" arrow>
              Discover Solvera
            </ButtonLink>
          </div>
        </div>
        <StackVisual />
      </Container>
    </Section>
  );
}

function StackVisual() {
  const layers = [
    { label: "Grow", items: ["SEO", "Paid campaigns", "Analytics"], tone: "bg-mint-50 border-mint/30", dot: "bg-mint" },
    { label: "Connect", items: ["AI assistants", "Workflows", "Integrations"], tone: "bg-brand-50 border-brand/25", dot: "bg-brand" },
    { label: "Build", items: ["iOS & Android apps", "Web apps", "Dashboards"], tone: "bg-white border-line", dot: "bg-ink" },
  ];
  return (
    <div data-reveal role="img" aria-label="Illustration: Solvera's three connected layers — build, connect and grow" className="relative mx-auto w-full max-w-lg">
      <div aria-hidden className="bg-grid-light mask-radial absolute inset-0 lg:-inset-10" />
      <div aria-hidden className="relative flex flex-col gap-4 rounded-[2rem] border border-line bg-paper p-5 sm:p-7">
        {layers.map((l, i) => (
          <div key={l.label} className={`relative rounded-2xl border p-5 shadow-[0_14px_30px_-24px_rgb(16_24_32/0.45)] ${l.tone}`} style={{ marginLeft: `${i * 6}%`, marginRight: `${(2 - i) * 6}%` }}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold">
                <span className={`size-2 rounded-full ${l.dot}`} /> {l.label}
              </span>
              <span className="font-mono text-[0.68rem] text-ink/70">Layer 0{3 - i}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {l.items.map((it) => (
                <span key={it} className="rounded-full border border-ink/10 bg-white/80 px-2.5 py-1 text-xs text-ink/75">
                  {it}
                </span>
              ))}
            </div>
            {i < layers.length - 1 && <span className="absolute -bottom-4 left-1/2 h-4 w-px bg-ink/20" />}
          </div>
        ))}
        <p className="pt-1 text-center font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted">One connected system</p>
      </div>
    </div>
  );
}
