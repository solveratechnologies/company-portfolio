import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { footerNav, legalNav } from "@/data/navigation";
import { getContent } from "@/content";
import { Logo } from "@/components/ui/Logo";
import { SocialIcon, getNetwork } from "@/components/ui/SocialIcon";
import { CurrentYear } from "./CurrentYear";

export async function Footer() {
  const { services } = await getContent();
  const { email, phone, address } = siteConfig.contact;
  const hasContact = Boolean(email || phone || address);

  return (
    <footer data-animate-section className="on-dark relative overflow-hidden bg-ink text-white">
      <div aria-hidden className="bg-grid-dark mask-fade-b pointer-events-none absolute inset-0 opacity-60" />
      <div data-reveal className="relative mx-auto max-w-[1240px] px-5 pb-10 pt-16 sm:px-8 md:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="flex max-w-sm flex-col gap-5">
            <Link href="/" className="w-fit rounded-lg">
              <Logo tone="light" />
          <span className="sr-only"> — home</span>
            </Link>
            <p className="text-[0.95rem] leading-relaxed text-white/65">
              Websites, custom software, practical AI and connected automation — designed to help growing businesses build, connect and grow with technology.
            </p>
            {hasContact ? (
              <ul className="flex flex-col gap-2.5 text-sm text-white/75">
                {email && (
                  <li>
                    <a href={`mailto:${email}`} className="inline-flex items-center gap-2 hover:text-white">
                      <Mail aria-hidden className="size-4 text-brand" /> {email}
                    </a>
                  </li>
                )}
                {phone && (
                  <li>
                    <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-2 hover:text-white">
                      <Phone aria-hidden className="size-4 text-brand" /> {phone}
                    </a>
                  </li>
                )}
                {address && (
                  <li className="inline-flex items-start gap-2">
                    <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" /> {address}
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-white/65">
                Have a project in mind?{" "}
                <Link href="/contact" className="font-medium text-white underline decoration-brand/70 underline-offset-4 hover:decoration-brand">
                  Send us an inquiry
                </Link>
                .
              </p>
            )}
            {siteConfig.social.length > 0 && (
              <ul className="flex flex-wrap gap-2.5" aria-label="Social profiles">
                {siteConfig.social.map((s) => {
                  const network = getNetwork(s.label);
                  return (
                    <li key={s.href}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${s.label} (opens in a new tab)`}
                        className={
                          network
                            ? "inline-flex size-10 items-center justify-center rounded-full border border-white/15 text-white/75 transition-colors hover:border-brand hover:bg-brand/15 hover:text-white"
                            : "inline-flex rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/75 hover:border-white/40 hover:text-white"
                        }
                      >
                        {network ? <SocialIcon network={network} className="size-[1.1rem]" /> : s.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <FooterColumn title="Services" links={services.map(({ title, href }) => ({ label: title, href }))} />
            {footerNav.map((col) => (
              <FooterColumn key={col.title} title={col.title} links={col.links} />
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/55 md:flex-row md:items-center md:justify-between">
          <p>
            © <CurrentYear /> {siteConfig.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalNav.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.16em] text-white/60">{title}</h2>
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-[0.95rem] text-white/75 transition-colors hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
