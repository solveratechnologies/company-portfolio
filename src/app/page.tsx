import { HeroSection } from "@/components/sections/HeroSection";
import { AboutPreview } from "@/components/sections/AboutPreview";
import { ServicesOverview } from "@/components/sections/ServicesOverview";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { AutomationSpotlight } from "@/components/sections/AutomationSpotlight";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { IndustriesGrid } from "@/components/sections/IndustriesGrid";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { InsightsPreview } from "@/components/sections/InsightsPreview";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { ShowSection } from "@/components/ui/ShowSection";
import { getContent } from "@/content";
import { pageMetadata } from "@/lib/seo";

// One definition drives the <title>, meta description, Open Graph and Twitter tags.
export const metadata = pageMetadata({
  title: "Solvera Technologies — Web Development, AI & Automation",
  absoluteTitle: true,
  description:
    "Solvera Technologies builds fast websites and custom software, applies practical AI, automates workflows, and grows businesses with measurable digital marketing.",
  path: "/",
});

// Home-page wording for the industries list. The /industries page keeps the text in src/data/industries.ts.
const industryCopy: Record<string, { name: string; summary: string }> = {
  "ecommerce-retail": { name: "E-commerce & Retail", summary: "Fast storefronts, shopping apps, connected inventory and marketing you can measure." },
  "restaurants-hospitality": { name: "Restaurants & Hospitality", summary: "Online ordering, bookings, reviews and guest messaging in one flow." },
  "professional-services": { name: "Professional Services", summary: "Credible websites, client portals, smooth intake and less admin." },
  "real-estate": { name: "Real Estate", summary: "Lead capture, qualification and follow-up that keeps pace with every enquiry." },
  healthcare: { name: "Healthcare & Clinics", summary: "Patient booking, digital intake and reminders, designed around privacy." },
  education: { name: "Education & Training", summary: "Learning apps, enrolment journeys and AI-powered knowledge search." },
  "startups-saas": { name: "Startups & SaaS", summary: "MVPs, mobile and web products, and the tooling that helps teams scale." },
  "financial-services": { name: "Financial Services", summary: "Secure client portals, document processing and compliant communication." },
};

export default async function HomePage() {
  const { industries, processPhases } = await getContent();
  return (
    <>
      <ShowSection page="home" section="hero"><HeroSection /></ShowSection>
      <ShowSection page="home" section="about"><AboutPreview /></ShowSection>
      <ShowSection page="home" section="services"><ServicesOverview /></ShowSection>
      <ShowSection page="home" section="work"><FeaturedWork /></ShowSection>
      <ShowSection page="home" section="automation"><AutomationSpotlight /></ShowSection>
      <ShowSection page="home" section="why"><WhyChooseUs /></ShowSection>
      <ShowSection page="home" section="industries">
        <IndustriesGrid industries={industries.map(({ slug, name, summary }) => ({ slug, name: industryCopy[slug]?.name ?? name, summary: industryCopy[slug]?.summary ?? summary }))} />
      </ShowSection>
      <ShowSection page="home" section="process"><ProcessTimeline phases={processPhases} /></ShowSection>
      <ShowSection page="home" section="testimonials"><TestimonialsSection /></ShowSection>
      <ShowSection page="home" section="insights"><InsightsPreview /></ShowSection>
      <ShowSection page="home" section="cta"><FinalCTA /></ShowSection>
    </>
  );
}
