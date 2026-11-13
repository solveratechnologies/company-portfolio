import { describe, expect, it } from "vitest";
import { OWNER_FACTS, readLegalFacts } from "@/config/legal";
import { termsSections } from "@/data/terms";
import type { LegalBlock, LegalSection } from "@/components/ui/LegalPage";

const blockText = (b: LegalBlock): string[] =>
  b.type === "p" || b.type === "h3" ? [b.text] : b.type === "list" || b.type === "olist" ? b.items : [...b.head, ...b.rows.flat()];
const allText = (sections: LegalSection[]) => sections.flatMap((s) => [s.title, ...(s.blocks ?? []).flatMap(blockText)]).join("\n");

describe("terms and conditions content", () => {
  const sections = termsSections(readLegalFacts({} as NodeJS.ProcessEnv));
  const text = allText(sections);

  it("has the 32 numbered sections in order", () => {
    expect(sections).toHaveLength(32);
    const title = (n: number) => sections[n - 1].title;
    expect(title(1)).toBe("Introduction and Acceptance");
    expect(title(7)).toBe("Prohibited Conduct");
    expect(title(10)).toBe("Privacy and Data Protection");
    expect(title(29)).toBe("Governing Law and Dispute Resolution");
    expect(title(32)).toBe("Contact Information");
    expect(new Set(sections.map((s) => s.title)).size).toBe(32);
  });

  it("is filled with the owner's facts and leaves no visible placeholder behind", () => {
    expect(text).toContain("Rawalpindi, Pakistan");
    expect(text).toContain("info@solveratechnologies.com");
    expect(text).toContain("+92 325 5580945");
    expect(text).toContain("https://solveratechnologies.com/privacy-policy/");
    expect(text).toContain("governed by the laws of **Islamic Republic of Pakistan**");
    expect(text).toContain("competent courts of **Rawalpindi, Pakistan**");
    expect(text).not.toMatch(/\[[^\]]*to be (completed|added|confirmed)\]/);
    expect(text).not.toMatch(/\[(Publication Date|Revision Date|Full |Complete |Official|Verified|Confirmed)/);
  });

  it("lists the twelve prohibited conduct items", () => {
    const section = sections[6];
    const items = section.blocks!.find((b) => b.type === "olist");
    expect(items?.type === "olist" && items.items).toHaveLength(12);
  });

  it("leaves out the phone lines when no number is published, and shows a visible placeholder for a missing governing law", () => {
    const noPhone = allText(termsSections({ ...OWNER_FACTS, phone: undefined }));
    expect(noPhone).not.toContain("**Telephone:**");
    expect(noPhone).not.toContain("**Phone:**");
    expect(allText(termsSections({ ...OWNER_FACTS, jurisdiction: undefined }))).toContain("[governing jurisdiction to be confirmed]");
    expect(allText(termsSections({ ...OWNER_FACTS, courtsLocation: undefined }))).toContain("[city and country of the courts to be confirmed]");
  });
});
