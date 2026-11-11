"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { ProcessPhase } from "@/data/process";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/** Horizontal timeline on desktop, vertical on mobile. Scroll moves the focus from 01 to 04. */
export function ProcessTimeline({ phases }: { phases: ProcessPhase[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);
  const [motion, setMotion] = useState(true);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 1024px)");
    const root = document.documentElement;
    const lastIndex = phases.length - 1;
    let locked = false;
    let index = 0;
    let lockY = 0;
    let acc = 0;
    let lastScroll = window.scrollY;
    let suppress: "down" | "up" | null = null;
    let writing = false;
    let wheeledAt = 0;
    let ignoreDriftUntil = 0;
    let acceptWheelAt = 0;
    const threshold = 50;
    const escape = 200;

    const centerOffset = () => {
      const rect = track.getBoundingClientRect();
      return rect.top + rect.height / 2 - window.innerHeight / 2;
    };

    const writeScroll = (y: number) => {
      const maxY = Math.max(0, root.scrollHeight - window.innerHeight);
      const next = Math.min(Math.max(0, y), maxY);
      lastScroll = next;
      if (Math.abs(window.scrollY - next) <= 1) return;
      writing = true;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, next);
      writing = false;
    };

    const pin = (fromBelow: boolean) => {
      if (locked) return;
      const rect = track.getBoundingClientRect();
      lockY = window.scrollY + rect.top - (window.innerHeight - rect.height) / 2;
      locked = true;
      acc = 0;
      ignoreDriftUntil = performance.now() + 120;
      acceptWheelAt = performance.now() + 50;
      index = fromBelow ? lastIndex : 0;
      root.style.scrollBehavior = "auto";
      setMotion(true);
      setActive(index);
      writeScroll(lockY);
    };

    const release = (direction: "down" | "up") => {
      locked = false;
      suppress = direction;
      acc = 0;
      writeScroll(lockY + (direction === "down" ? escape : -escape));
      requestAnimationFrame(() => {
        if (!locked) root.style.scrollBehavior = "";
      });
    };

    const stepBy = (delta: number) => {
      if (!locked || delta === 0) return;
      acc += delta;
      if (acc >= threshold) {
        acc = 0;
        if (index >= lastIndex) {
          release("down");
          return;
        }
        index += 1;
        setActive(index);
      } else if (acc <= -threshold) {
        acc = 0;
        if (index <= 0) {
          release("up");
          return;
        }
        index -= 1;
        setActive(index);
      }
      if (locked) writeScroll(lockY);
    };

    const wheelDelta = (event: WheelEvent) => {
      if (event.deltaMode === 1 || event.deltaMode === 2) return Math.sign(event.deltaY) * threshold;
      let delta = event.deltaY;
      if (delta === 0) {
        const legacy = (event as WheelEvent & { wheelDelta?: number }).wheelDelta ?? 0;
        if (legacy) delta = -legacy;
      }
      if (Math.abs(delta) >= 40) return Math.sign(delta) * threshold;
      return delta;
    };

    const onWheel = (event: WheelEvent) => {
      if (!wide.matches || reduced.matches) return;
      const delta = wheelDelta(event);
      if (delta === 0) return;
      const offset = centerOffset();

      if (!locked) {
        if (suppress === "down") {
          if (delta < 0 || offset < -escape) suppress = null;
          else return;
        } else if (suppress === "up") {
          if (delta > 0 || offset > escape) suppress = null;
          else return;
        }
        const scrollingDown = delta > 0;
        if ((scrollingDown && offset <= 90 && offset >= -40) || (!scrollingDown && offset >= -90 && offset <= 40)) {
          event.preventDefault();
          wheeledAt = performance.now();
          pin(!scrollingDown);
        }
        return;
      }

      event.preventDefault();
      wheeledAt = performance.now();
      if (performance.now() < acceptWheelAt) return;
      stepBy(delta);
    };

    let touchY = 0;
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!wide.matches || reduced.matches) return;
      const y = event.touches[0]?.clientY ?? touchY;
      const delta = touchY - y;
      touchY = y;
      if (delta === 0) return;
      if (!locked) {
        const offset = centerOffset();
        if ((delta > 0 && offset <= 90 && offset >= -40) || (delta < 0 && offset >= -90 && offset <= 40)) {
          event.preventDefault();
          wheeledAt = performance.now();
          pin(delta < 0);
        }
        return;
      }
      event.preventDefault();
      wheeledAt = performance.now();
      stepBy(Math.abs(delta) >= 40 ? Math.sign(delta) * threshold : delta);
    };

    const applyMobile = () => {
      if (reduced.matches) {
        setMotion(false);
        return;
      }
      setMotion(true);
      const rect = track.getBoundingClientRect();
      if (rect.bottom < 72 || rect.top > window.innerHeight - 72) {
        setActive(-1);
        return;
      }
      const items = [...track.querySelectorAll<HTMLElement>("[data-process-step]")];
      const midpoint = window.innerHeight / 2;
      let nearest = Infinity;
      let next = 0;
      items.forEach((item, itemIndex) => {
        const box = item.getBoundingClientRect();
        const delta = Math.abs(box.top + box.height / 2 - midpoint);
        if (delta < nearest) {
          nearest = delta;
          next = itemIndex;
        }
      });
      setActive(next);
    };

    const onScroll = () => {
      if (!wide.matches) {
        applyMobile();
        return;
      }
      if (writing) return;
      if (reduced.matches) {
        setMotion(false);
        return;
      }
      setMotion(true);
      const offset = centerOffset();
      if (locked) {
        const drift = window.scrollY - lockY;
        if (Math.abs(drift) > 1) {
          const fromWheel = performance.now() < ignoreDriftUntil || performance.now() - wheeledAt < 120;
          if (!fromWheel && Math.abs(drift) > 2) stepBy(drift);
          if (locked) writeScroll(lockY);
        }
        if (locked) lastScroll = lockY;
        return;
      }
      if (suppress === "down" && (offset < -escape || window.scrollY < lastScroll)) suppress = null;
      if (suppress === "up" && (offset > escape || window.scrollY > lastScroll)) suppress = null;
      if (suppress) {
        lastScroll = window.scrollY;
        return;
      }
      const scrollingDown = window.scrollY >= lastScroll;
      lastScroll = window.scrollY;
      if (scrollingDown && offset <= 100 && offset >= -40) pin(false);
      else if (!scrollingDown && offset >= -100 && offset <= 40) pin(true);
      else if (offset > 100) setActive((current) => (current === -1 ? current : -1));
    };

    const onKey = (event: KeyboardEvent) => {
      if (!wide.matches || !locked || reduced.matches) return;
      const down = event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ";
      const up = event.key === "ArrowUp" || event.key === "PageUp";
      if (!down && !up) return;
      const target = event.target;
      if (event.key === " " && target instanceof HTMLElement && target !== document.body && target !== root) return;
      event.preventDefault();
      stepBy(down ? threshold : -threshold);
    };

    const onMode = () => {
      locked = false;
      root.style.scrollBehavior = "";
      onScroll();
    };

    onScroll();
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    reduced.addEventListener("change", onScroll);
    wide.addEventListener("change", onMode);
    return () => {
      root.style.scrollBehavior = "";
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("scroll", onScroll);
      reduced.removeEventListener("change", onScroll);
      wide.removeEventListener("change", onMode);
    };
  }, [phases.length]);

  const focus = motion ? active : -1;
  const line = focus < 0 ? 100 : (focus / Math.max(1, phases.length - 1)) * 100;

  return (
    <Section labelledBy="process-title">
      <Container>
        <div ref={trackRef}>
          <SectionHeading
            eyebrow="Our process"
            id="process-title"
            title="From First Conversation to Continuous Improvement."
            description="A structured, transparent process, so you always know what's happening, what we need from you, and what comes next."
            action={
              <ButtonLink href="/process" variant="secondary" arrow>
                See How We Work
              </ButtonLink>
            }
          />
          <ol className="relative mt-16 grid gap-0 lg:grid-cols-4 lg:gap-6">
            <div aria-hidden className="absolute left-5 right-5 top-[1.35rem] hidden h-0.5 lg:block">
              <div className="absolute inset-0 rounded-full bg-line" />
              <div className="absolute inset-y-0 left-0 rounded-full bg-brand transition-[width] duration-300" style={{ width: `${line}%` }} />
            </div>
            {phases.map((phase, i) => {
              const on = focus < 0 || i === focus;
              return (
                <li
                  key={phase.number}
                  data-process-step
                  className={cn(
                    "relative flex gap-5 pb-10 transition-[opacity,transform] duration-300 lg:flex-col lg:gap-0 lg:pb-0",
                    on ? "opacity-100" : "opacity-40",
                  )}
                >
                  {i < phases.length - 1 && <span aria-hidden className="absolute bottom-0 left-[1.4rem] top-12 w-px bg-line lg:hidden" />}
                  <span
                    className={cn(
                      "relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full border font-mono text-sm font-medium shadow-[0_0_0_6px_var(--color-canvas)] transition-[background-color,border-color,color,transform,box-shadow] duration-300",
                      on
                        ? "scale-110 border-brand bg-brand text-ink shadow-[0_0_0_6px_var(--color-canvas),0_0_0_10px_rgb(242_114_34/0.22)]"
                        : "border-line bg-white text-muted",
                    )}
                  >
                    {phase.number}
                  </span>
                  <div className="lg:mt-7">
                    <h3 className={cn("text-card font-semibold", on ? "text-ink" : "text-muted")}>{phase.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted">{phase.summary}</p>
                    <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={`${phase.title} deliverables`}>
                      {phase.deliverables.map((item) => (
                        <li key={item} className="rounded-full bg-paper px-2.5 py-1 text-xs text-ink/75 ring-1 ring-line">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
