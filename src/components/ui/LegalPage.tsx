import { Fragment, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { PageHero } from "./PageHero";
import { Container, Section } from "./Container";
import { slugify } from "@/lib/utils";
import { LegalToc } from "@/components/ui/LegalToc";
import { legalNav } from "@/data/navigation";

/** One piece of a legal section, rendered in order. Text supports `**bold**` and `[label](https://…)`, `[label](mailto:…)`, `[label](tel:…)`. */
export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "olist"; items: string[] }
  | { type: "h3"; text: string }
  | { type: "table"; head: string[]; rows: string[][] };

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  list?: string[];
  /** Richer content (sub-headings, tables, mixed paragraphs and lists). Rendered after `paragraphs` and `list`. */
  blocks?: LegalBlock[];
}

const INLINE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g;

/** Renders `**bold**` and `[label](url)` without ever injecting HTML. Only http(s), mailto and tel links are linked. */
function Inline({ text }: { text: string }): ReactNode {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link && /^(https?:\/\/|mailto:|tel:)/i.test(link[2])) {
      const external = link[2].startsWith("http");
      return (
        <a
          key={i}
          href={link[2]}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="font-medium text-brand-ink underline decoration-brand/50 underline-offset-4 hover:text-brand-ink-hover"
        >
          {link[1]}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function BulletList({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={`mt-4 flex flex-col gap-2 pl-6 leading-relaxed text-ink/80 marker:text-brand ${ordered ? "list-decimal" : "list-disc"}`}>
      {items.map((li, i) => (
        <li key={i}>
          <Inline text={li} />
        </li>
      ))}
    </Tag>
  );
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p className="mt-4 leading-relaxed text-ink/80">
          <Inline text={block.text} />
        </p>
      );
    case "h3":
      return <h3 className="mt-8 text-lg font-semibold tracking-tight text-ink">{block.text}</h3>;
    case "list":
      return <BulletList items={block.items} />;
    case "olist":
      return <BulletList items={block.items} ordered />;
    case "table":
      return (
        <div className="mt-5 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead className="bg-paper">
              <tr>
                {block.head.map((h) => (
                  <th key={h} scope="col" className="border-b border-line px-4 py-3 font-semibold text-ink">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-b border-line last:border-b-0">
                  {row.map((cell, c) =>
                    c === 0 ? (
                      <th key={c} scope="row" className="px-4 py-3 align-top font-medium text-ink">
                        <Inline text={cell} />
                      </th>
                    ) : (
                      <td key={c} className="px-4 py-3 align-top text-ink/80">
                        <Inline text={cell} />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function LegalPage({
  title,
  intro,
  href,
  sections,
  meta,
  closing,
  ready,
}: {
  title: string;
  intro: string;
  href: string;
  sections: LegalSection[];
  /** Facts shown in a box above the first section, e.g. Effective date and Last updated. */
  meta?: { label: string; value: string }[];
  /** Closing lines shown after the last section (for example the copyright line). */
  closing?: string[];
  /** This page's publication gate (see src/config/legal.ts): the "Template notice" is shown while it is false. */
  ready: boolean;
}) {
  const isReady = ready;
  return (
    <>
      <PageHero breadcrumbs={[{ label: title, href }]} eyebrow="Legal" title={title} description={intro} size="compact" />
      <Section>
        <Container className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
          <nav aria-label={`${title} sections`} className="lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted">Contents</p>
            <LegalToc items={sections.map((s, i) => ({ id: slugify(s.title), label: `${i + 1}. ${s.title}` }))} />
            <p className="mt-8 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted">Other policies</p>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              {legalNav
                .filter((l) => l.href !== href)
                .map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-brand-ink hover:text-brand-ink-hover">
                      {l.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
          <div className="max-w-[72ch]">
            {!isReady && (
              <p data-reveal className="mb-10 flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900">
                <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span>
                  <strong className="font-semibold">Template notice:</strong> this policy is a starting template. It must be reviewed by
                  qualified legal counsel and completed with Solvera Technologies&apos; registered business details and effective date
                  before publication.
                </span>
              </p>
            )}
            {meta && meta.length > 0 && (
              <dl data-reveal className="mb-10 grid gap-x-8 gap-y-3 rounded-2xl border border-line bg-paper p-5 text-sm sm:grid-cols-2">
                {meta.map((m) => (
                  <div key={m.label}>
                    <dt className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted">{m.label}</dt>
                    <dd className="mt-1 font-medium text-ink">
                      <Inline text={m.value} />
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {sections.map((s, i) => (
              <section key={s.title} id={slugify(s.title)} data-reveal aria-labelledby={`${slugify(s.title)}-h`} className="scroll-mt-28 border-t border-line py-8 first:border-t-0 first:pt-0">
                <h2 id={`${slugify(s.title)}-h`} className="text-[1.35rem] font-semibold tracking-tight">
                  {i + 1}. {s.title}
                </h2>
                {s.paragraphs?.map((p, k) => (
                  <p key={k} className="mt-4 leading-relaxed text-ink/80">
                    <Inline text={p} />
                  </p>
                ))}
                {s.list && <BulletList items={s.list} />}
                {s.blocks?.map((b, k) => (
                  <Block key={k} block={b} />
                ))}
              </section>
            ))}
            {closing && closing.length > 0 && (
              <div className="mt-4 border-t border-line pt-8 text-sm text-muted">
                {closing.map((line, i) => (
                  <p key={i} className={i === 0 ? undefined : "mt-2"}>
                    <Inline text={line} />
                  </p>
                ))}
              </div>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}
