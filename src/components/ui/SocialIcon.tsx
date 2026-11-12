import type { ReactNode } from "react";

type Network = "x" | "facebook" | "instagram" | "linkedin";

/** Maps a profile label from NEXT_PUBLIC_SOCIAL_LINKS ("X", "Twitter", "LinkedIn"...) to a known network. */
export function getNetwork(label: string): Network | null {
  const l = label.trim().toLowerCase();
  if (l === "x" || l.startsWith("twitter") || l.startsWith("x (")) return "x";
  if (l.startsWith("facebook")) return "facebook";
  if (l.startsWith("instagram")) return "instagram";
  if (l.startsWith("linkedin")) return "linkedin";
  return null;
}

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const ICONS: Record<Network, ReactNode> = {
  x: <path fill="currentColor" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />,
  facebook: <path {...STROKE} d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  instagram: (
    <>
      <rect {...STROKE} width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path {...STROKE} d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line {...STROKE} x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </>
  ),
  linkedin: (
    <>
      <path {...STROKE} d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect {...STROKE} width="4" height="12" x="2" y="9" />
      <circle {...STROKE} cx="4" cy="4" r="2" />
    </>
  ),
};

export function SocialIcon({ network, className }: { network: Network; className?: string }) {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 24 24" className={className}>
      {ICONS[network]}
    </svg>
  );
}
