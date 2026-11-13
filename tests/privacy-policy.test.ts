import { describe, expect, it } from "vitest";
import { OWNER_FACTS, readLegalFacts } from "@/config/legal";
import { privacySections } from "@/data/privacy-policy";
import type { LegalBlock, LegalSection } from "@/components/ui/LegalPage";

const blockText = (b: LegalBlock): string[] =>
  b.type === "p" || b.type === "h3" ? [b.text] : b.type === "list" || b.type === "olist" ? b.items : [...b.head, ...b.rows.flat()];
const allText = (sections: LegalSection[]) => sections.flatMap((s) => [s.title, ...(s.blocks ?? []).flatMap(blockText)]).join("\n");

describe("privacy policy content", () => {
  const sections = privacySections(readLegalFacts({} as NodeJS.ProcessEnv));
  const text = allText(sections);

  it("has the 31 numbered sections in order, so the policy's own cross-references (Sections 5, 7, 14, 16, 18) stay correct", () => {
    expect(sections).toHaveLength(31);
    const title = (n: number) => sections[n - 1].title;
    expect(title(1)).toBe("Introduction");
    expect(title(2)).toBe("Identity and Contact Information");
    expect(title(5)).toBe("Categories of Personal Information We Collect");
    expect(title(7)).toBe("Purposes and Legal Bases for Processing");
    expect(title(14)).toBe("Disclosure and Sharing of Personal Information");
    expect(title(16)).toBe("International Data Transfers");
    expect(title(18)).toBe("Retention and Deletion of Personal Information");
    expect(title(20)).toBe("Additional Rights — European Union and European Economic Area");
    expect(title(31)).toBe("Contact and Complaints");
    expect(new Set(sections.map((s) => s.title)).size).toBe(31);
  });

  it("is filled with the owner's facts and leaves no visible placeholder behind", () => {
    expect(text).toContain("Solvera Technologies");
    expect(text).toContain("Rawalpindi, Pakistan");
    expect(text).toContain("info@solveratechnologies.com");
    expect(text).toContain("+92 325 5580945");
    expect(text).toContain("https://solveratechnologies.com/");
    expect(text).toContain("**Primary operating country:** Pakistan");
    expect(text).not.toMatch(/\[[^\]]*to be (completed|added|confirmed)\]/);
    expect(text).not.toMatch(/\[(Publication Date|Revision Date|Full Legal Name|Complete Address|Business Email|Privacy Email|Verified|Approved|Configured|Confirm|Insert|Publish|Name or Position)/);
  });

  it("states the owner's actual advertising, sale/sharing and sensitive-data practices", () => {
    expect(text).toContain(`**Actual advertising practices:** ${OWNER_FACTS.advertisingStatement}`);
    expect(text).toContain(`**Actual sale/sharing status:** ${OWNER_FACTS.saleSharingStatement}`);
    expect(text).toContain(`**Sensitive personal information practices:** ${OWNER_FACTS.sensitiveStatement}`);
  });

  it("builds the retention table from the owner's retention periods", () => {
    const table = sections[17].blocks!.find((b) => b.type === "table");
    expect(table?.type).toBe("table");
    if (table?.type !== "table") return;
    expect(table.rows).toHaveLength(10);
    const rows = Object.fromEntries(table.rows.map(([k, v]) => [k, v]));
    expect(rows["General inquiries"]).toBe(OWNER_FACTS.retentionInquiries);
    expect(rows["Prospective-client information"]).toBe(OWNER_FACTS.retentionProspects);
    expect(rows["Client contracts and project records"]).toBe(`${OWNER_FACTS.retentionClients} after the engagement ends`);
    expect(rows["Marketing contacts"]).toBe(`Until opt-out or ${OWNER_FACTS.retentionMarketing}, subject to lawful suppression records`);
    expect(rows["Recruitment information"]).toBe(`${OWNER_FACTS.retentionRecruitment} after the recruitment decision`);
    expect(rows["Website and security logs"]).toBe(OWNER_FACTS.retentionLogs);
    expect(rows["Analytics information"]).toBe(OWNER_FACTS.retentionAnalytics);
    expect(rows["Call recordings and transcripts"]).toBe(OWNER_FACTS.retentionRecordings);
    expect(rows["Accounting and tax documentation"]).toBe("Applicable legal retention period");
    expect(rows["Client-controlled data"]).toBe("Contractual instructions and applicable DPA");
  });

  it("leaves out the lines the owner chose not to publish", () => {
    expect(text).not.toMatch(/Privacy Responsible Person|Cookie inventory|Cookie preference interface|Other processing or hosting countries|opt-out link/);
    expect(text).not.toMatch(/EU Representative, if required|UK Representative, if required|Data Protection Officer, if required|UK Data Protection Contact/);
  });

  it("shows the EU/UK representative and DPO lines when one is appointed", () => {
    const withReps = allText(privacySections({ ...OWNER_FACTS, euRepresentative: "Acme EU GmbH", dpo: "Jane Doe, dpo@example.com" }));
    expect(withReps).toContain("**EU Representative, if required:** Acme EU GmbH");
    expect(withReps).toContain("**Data Protection Officer, if required:** Jane Doe, dpo@example.com");
    expect(withReps).not.toContain("UK Representative, if required");
  });

  it("leaves out the phone lines when no number is published, and shows a visible placeholder for a missing required fact", () => {
    expect(allText(privacySections({ ...OWNER_FACTS, phone: undefined }))).not.toContain("**Telephone:**");
    expect(allText(privacySections({ ...OWNER_FACTS, privacyEmail: undefined }))).toContain("[privacy email to be completed]");
    expect(allText(privacySections({ ...OWNER_FACTS, retentionLogs: undefined }))).toContain("[retention period to be confirmed]");
  });
});
