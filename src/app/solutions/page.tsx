import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, Lock, Plug } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { getServiceMap } from "@/content";
import { ShowSection } from "@/components/ui/ShowSection";
import { PageHero } from "@/components/ui/PageHero";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProcessSteps } from "@/components/services/ServiceBlocks";
import { UIMockup } from "@/components/visuals/UIMockup";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { ProblemCards, type ProblemCard } from "@/components/solutions/ProblemCards";
import { BuildCards, type BuildCard } from "@/components/solutions/BuildCards";
import type { ServiceSlug } from "@/types/service";

export const metadata = pageMetadata({
  title: "Custom Software Solutions",
  description:
    "Know the problem but not the service? Solvera designs custom dashboards, portals, internal tools and integrations around the way your business works.",
  path: "/solutions",
});

const problems: { icon: ProblemCard["icon"]; problem: string; direction: string; services: ServiceSlug[] }[] = [
  { icon: "spreadsheet", problem: "“We run the business on spreadsheets that keep breaking.”", direction: "A custom internal tool or database with forms, roles and reports.", services: ["web-development", "business-automation"] },
  { icon: "timer", problem: "“Our team spends hours copying data between systems.”", direction: "Integrations and workflows that keep tools in sync automatically.", services: ["business-automation"] },
  { icon: "search", problem: "“We can't see what's happening without asking around.”", direction: "A dashboard that brings key data from several tools into one view.", services: ["web-development", "business-automation"] },
  { icon: "users", problem: "“Clients keep emailing to ask for status updates.”", direction: "A client portal with live status, documents and requests.", services: ["web-development"] },
  { icon: "clipboard", problem: "“We answer the same questions every day.”", direction: "An AI assistant grounded in your own content, with human handover.", services: ["ai-solutions"] },
  { icon: "unplug", problem: "“Leads come in, but follow-up is inconsistent.”", direction: "Lead capture, qualification and follow-up sequences tied to your CRM.", services: ["business-automation", "ai-solutions", "digital-marketing"] },
];

const builds: BuildCard[] = [
  { icon: "dashboard", title: "Custom dashboards", description: "Operational and management views built around the decisions people make every day." },
  { icon: "portal", title: "Client & partner portals", description: "Secure spaces for status, documents, approvals and requests." },
  { icon: "tools", title: "Internal tools", description: "Purpose-built apps that replace fragile spreadsheets and manual trackers." },
  { icon: "workflow", title: "Workflow systems", description: "Multi-step processes with assignments, approvals, reminders and audit trails." },
];

const scenarios = [
  { kind: "portal" as const, title: "Operations portal for a field service team", text: "Jobs, technician updates and customer status in one place, with invoicing exports.", href: "/work/field-service-operations-portal" },
  { kind: "dashboard" as const, title: "Front-desk dashboard for a clinic", text: "Today's appointments, outstanding intake forms and reminders at a glance.", href: "/work/clinic-intake-automation" },
  { kind: "document" as const, title: "Document review tool for finance", text: "Extracted invoice data checked side by side with the source before export.", href: "/work/invoice-data-extraction" },
];

export default async function SolutionsPage() {
  const serviceMap = await getServiceMap();
  return (
    <>
      <ShowSection page="solutions" section="hero">
      <PageHero
        breadcrumbs={[{ label: "Solutions", href: "/solutions" }]}
        eyebrow="Custom software solutions"
        title="Tailored solutions for the way your business works."
        description="If you know the problem but not which service you need, start here. We design dashboards, portals, internal tools and integrations around your processes — not the other way around."
        size="compact"
        actions={
          <>
            <ButtonLink href="/contact?service=Custom%20Software" size="lg" arrow>
              Describe your problem
            </ButtonLink>
            <ButtonLink href="#problems" size="lg" variant="secondary">
              Common problems
            </ButtonLink>
          </>
        }
        aside={<UIMockup kind="portal" label="Illustration of a custom job management portal" className="aspect-[4/3] rounded-[1.75rem] border border-line" />}
      />
      </ShowSection>
      <ShowSection page="solutions" section="problems">
        <ProblemCards
          cards={problems.map(({ icon, problem, direction, services }) => ({
            icon,
            problem,
            direction,
            services: services.map((slug) => ({ href: serviceMap[slug].href, title: serviceMap[slug].title })),
          }))}
        />
      </ShowSection>
      {/* 3 */}
      <BuildCards cards={builds}>
      {/* 4 */}
      <Section tone="ink" labelledBy="integration-title" spacing="snug" reveal={false} className="overflow-hidden">
        <div aria-hidden className="bg-grid-dark mask-radial absolute inset-0" />
        <Container className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
          <SectionHeading
            tone="dark"
            eyebrow="System integration"
            id="integration-title"
            title="Data that flows where it's needed."
            description="Custom software rarely stands alone. We plan how data moves between your new tool and existing systems — with clear ownership, access controls and logging."
          />
          <DataFlow />
        </Container>
      </Section>
      </BuildCards>
      {/* 5 */}
      <ShowSection page="solutions" section="scenarios">
      <Section labelledBy="scenarios-title" spacing="snug">
        <Container>
          <SectionHeading eyebrow="Example scenarios" id="scenarios-title" title="What this can look like." description="Concept scenarios — not client projects — illustrating typical solutions." />
          <ul className="mt-14 grid gap-5 md:grid-cols-3">
            {scenarios.map((s, i) => (
              <li key={s.title} data-reveal style={{ "--i": i } as CSSProperties}>
                <Link href={s.href} className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line transition-[border-color,box-shadow] hover:border-brand/30 hover:shadow-[0_24px_48px_-28px_rgb(16_24_32/0.35)]">
                  <UIMockup kind={s.kind} label={s.title} className="aspect-[16/11] border-b border-line" />
                  <div className="flex flex-1 flex-col p-6">
                    <Badge tone="warning" className="w-fit">
                      Concept
                    </Badge>
                    <h3 className="mt-4 font-semibold group-hover:text-brand-ink">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-brand-ink">
                      View concept <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
      </ShowSection>
      <ShowSection page="solutions" section="delivery">
      <ProcessSteps
        id="delivery"
        eyebrow="Delivery approach"
        title="How we deliver custom software."
        spacing="snug"
        steps={[
          { title: "Discovery workshop", description: "Map users, tasks, data and integrations; agree what success looks like." },
          { title: "Prototype", description: "Clickable prototype of the key screens to validate before building." },
          { title: "Iterative build", description: "Working software every milestone on a staging environment." },
          { title: "Launch & handover", description: "Testing, data migration, training, documentation and full access." },
        ]}
      />
      </ShowSection>
      <ShowSection page="solutions" section="cta">
      <FinalCTA title="Describe the problem. We'll help design the solution." primary={{ label: "Book a free demo", href: "/contact?service=Custom%20Software" }} secondary={{ label: "Explore services", href: "/services" }} />
      </ShowSection>
    </>
  );
}

function DataFlow() {
  const left = ["Website forms", "CRM", "Accounting"];
  const right = ["Dashboard", "Client portal", "Reports"];
  return (
    <div data-reveal role="img" aria-label="Diagram: data from website forms, CRM and accounting flows through a secure integration layer into a dashboard, client portal and reports" className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
      <ul aria-hidden className="flex flex-col gap-3">
        {left.map((l) => (
          <li key={l} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center text-sm text-white/80 sm:px-4">
            {l}
          </li>
        ))}
      </ul>
      <div aria-hidden className="flex flex-col items-center gap-2">
        <span className="h-10 w-px bg-gradient-to-b from-transparent to-mint/60" />
        <div className="flex size-20 flex-col items-center justify-center gap-1 rounded-2xl border border-mint/40 bg-mint/10 text-mint-300 sm:size-24">
          <Plug className="size-5" />
          <span className="text-[0.65rem] font-medium">Integration</span>
        </div>
        <span className="flex items-center gap-1 text-[0.65rem] text-white/55">
          <Lock className="size-3" /> Logged
        </span>
        <span className="h-10 w-px bg-gradient-to-b from-mint/60 to-transparent" />
      </div>
      <ul aria-hidden className="flex flex-col gap-3">
        {right.map((r) => (
          <li key={r} className="rounded-xl border border-brand/30 bg-brand/10 px-3 py-3 text-center text-sm text-white sm:px-4">
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}
