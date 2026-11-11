import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Service, ServiceSlug } from "@/types/service";
import { Container } from "@/components/ui/Container";

// Home-page wording only. Nav, service pages and breadcrumbs keep the titles in src/data/services.ts.
const stripCopy: Record<ServiceSlug, { title: string; line: string }> = {
  "web-development": { title: "App & Web Development", line: "iOS, Android and web, built to scale" },
  "ai-solutions": { title: "AI Solutions", line: "Assistants and agents that do real work" },
  "business-automation": { title: "Business Automation", line: "Connected tools, fewer manual tasks" },
  "digital-marketing": { title: "Digital Marketing", line: "Traffic, leads and clear reporting" },
};

export function CapabilityStrip({ services }: { services: Service[] }) {
  return (
    <section aria-label="Core capabilities" data-animate-section className="relative pb-8 text-ink md:pb-16 lg:pb-20">
      <Container size="wide">
        <ul data-reveal className="grid grid-cols-1 overflow-hidden rounded-2xl border border-line bg-white/70 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => {
            const Icon = s.icon;
            const copy = stripCopy[s.slug] ?? { title: s.title, line: "" };
            return (
              <li key={s.slug} className="border-line [&:not(:first-child)]:border-t sm:[&:nth-child(2)]:border-t-0 sm:[&:nth-child(even)]:border-l lg:[&:not(:first-child)]:border-l lg:[&:not(:first-child)]:border-t-0">
                <Link href={s.href} className="group flex h-full items-center gap-4 p-5 transition-colors hover:bg-brand-50 md:p-6">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand-50 text-brand transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-ink">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <span className="flex flex-col">
                    <span className="font-mono text-[0.68rem] text-muted">0{i + 1}</span>
                    <span className="font-medium text-ink underline decoration-transparent decoration-1 underline-offset-[6px] transition-colors group-hover:decoration-brand">
                      {copy.title}
                    </span>
                    {copy.line ? <span className="mt-0.5 text-[0.8rem] leading-snug text-muted">{copy.line}</span> : null}
                  </span>
                  <ArrowUpRight aria-hidden className="ml-auto size-4 text-ink/30 transition-colors group-hover:text-brand" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
