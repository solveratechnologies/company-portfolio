"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Where a section counts as "current": once its top has passed this fraction of the viewport height. */
const READ_LINE = 0.3;

/**
 * Contents list that highlights the section currently on screen. Rendered markup is identical on the server
 * and the first client render (nothing active), so it stays hydration-safe and works as plain anchor links
 * without JavaScript.
 */
export function LegalToc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * READ_LINE;
      let current: string | null = null;
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = id;
        else break;
      }
      // Above the first section (hero, details box): nothing is highlighted.
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  // Keep the highlighted entry visible inside the (scrollable) sidebar without moving the page itself.
  useEffect(() => {
    const list = listRef.current;
    const nav = list?.closest("nav");
    const link = active ? list?.querySelector<HTMLElement>(`a[href="#${CSS.escape(active)}"]`) : null;
    if (!nav || !link || nav.scrollHeight <= nav.clientHeight) return;
    // Position of the link inside the nav's scrollable content, independent of the page scroll or sticky offset.
    const top = link.getBoundingClientRect().top - nav.getBoundingClientRect().top + nav.scrollTop;
    if (top < nav.scrollTop + 24 || top + link.offsetHeight > nav.scrollTop + nav.clientHeight - 24) {
      nav.scrollTo({ top: top - nav.clientHeight / 2, behavior: "smooth" });
    }
  }, [active]);

  return (
    <ol ref={listRef} className="mt-3 flex flex-col gap-1.5 text-sm">
      {items.map(({ id, label }) => {
        const isActive = id === active;
        return (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={isActive ? "location" : undefined}
              className={cn(
                "block rounded-md border-l-2 py-0.5 pl-3 transition-colors",
                isActive ? "border-brand bg-brand/10 font-medium text-ink" : "border-transparent text-muted hover:text-ink",
              )}
            >
              {label}
            </a>
          </li>
        );
      })}
    </ol>
  );
}
