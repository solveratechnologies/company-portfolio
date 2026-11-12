"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { mainNav, serviceNav, isActivePath, type ServiceLink } from "@/data/navigation";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";

export function MobileNavigation({ pathname, services }: { pathname: string; services: ServiceLink[] }) {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const menuId = useId();
  const servicesId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close after navigation
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      // Keep focus within the toggle + panel while open.
      const focusables = [
        toggleRef.current!,
        ...Array.from(panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")),
      ].filter((el) => el.offsetParent !== null || el === toggleRef.current);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 70rem)").matches) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const linkClass = (active: boolean) =>
    cn(
      "flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-lg font-medium transition-colors",
      active ? "bg-nav text-ink" : "text-ink/75 hover:bg-white/60 hover:text-ink",
    );

  const [home, ...rest] = mainNav;

  return (
    <div className="nav:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
        className="relative z-[51] flex size-11 items-center justify-center rounded-full border border-line bg-canvas/80 text-ink transition-colors hover:border-brand/40 hover:text-brand-ink"
      >
        {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
      </button>

      <div
        id={menuId}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={cn(
          "fixed inset-x-0 bottom-0 top-[4.5rem] z-50 overflow-y-auto bg-canvas transition-[opacity,visibility,transform] duration-300 ease-out",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
        )}
      >
        <nav aria-label="Mobile" className="mx-auto flex min-h-full max-w-xl flex-col px-5 pb-10 pt-4">
          <ul className="flex flex-col gap-1">
            <li>
              <Link href={home.href} className={linkClass(isActivePath(pathname, home.href))} aria-current={pathname === "/" ? "page" : undefined}>
                {home.label}
              </Link>
            </li>
            <li>
              <button
                type="button"
                aria-expanded={servicesOpen}
                aria-controls={servicesId}
                onClick={() => setServicesOpen((o) => !o)}
                className={linkClass(pathname.startsWith("/services"))}
              >
                Services
                <ChevronDown aria-hidden className={cn("size-5 transition-transform duration-200", servicesOpen && "rotate-180")} />
              </button>
              <ul id={servicesId} hidden={!servicesOpen} className="mb-2 ml-4 mt-1 flex flex-col gap-0.5 border-l border-line pl-3">
                {services.map(({ href, label }) => {
                  const Icon = serviceNav.find((item) => item.href === href)?.icon ?? serviceNav[0].icon;
                  return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={pathname === href ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-base transition-colors",
                        pathname === href ? "bg-nav text-ink" : "text-ink/70 hover:text-ink",
                      )}
                    >
                      <Icon aria-hidden className="size-4 text-brand" />
                      {label}
                    </Link>
                  </li>
                  );
                })}
                <li>
                  <Link href="/services" className="flex rounded-lg px-3 py-3 text-base text-ink/70 hover:text-ink">
                    All services
                  </Link>
                </li>
              </ul>
            </li>
            {rest.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass(active)} aria-current={active ? "page" : undefined}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto pt-8">
            <ButtonLink href="/contact" size="lg" arrow className="w-full">
              Book a free demo
            </ButtonLink>
          </div>
        </nav>
      </div>
    </div>
  );
}
