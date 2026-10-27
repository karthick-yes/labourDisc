import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories, categoryRoles, skills } from "@/db/schema";

// Skills and categories are small seed tables that change only on deploy,
// so they are loaded once per server process.

export type Skill = typeof skills.$inferSelect;
export type Category = typeof categories.$inferSelect & { roles: string[] };

let cache: Promise<{ skills: Skill[]; categories: Category[] }> | null = null;

function load() {
  cache ??= (async () => {
    const [skillRows, categoryRows, roleRows] = await Promise.all([
      db.select().from(skills).orderBy(asc(skills.canonicalNameEn)),
      db.select().from(categories),
      db.select().from(categoryRoles),
    ]);
    return {
      skills: skillRows,
      categories: categoryRows.map((c) => ({
        ...c,
        roles: roleRows.filter((r) => r.categoryId === c.id).map((r) => r.skillId),
      })),
    };
  })().catch((err) => {
    cache = null;
    throw err;
  });
  return cache;
}

export async function getSkills() {
  return (await load()).skills;
}

export async function getCategories() {
  return (await load()).categories;
}

export async function getReference() {
  const { skills, categories } = await load();
  return {
    skills,
    categories,
    skillById: new Map(skills.map((s) => [s.id, s])),
    categoryById: new Map(categories.map((c) => [c.id, c])),
  };
}

/** Skill ids whose name or synonyms contain the query (any language). */
export function skillIdsMatching(all: Skill[], q: string): string[] {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  return all
    .filter((s) =>
      [s.canonicalNameEn, s.nameMl, s.id, ...s.synonyms].some((v) =>
        v.toLowerCase().includes(needle),
      ),
    )
    .map((s) => s.id);
}
