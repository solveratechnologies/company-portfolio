import { getService } from "@/content";
import { pageMetadata, serviceJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/ui/JsonLd";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceHero } from "@/components/services/ServiceHero";
import { ServiceFeatureGrid } from "@/components/services/ServiceFeatureGrid";
import { ServiceCategoryCarousel } from "@/components/services/ServiceCategoryCarousel";
import { ServiceFAQ } from "@/components/services/ServiceFAQ";
import { ProcessSteps, RelatedProjectsBlock, ServiceOverviewBlock } from "@/components/services/ServiceBlocks";
import { UIMockup } from "@/components/visuals/UIMockup";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { ShowSection } from "@/components/ui/ShowSection";

export const metadata = pageMetadata({
  title: "Web Development & Custom Software",
  description:
    "Fast, accessible business websites, e-commerce, web applications, dashboards and API integrations — built for performance, usability and long-term maintainability.",
  path: "/services/web-development",
});

export default async function WebDevelopmentPage() {
  const service = await getService("web-development");
  return (
    <>
      <JsonLd data={serviceJsonLd(service)} />
      {/* 1 */}
      <ServiceHero
        service={service}
        title="Digital Experiences Built for Performance and Growth."
        description="Websites and web applications that load fast, read clearly, and stay easy to maintain — designed around the goals of your business and the people who use them."
        aside={
          <div className="relative">
            <UIMockup kind="storefront" label="Illustration of a responsive storefront built for fast product discovery" className="aspect-[4/3] rounded-[1.75rem] border border-white/10" />
            <div aria-hidden className="absolute -bottom-6 -left-4 hidden w-1/2 sm:block">
              <UIMockup kind="dashboard" label="" className="aspect-[4/3] rounded-2xl border border-white/10 p-[4%]! shadow-2xl" />
            </div>
          </div>
        }
      />
      {/* 2 */}
      <ServiceOverviewBlock title="Websites and applications that do a job — and keep doing it." useCases={service.useCases}>
        <p>{service.overview}</p>
        <p className="text-muted">
          For marketing websites, we focus on clear messaging, fast loading and easy content updates. For custom applications,
          we focus on the workflows your team relies on, with roles, data and integrations planned from the start.
        </p>
      </ServiceOverviewBlock>
      {/* 3 */}
      <Section tone="paper" labelledBy="categories-title" spacing="snug">
        <Container>
          <SectionHeading eyebrow="What we build" id="categories-title" title="Service categories" description="From a focused landing page to a full web application." />
          <ServiceCategoryCarousel items={service.offerings.map(({ title, description }) => ({ title, description }))} />
        </Container>
      </Section>
      {/* 4 */}
      <Section tone="ink" labelledBy="benefits-title" spacing="snug" className="overflow-hidden">
        <div aria-hidden className="bg-grid-dark mask-radial absolute inset-0" />
        <Container className="relative">
          <SectionHeading tone="dark" eyebrow="Business benefits" id="benefits-title" title="Built well, so it keeps working for you." />
          <div className="mt-14">
            <ServiceFeatureGrid items={service.benefits} columns={3} tone="dark" />
          </div>
        </Container>
      </Section>
      {/* 5 */}
      <ProcessSteps steps={service.process} title="Our development process" description="Small, reviewable steps — so you see progress early and decisions are made with real work in front of you." tone="white" spacing="snug" />
      {/* 6 */}
      <ShowSection page="web-development" section="work">
        <RelatedProjectsBlock service="web-development" tone="paper" />
      </ShowSection>
      {/* 7 */}
      <ServiceFAQ items={service.faqs} title="Web development questions" description="Timelines, scope, revisions, maintenance and handover." />
      {/* 8 */}
      <FinalCTA
        eyebrow="Web development"
        title="Discuss Your Website or Software Project."
        description="Share what you need to build and any deadlines. We'll come back with questions and a suggested approach."
        primary={{ label: "Book a free demo", href: "/contact?service=Web%20Development" }}
        secondary={{ label: "View our work", href: "/work?category=Web%20Development" }}
      />
    </>
  );
}
