"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import type { ServiceLink } from "@/data/navigation";
import { DesktopNavigation } from "./DesktopNavigation";
import { MobileNavigation } from "./MobileNavigation";

/** True while the page's hero (`[data-hero]`) still extends below the header. Read straight from the DOM. */
function readOnHero() {
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  if (!hero) return false;
  const edge = document.querySelector("header")?.offsetHeight ?? 72;
  return hero.getBoundingClientRect().bottom > edge;
}

export function Header({ services }: { services: ServiceLink[] }) {
  const pathname = usePathname();

  // Scroll position and layout are external state, so subscribe to them instead of mirroring them
  // into React state from an effect. The server render and hydration assume "on hero" (as before).
  // `pathname` is a dependency on purpose: navigating swaps the hero element, so we re-subscribe and
  // React re-reads the snapshot for the new page.
  const subscribe = useCallback(
    (notify: () => void) => {
      void pathname;
      window.addEventListener("scroll", notify, { passive: true });
      window.addEventListener("resize", notify);
      return () => {
        window.removeEventListener("scroll", notify);
        window.removeEventListener("resize", notify);
      };
    },
    [pathname],
  );
  const onHero = useSyncExternalStore(subscribe, readOnHero, () => true);

  return (
    <header
      className="header-in fixed inset-x-0 top-0 z-50 shadow-[0_24px_50px_-28px_rgb(16_24_32/0.4)] transition-colors duration-300"
      style={{ backgroundColor: onHero ? "#f3d8c4" : "#fff6f0" }}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-[4.5rem] max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="shrink-0 rounded-lg">
          <Logo tone="dark" />
          <span className="sr-only"> — home</span>
        </Link>
        <DesktopNavigation pathname={pathname} services={services} />
        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <ButtonLink href="/contact" variant="primary" arrow>
              Book a free demo
            </ButtonLink>
          </span>
          <MobileNavigation pathname={pathname} services={services} />
        </div>
      </div>
    </header>
  );
}
