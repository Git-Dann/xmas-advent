/**
 * Generates docs/PUZZLE-MAP.md and docs/ANSWER-KEY.md from the content definitions, so the
 * documentation can never drift from the code. Run: npm run docs:generate
 * ANSWER-KEY.md is private: it lives only in this private repository, never in dist/.
 */
import { writeFileSync } from 'node:fs';
import { ANSWERS } from '../server/content/answers';
import { CHAPTERS, DAYS } from '../server/content/days';
import { EVIDENCE } from '../server/content/evidence';
import { buildGraph, graphAsMermaid, validateGraph } from '../server/content/graph';
import type { Matcher } from '../server/validation/matchers';

const evidenceTitle = (id: string) => EVIDENCE.find((e) => e.id === id)?.title ?? id;

function describe(m: Matcher): string {
  switch (m.type) {
    case 'text': return `text, any of: ${m.accept.map((a) => `"${a}"`).join(', ')}`;
    case 'code': return `exact digits "${m.value}" (leading zeros matter)`;
    case 'choice': return `option id \`${m.value}\``;
    case 'sequence': return `in order: ${m.items.join(' → ')}`;
    case 'set': return `exactly this set: ${m.items.map((i) => `\`${i}\``).join(', ')}`;
    case 'mapping': return Object.entries(m.map).map(([k, v]) => `\`${k}\` → \`${v}\``).join(', ');
    case 'date': return `day ${m.day}, month ${m.month} (structured, or text such as "${m.day}/${m.month}")`;
    case 'fields': return Object.entries(m.fields).map(([k, v]) => `**${k}**: ${describe(v)}`).join('; ');
    case 'any': return m.of.map(describe).join(' **or** ');
    case 'evidenceOrText': return `evidence ${m.evidence.map((e) => `"${evidenceTitle(e)}"`).join(' or ')}, or ${describe(m.text)}`;
    case 'evidence': return `present owned evidence "${evidenceTitle(m.id)}"`;
  }
}

const problems = validateGraph();
const edges = buildGraph();
let map = `# Puzzle map\n\nGenerated from \`server/content\` by \`npm run docs:generate\`. Do not edit by hand.\n\n`;
map += `Graph validation: ${problems.length === 0 ? '**valid** (no missing references, no cycles, no impossible states)' : problems.join('; ')}.\n\n`;
map += `## Dependency diagram\n\nThick arrows are mandatory mechanical dependencies (the server refuses attempts without that evidence). Dotted arrows are narrative references or layers revealed later. Every day also requires the previous day (strict sequence), which is not drawn.\n\n\`\`\`mermaid\n${graphAsMermaid()}\n\`\`\`\n\n`;
map += `## Chapters\n\n| Chapter | Title | Days | Seal |\n|---|---|---|---|\n`;
for (const [n, c] of Object.entries(CHAPTERS)) map += `| ${n} | ${c.title} | ${c.days[0]}–${c.days[1]} | ${c.seal ?? 'Christmas Key'} |\n`;
map += `\n## Days\n\n| Day | Title | Interaction | Stages | Requires (mandatory) | Rewards |\n|---|---|---|---|---|---|\n`;
for (const d of DAYS) {
  map += `| ${d.day} | ${d.title} | ${d.scene.kind === 'none' ? '-' : d.scene.kind} | ${d.stages.map((s) => `${s.id} (${s.kind})`).join(', ')} | ${d.requiresEvidence.map(evidenceTitle).join(', ') || '-'} | ${[...d.rewards.map(evidenceTitle), ...(d.entitlements ?? []).map((e) => `entitlement: ${e}`), ...(d.grantsOnOpen ?? []).map((e) => `on open: ${e}`), ...(d.revealsLayers ?? []).map((l) => `reveals ${l}`)].join(', ') || '-'} |\n`;
}
map += `\n## All edges\n\n| From | To | Via | Kind |\n|---|---|---|---|\n`;
for (const e of edges.filter((x) => x.kind !== 'sequence')) map += `| ${e.from} | ${e.to} | ${e.via} | ${e.kind} |\n`;
writeFileSync('docs/PUZZLE-MAP.md', map);

let key = `# Answer key (PRIVATE)\n\nGenerated from \`server/content/answers.ts\` by \`npm run docs:generate\`. This file is private to the repository. It is never part of the public build (\`scripts/check-bundle.mjs\` enforces this). Admin overrides stored in D1 are not reflected here; see Admin > Days.\n\nText answers are compared after normalisation: trimmed, whitespace collapsed, case-insensitive, Unicode NFKC, apostrophes ignored, other punctuation ignored. Codes are compared as exact digit strings.\n\n`;
for (const d of DAYS) {
  key += `## Day ${d.day}: ${d.title}\n\n`;
  for (const s of d.stages) key += `- **${s.id}** (${s.kind}): ${describe(ANSWERS[d.day]![s.id]!)}\n`;
  key += `- Hints: ${d.hints.map((h, i) => `(${i + 1}) ${h}`).join(' ')}\n\n`;
}
writeFileSync('docs/ANSWER-KEY.md', key);
console.log('Wrote docs/PUZZLE-MAP.md and docs/ANSWER-KEY.md');
