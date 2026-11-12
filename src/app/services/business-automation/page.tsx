import type { CSSProperties } from "react";
import { getService } from "@/content";
import { integrationGroups } from "@/data/services";
import { pageMetadata, serviceJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui/JsonLd";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Accordion } from "@/components/ui/Accordion";
import { IconLink } from "@/components/ui/IconLink";
import { ServiceHero } from "@/components/services/ServiceHero";
import { ServiceFeatureGrid } from "@/components/services/ServiceFeatureGrid";
import { ServiceOverviewBlock } from "@/components/services/ServiceBlocks";
import { BranchingWorkflow } from "@/components/visuals/BranchingWorkflow";
import { UIMockup } from "@/components/visuals/UIMockup";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { faqJsonLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Business Automation & Integrations",
  description:
    "Automate CRM workflows, lead management, invoicing reminders, appointments, reporting and data sync — with documented workflows, testing and error handling.",
  path: "/services/business-automation",
});

export default async function BusinessAutomationPage() {
  const service = await getService("business-automation");
  return (
    <>
      <JsonLd data={serviceJsonLd(service)} />
      <JsonLd data={faqJsonLd(service.faqs)} />
      {/* 1 */}
      <ServiceHero
        service={service}
        title="Less Manual Work. More Connected Operations."
        description="We map how work moves through your business and connect the tools involved — so routine steps happen reliably and your team can focus on work that needs judgement."
        ctaLabel="Automate a process"
        aside={<UIMockup kind="workflow" label="Illustration of an automated booking and intake workflow" className="aspect-[4/3] rounded-[1.75rem] border border-white/10" />}
      />
      {/* 2 */}
      <ServiceOverviewBlock title="Where time quietly disappears." useCases={service.useCases} useCasesTitle="Typical automation opportunities">
        <p>{service.overview}</p>
        <p className="text-muted">
          Good automation is boring in the best way: it runs consistently, logs what it does, and tells someone when it can&apos;t
          complete a step.
        </p>
      </ServiceOverviewBlock>
      {/* 3 */}
      <Section tone="paper" labelledBy="categories-title" spacing="snug">
        <Container>
          <SectionHeading eyebrow="Automation categories" id="categories-title" title="What we automate" />
          <div className="mt-14">
            <ServiceFeatureGrid items={service.offerings} columns={3} tone="paper" />
          </div>
        </Container>
      </Section>
      {/* 4 */}
      <Section labelledBy="integrations-title" spacing="snug">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <SectionHeading
            eyebrow="Integrations"
            id="integrations-title"
            title="Tools we work with."
            description="We choose the platform that fits your systems, data sensitivity and budget — and use custom code via APIs when a no-code tool isn't the right fit."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {integrationGroups.map((g, i) => (
              <div key={g.label} data-reveal style={{ "--i": i } as CSSProperties} className="rounded-[var(--radius-card)] border border-line p-6">
                <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-muted">{g.label}</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {g.items.map((it) => (
                    <li key={it} className="rounded-lg bg-paper px-3 py-1.5 text-sm font-medium text-ink/80 ring-1 ring-line">
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-sm text-muted sm:col-span-2">Platform names are trademarks of their respective owners and are listed to describe compatibility, not partnership.</p>
          </div>
        </Container>
      </Section>
      {/* 5 */}
      <Section tone="paper" labelledBy="visualizer-title" spacing="snug">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Workflow visualizer"
            id="visualizer-title"
            title="Anatomy of a reliable automation."
            description="A trigger, processing steps, conditional logic, actions — and a plan for when things go wrong."
            className="mx-auto"
          />
          <div className="mt-14">
            <BranchingWorkflow />
          </div>
        </Container>
      </Section>
      {/* 6 */}
      <Section tone="ink" labelledBy="benefits-title" spacing="snug" className="overflow-hidden">
        <div aria-hidden className="bg-grid-dark mask-radial absolute inset-0" />
        <Container className="relative">
          <SectionHeading tone="dark" eyebrow="Business benefits" id="benefits-title" title="What changes when processes are connected." />
          <div className="mt-14">
            <ServiceFeatureGrid items={service.benefits} columns={4} tone="dark" />
          </div>
        </Container>
      </Section>
      {/* 7 */}
      <Section id="process" labelledBy="implementation-title" spacing="snug">
        <Container className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading eyebrow="Implementation" id="implementation-title" title="From mapping to monitoring." />
            <ol className="mt-10 flex flex-col">
              {service.process.map((step, i) => (
                <li key={step.title} data-reveal style={{ "--i": i } as CSSProperties} className="relative flex gap-5 pb-8 last:pb-0">
                  {i < service.process.length - 1 && <span aria-hidden className="absolute bottom-0 left-[1.1rem] top-10 w-px bg-line" />}
                  <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-brand/30 bg-white font-mono text-xs text-brand-ink">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 leading-relaxed text-muted">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="text-card font-semibold">Automation FAQ</h2>
            <Accordion items={service.faqs} className="mt-6" />
            <IconLink href="/faq#ai-automation" className="mt-6">
              More AI &amp; automation questions
            </IconLink>
          </div>
        </Container>
      </Section>
      {/* 8 */}
      <FinalCTA
        eyebrow="Business automation"
        title="Automate a Business Process."
        description="Describe a task your team repeats every week. We'll map it and show you what could run automatically."
        primary={{ label: "Book a free demo", href: "/contact?service=Business%20Automation" }}
        secondary={{ label: "Read: what to automate first", href: "/insights/which-business-processes-to-automate" }}
      />
    </>
  );
}
