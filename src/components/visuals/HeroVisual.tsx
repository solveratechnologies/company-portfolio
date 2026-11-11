import Image from "next/image";
import { cn } from "@/lib/utils";

/** Laptop + phone dashboard artwork (transparent PNG: the supplied image with only its black backdrop removed; over black it is pixel-identical to the original). */
export function HeroVisual({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full max-w-[860px] shrink-0 lg:-mr-6 lg:w-[122%] lg:max-w-none lg:translate-y-2 xl:-mr-28", className)}>
      <Image
        src="/images/hero/dashboard-devices-final.png"
        alt="Solvera dashboard shown on a laptop and a phone"
        width={1024}
        height={576}
        // LCP image at every viewport: preload it. Served through the Next.js optimizer (resized + AVIF/WebP, alpha kept).
        preload
        sizes="(min-width: 1024px) 66vw, 100vw"
        className="h-auto w-full"
      />
    </div>
  );
}
