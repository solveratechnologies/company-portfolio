import { pageMetadata } from "@/lib/seo";
import { legalStatus, fact } from "@/config/legal";
import { LegalPage } from "@/components/ui/LegalPage";

const status = legalStatus("cookie");

export const metadata = pageMetadata({
  title: "Cookie Policy",
  description: "Information about cookies and similar technologies used on the Solvera Technologies website.",
  path: "/cookie-policy",
  // Unfinished legal pages stay out of search results until the owner supplies the facts (src/config/legal.ts).
  noIndex: !status.ready,
});

export default function CookiePolicyPage() {
  const { facts } = status;
  return (
    <LegalPage
      title="Cookie Policy"
      href="/cookie-policy"
      ready={status.ready}
      intro="What cookies are, which ones this website uses, and how you can control them."
      sections={[
        { title: "What cookies are", paragraphs: ["Cookies are small text files stored by your browser. Similar technologies include local storage and tracking pixels."] },
        {
          title: "Cookies this website uses",
          paragraphs: [
            "In its current configuration, the website's own code does not set cookies and does not use browser local storage or session storage. It does not use analytics, advertising or tracking technologies. Hosting and network providers may use strictly necessary technical mechanisms to deliver and protect the website.",
          ],
        },
        { title: "Analytics and advertising", paragraphs: ["If analytics or advertising tools (for example, Google Analytics or ad platform tags) are added in future, this policy will be updated to list them, and consent will be requested where the law requires it before they are activated."] },
        { title: "Managing cookies", paragraphs: ["You can block or delete cookies in your browser settings. Blocking strictly necessary technical mechanisms may affect how parts of the website work."] },
        { title: "Contact", paragraphs: [`Questions about this policy can be sent through the contact page. Effective date: ${fact(facts.effectiveDate, "effective date to be added")}.`] },
      ]}
    />
  );
}
