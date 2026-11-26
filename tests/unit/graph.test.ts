import { describe, expect, it } from 'vitest';
import { DAYS } from '../../server/content/days';
import { EVIDENCE } from '../../server/content/evidence';
import { buildGraph, graphAsMermaid, validateGraph } from '../../server/content/graph';

describe('puzzle dependency graph', () => {
  it('has no missing references, circular dependencies or impossible states', () => {
    expect(validateGraph()).toEqual([]);
  });
  it('contains the specified mandatory dependencies', () => {
    const edges = buildGraph().filter((e) => e.kind === 'mandatory');
    const has = (from: number, to: number, via: string) => edges.some((e) => e.from === from && e.to === to && e.via === via);
    expect(has(4, 6, 'birth-record-chloe')).toBe(true);
    expect(has(5, 6, 'clock')).toBe(true);
    expect(has(3, 9, 'cinema-ticket')).toBe(true);
    expect(has(7, 8, 'coastal-map')).toBe(true);
    expect(has(2, 15, 'dated-record')).toBe(true);
    expect(has(14, 18, 'address-label')).toBe(true);
    expect(has(16, 18, 'maroon-ornament')).toBe(true);
    expect(has(6, 24, 'star-seal')).toBe(true);
    expect(has(12, 24, 'moon-seal')).toBe(true);
    expect(has(18, 24, 'home-seal')).toBe(true);
    expect(has(22, 24, 'heart-seal')).toBe(true);
    expect(has(23, 24, 'final-instruction')).toBe(true);
    expect(has(24, 25, 'christmas-key')).toBe(true);
  });
  it('defines every evidence item exactly once', () => {
    const ids = EVIDENCE.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('has 25 days with three hints each and unique ids', () => {
    expect(DAYS).toHaveLength(25);
    expect(new Set(DAYS.map((d) => d.id)).size).toBe(25);
    for (const day of DAYS) expect(day.hints).toHaveLength(3);
  });
  it('renders a Mermaid diagram', () => {
    expect(graphAsMermaid()).toContain('D24 ==>|christmas-key| D25');
  });
});
