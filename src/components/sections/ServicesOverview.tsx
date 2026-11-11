import { getContent } from "@/content";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IconLink } from "@/components/ui/IconLink";
import type { ServiceSlug } from "@/types/service";
import { ServiceOverviewCarousel } from "./ServiceOverviewCarousel";

// Home-page card copy only. Service pages, navigation and breadcrumbs keep the text in src/data/services.ts.
const cardCopy: Record<ServiceSlug, { title: string; summary: string; chips: string[] }> = {
  "web-development": {
    title: "App & Web Development",
    summary:
      "Native and cross-platform mobile apps for iOS and Android, fast websites, and custom web platforms, built for performance, security and growth.",
    chips: ["iOS apps", "Android apps", "Cross-platform (React Native / Flutter)", "Web applications", "Business websites", "E-commerce"],
  },
  "ai-solutions": {
    title: "AI Solutions",
    summary:
      "AI assistants, conversational agents and document processing that answer customers, find information and take repetitive work off your team, with human review where it matters.",
    chips: ["AI assistants & chatbots", "AI agents", "Knowledge-base search (RAG)", "Document processing", "AI integrations"],
  },
  "business-automation": {
    title: "Business Automation",
    summary:
      "Connected workflows that move data between your CRM, inbox, calendar and accounting tools automatically, so leads, invoices and bookings never slip through the cracks.",
    chips: ["CRM workflows", "Lead management", "Invoicing & payment reminders", "Appointment workflows", "API integrations"],
  },
  "digital-marketing": {
    title: "Digital Marketing",
    summary:
      "Search, paid campaigns and analytics joined up into one measurable system, so you know where enquiries come from and what to improve next.",
    chips: ["Technical & on-page SEO", "Local SEO", "Google Business Profile", "Google & Meta Ads", "Conversion tracking"],
  },
};

export async function ServicesOverview() {
  const { services } = await getContent();
  return (
    <Section tone="paper" labelledBy="services-overview-title" spacing="compact">
      <Container>
        <SectionHeading
          eyebrow="Services"
          id="services-overview-title"
          title="Everything You Need to Build, Automate, and Grow."
          description="Four connected capabilities. Start with one, or combine them into a single solution."
          action={<IconLink href="/services">All services</IconLink>}
        />
        <ServiceOverviewCarousel
          services={services.map(({ slug, title, href, summary, accent, offerings }) => {
            const copy = cardCopy[slug];
            return {
              slug,
              title: copy?.title ?? title,
              href,
              summary: copy?.summary ?? summary,
              accent,
              offerings: (copy?.chips ?? offerings.map((offering) => offering.title)).map((chip) => ({ title: chip })),
            };
          })}
        />
      </Container>
    </Section>
  );
}
