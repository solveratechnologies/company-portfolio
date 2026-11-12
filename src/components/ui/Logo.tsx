import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO = {
  // Dark wordmark for light backgrounds, white wordmark for dark backgrounds. Same artwork, orange accents unchanged.
  dark: "/images/logo/solvera-logo.png",
  light: "/images/logo/solvera-logo-light.png",
} as const;

export function Logo({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <Image
      src={LOGO[tone]}
      alt="Solvera Technologies"
      width={800}
      height={284}
      sizes="160px"
      className={cn("h-11 w-auto select-none", className)}
    />
  );
}
