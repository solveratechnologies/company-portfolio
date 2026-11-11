import { Briefcase, KeyRound, LineChart, Network } from "lucide-react";
import { ServiceFeatureGrid } from "@/components/services/ServiceFeatureGrid";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const values = [
  { icon: Briefcase, title: "Business-First Thinking", description: "We start with the outcome you need: more enquiries, less admin, clearer data. Then we choose the technology to serve it. If a simpler option will do the job, we'll recommend it." },
  { icon: Network, title: "One Team, Every Discipline", description: "Apps, AI, automation and marketing planned together by one team, so nothing gets lost between agencies and every part works with the others." },
  { icon: LineChart, title: "Built to Be Measured", description: "Every project starts with agreed success measures and ships with the tracking to prove them, so you see results, not just deliverables." },
  { icon: KeyRound, title: "You Own Everything", description: "Clean code, documented workflows and full handover of accounts and access. No lock-in, and your solution stays easy to improve." },
];

export function WhyChooseUs() {
  return (
    <Section labelledBy="why-title">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            eyebrow="Why Solvera"
            id="why-title"
            title="A Better Way to Build Digital Solutions."
            description="Practical thinking, clear communication and work that's built to last."
          />
        </div>
        <ServiceFeatureGrid items={values} columns={2} numbered />
      </Container>
    </Section>
  );
}
