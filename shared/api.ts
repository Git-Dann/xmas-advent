/**
 * Types shared by the client and the server. Nothing in this file may contain answers,
 * correct placements or private family content. It only describes the shape of payloads.
 */

export type DayState = 'future' | 'locked' | 'available' | 'in_progress' | 'complete';

export interface CalendarDay {
  day: number;
  /** ISO date (YYYY-MM-DD) in Europe/London. */
  date: string;
  state: DayState;
  /** Only present for days the player can open or has completed. */
  title?: string;
  chapter?: number;
}

export interface CalendarResponse {
  today: string;
  days: CalendarDay[];
  chapterSeals: { star: boolean; moon: boolean; home: boolean; heart: boolean };
  hasChristmasKey: boolean;
  completedCount: number;
}

export interface SessionResponse {
  authenticated: boolean;
  player?: { name: string; preview: boolean };
  admin?: boolean;
}

/** One option in a choice, tile, sorting or matching interaction. Ids are opaque. */
export interface OptionSpec {
  id: string;
  label: string;
  /** Optional short description for screen readers and the list alternative. */
  description?: string;
  /** Optional decorative image path (public, non-secret). */
  image?: string;
  /** Optional programmatic glyph key rendered by the client. */
  glyph?: string;
}

export type StageSpec =
  | { kind: 'text'; id: string; prompt: string; label: string; placeholder?: string; inputMode?: 'text' | 'numeric' }
  | { kind: 'code'; id: string; prompt: string; label: string; digits: number; format?: string; wheels?: boolean }
  | { kind: 'dials'; id: string; prompt: string; dials: { id: string; label: string; prefix: string; digits: number }[] }
  | { kind: 'choice'; id: string; prompt: string; options: OptionSpec[]; layout?: 'menu' | 'grid' | 'list' | 'scene'; allowText?: boolean; textLabel?: string }
  | { kind: 'tiles'; id: string; prompt: string; tiles: OptionSpec[]; slots: number; allowText?: boolean; textLabel?: string }
  | { kind: 'placement'; id: string; prompt: string; pieces: OptionSpec[]; slots: { id: string; label: string; glyph?: string }[]; source?: 'pieces' | 'evidence' }
  | { kind: 'sorting'; id: string; prompt: string; items: OptionSpec[]; bins: { id: string; label: string }[] }
  | { kind: 'fields'; id: string; prompt: string; fields: FieldSpec[]; sentence?: boolean; textAlternative?: { label: string } }
  | { kind: 'date'; id: string; prompt: string; label: string; year: number }
  | { kind: 'select-many'; id: string; prompt: string; options: OptionSpec[]; centreLabel: string }
  | { kind: 'compare'; id: string; prompt: string; left: RecordSpec; right: RecordSpec; valueLabel: string }
  | { kind: 'evidence-slots'; id: string; prompt: string; slots: { id: string; label: string; hint: string; inputMode?: 'text' | 'numeric' }[] }
  | { kind: 'key'; id: string; prompt: string };

export type FieldSpec =
  | { id: string; label: string; type: 'text'; placeholder?: string }
  | { id: string; label: string; type: 'choice'; options: OptionSpec[] };

export interface RecordSpec {
  title: string;
  caption: string;
  fields: { id: string; label: string; value: string }[];
}

/** Scenes are the tactile set-pieces that frame a stage. Content is for the current day only. */
export type SceneSpec =
  | { kind: 'envelope'; seal: string; letter: string[]; signature: string; enclosure?: RecordSpec }
  | { kind: 'frost'; panes: { id: string; text: string }[] }
  | { kind: 'clock'; fragments: { hour: number; text: string }[] }
  | { kind: 'postcard'; front: string; layers: { id: string; text: string }[] }
  | { kind: 'woodland'; objects: { id: string; label: string; description: string; image: string; x: number; y: number; scale: number }[] }
  | { kind: 'house'; faces: { id: string; label: string; text: string; image?: string }[] }
  | { kind: 'clues'; clues: { title: string; text: string; image?: string; glyph?: string }[]; record?: RecordSpec }
  | { kind: 'media'; slot: string; mediaUrl?: string; mediaType?: 'audio' | 'video'; transcriptTitle: string; transcript: string[]; isRecording: boolean }
  | { kind: 'emblem' }
  | { kind: 'vault' }
  | { kind: 'none' };

export interface StageView {
  spec: StageSpec;
  complete: boolean;
  /** True when this stage is the next one the player should attempt. */
  active: boolean;
}

export interface PuzzleResponse {
  day: number;
  date: string;
  title: string;
  chapter: number;
  chapterTitle: string;
  state: DayState;
  intro: string[];
  objective: string;
  scene: SceneSpec;
  stages: StageView[];
  hints: { index: number; text: string }[];
  hintsAvailable: number;
  /** Evidence this puzzle asks the player to retrieve from the Archive. */
  requiredEvidence: EvidenceSummary[];
  /** Present only when the day is complete. */
  reveal?: RevealView;
}

export interface RevealView {
  title: string;
  body: string[];
  rewards: EvidenceSummary[];
  chapterComplete?: { chapter: number; title: string; seal: string };
  message?: string;
}

export interface AttemptResponse {
  correct: boolean;
  /** Supportive, neutral message for incorrect answers. Never reveals the answer. */
  message?: string;
  partial?: { correct: number; total: number };
  stageComplete?: boolean;
  dayComplete?: boolean;
  reveal?: RevealView;
}

export interface HintResponse {
  hints: { index: number; text: string }[];
  hintsAvailable: number;
}

export type EvidenceKind =
  | 'letter' | 'record' | 'ticket' | 'photo' | 'seal' | 'key' | 'ornament' | 'recording' | 'map' | 'menu' | 'note' | 'tool' | 'object';

export interface EvidenceSummary {
  id: string;
  title: string;
  kind: EvidenceKind;
  day: number;
  glyph?: string;
}

export type EvidenceAction = 'rotate' | 'turn' | 'zoom' | 'inspect' | 'overlay' | 'reveal' | 'listen' | 'combine';

export interface EvidenceFace {
  heading?: string;
  lines: string[];
  fields?: { label: string; value: string }[];
  image?: string;
  imageAlt?: string;
  mediaUrl?: string;
  mediaType?: 'audio' | 'video' | 'image';
}

export interface EvidenceDetail extends EvidenceSummary {
  description: string;
  front: EvidenceFace;
  back?: EvidenceFace;
  /** Hidden layers that the player's tools have revealed. Unrevealed layers are never sent. */
  layers: { id: string; label: string; face: 'front' | 'back'; lines: string[] }[];
  actions: EvidenceAction[];
}

export interface ArchiveResponse {
  evidence: EvidenceSummary[];
  tools: { id: string; title: string; description: string }[];
}

export interface FinaleResponse {
  unlocked: boolean;
  message?: string;
  title?: string;
  letter?: string[];
  signature?: string;
  media?: { id: string; type: 'image' | 'audio' | 'video'; url: string; caption?: string }[];
  closing?: string;
  /** The full title, revealed only in the Christmas Room. */
  fullTitle?: string;
}

export interface ApiError {
  error: string;
  message: string;
}
