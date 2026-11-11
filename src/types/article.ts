export type ArticleCategory = "Automation" | "Web Development" | "App Development" | "AI" | "Digital Marketing" | "Strategy";

export type ArticleBlock =
  | { type: "h2"; id: string; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; title: string; text: string };

export interface Article {
  slug: string;
  title: string;
  /** Optional shorter text for the <title> tag and social cards. The visible H1 always uses `title`. */
  seoTitle?: string;
  excerpt: string;
  category: ArticleCategory;
  author: string;
  /** ISO date. Leave undefined until the article is actually published. */
  publishedAt?: string;
  updatedAt?: string;
  featured?: boolean;
  cover: { tone: "brand" | "mint" | "ink"; motif: "grid" | "nodes" | "bars" | "rings" };
  body: ArticleBlock[];
}
