import type { CSSProperties } from "react";
import { Compass, Eye, Lightbulb, ShieldCheck, Target, Wrench } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { getContent } from "@/content";
import { ShowSection } from "@/components/ui/ShowSection";
import { PageHero } from "@/components/ui/PageHero";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceFeatureGrid } from "@/components/services/ServiceFeatureGrid";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { IconLink } from "@/components/ui/IconLink";

export const metadata = pageMetadata({
  title: "About Us",
  description:
    "Solvera Technologies is a digital solutions partner bringing web development, AI, automation and digital marketing together to solve practical business problems.",
  path: "/about",
});

const values = [
  { icon: Eye, title: "Clarity", description: "Plain language, written scopes and honest recommendations — including when a simpler option is the better choice." },
  { icon: Target, title: "Accountability", description: "We own our commitments, communicate early when something changes, and follow through on what we agree." },
  { icon: Lightbulb, title: "Practical innovation", description: "We adopt new technology — including AI — where it delivers real value, not because it is fashionable." },
  { icon: Wrench, title: "Maintainability", description: "We build things that can be understood, updated and handed over, so your investment keeps paying off." },
];

export default async function AboutPage() {
  const { services, detailedPhases } = await getContent();
  return (
    <>
      <ShowSection page="about" section="hero">
      <PageHero
        breadcrumbs={[{ label: "About", href: "/about" }]}
        eyebrow="About Solvera"
        title="A Technology Partner for Your Next Stage of Growth."
        description="We help startups, small and medium-sized businesses, and growing companies use technology to work better — with websites, software, AI, automation and marketing that are designed to work together."
        size="tight"
        actions={
          <>
            <ButtonLink href="/contact" size="lg" arrow>
              Book a free demo
            </ButtonLink>
            <ButtonLink href="/process" size="lg" variant="secondary">
              How we work
            </ButtonLink>
          </>
        }
      />
      </ShowSection>

      {/* 2. Our story */}
      <Section labelledBy="story-title" spacing="tight">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <SectionHeading eyebrow="Our story" id="story-title" title="Why Solvera exists." />
          <div data-reveal className="flex flex-col gap-5 text-lead leading-relaxed text-ink/80">
            <p>
              Growing businesses rarely struggle because of one missing tool. They struggle because their website, CRM, inboxes,
              spreadsheets and marketing platforms don&apos;t work together — so people fill the gaps with manual effort.
            </p>
            <p>
              Solvera Technologies was created to close those gaps. Instead of treating web development, AI, automation and
              marketing as separate projects with separate vendors, we look at how they connect and design solutions around the
              way a business actually operates.
            </p>
            <p className="text-muted">
              The name reflects that purpose: <span className="font-medium text-ink">solve</span> real problems, and build things
              that are <span className="font-medium text-ink">viable</span> over the long term.
            </p>
          </div>
        </Container>
      </Section>

      {/* 3. Mission */}
      <Section tone="ink" labelledBy="mission-title" spacing="tight" className="overflow-hidden">
        <div aria-hidden className="bg-grid-dark mask-radial absolute inset-0" />
        <Container className="relative">
          <div data-reveal className="mx-auto max-w-4xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-brand-300">Our mission</p>
            <h2 id="mission-title" className="mt-6 text-heading font-semibold text-balance">
              To help growing businesses spend less time on manual work and more time on the work that moves them forward —
              through technology that is clear, connected and built to last.
            </h2>
          </div>
        </Container>
      </Section>

      {/* 4. Approach */}
      <Section labelledBy="approach-title" spacing="tight">
        <Container>
          <SectionHeading
            eyebrow="Our approach"
            id="approach-title"
            title="Business needs first. Technology second. Execution throughout."
            description="Every engagement balances three things — and we keep all three visible from the first conversation to launch."
          />
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { icon: Compass, title: "Understand the business", text: "Goals, customers, constraints and how work actually flows today." },
              { icon: Lightbulb, title: "Choose the right technology", text: "The simplest reliable option that fits your stack, budget and team." },
              { icon: ShieldCheck, title: "Execute with discipline", text: "Written scope, visible progress, testing and full handover." },
            ].map(({ icon: Icon, title, text }, i) => (
              <li key={title} data-reveal style={{ "--i": i } as CSSProperties} className="relative rounded-[var(--radius-card)] border border-line bg-paper/60 p-7">
                <span className="font-mono text-xs text-muted">0{i + 1}</span>
                <Icon aria-hidden className="mt-6 size-6 text-brand" />
                <h3 className="mt-4 text-card font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <ShowSection page="about" section="services">
      <Section tone="paper" labelledBy="capabilities-title" spacing="tight">
        <Container>
          <SectionHeading
            eyebrow="Core capabilities"
            id="capabilities-title"
            title="Four disciplines, one connected team."
            action={<IconLink href="/services">Explore services</IconLink>}
          />
          <ul className="mt-8 grid gap-5 md:grid-cols-2">
            {services.map((s, i) => (
              <li key={s.slug}>
                <ServiceCard service={s} index={i} />
              </li>
            ))}
          </ul>
        </Container>
      </Section>
      </ShowSection>

      {/* 6. Values */}
      <Section labelledBy="values-title" spacing="tight">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <SectionHeading eyebrow="Our values" id="values-title" title="The principles behind every project." />
          <ServiceFeatureGrid items={values} columns={2} />
        </Container>
      </Section>

      <ShowSection page="about" section="process">
      <Section tone="paper" labelledBy="how-title" spacing="tight">
        <Container>
          <SectionHeading
            eyebrow="How we work"
            id="how-title"
            title="A clear path from idea to improvement."
            action={
              <ButtonLink href="/process" variant="secondary" arrow>
                See our process
              </ButtonLink>
            }
          />
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {detailedPhases.map((p, i) => (
              <li key={p.id} data-reveal style={{ "--i": i } as CSSProperties} className="rounded-[var(--radius-card)] border border-line bg-white p-6">
                <span className="font-mono text-xs text-brand-ink">{p.number}</span>
                <h3 className="mt-3 font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.intro}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>
      </ShowSection>

      <ShowSection page="about" section="cta">
      <FinalCTA title="Let's talk about what you're building next." secondary={{ label: "See our work", href: "/work" }} />
      </ShowSection>
    </>
  );
}
