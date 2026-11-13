import { services } from "./services";

export interface NavLink {
  label: string;
  href: string;
}

export const mainNav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Solutions", href: "/solutions" },
  { label: "Industries", href: "/industries" },
  { label: "About", href: "/about" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/contact" },
];

export type ServiceLink = { label: string; href: string; description: string };

export const serviceNav = services.map((s) => ({
  label: s.title,
  href: s.href,
  description: s.menuDescription,
  icon: s.icon,
}));

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Our Process", href: "/process" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "All Services", href: "/services" },
      { label: "Custom Solutions", href: "/solutions" },
      { label: "Industries", href: "/industries" },
      { label: "Work", href: "/work" },
      { label: "Insights", href: "/insights" },
      { label: "FAQ", href: "/faq" },
    ],
  },
];

export const legalNav: NavLink[] = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms and Conditions", href: "/terms" },
  { label: "Cookie Policy", href: "/cookie-policy" },
];

/** Returns true when `href` should be shown as active for `pathname`. */
export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
