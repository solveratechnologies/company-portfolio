import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function FinalCTA({
  title = "Let's Build Something That Moves Your Business Forward.",
  description = "Tell us what you are trying to achieve. We'll help you identify the right next step.",
  primary = { label: "Book a free demo", href: "/contact" },
  secondary = { label: "Explore Services", href: "/services" },
  eyebrow = "Next step",
}: {
  title?: string;
  description?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string } | null;
  eyebrow?: string;
}) {
  return (
    <section aria-labelledby="final-cta-title" data-animate-section className="bg-canvas py-6 md:py-10">
      <Container size="wide">
        <div data-reveal className="on-dark relative isolate overflow-hidden rounded-[2rem] bg-ink px-6 py-16 text-white sm:px-12 md:py-24">
          <div aria-hidden className="bg-grid-dark mask-radial absolute inset-0 -z-10" />
          <div aria-hidden className="absolute left-1/2 top-full -z-10 size-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/35 blur-[120px]" />
          <svg aria-hidden viewBox="0 0 800 200" className="absolute inset-x-0 bottom-0 -z-10 h-40 w-full opacity-40" preserveAspectRatio="none">
            <path d="M0 160 C 200 160, 220 60, 400 60 S 600 160, 800 120" fill="none" stroke="#f27222" strokeWidth="1" strokeDasharray="3 7" />
          </svg>
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            <Eyebrow tone="dark">{eyebrow}</Eyebrow>
            <h2 id="final-cta-title" className="text-heading font-semibold text-balance">
              {title}
            </h2>
            <p className="max-w-xl text-lead text-white/70">{description}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <ButtonLink href={primary.href} size="lg" arrow>
                {primary.label}
              </ButtonLink>
              {secondary && (
                <ButtonLink href={secondary.href} size="lg" variant="outline-light">
                  {secondary.label}
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
