import type { CSSProperties } from "react";
import { CalendarCheck, Mail, MapPin, MessageSquareText, Phone, SearchCheck } from "lucide-react";
import { pageMetadata, faqJsonLd } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { getContent } from "@/content";
import { ShowSection } from "@/components/ui/ShowSection";
import { PageHero } from "@/components/ui/PageHero";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Accordion } from "@/components/ui/Accordion";
import { JsonLd } from "@/components/ui/JsonLd";
import { ContactForm } from "@/components/forms/ContactForm";
import { BookingCalendar } from "@/components/forms/BookingCalendar";
import { getContactMode } from "@/config/contact-mode";
import Link from "next/link";

export const metadata = pageMetadata({
  title: "Contact — Start a Project",
  description:
    "Tell Solvera Technologies about your project. Share your goals and we'll reply with questions, initial thoughts and a suggested next step.",
  path: "/contact",
});

const steps = [
  { icon: MessageSquareText, title: "We review your inquiry", text: "We read your details carefully and may follow up with a few clarifying questions by email." },
  { icon: CalendarCheck, title: "We have a conversation", text: "A short call to understand goals, constraints and timing — and share initial thoughts." },
  { icon: SearchCheck, title: "You receive a recommendation", text: "A suggested approach and next step. If we're not the right fit, we'll tell you." },
];

export default async function ContactPage() {
  const { services, contactFaqs } = await getContent();
  const { email, phone, address } = siteConfig.contact;
  const hasContact = Boolean(email || phone || address);
  // CONTACT_MODE in .env.local picks which block fills the inquiry slot: the booking calendar (default) or the inquiry form.
  const booking = getContactMode() === "booking";

  return (
    <>
      <JsonLd data={faqJsonLd(contactFaqs)} />
      <ShowSection page="contact" section="hero">
      <PageHero
        breadcrumbs={[{ label: "Contact", href: "/contact" }]}
        eyebrow="Contact"
        title="Tell Us What You're Building."
        description="Whether you have a detailed brief or just a problem you'd like to solve, we'd like to hear about it."
        size="tight"
      />
      </ShowSection>

      <ShowSection page="contact" section="form">
      <Section labelledBy="inquiry-title" spacing="tight">
        <Container className="grid gap-14 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
          {/* 2. Introduction + 4. Service selection guide */}
          <div className="flex flex-col gap-10">
            <div data-reveal>
              <h2 className="text-card font-semibold">{booking ? "What happens after you book" : "What happens after you send an inquiry"}</h2>
              <p className="mt-3 leading-relaxed text-muted">
                {booking
                  ? "Pick the day and the 30-minute time that suits you, then tell us who's booking. Your request goes directly to the team, and we reply by email to confirm the call. There's no obligation, and we only use your details to arrange the call."
                  : "Your message goes directly to the team. We review every inquiry ourselves, then reply by email with questions or a suggested time to talk. There's no obligation, and we only use your details to respond."}
              </p>
            </div>
            <div data-reveal>
              <h2 className="text-card font-semibold">{booking ? "What we can help with" : "Choosing a service"}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {booking
                  ? "Not sure what you need yet? That's fine — here's what we do, and we can talk it through on the call."
                  : "Not sure which to select? Here's a quick guide — or choose “Not sure yet”."}
              </p>
              <ul className="mt-5 flex flex-col gap-3">
                {services.map((s) => {
                  const Icon = s.icon;
                  return (
                    <li key={s.slug} className="flex gap-3 rounded-2xl border border-line p-4">
                      <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />
                      <div>
                        <Link href={s.href} className="font-medium hover:text-brand-ink">
                          {s.title}
                        </Link>
                        <p className="mt-0.5 text-sm text-muted">{s.menuDescription}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* 3. Form */}
          <div id="inquiry" data-reveal className="rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_30px_60px_-40px_rgb(16_24_32/0.35)] sm:p-9">
            <h2 id="inquiry-title" className="text-[1.6rem] font-semibold tracking-tight">
              {booking ? "Book a call" : "Project inquiry"}
            </h2>
            <p className="mt-2 text-muted">
              {booking ? "Choose a date and a time, then tell us who's booking. We'll confirm by email." : "A few details help us prepare a useful first conversation."}
            </p>
            <div className="mt-8">{booking ? <BookingCalendar contactEmail={email} /> : <ContactForm contactEmail={email} />}</div>
          </div>
        </Container>
      </Section>

      {/* 5. What happens next */}
      <Section tone="paper" labelledBy="next-title" spacing="tight">
        <Container>
          <SectionHeading eyebrow="What happens next" id="next-title" title="Three simple steps." />
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} data-reveal style={{ "--i": i } as CSSProperties} className="rounded-[var(--radius-card)] border border-line bg-white p-7">
                <div className="flex items-center justify-between">
                  <Icon aria-hidden className="size-6 text-brand" />
                  <span className="font-mono text-xs text-muted">Step {i + 1}</span>
                </div>
                <h3 className="mt-6 text-card font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>
      </ShowSection>

      <ShowSection page="contact" section="faq">
      <Section labelledBy="contact-faq-title" spacing="tight">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <SectionHeading eyebrow="FAQ" id="contact-faq-title" title="Before you get in touch" description="Project scope, timelines, discovery and next steps." />
          <Accordion items={contactFaqs} />
        </Container>
      </Section>
      </ShowSection>

      {/* 7. Contact details */}
      <Section tone="paper" labelledBy="details-title" spacing="tight">
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <h2 id="details-title" className="text-card font-semibold">
              Other ways to reach us
            </h2>
            {hasContact ? (
              <ul className="flex flex-wrap gap-x-8 gap-y-3 text-ink/80">
                {email && (
                  <li>
                    <a href={`mailto:${email}`} className="inline-flex items-center gap-2 hover:text-brand-ink">
                      <Mail aria-hidden className="size-4 text-brand" /> {email}
                    </a>
                  </li>
                )}
                {phone && (
                  <li>
                    <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-2 hover:text-brand-ink">
                      <Phone aria-hidden className="size-4 text-brand" /> {phone}
                    </a>
                  </li>
                )}
                {address && (
                  <li className="inline-flex items-center gap-2">
                    <MapPin aria-hidden className="size-4 text-brand" /> {address}
                  </li>
                )}
              </ul>
            ) : (
              <p className="max-w-xl text-muted">
                {booking
                  ? "The booking calendar above is the best way to reach us — it goes straight to the team."
                  : "The inquiry form above is the best way to reach us — it goes straight to the team and helps us respond with useful context."}
              </p>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}
