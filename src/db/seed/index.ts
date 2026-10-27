// Seeds the shared reference tables (skills, categories, category roles).
// Safe to re-run: existing rows are updated in place.
import "dotenv/config";
import { sql } from "drizzle-orm";
import { CATEGORIES } from "../../config/categories";
import { SKILLS } from "../../config/skills";
import { db } from "../index";
import { categories, categoryRoles, skills } from "../schema";

async function main() {
  const skillIds = new Set(SKILLS.map((s) => s.id));
  for (const c of CATEGORIES) {
    for (const r of c.roles) {
      if (!skillIds.has(r)) throw new Error(`Category ${c.id} has unknown role ${r}`);
    }
  }

  await db
    .insert(skills)
    .values(
      SKILLS.map((s) => ({
        id: s.id,
        canonicalNameEn: s.en,
        nameMl: s.ml,
        synonyms: s.synonyms,
      })),
    )
    .onConflictDoUpdate({
      target: skills.id,
      set: {
        canonicalNameEn: sql`excluded.canonical_name_en`,
        nameMl: sql`excluded.name_ml`,
        synonyms: sql`excluded.synonyms`,
      },
    });

  await db
    .insert(categories)
    .values(
      CATEGORIES.map((c) => ({
        id: c.id,
        nameEn: c.en,
        nameMl: c.ml,
        osmTags: c.osmTags,
      })),
    )
    .onConflictDoUpdate({
      target: categories.id,
      set: {
        nameEn: sql`excluded.name_en`,
        nameMl: sql`excluded.name_ml`,
        osmTags: sql`excluded.osm_tags`,
      },
    });

  await db.transaction(async (tx) => {
    await tx.delete(categoryRoles);
    await tx
      .insert(categoryRoles)
      .values(
        CATEGORIES.flatMap((c) =>
          c.roles.map((skillId) => ({ categoryId: c.id, skillId })),
        ),
      );
  });

  console.log(`Seeded ${SKILLS.length} skills, ${CATEGORIES.length} categories.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
