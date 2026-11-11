import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { HeroVisual } from "@/components/visuals/HeroVisual";
import { getContent } from "@/content";
import { isSectionEnabled } from "@/config/sections";
import { CapabilityStrip } from "@/components/sections/CapabilityStrip";

export async function HeroSection() {
  const { services } = await getContent();
  return (
    <section aria-labelledby="hero-title" data-hero className="relative isolate overflow-hidden bg-hero text-ink">
      <div aria-hidden className="bg-grid-light absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_78%,transparent)]" />
      <div aria-hidden className="absolute -right-48 -top-48 -z-10 size-[760px] rounded-full bg-brand/30 blur-[150px]" />
      <div aria-hidden className="absolute -bottom-64 -left-40 -z-10 size-[560px] rounded-full bg-brand/15 blur-[150px]" />

      <Container size="wide" className="grid items-center gap-10 pb-10 pt-32 md:pt-40 lg:min-h-[min(820px,100svh)] lg:grid-cols-[0.82fr_1.18fr] lg:gap-6 lg:pb-14">
        <div className="relative z-10 flex flex-col gap-7">
          <div className="enter" style={{ "--i": 0 } as CSSProperties}>
            <Eyebrow>Strategy · Technology · Growth</Eyebrow>
          </div>
          <h1
            id="hero-title"
            className="enter text-[clamp(2.65rem,4.6vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.038em]"
            style={{ "--i": 1 } as CSSProperties}
          >
            <span className="block">Build Smarter.</span>
            <span className="block">Work Faster.</span>
            <span className="block text-brand-600">Grow Further.</span>
          </h1>
          <p className="enter max-w-xl text-lead text-muted" style={{ "--i": 2 } as CSSProperties}>
            We design and build mobile apps, web platforms, AI tools and automated workflows for growing businesses. Then we help you market them, so your technology brings in customers and saves your team time.
          </p>
          <div className="enter flex flex-wrap gap-3 pt-1" style={{ "--i": 3 } as CSSProperties}>
            <ButtonLink href="/contact" size="lg" arrow>
              Start a Project
            </ButtonLink>
            <ButtonLink href="/services" size="lg" variant="secondary">
              Explore Our Services
            </ButtonLink>
          </div>
        </div>
        <div className="enter flex w-full justify-center lg:justify-end" style={{ "--i": 2 } as CSSProperties}>
          <HeroVisual />
        </div>
      </Container>
      {isSectionEnabled("home", "capabilities") ? <CapabilityStrip services={services} /> : null}
    </section>
  );
}
