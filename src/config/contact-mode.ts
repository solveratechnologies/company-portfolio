/**
 * Which block the Contact page shows in the "inquiry" slot:
 *   - "booking": the date-picker booking calendar (default)
 *   - "form":    the project inquiry form
 * Choose with CONTACT_MODE in .env.local (see .env.example). Unknown or empty values fall back to "booking".
 * Read on the server when the page is built/rendered, so restart `next dev` (or rebuild) after changing it.
 */
export type ContactMode = "booking" | "form";

export function getContactMode(env: NodeJS.ProcessEnv = process.env): ContactMode {
  return env.CONTACT_MODE?.trim().toLowerCase() === "form" ? "form" : "booking";
}
