import { ANSWERS } from './answers';
import { DAYS } from './days';
import { EVIDENCE, getEvidence } from './evidence';

export interface DependencyEdge {
  from: number;
  to: number;
  via: string;
  kind: 'mandatory' | 'narrative' | 'sequence' | 'layer';
}

/** Builds the puzzle dependency graph from the content definitions. */
export function buildGraph(): DependencyEdge[] {
  const awardedBy = new Map<string, number>();
  for (const day of DAYS) for (const id of day.rewards) awardedBy.set(id, day.day);
  const edges: DependencyEdge[] = [];
  for (const day of DAYS) {
    if (day.day > 1) edges.push({ from: day.day - 1, to: day.day, via: 'sequence', kind: 'sequence' });
    for (const id of day.requiresEvidence) {
      const from = awardedBy.get(id);
      if (from !== undefined) edges.push({ from, to: day.day, via: id, kind: 'mandatory' });
    }
    for (const id of day.narrativeRefs ?? []) {
      const from = awardedBy.get(id);
      if (from !== undefined) edges.push({ from, to: day.day, via: id, kind: 'narrative' });
    }
  }
  for (const def of EVIDENCE) {
    for (const layer of def.layers ?? []) {
      const from = awardedBy.get(def.id);
      const to = layer.requires.dayComplete ?? layer.requires.dayAvailable;
      if (from !== undefined && to !== undefined) edges.push({ from, to, via: `${def.id}:${layer.id}`, kind: 'layer' });
    }
  }
  return edges;
}

/** Returns a list of problems. An empty list means the graph is valid and completable. */
export function validateGraph(): string[] {
  const problems: string[] = [];
  const awardedBy = new Map<string, number>();
  const days = new Set(DAYS.map((d) => d.day));
  for (let n = 1; n <= 25; n++) if (!days.has(n)) problems.push(`Day ${n} is missing.`);
  for (const day of DAYS) {
    for (const id of day.rewards) {
      if (!getEvidence(id)) problems.push(`Day ${day.day} awards unknown evidence ${id}.`);
      if (awardedBy.has(id)) problems.push(`Evidence ${id} is awarded twice.`);
      awardedBy.set(id, day.day);
    }
    for (const stage of day.stages) {
      if (!ANSWERS[day.day]?.[stage.id]) problems.push(`Day ${day.day} stage ${stage.id} has no answer.`);
    }
    if (day.hints.length !== 3) problems.push(`Day ${day.day} must have exactly three hints.`);
  }
  for (const day of DAYS) {
    for (const id of day.requiresEvidence) {
      const from = awardedBy.get(id);
      if (from === undefined) problems.push(`Day ${day.day} requires ${id}, which no day awards.`);
      else if (from >= day.day) problems.push(`Day ${day.day} requires ${id}, which is only awarded on day ${from} (impossible or circular).`);
    }
    for (const id of day.narrativeRefs ?? []) {
      const from = awardedBy.get(id);
      if (from === undefined || from >= day.day) problems.push(`Day ${day.day} references ${id} before it exists.`);
    }
  }
  for (const def of EVIDENCE) {
    for (const layer of def.layers ?? []) {
      const r = layer.requires;
      const at = r.dayComplete ?? r.dayAvailable;
      const from = awardedBy.get(def.id);
      if (at !== undefined && from !== undefined && at <= from) problems.push(`Layer ${def.id}:${layer.id} unlocks before the evidence exists.`);
    }
  }
  // Cycle check over all edges (sequence edges make the graph a DAG only if every edge points forward).
  for (const edge of buildGraph()) {
    if (edge.from >= edge.to) problems.push(`Edge ${edge.via} goes backwards from day ${edge.from} to day ${edge.to}.`);
  }
  return problems;
}

export function graphAsMermaid(): string {
  const lines = ['flowchart TD'];
  for (const day of DAYS) lines.push(`  D${day.day}["Day ${day.day}: ${day.title.replace(/"/g, "'")}"]`);
  for (const edge of buildGraph()) {
    if (edge.kind === 'sequence') continue;
    const arrow = edge.kind === 'mandatory' ? '==>' : '-.->';
    lines.push(`  D${edge.from} ${arrow}|${edge.via}| D${edge.to}`);
  }
  return lines.join('\n');
}
