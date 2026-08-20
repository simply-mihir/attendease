/**
 * Subject slug utilities.
 *
 * URLs: /subjects/dbms, /subjects/data-structures
 * Slugs are stored in the DB and unique per user.
 */

/** Generate a URL-safe slug from a subject name. */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "subject";
}

/** Build href for a subject detail page. */
export function subjectHref(slug: string): string {
  return `/subjects/${slug}`;
}
