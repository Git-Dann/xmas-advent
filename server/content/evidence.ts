import type { EvidenceAction, EvidenceFace, EvidenceKind } from '../../shared/api';

/**
 * Evidence definitions (server-only). Hidden layers carry a `requires` rule and are stripped from
 * responses until the rule is satisfied, so future information is never downloaded early.
 */
export interface LayerDef {
  id: string;
  label: string;
  face: 'front' | 'back';
  lines: string[];
  requires: { entitlement?: string; dayComplete?: number; dayAvailable?: number };
}

export interface EvidenceDef {
  id: string;
  title: string;
  kind: EvidenceKind;
  /** Day that awards this evidence (0 for evidence only shown inside a puzzle). */
  day: number;
  glyph?: string;
  description: string;
  front: EvidenceFace;
  back?: EvidenceFace;
  layers?: LayerDef[];
  /** Media slot that, when uploaded by the admin, attaches to this evidence. */
  mediaSlot?: string;
}

export const EVIDENCE: EvidenceDef[] = [
  {
    id: 'university-record', title: 'Register of Arrivals', kind: 'record', day: 1, glyph: 'record',
    description: 'The first entry in the collection. Water damage has blurred part of it.',
    front: {
      heading: 'Register of Arrivals',
      fields: [
        { label: 'Institution', value: 'Edge Hill University' },
        { label: 'Town', value: 'Ormskirk, Lancashire' },
        { label: 'Entry', value: 'The beginning of a story' },
        { label: 'Status', value: 'Unfinished' },
      ],
      lines: [],
    },
  },
  {
    id: 'dated-record', title: 'University Record, 2010', kind: 'record', day: 2, glyph: 'star',
    description: 'The university record, now dated. Someone has drawn a small star beside the year.',
    front: {
      heading: 'University Record',
      fields: [
        { label: 'Institution', value: 'Edge Hill University' },
        { label: 'Town', value: 'Ormskirk, Lancashire' },
        { label: 'Year', value: '2010 ☆' },
        { label: 'Observation', value: 'Wonderfully beautiful. Mysterious.' },
        { label: 'Filed by', value: 'The Curator' },
      ],
      lines: [],
    },
  },
  {
    id: 'cinema-ticket', title: 'Cinema Ticket', kind: 'ticket', day: 3, glyph: 'ticket',
    description: 'Admit two. Gulliver\'s Travels, at a cinema near Edge Hill. Something is marked on the back.',
    front: {
      heading: 'ADMIT TWO',
      lines: ['Gulliver\'s Travels', '2010 · Evening showing', 'A cinema near Edge Hill'],
    },
    back: {
      heading: 'Reverse',
      lines: ['A faint, unexplained marking. It will not read in ordinary light.'],
    },
    layers: [
      {
        id: 'lamp-words', label: 'Under the lamp', face: 'back',
        lines: ['TWO PEOPLE,', 'ONE PROMISE.'],
        requires: { entitlement: 'lamp' },
      },
    ],
  },
  {
    id: 'birth-record-chloe', title: 'Record A', kind: 'record', day: 4, glyph: 'record',
    description: 'The first stranger. She would grow up to love maroon and distrust cake.',
    front: {
      heading: 'Record A',
      fields: [
        { label: 'Born', value: '1991' },
        { label: 'Loves', value: 'Maroon, curry, gin, board games, Winnie-the-Pooh' },
        { label: 'Distrusts', value: 'Cake' },
      ],
      lines: [],
    },
  },
  {
    id: 'birth-record-dan', title: 'Record B', kind: 'record', day: 4, glyph: 'record',
    description: 'The second stranger. He caught glimpses of her at university.',
    front: {
      heading: 'Record B',
      fields: [
        { label: 'Born', value: '1986' },
        { label: 'Note', value: 'Caught glimpses of her at university. Never quite recovered.' },
      ],
      lines: [],
    },
  },
  {
    id: 'clock', title: 'The Night Clock', kind: 'object', day: 5, glyph: 'clock',
    description: 'A clock that remembers staying up all night talking.',
    front: { heading: 'The Night Clock', lines: ['Stopped somewhere after midnight.', 'Still talking.'] },
    back: { heading: 'Engraved on the back', lines: ['Her story comes first.'] },
  },
  {
    id: 'star-seal', title: 'Star Seal', kind: 'seal', day: 6, glyph: 'star',
    description: 'The first chapter seal. Warm gold, and heavier than it looks.',
    front: { heading: 'Star Seal', lines: ['Chapter One: Where It Began'] },
  },
  {
    id: 'note-withheld', title: 'Folded Note', kind: 'note', day: 6, glyph: 'note',
    description: 'Found in the first drawer, in an unfamiliar hand.',
    front: { lines: ['"The Curator has not told you everything."'] },
  },
  {
    id: 'coastal-map', title: 'Coastal Map', kind: 'map', day: 7, glyph: 'map',
    description: 'A coastline, a pinewood, and a small symbol in one corner.',
    front: {
      heading: 'Coastal Map',
      lines: ['Formby. Dunes, beach and pinewoods.', 'In the corner, a small inked symbol: an animal with tufted ears and a long, bushy tail.'],
      image: '/assets/engravings/red-squirrel.webp',
      imageAlt: 'An inked symbol of a red squirrel with tufted ears and a bushy tail',
    },
  },
  {
    id: 'proposal-record', title: 'Proposal Record', kind: 'record', day: 8, glyph: 'record',
    description: 'Recovered from a red squirrel in the Formby pinewoods.',
    front: {
      heading: 'Proposal Record',
      fields: [
        { label: 'Place', value: 'Formby, near the red squirrels' },
        { label: 'Weather', value: 'Extremely windy' },
        { label: 'Question', value: 'Asked' },
        { label: 'State of the person asking', value: 'Very, very nervous' },
      ],
      lines: [],
    },
  },
  {
    id: 'ring-token', title: 'Ring Token', kind: 'object', day: 8, glyph: 'ring',
    description: 'A very small ring-shaped token.',
    front: { heading: 'Ring Token', lines: ['Small. Round. Important.'] },
  },
  {
    id: 'wedding-invitation', title: 'Wedding Invitation', kind: 'letter', day: 9, glyph: 'envelope',
    description: 'Sealed, and addressed in gold. Two people, one promise.',
    front: { heading: 'You are invited', lines: ['Two people. One promise.', 'The date is held behind a lock.'] },
  },
  {
    id: 'music-box', title: 'Music Box', kind: 'object', day: 10, glyph: 'music',
    description: 'A music box with a velvet lining. Its song card is whole again.',
    front: { heading: 'Music Box', lines: ['Song card: Little Things'] },
  },
  {
    id: 'wedding-song-record', title: 'Wedding Song Record', kind: 'record', day: 10, glyph: 'music',
    description: 'Who sang at the wedding, and what.',
    front: {
      heading: 'Wedding Song Record',
      fields: [
        { label: 'Song', value: 'Little Things' },
        { label: 'Recorded by', value: 'One Direction' },
        { label: 'Performed at the wedding by', value: 'The groom, live, in front of everyone' },
        { label: 'Bravery', value: 'Considerable' },
      ],
      lines: [],
    },
  },
  {
    id: 'wedding-menu', title: 'Wedding Menu', kind: 'menu', day: 11, glyph: 'menu',
    description: 'The wedding breakfast. Not cake.',
    front: { heading: 'Wedding Breakfast', lines: ['Curry'] },
  },
  {
    id: 'calendar-fragment', title: 'Calendar Fragment', kind: 'record', day: 11, glyph: 'calendar',
    description: 'Torn from a calendar. One date is circled in gold.',
    front: { heading: 'October 2014', lines: ['Saturday 25 October is circled in gold.'] },
  },
  {
    id: 'moon-seal', title: 'Moon Seal', kind: 'seal', day: 12, glyph: 'moon',
    description: 'The second chapter seal, in silver.',
    front: { heading: 'Moon Seal', lines: ['Chapter Two: One Promise'] },
  },
  {
    id: 'wedding-record', title: 'Wedding Record', kind: 'record', day: 12, glyph: 'ring',
    description: 'Pressed flat like a flower.',
    front: {
      heading: 'Wedding Record',
      fields: [
        { label: 'Date', value: '25 October 2014' },
        { label: 'Song', value: 'Little Things, sung by the groom' },
        { label: 'Wedding breakfast', value: 'Curry' },
      ],
      lines: [],
    },
  },
  {
    id: 'intercepted-message', title: 'Intercepted Message', kind: 'note', day: 12, glyph: 'note',
    description: 'Pencil, two different hands. Definitely not the Curator.',
    front: { lines: ['"We are the Junior Investigators. We are not supposed to be in here. Keep looking. There are more secret things."'] },
  },
  {
    id: 'honeymoon-postcard', title: 'Honeymoon Postcard', kind: 'photo', day: 13, glyph: 'sun', mediaSlot: 'honeymoon-photo',
    description: 'Florida. Filed under "happiest".',
    front: { heading: 'Greetings from Florida', lines: ['Universal Studios.', 'No cares at all.'] },
  },
  {
    id: 'house-key', title: 'House Key', kind: 'key', day: 14, glyph: 'key',
    description: 'The key to a first home.',
    front: { heading: 'House Key', lines: ['A first front door of your own.'] },
  },
  {
    id: 'address-label', title: 'Address Label', kind: 'record', day: 14, glyph: 'foxglove',
    description: 'A neat label from the model house.',
    front: { heading: 'Address', lines: ['Foxglove Way'], image: '/assets/engravings/foxglove.webp', imageAlt: 'A botanical engraving of a foxglove' },
  },
  {
    id: 'intercepted-correction', title: 'Intercepted Correction', kind: 'note', day: 15, glyph: 'note',
    description: 'A correction to the correction, in pencil.',
    front: { lines: ['"He didn\'t make a mistake. He wanted to see if you would notice. You always notice."', 'Corrected year: 2010.'] },
  },
  {
    id: 'maroon-ornament', title: 'Maroon Ornament', kind: 'ornament', day: 16, glyph: 'ornament',
    description: 'Wrapped in tissue at the bottom of the box marked "C".',
    front: { heading: 'Maroon Ornament', lines: ['Your colour.'] },
  },
  {
    id: 'incident-report', title: 'Incident Report PORCH/001', kind: 'record', day: 17, glyph: 'door',
    description: 'Classification: deeply embarrassing.',
    front: {
      heading: 'Official Incident Report',
      fields: [
        { label: 'Reference', value: 'PORCH/001' },
        { label: 'Location', value: 'The parents\' residence' },
        { label: 'Subject', value: 'Dan' },
        { label: 'Finding', value: 'Subject crashed into the porch door. The door did not move out of the way.' },
        { label: 'Recommendation', value: 'Never to be mentioned again, except at Christmas, on birthdays, and whenever it would be funny.' },
      ],
      lines: [],
    },
  },
  {
    id: 'home-seal', title: 'Home Seal', kind: 'seal', day: 18, glyph: 'home',
    description: 'The third chapter seal.',
    front: { heading: 'Home Seal', lines: ['Chapter Three: Home'] },
  },
  {
    id: 'family-record-1', title: 'The First Little Mystery', kind: 'record', day: 18, glyph: 'record',
    description: 'A family record, sealed with wax.',
    front: { heading: 'The first little mystery', lines: ['Sealed with wax.'] },
    layers: [
      {
        id: 'opened', label: 'Opened', face: 'front',
        lines: ['Name: Oliver', 'The elder brother.', 'Analytical. Thoughtful. Inquisitive.', 'Magic, Rubik\'s cubes, fidgets and puzzles.'],
        requires: { dayAvailable: 19 },
      },
      {
        id: 'day-value', label: 'Day value', face: 'front',
        lines: ['Arrived: 1 December 2016', 'Day value: 01'],
        requires: { dayComplete: 19 },
      },
    ],
  },
  {
    id: 'family-record-2', title: 'The Second Little Mystery', kind: 'record', day: 18, glyph: 'record',
    description: 'A family record, sealed with wax.',
    front: { heading: 'The second little mystery', lines: ['Sealed with wax.'] },
    layers: [
      {
        id: 'hint', label: 'Through the wax', face: 'front',
        lines: ['Just visible through the wax: superheroes and very small, very fast cars.'],
        requires: { dayAvailable: 20 },
      },
      {
        id: 'opened', label: 'Opened', face: 'front',
        lines: ['Name: George', 'The younger brother.', 'Energetic. Funny. Imaginative.', 'Superheroes and Hot Wheels.'],
        requires: { dayAvailable: 21 },
      },
      {
        id: 'day-value', label: 'Day value', face: 'front',
        lines: ['Arrived: 30 September 2019', 'Day value: 30'],
        requires: { dayComplete: 21 },
      },
    ],
  },
  {
    id: 'investigator-dossier', title: 'Investigators\' Dossier', kind: 'record', day: 20, glyph: 'magnifier', mediaSlot: 'investigators',
    description: 'The Junior Investigators, identified.',
    front: {
      heading: 'Junior Investigators',
      fields: [
        { label: 'Investigator One', value: 'Oliver' },
        { label: 'Investigator Two', value: 'George' },
        { label: 'Employer', value: 'The Curator (identity under investigation)' },
      ],
      lines: [],
    },
  },
  {
    id: 'heart-seal', title: 'Heart Seal', kind: 'seal', day: 22, glyph: 'heart',
    description: 'The fourth seal.',
    front: { heading: 'Heart Seal', lines: ['Elephant Juice'] },
  },
  {
    id: 'personal-letter', title: 'A Letter', kind: 'letter', day: 22, glyph: 'envelope',
    description: 'About words that mean more than they say.',
    front: {
      lines: [
        'Some words mean much more to two people than they do to everyone else.',
        'To anyone else, this is nonsense. To us, it never has been.',
        'Elephant Juice.',
      ],
    },
  },
  {
    id: 'note-bub', title: 'Note: "Morning, Bub."', kind: 'note', day: 23, glyph: 'note',
    description: 'Unsigned.',
    front: { lines: ['"Morning, Bub."'] },
  },
  {
    id: 'note-chunky', title: 'Note: "Night night, Chunky and Grey."', kind: 'note', day: 23, glyph: 'note',
    description: 'Addressed to the Curator.',
    front: { lines: ['"Night night, Chunky and Grey."'] },
  },
  {
    id: 'final-instruction', title: 'Final Instruction', kind: 'letter', day: 23, glyph: 'envelope',
    description: 'Left by the Junior Investigators.',
    front: {
      lines: [
        'Begin with the eldest.',
        'Take the day each of them arrived.',
        'Two digits for each.',
        'Four digits for everything that matters.',
      ],
    },
  },
  {
    id: 'curator-identity', title: 'The Curator', kind: 'record', day: 23, glyph: 'magnifier',
    description: 'Identity confirmed.',
    front: {
      heading: 'The Curator',
      fields: [
        { label: 'Name', value: 'Dan (also known as Chunky and Grey)' },
        { label: 'Assistants', value: 'Oliver and George' },
        { label: 'Known for', value: 'Glimpses at Edge Hill, Little Things, and the porch door' },
      ],
      lines: [],
    },
  },
  {
    id: 'christmas-key', title: 'The Christmas Key', kind: 'key', day: 24, glyph: 'key',
    description: 'Gold. Earned on Christmas Eve. Keep it safe until Christmas morning.',
    front: { heading: 'The Christmas Key', lines: ['Two people. One promise. Two incredible boys.', 'Opens the vault on Christmas morning.'] },
  },
];

/** Puzzle-only evidence shown on Day 23's board even before it is awarded. */
export const BOARD_ONLY = new Set(['note-bub', 'note-chunky']);

export const TOOLS: Record<string, { title: string; description: string }> = {
  archive: { title: 'The Archive', description: 'Everything you have collected, kept safe.' },
  lamp: { title: 'The Lamp', description: 'Shows inks that ordinary light cannot. Use it on the back of an object.' },
  'christmas-key': { title: 'The Christmas Key', description: 'Opens the vault on Christmas morning.' },
};

export function getEvidence(id: string): EvidenceDef | undefined {
  return EVIDENCE.find((entry) => entry.id === id);
}

export function actionsFor(def: EvidenceDef, hasLamp: boolean, hasMedia: boolean): EvidenceAction[] {
  const actions: EvidenceAction[] = ['inspect', 'zoom'];
  if (def.back) actions.push('turn');
  if (def.kind === 'key' || def.kind === 'seal' || def.kind === 'ornament' || def.kind === 'object') actions.push('rotate');
  if (hasLamp && def.layers?.some((layer) => layer.requires.entitlement === 'lamp')) actions.push('overlay');
  if (def.layers?.some((layer) => layer.requires.dayComplete || layer.requires.dayAvailable)) actions.push('reveal');
  if (hasMedia) actions.push('listen');
  if (def.kind === 'seal' || def.id === 'christmas-key') actions.push('combine');
  return actions;
}
