import { getContent } from "@/content";
import { ArticleCard } from "@/components/insights/ArticleCard";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IconLink } from "@/components/ui/IconLink";

export async function InsightsPreview() {
  const { articles } = await getContent();
  return (
    <Section labelledBy="insights-preview-title">
      <Container>
        <SectionHeading
          eyebrow="Insights"
          id="insights-preview-title"
          title="Ideas for Better Digital Decisions."
          description="Practical guides on apps, websites, AI, automation and growth, written for business owners and teams."
          action={<IconLink href="/insights">All insights</IconLink>}
        />
        <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 3).map((a, i) => (
            <li key={a.slug} className={i === 2 ? "md:col-span-2 lg:col-span-1" : undefined}>
              <ArticleCard article={a} index={i} />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
