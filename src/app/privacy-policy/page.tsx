import { pageMetadata } from "@/lib/seo";
import { legalStatus, fact } from "@/config/legal";
import { LegalPage } from "@/components/ui/LegalPage";
import { privacySections, PRIVACY_SITE_URL } from "@/data/privacy-policy";

const status = legalStatus("privacy");

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How Solvera Technologies collects, uses, stores, discloses and protects personal information when you use our website or work with us.",
  path: "/privacy-policy",
  // An unfinished legal page stays out of search results until its facts are supplied and reviewed (src/config/legal.ts).
  noIndex: !status.ready,
});

export default function PrivacyPolicyPage() {
  const { facts, ready } = status;
  return (
    <LegalPage
      title="Privacy Policy"
      href="/privacy-policy"
      ready={ready}
      intro="How Solvera Technologies collects, uses, stores, discloses and protects personal information."
      meta={[
        { label: "Effective date", value: fact(facts.effectiveDate, "effective date to be added") },
        { label: "Last updated", value: fact(facts.lastUpdated, "revision date to be added") },
        { label: "Website", value: `[${PRIVACY_SITE_URL}](${PRIVACY_SITE_URL})` },
      ]}
      sections={privacySections(facts)}
      closing={["**© 2026 Solvera Technologies. All Rights Reserved.**", "End of Global Privacy Policy."]}
    />
  );
}
