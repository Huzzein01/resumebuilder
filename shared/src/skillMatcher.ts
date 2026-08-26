import { skillTaxonomy } from "./skillTaxonomy.js";

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Boundary assertions that treat compound-token punctuation (Node.js, C++, C#, CI/CD,
// Test-Driven) as "attached" to a word, without blocking ordinary trailing sentence
// punctuation (e.g. "...skilled in C#." or "...knows PostgreSQL."). A short alias like
// "JS" must not match inside "Node.js", and "C" must not match inside "C++" or "C#" —
// but "C#"/"C++" themselves must still match right before a period or space.
const LEFT_BOUNDARY = "(?<!\\w)(?<![#+])(?<!\\w\\.)(?<!\\w-)(?<!\\w/)";
const RIGHT_BOUNDARY = "(?!\\w)(?![#+])(?!\\.\\w)(?!-\\w)(?!/\\w)";

export function buildSkillRegex(terms: string[]): RegExp {
  const alternation = terms
    .map(escapeRegex)
    .sort((a, b) => b.length - a.length)
    .join("|");
  return new RegExp(`${LEFT_BOUNDARY}(${alternation})${RIGHT_BOUNDARY}`, "i");
}

const normalize = (s: string) => s.trim().toLowerCase();

const nameOrAliasToId = new Map<string, string>();
for (const entry of skillTaxonomy) {
  nameOrAliasToId.set(normalize(entry.name), entry.id);
  for (const alias of entry.aliases) {
    nameOrAliasToId.set(normalize(alias), entry.id);
  }
}

/**
 * Resolves a discrete skill name/alias string (e.g. a Profile skill's name, or a
 * project's techStack entry) to a taxonomy skill id via exact case-insensitive
 * comparison — unlike buildSkillRegex, which matches substrings inside free-form text.
 */
export function resolveTaxonomySkillId(nameOrAlias: string): string | undefined {
  return nameOrAliasToId.get(normalize(nameOrAlias));
}
