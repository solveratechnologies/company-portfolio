import { pageMetadata } from "@/lib/seo";
import { legalStatus, fact } from "@/config/legal";
import { LegalPage } from "@/components/ui/LegalPage";
import { termsSections, TERMS_SITE_URL } from "@/data/terms";

const status = legalStatus("terms");

export const metadata = pageMetadata({
  title: "Terms and Conditions",
  description: "Terms and Conditions governing the use of the Solvera Technologies website. Paid professional services are governed by separate agreements.",
  path: "/terms",
  // An unfinished legal page stays out of search results until its facts are supplied and reviewed (src/config/legal.ts).
  noIndex: !status.ready,
});

export default function TermsPage() {
  const { facts, ready } = status;
  return (
    <LegalPage
      title="Terms and Conditions"
      href="/terms"
      ready={ready}
      intro="The terms that apply when you use this website. Paid professional services are governed by separate written agreements."
      meta={[
        { label: "Effective date", value: fact(facts.effectiveDate, "effective date to be added") },
        { label: "Last updated", value: fact(facts.lastUpdated, "revision date to be added") },
        { label: "Website", value: `[${TERMS_SITE_URL}](${TERMS_SITE_URL})` },
      ]}
      sections={termsSections(facts)}
      closing={["**© 2026 Solvera Technologies. All Rights Reserved.**", "End of Global Website Terms and Conditions."]}
    />
  );
}
