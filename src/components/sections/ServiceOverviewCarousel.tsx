"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { services as iconServices } from "@/data/services";
import type { Service } from "@/types/service";
import { cn } from "@/lib/utils";

export type ServiceSlide = Pick<Service, "slug" | "title" | "href" | "summary" | "accent"> & {
  offerings: { title: string }[];
};

const INTERVAL = 2000;

function CardFace({ service, index, featured }: { service: ServiceSlide; index: number; featured: boolean }) {
  const Icon = iconServices.find((item) => item.slug === service.slug)?.icon ?? iconServices[0].icon;
  const mint = service.accent === "mint";
  return (
    <>
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-xl",
            featured
              ? mint
                ? "bg-mint text-ink"
                : "bg-brand text-ink"
              : mint
                ? "bg-mint-50 text-[#1f7a58]"
                : "bg-brand-50 text-brand",
          )}
        >
          <Icon aria-hidden className="size-5" />
        </span>
        <span className="font-mono text-xs text-muted">0{index + 1}</span>
      </div>
      <h3 className="mt-6 text-card font-semibold text-ink">{service.title}</h3>
      <p className="mt-3 leading-relaxed text-muted">{service.summary}</p>
      <ul className="mt-5 flex flex-wrap gap-1.5">
        {service.offerings.map((item) => (
          <li key={item.title} className="rounded-full border border-line px-2.5 py-1 text-xs text-ink/70">
            {item.title}
          </li>
        ))}
      </ul>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-brand-ink">
        Learn More
        <span className="sr-only"> about {service.title}</span>
        <ArrowRight aria-hidden className="size-4" />
      </span>
    </>
  );
}

function CardShell({
  featured,
  children,
  onSelect,
  href,
}: {
  featured: boolean;
  children: ReactNode;
  onSelect: () => void;
  href: string;
}) {
  const className = cn(
    "flex min-h-[480px] w-full flex-col rounded-[var(--radius-card)] border bg-white p-7 text-left sm:min-h-[520px] sm:p-8",
    featured
      ? "border-white shadow-[0_28px_60px_-28px_rgb(16_24_32/0.45)]"
      : "border-line shadow-[0_10px_30px_-24px_rgb(16_24_32/0.35)]",
  );
  if (featured) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onSelect} className={className}>
      {children}
    </button>
  );
}

function scaleFor(place: number) {
  const distance = Math.abs(place);
  if (distance === 0) return 1.04;
  if (distance === 1) return 0.97;
  return 0.92;
}

/** Shortest signed circular distance from the cursor to a card, so the loop never needs a "teleport". */
function placeOf(index: number, cursor: number, total: number) {
  let place = (((index - cursor) % total) + total) % total;
  if (place > total / 2) place -= total;
  return place;
}

export function ServiceOverviewCarousel({ services }: { services: ServiceSlide[] }) {
  const total = services.length;
  const labelId = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState(0);
  // Temporary pause while the pointer is over the carousel or focus is inside it.
  const [interacting, setInteracting] = useState(false);
  // Persistent pause chosen with the Pause/Play button (WCAG 2.2.2).
  const [userPaused, setUserPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [reduce, setReduce] = useState(false);
  const [stageW, setStageW] = useState(1440);
  const active = ((cursor % total) + total) % total;
  // With prefers-reduced-motion the carousel never auto-rotates and slides do not animate.
  const rotating = !reduce && !userPaused && !interacting;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(motion.matches);
    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => setStageW(stage.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const id = window.setInterval(() => setCursor((current) => current + 1), INTERVAL);
    return () => window.clearInterval(id);
  }, [rotating, timer]);

  function go(direction: number) {
    setCursor((current) => current + direction);
    setTimer((current) => current + 1);
  }

  const visibleCount = stageW >= 720 ? 3 : 1;
  const reach = (visibleCount - 1) / 2;
  const edge = 20;
  const cardW = reach === 0 ? Math.min(480, stageW - 40) : Math.min(460, (stageW - edge * 2) / (visibleCount * 0.74));
  const step = reach === 0 ? 0 : (stageW / 2 - (cardW * scaleFor(reach)) / 2 - edge) / reach;

  return (
    <div
      className="mt-6"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocus={() => setInteracting(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false);
      }}
    >
      <div className="flex justify-end">
        <div className="inline-flex overflow-hidden rounded-full border border-line bg-white">
          {!reduce && (
            <button
              type="button"
              aria-label={userPaused ? "Start automatic rotation of services" : "Pause automatic rotation of services"}
              onClick={() => setUserPaused((current) => !current)}
              className="flex size-11 items-center justify-center border-r border-line text-ink/70 transition-colors hover:bg-paper hover:text-ink"
            >
              {userPaused ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}
            </button>
          )}
          <button
            type="button"
            aria-label="Previous service"
            onClick={() => go(-1)}
            className="flex size-11 items-center justify-center text-ink/70 transition-colors hover:bg-paper hover:text-ink"
          >
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next service"
            onClick={() => go(1)}
            className="flex size-11 items-center justify-center border-l border-line text-ink/70 transition-colors hover:bg-paper hover:text-ink"
          >
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        role="region"
        aria-roledescription="carousel"
        aria-labelledby={labelId}
        className="relative mt-3 h-[690px] overflow-hidden min-[360px]:h-[640px] sm:h-[560px]"
      >
        {/* Announce slide changes only when the user is stepping manually; stay silent while auto-rotating. */}
        <p id={labelId} aria-live={rotating ? "off" : "polite"} aria-atomic className="sr-only">
          Services. Showing {services[active]?.title}.
        </p>
        <ul className="absolute inset-0">
          {services.map((service, index) => {
            const place = placeOf(index, cursor, total);
            if (Math.abs(place) > reach + 1) return null;
            const featured = place === 0;
            const visible = Math.abs(place) <= reach;
            const scale = scaleFor(place);
            return (
              <li
                key={service.slug}
                aria-hidden={!featured}
                className="absolute top-1/2 left-1/2"
                style={{
                  width: cardW,
                  transform: `translate(-50%, -50%) translateX(${place * step}px) translateY(${featured ? -10 : 0}px) scale(${scale})`,
                  zIndex: featured ? 30 : 20 - Math.abs(place),
                  opacity: visible ? 1 : 0,
                  transition: reduce ? "none" : "transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 700ms ease",
                  pointerEvents: visible ? "auto" : "none",
                }}
              >
                <CardShell featured={featured} href={service.href} onSelect={() => go(place)}>
                  <CardFace service={service} index={index} featured={featured} />
                </CardShell>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
