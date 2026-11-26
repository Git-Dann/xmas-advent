import type { RecordSpec, SceneSpec, StageSpec } from '../../shared/api';

/**
 * Player-facing content for all 25 days. This module is server-only: it is bundled into the
 * Pages Functions worker and never into the browser build. Answers live in ./answers.ts.
 *
 * Every fact used here comes from the canonical family brief. Anything the Curator says that is
 * not a fact (tone, staging, the Junior Investigators' notes) is clearly fictional framing.
 * Dan can override any text from the admin area without a redeploy.
 */

export interface DayContent {
  day: number;
  id: string;
  title: string;
  chapter: 1 | 2 | 3 | 4 | 5;
  intro: string[];
  objective: string;
  scene: SceneSpec;
  stages: StageSpec[];
  hints: [string, string, string];
  reveal: { title: string; body: string[]; message?: string };
  /** Evidence ids awarded atomically when the day is completed. */
  rewards: string[];
  /** Evidence layers revealed when the day is completed (evidenceId:layerId). */
  revealsLayers?: string[];
  /** Entitlements awarded when the day is completed. */
  entitlements?: string[];
  /** Entitlements granted as soon as the day becomes available (for example a new tool). */
  grantsOnOpen?: string[];
  /** Mandatory mechanical dependencies: evidence the player must own to attempt the day. */
  requiresEvidence: string[];
  /** Optional narrative references, shown in the dependency map but not enforced. */
  narrativeRefs?: string[];
}

export const CHAPTERS: Record<number, { title: string; seal: string | null; days: [number, number] }> = {
  1: { title: 'Where It Began', seal: 'star', days: [1, 6] },
  2: { title: 'One Promise', seal: 'moon', days: [7, 12] },
  3: { title: 'Home', seal: 'home', days: [13, 18] },
  4: { title: 'The Little Mysteries', seal: 'heart', days: [19, 24] },
  5: { title: 'Christmas Morning', seal: null, days: [25, 25] },
};

const originalRecord: RecordSpec = {
  title: 'University Record',
  caption: 'From the Archive. Filed on day 2.',
  fields: [
    { id: 'f-a', label: 'Institution', value: 'Edge Hill University' },
    { id: 'f-b', label: 'Town', value: 'Ormskirk, Lancashire' },
    { id: 'f-c', label: 'Year', value: '2010' },
    { id: 'f-d', label: 'Observation', value: 'Wonderfully beautiful. Mysterious.' },
    { id: 'f-e', label: 'Filed by', value: 'The Curator' },
  ],
};

const alteredRecord: RecordSpec = {
  title: 'University Record (copy)',
  caption: 'Newly made by the Curator. Possibly in a hurry.',
  fields: [
    { id: 'f-a', label: 'Institution', value: 'Edge Hill University' },
    { id: 'f-b', label: 'Town', value: 'Ormskirk, Lancashire' },
    { id: 'f-c', label: 'Year', value: '2012' },
    { id: 'f-d', label: 'Observation', value: 'Wonderfully beautiful. Mysterious.' },
    { id: 'f-e', label: 'Filed by', value: 'The Curator' },
  ],
};

export const DAYS: DayContent[] = [
  {
    day: 1,
    id: 'the-invitation',
    title: 'The Invitation',
    chapter: 1,
    intro: [
      'An envelope has arrived, sealed in maroon wax. It is addressed to you, in handwriting you almost recognise.',
    ],
    objective: 'Open the envelope, examine the record inside and name the place where the story began.',
    scene: {
      kind: 'envelope',
      seal: 'star',
      letter: [
        'Good evening, Chloe.',
        'Forgive the intrusion. My name is not important yet. You may call me the Curator.',
        'I look after a collection. It is old in places, untidy in others, and, I am sorry to say, unfinished. I am told that only you can finish it.',
        'Each day until Christmas, one more door in the village will open. Behind each one is something that belongs in the collection. Some objects will make sense at once. Others will only make sense later. Keep everything.',
        'We begin, as all good collections do, with a record.',
      ],
      signature: 'The Curator',
      enclosure: {
        title: 'Register of Arrivals',
        caption: 'Water damage has made part of the entry unreadable.',
        fields: [
          { id: 'r1', label: 'Institution', value: 'E _ _ e   H _ _ l   U n i v e r s i t y' },
          { id: 'r2', label: 'Town', value: 'Ormskirk, Lancashire' },
          { id: 'r3', label: 'Entry', value: 'The beginning of a story' },
          { id: 'r4', label: 'Status', value: 'Unfinished' },
        ],
      },
    },
    stages: [
      { kind: 'text', id: 'place', prompt: 'Where did the story begin?', label: 'Name the place', placeholder: 'The name on the record' },
    ],
    hints: [
      'Look closely at the smudged name on the record. The town beneath it is perfectly clear.',
      'It is a university in Ormskirk, Lancashire. You knew it well in 2010.',
      'The answer is Edge Hill (Edge Hill University also works).',
    ],
    reveal: {
      title: 'Edge Hill',
      body: [
        'Of course it was. The record has been filed, and the collection has its first entry.',
        'The Archive is now open. Everything you find this month will be kept there, and you will want to return to it more often than you expect.',
      ],
    },
    rewards: ['university-record'],
    entitlements: ['archive'],
    requiresEvidence: [],
  },
  {
    day: 2,
    id: 'a-glimpse-of-you',
    title: 'A Glimpse of You',
    chapter: 1,
    intro: [
      'Every collection has a first sighting. This one was recorded on three small windows, and the windows have frosted over with the cold of a long time ago.',
    ],
    objective: 'Clear the frost from all three windows and find the year the story began.',
    scene: {
      kind: 'frost',
      panes: [
        { id: 'pane-1', text: 'A corridor at Edge Hill. A crowd of people. Someone glimpsed for a moment, and then gone.' },
        { id: 'pane-2', text: '"Wonderfully beautiful," the observer wrote. "And mysterious."' },
        { id: 'pane-3', text: 'The note is dated in the observer\'s careful hand: the autumn of two thousand and ten.' },
      ],
    },
    stages: [
      { kind: 'code', id: 'year', prompt: 'In which year did the story begin?', label: 'Year', digits: 4, format: 'YYYY' },
    ],
    hints: [
      'All three windows have something to say, but only one of them is dated.',
      'The third window gives the year in words.',
      'Two thousand and ten: enter 2010.',
    ],
    reveal: {
      title: '2010',
      body: [
        'The university record now carries a date, and someone has drawn a small star beside it.',
        'Nobody will say who. The Curator insists it was already there.',
      ],
    },
    rewards: ['dated-record'],
    requiresEvidence: ['university-record'],
  },
  {
    day: 3,
    id: 'admit-two',
    title: 'Admit Two',
    chapter: 1,
    intro: [
      'The next object arrived in three pieces, which is not how cinema tickets are supposed to arrive.',
      'Someone has been careless with the collection. Or careful, depending on how you look at it.',
    ],
    objective: 'Reassemble the ticket, then name the film.',
    scene: { kind: 'none' },
    stages: [
      {
        kind: 'placement',
        id: 'pieces',
        prompt: 'Put the three pieces of the ticket back in order.',
        pieces: [
          { id: 'tp-m7', label: '"GULL ··· TRA"', description: 'A middle piece, torn on both edges, with part of a title printed across it.' },
          { id: 'tp-x4', label: '"2010 · EVENING"', description: 'Torn on its left edge. The right edge is clean and rounded.' },
          { id: 'tp-k2', label: '"ADMIT TWO"', description: 'A clean, rounded left edge. Torn on the right.' },
        ],
        slots: [
          { id: 'left', label: 'Left' },
          { id: 'centre', label: 'Centre' },
          { id: 'right', label: 'Right' },
        ],
      },
      { kind: 'text', id: 'film', prompt: 'Which film did you see?', label: 'Name the film', placeholder: 'The title on the ticket' },
    ],
    hints: [
      'Look at the edges. Only one piece has a clean left edge, and only one has a clean right edge.',
      'Once the ticket is whole, the title is half printed. A man washed up on an island of very small people. You saw it near Edge Hill in 2010.',
      'Left: ADMIT TWO. Centre: GULL ··· TRA. Right: 2010. The film is Gulliver\'s Travels, although Gulliver\'s Island works too.',
    ],
    reveal: {
      title: 'Gulliver\'s Island',
      body: [
        'Officially Gulliver\'s Travels. In this family, forever Gulliver\'s Island.',
        'Two seats, one film, and an odd marking on the back of the ticket that refuses to be read in ordinary light. The Curator has filed it carefully. It will matter later.',
      ],
    },
    rewards: ['cinema-ticket'],
    requiresEvidence: [],
  },
  {
    day: 4,
    id: 'the-two-strangers',
    title: 'The Two Strangers',
    chapter: 1,
    intro: [
      'Two records have been found in the same drawer, although they were never filed together. Each describes a stranger. Each is missing the end of a year.',
      'The Curator suspects you know both of these strangers rather well.',
    ],
    objective: 'Complete both birth years.',
    scene: {
      kind: 'clues',
      clues: [
        { title: 'Record A', text: 'She would grow up to love maroon, curry, gin, board games and Winnie-the-Pooh, and to distrust cake. Born 19··.', glyph: 'record' },
        { title: 'Record B', text: 'He would one day catch glimpses of her at university and never quite recover. Born 19··.', glyph: 'record' },
      ],
    },
    stages: [
      {
        kind: 'dials',
        id: 'years',
        prompt: 'Turn the dials to complete each year.',
        dials: [
          { id: 'her', label: 'Record A: her year', prefix: '19', digits: 2 },
          { id: 'his', label: 'Record B: his year', prefix: '19', digits: 2 },
        ],
      },
    ],
    hints: [
      'Record A is about you. Record B is about the man who glimpsed you at Edge Hill.',
      'You need your birth year and Dan\'s, in that order.',
      'Hers is 1991. His is 1986.',
    ],
    reveal: {
      title: 'Two strangers',
      body: [
        'Two records, two years, one drawer. Both are complete.',
        'Keep them close. The Curator has a feeling they will be asked for again very soon.',
      ],
    },
    rewards: ['birth-record-chloe', 'birth-record-dan'],
    requiresEvidence: [],
  },
  {
    day: 5,
    id: 'after-midnight',
    title: 'After Midnight',
    chapter: 1,
    intro: [
      'This clock stopped a long time ago, at some unreasonable hour of the night.',
      'Wind it forward from the evening and see what it remembers.',
    ],
    objective: 'Turn the clock through the night. What did these two do for hours?',
    scene: {
      kind: 'clock',
      fragments: [
        { hour: 21, text: 'Nine o\'clock. "Just one more minute."' },
        { hour: 22, text: 'Ten. Neither of them has noticed the time.' },
        { hour: 23, text: 'Eleven. Still going.' },
        { hour: 0, text: 'Midnight. Somehow the conversation is only getting started.' },
        { hour: 2, text: 'Two in the morning. There is always one more thing to say.' },
        { hour: 4, text: 'Four. The sky is getting lighter, and nobody wants to be the first to stop.' },
      ],
    },
    stages: [
      { kind: 'text', id: 'activity', prompt: 'What did they do all night?', label: 'One or two words', placeholder: 'All night long, they were...' },
    ],
    hints: [
      'Every hour on the clock is the same activity, carried on.',
      'It is what you and Dan did through the night in those early days, instead of sleeping.',
      'You stayed up all night talking. Enter "talking".',
    ],
    reveal: {
      title: 'Talking all night',
      body: [
        'All night, more nights than anyone sensible would admit to.',
        'As the hands settle, an engraving appears on the back of the clock: "Her story comes first." The Curator suggests you remember that. Tomorrow, it will matter.',
      ],
    },
    rewards: ['clock'],
    requiresEvidence: [],
  },
  {
    day: 6,
    id: 'the-first-lock',
    title: 'The First Lock',
    chapter: 1,
    intro: [
      'The first lock in the collection is a small brass thing with four wheels and a great deal of self-importance. It guards a drawer.',
      'It will open for anyone who reads the records properly.',
    ],
    objective: 'Retrieve both birth records and the clock from the Archive, then set the combination.',
    scene: {
      kind: 'clues',
      clues: [
        { title: 'Engraved on the lock plate', text: 'Two strangers. Two digits each. Only the last two.', glyph: 'lock' },
        { title: 'Engraved on the clock', text: 'Her story comes first.', glyph: 'clock' },
      ],
    },
    stages: [
      { kind: 'code', id: 'combination', prompt: 'Set the four wheels.', label: 'Combination', digits: 4, wheels: true },
    ],
    hints: [
      'Open the two birth records and the clock in the Archive. The lock wants two digits from each record.',
      'Take the last two digits of each birth year. The clock tells you whose come first.',
      'Your year ends in 91 and Dan\'s ends in 86. Her story comes first: 9186.',
    ],
    reveal: {
      title: 'The drawer opens',
      body: [
        'Click. The drawer slides open on a breath of cedar.',
        'Inside: a star seal, warm gold and heavier than it looks, and a folded note in an unfamiliar hand.',
        'The note says only: "The Curator has not told you everything."',
        'Someone else has been in the collection.',
      ],
    },
    rewards: ['star-seal', 'note-withheld'],
    requiresEvidence: ['birth-record-chloe', 'birth-record-dan', 'clock'],
    narrativeRefs: ['university-record'],
  },
  {
    day: 7,
    id: 'the-wind',
    title: 'The Wind',
    chapter: 2,
    intro: [
      'The next object is a postcard, and it will not keep still. Wherever this was, the wind was in charge.',
    ],
    objective: 'Hold the postcard steady, read every line, and name the place.',
    scene: {
      kind: 'postcard',
      front: 'Greetings from the coast',
      layers: [
        { id: 'l1', text: 'Sand dunes and tall pines on the Sefton coast, north of Liverpool.' },
        { id: 'l2', text: 'A painted sign by the path: "Red squirrels. Please take care."' },
        { id: 'l3', text: 'A trail through the pinewoods towards the Point, and the beach beyond it.' },
        { id: 'l4', text: 'Written along the edge: "Windiest day of the year. Somebody was very nervous."' },
      ],
    },
    stages: [
      { kind: 'text', id: 'place', prompt: 'Where is this?', label: 'Name the place', placeholder: 'A windy beach' },
    ],
    hints: [
      'Hold the postcard steady until all four lines have been read.',
      'A windy beach with pinewoods and red squirrels, north of Liverpool, where something important happened.',
      'It is Formby.',
    ],
    reveal: {
      title: 'Formby',
      body: [
        'The postcard finally settles. On the reverse, a small map unfolds: a coastline, a pinewood, and a tiny red squirrel inked into one corner like a signature.',
      ],
    },
    rewards: ['coastal-map'],
    requiresEvidence: [],
  },
  {
    day: 8,
    id: 'the-squirrels-secret',
    title: 'The Squirrel\'s Secret',
    chapter: 2,
    intro: [
      'The map points into the pinewoods. Something is hiding there.',
      'If the symbol on the map is anything to go by, it has tufted ears and strong opinions about nuts.',
    ],
    objective: 'Use the symbol on the coastal map to find the right creature in the woods.',
    scene: {
      kind: 'woodland',
      objects: [
        { id: 'w-j3', label: 'Creature by the stream', description: 'A small bird with a round breast, perched on a low branch by the stream.', image: '/assets/engravings/robin.webp', x: 16, y: 62, scale: 0.7 },
        { id: 'w-p8', label: 'Creature in the hollow', description: 'A large-eyed bird, very still, in a hollow of an old trunk.', image: '/assets/engravings/owl.webp', x: 38, y: 30, scale: 0.9 },
        { id: 'w-b5', label: 'Creature in the bracken', description: 'A long-eared animal crouching low in the bracken.', image: '/assets/engravings/hare.webp', x: 58, y: 74, scale: 0.9 },
        { id: 'w-r1', label: 'Creature at the edge of the trees', description: 'A sly, narrow-faced animal watching from the edge of the trees.', image: '/assets/engravings/fox.webp', x: 82, y: 70, scale: 1 },
        { id: 'w-h6', label: 'Creature among the leaves', description: 'A small, round, spiny animal half buried in fallen leaves.', image: '/assets/engravings/hedgehog.webp', x: 32, y: 84, scale: 0.6 },
        { id: 'w-d2', label: 'Creature in the clearing', description: 'A tall animal with branching antlers, standing in the clearing.', image: '/assets/engravings/deer.webp', x: 52, y: 44, scale: 1.2 },
        { id: 'w-s9', label: 'Creature high in the pines', description: 'A small animal with tufted ears and a long, curled, bushy tail, high in a pine.', image: '/assets/engravings/red-squirrel.webp', x: 78, y: 20, scale: 0.65 },
      ],
    },
    stages: [
      { kind: 'choice', id: 'creature', prompt: 'Which creature matches the symbol on the map?', options: [], layout: 'scene' },
    ],
    hints: [
      'Open the coastal map in the Archive and look at the symbol in the corner.',
      'The symbol is a red squirrel. Find it in the woods.',
      'Look high in the pine trees, towards the top right of the scene.',
    ],
    reveal: {
      title: 'Found you',
      body: [
        'The squirrel was guarding a record, and a very small ring-shaped token.',
        'The record notes only three things. It was extremely windy. A question was asked. And the person asking it was very, very nervous.',
      ],
    },
    rewards: ['proposal-record', 'ring-token'],
    requiresEvidence: ['coastal-map'],
  },
  {
    day: 9,
    id: 'the-other-side',
    title: 'The Other Side',
    chapter: 2,
    intro: [
      'A new tool has arrived in the Archive: a small lamp that shows what ordinary light cannot.',
      'The Curator recommends using it on something you already own. Something with an unexplained marking on the back.',
    ],
    objective: 'Find the cinema ticket in the Archive, turn it over, use the lamp, and set the revealed words in order.',
    scene: {
      kind: 'clues',
      clues: [
        { title: 'The lamp', text: 'Hold it over the back of an object. Some inks only appear in its light.', glyph: 'lamp' },
      ],
    },
    stages: [
      {
        kind: 'tiles',
        id: 'phrase',
        prompt: 'Set the words in the order the lamp revealed them.',
        tiles: [
          { id: 't-one', label: 'ONE' },
          { id: 't-forever', label: 'FOREVER' },
          { id: 't-two', label: 'TWO' },
          { id: 't-three', label: 'THREE' },
          { id: 't-promise', label: 'PROMISE' },
          { id: 't-wishes', label: 'WISHES' },
          { id: 't-people', label: 'PEOPLE' },
          { id: 't-and', label: 'AND' },
        ],
        slots: 4,
      },
    ],
    hints: [
      'Open the cinema ticket in the Archive, turn it over and use the lamp.',
      'The lamp reveals four words on the back of the ticket. Use them in the same order.',
      'TWO PEOPLE ONE PROMISE.',
    ],
    reveal: {
      title: 'Two people, one promise',
      body: [
        'The marking on the ticket was never a mistake. It was waiting for the right light.',
        'Behind the words, a sealed wedding invitation, addressed in gold.',
      ],
    },
    rewards: ['wedding-invitation'],
    grantsOnOpen: ['lamp'],
    requiresEvidence: ['cinema-ticket'],
  },
  {
    day: 10,
    id: 'something-small',
    title: 'Something Small',
    chapter: 2,
    intro: [
      'A music box. Wind it, and nothing plays: the song card inside has been cut into pieces.',
      'The Curator would very much like to know what it used to play, and who used to sing it.',
    ],
    objective: 'Rebuild the song title, then name the artist.',
    scene: { kind: 'none' },
    stages: [
      {
        kind: 'tiles',
        id: 'title',
        prompt: 'Rebuild the title from the pieces of the song card.',
        tiles: [
          { id: 's-moments', label: 'Moments' },
          { id: 's-things', label: 'Things' },
          { id: 's-big', label: 'Big' },
          { id: 's-little', label: 'Little' },
          { id: 's-simple', label: 'Simple' },
          { id: 's-days', label: 'Days' },
        ],
        slots: 2,
      },
      {
        kind: 'choice',
        id: 'artist',
        prompt: 'Who recorded it?',
        layout: 'list',
        allowText: true,
        textLabel: 'Or type the artist',
        options: [
          { id: 'a-4n', label: 'Take That' },
          { id: 'a-7q', label: 'One Direction' },
          { id: 'a-2k', label: 'Westlife' },
          { id: 'a-9c', label: 'Ed Sheeran' },
          { id: 'a-5m', label: 'McFly' },
        ],
      },
    ],
    hints: [
      'The title has two words, and it is about noticing the small details of someone.',
      'It is the song Dan sang at your wedding.',
      'Little Things, by One Direction.',
    ],
    reveal: {
      title: 'Little Things',
      body: [
        'The song card is whole again, and the music box gives a small, satisfied click.',
        'Under the velvet lining, a wedding record: performed by the groom, live, in front of everyone. Bravery: considerable.',
      ],
    },
    rewards: ['music-box', 'wedding-song-record'],
    requiresEvidence: [],
  },
  {
    day: 11,
    id: 'an-unusual-breakfast',
    title: 'An Unusual Breakfast',
    chapter: 2,
    intro: [
      'The wedding menu has been found, but someone has spilled tea over the important part.',
      'The Curator, who has strong opinions about weddings, insists the wedding breakfast must have been cake. The Curator is often wrong.',
    ],
    objective: 'Choose the dish that was really served at the wedding breakfast.',
    scene: { kind: 'none' },
    stages: [
      {
        kind: 'choice',
        id: 'dish',
        prompt: 'What was served?',
        layout: 'menu',
        options: [
          { id: 'm-k1', label: 'Roast beef and Yorkshire puddings' },
          { id: 'm-x9', label: 'A three-tier cake', description: 'The Curator\'s suggestion' },
          { id: 'm-c4', label: 'Curry' },
          { id: 'm-f7', label: 'Fish and chips' },
          { id: 'm-s2', label: 'Salmon en croûte' },
          { id: 'm-l6', label: 'Lasagne' },
        ],
      },
    ],
    hints: [
      'The Curator is wrong about the cake. You do not even like cake.',
      'It was one of your favourites, and an unusual choice for a wedding breakfast.',
      'Curry.',
    ],
    reveal: {
      title: 'Curry, obviously',
      body: [
        'Cake was never in with a chance.',
        'The menu is restored, and tucked behind it is a fragment torn from a calendar: October 2014, with one date circled in gold.',
      ],
    },
    rewards: ['wedding-menu', 'calendar-fragment'],
    requiresEvidence: [],
  },
  {
    day: 12,
    id: 'one-promise',
    title: 'One Promise',
    chapter: 2,
    intro: [
      'The wedding invitation is fastened with a lock of its own. Four wheels again.',
      'The proposal, the promise, the song and the breakfast are all in the Archive. Only one thing is missing: the date.',
    ],
    objective: 'Set the wedding date on the lock, day first, then month.',
    scene: {
      kind: 'clues',
      clues: [
        { title: 'Printed on the lock', text: 'DD MM. Day first, then month. Two digits each.', glyph: 'lock' },
      ],
    },
    stages: [
      { kind: 'code', id: 'combination', prompt: 'Set the date: DDMM.', label: 'Wedding date as DDMM', digits: 4, format: 'DD MM', wheels: true },
    ],
    hints: [
      'Look at the calendar fragment in the Archive.',
      'The lock wants the day, then the month, as two digits each (DDMM).',
      'Your wedding was on 25 October 2014: enter 2510.',
    ],
    reveal: {
      title: 'The invitation opens',
      body: [
        'Inside: a silver moon seal and the wedding record itself, pressed flat like a flower.',
        'And then something that should not be there at all. A note, in pencil, from two people who are definitely not the Curator:',
        '"We are the Junior Investigators. We are not supposed to be in here. Keep looking. There are more secret things."',
      ],
    },
    rewards: ['moon-seal', 'wedding-record', 'intercepted-message'],
    requiresEvidence: ['proposal-record', 'wedding-invitation', 'wedding-song-record', 'wedding-menu', 'calendar-fragment'],
  },
  {
    day: 13,
    id: 'two-tickets-to-paradise',
    title: 'Two Tickets to Paradise',
    chapter: 3,
    intro: [
      'A travel wallet, emptied out on the Curator\'s desk. The two ticket stubs inside have been torn into fragments.',
      'Match the fragments to where you went, and what you went to see.',
    ],
    objective: 'Match the destination and the attraction.',
    scene: { kind: 'none' },
    stages: [
      {
        kind: 'fields',
        id: 'trip',
        prompt: 'Rebuild the travel ticket.',
        fields: [
          {
            id: 'destination', label: 'Destination', type: 'choice',
            options: [
              { id: 'd-3p', label: 'Lapland' },
              { id: 'd-8f', label: 'Florida' },
              { id: 'd-1r', label: 'Paris' },
              { id: 'd-6y', label: 'New York' },
            ],
          },
          {
            id: 'attraction', label: 'Attraction', type: 'choice',
            options: [
              { id: 'x-2e', label: 'The Eiffel Tower' },
              { id: 'x-9s', label: 'Santa\'s grotto' },
              { id: 'x-4u', label: 'Universal Studios' },
              { id: 'x-7c', label: 'Central Park' },
            ],
          },
        ],
      },
    ],
    hints: [
      'Think about your honeymoon: sunshine, not snow.',
      'The destination is a US state, and the attraction is a film studio theme park there.',
      'Florida and Universal Studios.',
    ],
    reveal: {
      title: 'Florida',
      body: [
        'Sunshine, rollercoasters, Universal Studios and absolutely nothing to worry about.',
        'The Curator has filed this one under "happiest".',
      ],
    },
    rewards: ['honeymoon-postcard'],
    requiresEvidence: [],
  },
  {
    day: 14,
    id: 'the-house-we-built',
    title: 'The House We Built',
    chapter: 3,
    intro: [
      'A tiny model house sits on the Curator\'s desk. The Curator would like it to be clear that this is only a model, not a portrait of anywhere in particular.',
      'But it has been labelled with great care. Turn it around and find its street.',
    ],
    objective: 'Inspect the model house and name the street.',
    scene: {
      kind: 'house',
      faces: [
        { id: 'front', label: 'Front', text: 'A front door, and a lamp lit in the window. A small card on the step reads "First home".' },
        { id: 'side', label: 'Side', text: 'A small enamel street sign shows a single flower: tall, with bell-shaped blooms climbing the stem.', image: '/assets/engravings/foxglove.webp' },
        { id: 'back', label: 'Back', text: 'A garden gate. Chalked on it, in capitals: "______ WAY".' },
        { id: 'roof', label: 'Roof', text: 'Tucked behind the chimney: "Where the two of you first had a front door of your own."' },
      ],
    },
    stages: [
      { kind: 'text', id: 'street', prompt: 'Which street is this?', label: 'Street name', placeholder: '______ Way' },
    ],
    hints: [
      'Turn the house to find the enamel sign on the side.',
      'The flower on the sign is a foxglove.',
      'Your first home was on Foxglove Way.',
    ],
    reveal: {
      title: 'Foxglove Way',
      body: [
        'The front door of the little house swings open and a key drops out, along with a neat address label.',
        'First homes are like that: small, a bit chaotic, and full of things you will want to keep.',
      ],
    },
    rewards: ['house-key', 'address-label'],
    requiresEvidence: [],
  },
  {
    day: 15,
    id: 'the-curators-mistake',
    title: 'The Curator\'s Mistake',
    chapter: 3,
    intro: [
      'The Curator has been tidying the collection and has, apparently, made a small error.',
      'A new copy of an old record has appeared, and it does not quite match the original.',
    ],
    objective: 'Compare the copy with the original record, find the altered line and restore it.',
    scene: { kind: 'none' },
    stages: [
      {
        kind: 'compare',
        id: 'correction',
        prompt: 'Select the line that has been altered, then enter its original value.',
        left: originalRecord,
        right: alteredRecord,
        valueLabel: 'Original value',
      },
    ],
    hints: [
      'Open the dated university record in the Archive and compare it with the copy line by line.',
      'Only one line is different, and it is a year.',
      'The copy says 2012. The original says 2010. Select the year and enter 2010.',
    ],
    reveal: {
      title: 'Corrected',
      body: [
        'And then, in the margin, a correction to the correction, in pencil:',
        '"He didn\'t make a mistake. He wanted to see if you would notice. You always notice."',
        'The Curator, it seems, knows you personally. The Junior Investigators would like that noted.',
      ],
    },
    rewards: ['intercepted-correction'],
    requiresEvidence: ['dated-record'],
  },
  {
    day: 16,
    id: 'the-chloe-collection',
    title: 'The Chloe Collection',
    chapter: 3,
    intro: [
      'Eight objects have been delivered to the Curator in a single box marked "C".',
      'Some of them belong in a collection about you. Some of them very much do not.',
    ],
    objective: 'Sort all eight objects: things you love, and things you dislike.',
    scene: { kind: 'none' },
    stages: [
      {
        kind: 'sorting',
        id: 'sort',
        prompt: 'Place each object in a drawer.',
        items: [
          { id: 'o-7f', label: 'Cake', glyph: 'cake' },
          { id: 'o-2k', label: 'Gin', glyph: 'gin' },
          { id: 'o-9d', label: 'Bugs', glyph: 'bug' },
          { id: 'o-4r', label: 'Cadbury chocolate', glyph: 'chocolate' },
          { id: 'o-1m', label: 'Tendons', glyph: 'tendon' },
          { id: 'o-6c', label: 'Curry', glyph: 'curry' },
          { id: 'o-3x', label: 'Dirt', glyph: 'dirt' },
          { id: 'o-8w', label: 'The colour maroon', glyph: 'maroon' },
        ],
        bins: [
          { id: 'bin-a', label: 'Things Chloe loves' },
          { id: 'bin-b', label: 'Things Chloe dislikes' },
        ],
      },
    ],
    hints: [
      'You know this one better than anyone. Trust your instincts.',
      'Four are favourites. Four are things you would rather not go near, and one of those surprises most people.',
      'Loves: Cadbury chocolate, curry, gin and maroon. Dislikes: cake, tendons, bugs and dirt.',
    ],
    reveal: {
      title: 'Sorted',
      body: [
        'The Curator has filed "cake" under "dislikes", with visible confusion.',
        'In the bottom of the box, wrapped in tissue, is a single maroon ornament.',
      ],
    },
    rewards: ['maroon-ornament'],
    requiresEvidence: [],
  },
  {
    day: 17,
    id: 'the-incident',
    title: 'The Incident',
    chapter: 3,
    intro: [
      'The Curator has received a confidential report concerning an incident at your parents\' house.',
      'Three exhibits were recovered from the scene. The conclusion of the report has been redacted. Please restore it.',
    ],
    objective: 'Study the three exhibits and rebuild the report\'s conclusion.',
    scene: {
      kind: 'clues',
      clues: [
        { title: 'Exhibit A', text: 'A porch.', glyph: 'porch' },
        { title: 'Exhibit B', text: 'A door, no longer entirely the shape it used to be.', glyph: 'door' },
        { title: 'Exhibit C', text: 'A man, extremely embarrassed.', glyph: 'man' },
      ],
    },
    stages: [
      {
        kind: 'fields',
        id: 'conclusion',
        prompt: 'Complete the conclusion.',
        sentence: true,
        textAlternative: { label: 'Or write the conclusion yourself' },
        fields: [
          {
            id: 'who', label: 'Who', type: 'choice',
            options: [
              { id: 'w-7p', label: 'The postman' },
              { id: 'w-3d', label: 'Dan' },
              { id: 'w-9r', label: 'A reindeer' },
            ],
          },
          {
            id: 'what', label: 'Did what', type: 'choice',
            options: [
              { id: 'v-2l', label: 'locked himself out of' },
              { id: 'v-6p', label: 'painted' },
              { id: 'v-4c', label: 'crashed into' },
            ],
          },
          {
            id: 'object', label: 'To what', type: 'choice',
            options: [
              { id: 'b-5s', label: 'the garden shed' },
              { id: 'b-1d', label: 'the porch door' },
              { id: 'b-8t', label: 'the Christmas tree' },
            ],
          },
        ],
      },
    ],
    hints: [
      'Exhibit C is someone you know very well. Exhibit B is the victim.',
      'It involves Dan and your parents\' porch door. It did not end well for the door.',
      'Dan crashed into the porch door.',
    ],
    reveal: {
      title: 'Official Incident Report',
      body: [
        'Reference: PORCH/001. Classification: deeply embarrassing.',
        'Finding: the subject made contact with the porch door of the residence. The porch door did not move out of the way.',
        'Recommendation: this incident is never to be mentioned again, except at Christmas, on birthdays, and whenever it would be funny.',
      ],
    },
    rewards: ['incident-report'],
    requiresEvidence: [],
  },
  {
    day: 18,
    id: 'home',
    title: 'Home',
    chapter: 3,
    intro: [
      'The third lock is different. It has no wheels.',
      'Instead there are three empty slots, each shaped for something you already own: a house, a colour, and the beginning of the story.',
    ],
    objective: 'Fill each slot with the right evidence from the Archive, or type what it shows.',
    scene: { kind: 'none' },
    stages: [
      {
        kind: 'evidence-slots',
        id: 'slots',
        prompt: 'Place the evidence.',
        slots: [
          { id: 'street', label: 'The house', hint: 'Where was your first home?' },
          { id: 'colour', label: 'The colour', hint: 'Which colour runs through the collection?' },
          { id: 'year', label: 'The beginning', hint: 'When did the story begin?', inputMode: 'numeric' },
        ],
      },
    ],
    hints: [
      'Each slot wants something from the Archive: something from your first home, something in your colour, and the corrected record.',
      'The address label, the maroon ornament and the 2010 university record.',
      'Foxglove Way. Maroon. 2010.',
    ],
    reveal: {
      title: 'Home',
      body: [
        'The slots glow, one after another, and the lock gives way.',
        'Behind it: a home seal, and a drawer the Curator swears was never there before.',
        'Inside are two family records, sealed with wax. Their labels say only "The first little mystery" and "The second little mystery".',
      ],
    },
    rewards: ['home-seal', 'family-record-1', 'family-record-2'],
    requiresEvidence: ['address-label', 'maroon-ornament', 'dated-record'],
    narrativeRefs: ['house-key', 'intercepted-correction'],
  },
  {
    day: 19,
    id: 'the-first-little-mystery',
    title: 'The First Little Mystery',
    chapter: 4,
    intro: [
      'The first family record breaks its seal.',
      '"Analytical. Thoughtful. Inquisitive. Never far from a puzzle, a fidget or a Rubik\'s cube, and suspected of doing actual magic."',
      'The record has a name: Oliver. The date of his arrival has been left for you to find.',
    ],
    objective: 'Find Oliver\'s birthday on the calendar.',
    scene: { kind: 'none' },
    stages: [
      { kind: 'date', id: 'birthday', prompt: 'When did Oliver arrive?', label: 'Oliver\'s birthday', year: 2016 },
    ],
    hints: [
      'Oliver\'s family record is in the Archive.',
      'It is the very first day of a very important month. This calendar may have been designed around it.',
      '1 December.',
    ],
    reveal: {
      title: '1 December',
      body: [
        'The first door of this calendar opened on Oliver\'s birthday. That was not an accident.',
        'His record now shows a day value, in gold: 01.',
      ],
    },
    rewards: [],
    revealsLayers: ['family-record-1:day-value'],
    requiresEvidence: ['family-record-1'],
  },
  {
    day: 20,
    id: 'the-junior-investigators',
    title: 'The Junior Investigators',
    chapter: 4,
    intro: [
      'The Junior Investigators have been leaving notes all month. Today they have left their case files.',
      'Read them carefully, and decide who is who.',
    ],
    objective: 'Match each investigator to the right family record.',
    scene: {
      kind: 'media',
      slot: 'investigators',
      transcriptTitle: 'Case files',
      transcript: [
        'Investigator One. Specialist in patterns, cubes and impossible tricks. Thinks carefully before answering. Asks "why?" more than anyone in the building.',
        'Investigator Two. Specialist in speed, superheroes and very small cars that go very fast. Laughs the loudest. Has an imagination roughly the size of a planet.',
      ],
      isRecording: false,
    },
    stages: [
      {
        kind: 'placement',
        id: 'match',
        prompt: 'Place each investigator\'s case file with the right name.',
        pieces: [
          { id: 'inv-b', label: 'Investigator Two', description: 'Speed, superheroes and very small fast cars.' },
          { id: 'inv-a', label: 'Investigator One', description: 'Patterns, cubes and impossible tricks.' },
        ],
        slots: [
          { id: 'slot-o', label: 'Oliver' },
          { id: 'slot-g', label: 'George' },
        ],
      },
    ],
    hints: [
      'One investigator loves puzzles and magic. The other loves superheroes and fast little cars.',
      'Oliver loves magic and Rubik\'s cubes. George loves superheroes and Hot Wheels.',
      'Investigator One is Oliver. Investigator Two is George.',
    ],
    reveal: {
      title: 'Case closed',
      body: [
        'The Junior Investigators are Oliver and George, and they have been working for the Curator all along.',
        'Which raises a rather obvious question about who the Curator might be.',
      ],
    },
    rewards: ['investigator-dossier'],
    requiresEvidence: ['family-record-1', 'family-record-2'],
  },
  {
    day: 21,
    id: 'the-second-little-mystery',
    title: 'The Second Little Mystery',
    chapter: 4,
    intro: [
      'The second family record breaks its seal.',
      '"Energetic. Funny. Imaginative. Superheroes and Hot Wheels, often at the same time."',
      'The name on it: George. The date of his arrival is missing.',
    ],
    objective: 'Find George\'s birthday on the calendar.',
    scene: { kind: 'none' },
    stages: [
      { kind: 'date', id: 'birthday', prompt: 'When did George arrive?', label: 'George\'s birthday', year: 2019 },
    ],
    hints: [
      'George\'s family record is in the Archive.',
      'It is an autumn birthday, on the very last day of September.',
      '30 September.',
    ],
    reveal: {
      title: '30 September',
      body: [
        'The last day of September, and the beginning of a great deal of noise.',
        'His record now shows a day value, in gold: 30.',
      ],
    },
    rewards: [],
    revealsLayers: ['family-record-2:day-value'],
    requiresEvidence: ['family-record-2'],
  },
  {
    day: 22,
    id: 'our-language',
    title: 'Our Language',
    chapter: 4,
    intro: [
      'Every family has words that mean more than they say.',
      'The Curator has found two objects that, together, mean everything: an engraving of an elephant, and a small glass of something orange.',
    ],
    objective: 'Put the two words together.',
    scene: {
      kind: 'clues',
      clues: [
        { title: 'An engraving', text: 'An elephant, drawn with great seriousness.', image: '/assets/engravings/elephant.webp' },
        { title: 'A small glass', text: 'Something orange, freshly poured.', glyph: 'juice' },
      ],
    },
    stages: [
      {
        kind: 'tiles',
        id: 'phrase',
        prompt: 'Choose the two words, in order.',
        allowText: true,
        textLabel: 'Or type the phrase',
        tiles: [
          { id: 'p-trunk', label: 'Trunk' },
          { id: 'p-juice', label: 'Juice' },
          { id: 'p-orange', label: 'Orange' },
          { id: 'p-elephant', label: 'Elephant' },
          { id: 'p-squash', label: 'Squash' },
          { id: 'p-peanut', label: 'Peanut' },
        ],
        slots: 2,
      },
    ],
    hints: [
      'It is a phrase only the two of you really use.',
      'Mouth it silently and it looks exactly like three other words.',
      'Elephant Juice.',
    ],
    reveal: {
      title: 'Elephant Juice',
      body: [
        'A heart seal, and a letter.',
        'Some words mean much more to two people than they do to everyone else. To anyone else, this is nonsense. To us, it never has been.',
      ],
    },
    rewards: ['heart-seal', 'personal-letter'],
    requiresEvidence: [],
  },
  {
    day: 23,
    id: 'who-is-the-curator',
    title: 'Who Is the Curator?',
    chapter: 4,
    intro: [
      'It is time to look at the evidence properly.',
      'The Curator has pinned everything to a board, which is either very brave or very careless. Two new notes have been pinned up overnight.',
    ],
    objective: 'Connect the evidence that describes the Curator, then name them.',
    scene: {
      kind: 'clues',
      clues: [
        { title: 'Note, unsigned', text: '"Morning, Bub."', glyph: 'note' },
        { title: 'Note, addressed to the Curator', text: '"Night night, Chunky and Grey."', glyph: 'note' },
      ],
    },
    stages: [
      {
        kind: 'select-many',
        id: 'board',
        prompt: 'Connect every clue that describes the Curator. Leave out anything that describes only you.',
        centreLabel: 'The Curator',
        options: [
          { id: 'note-bub', label: 'Note: "Morning, Bub."', description: 'What someone calls you.' },
          { id: 'maroon-ornament', label: 'The maroon ornament', description: 'From the Chloe Collection.' },
          { id: 'wedding-song-record', label: 'Wedding song record', description: 'Who sang Little Things.' },
          { id: 'note-chunky', label: 'Note: "Night night, Chunky and Grey."', description: 'What you call someone.' },
          { id: 'birth-record-chloe', label: 'Record A: born 1991', description: 'A birth record.' },
          { id: 'incident-report', label: 'Incident report PORCH/001', description: 'Who met the porch door.' },
          { id: 'university-record', label: 'University record', description: 'Who first glimpsed you.' },
        ],
      },
      { kind: 'text', id: 'name', prompt: 'Who is the Curator?', label: 'Name the Curator', placeholder: 'The Curator is...' },
    ],
    hints: [
      'Choose the clues about the person who has been writing to you: what he calls you, what you call him, what he sang, what he crashed into, and where he first saw you.',
      'Leave out the maroon ornament and your own birth record: they describe you. Then ask yourself who calls you Bub.',
      'Connect Bub, Chunky and Grey, the wedding song, the porch incident and the university record. The Curator is Dan.',
    ],
    reveal: {
      title: 'Hello, Bub',
      body: [
        'Yes. It was me, all along.',
        'The man who glimpsed you at Edge Hill, sang Little Things in front of everyone and crashed into your parents\' porch door. I am the Curator.',
        'My two Junior Investigators are Oliver and George, who have been helping me hide all of this from you.',
        'There is one more thing to find, and they have left you instructions.',
      ],
    },
    rewards: ['final-instruction', 'curator-identity'],
    requiresEvidence: ['wedding-song-record', 'incident-report', 'university-record', 'investigator-dossier'],
  },
  {
    day: 24,
    id: 'the-christmas-key',
    title: 'The Christmas Key',
    chapter: 4,
    intro: [
      'Christmas Eve. Everything in the collection has led here.',
      'One last lock, and four empty places shaped like the seals you have earned.',
    ],
    objective: 'Set the final combination, then return the four seals to their places.',
    scene: { kind: 'emblem' },
    stages: [
      { kind: 'code', id: 'combination', prompt: 'Four digits for everything that matters.', label: 'Final combination', digits: 4, wheels: true },
      {
        kind: 'placement',
        id: 'seals',
        prompt: 'Return each seal to the place shaped for it.',
        source: 'evidence',
        pieces: [],
        slots: [
          { id: 'pos-n', label: 'A five-pointed outline', glyph: 'star' },
          { id: 'pos-e', label: 'A crescent outline', glyph: 'moon' },
          { id: 'pos-s', label: 'An outline of a roof and walls', glyph: 'home' },
          { id: 'pos-w', label: 'A rounded, pointed outline', glyph: 'heart' },
        ],
      },
    ],
    hints: [
      'The last combination belongs to two people who mean everything to you.',
      'Find Oliver and George\'s family records. You only need the day of each month.',
      'Oliver is 01. George is 30. Put them together, oldest first: 0130. Then match each seal to its outline.',
    ],
    reveal: {
      title: 'The Christmas Key',
      body: [
        'All those little moments. All those ridiculous memories. Everything that brought us here.',
        'Two people. One promise. Two incredible boys.',
        'You\'ve found the most important part of the collection.',
        'Keep this key safe until Christmas morning.',
      ],
    },
    rewards: ['christmas-key'],
    entitlements: ['christmas-key'],
    requiresEvidence: ['family-record-1', 'family-record-2', 'final-instruction', 'star-seal', 'moon-seal', 'home-seal', 'heart-seal'],
  },
  {
    day: 25,
    id: 'christmas-morning',
    title: 'Christmas Morning',
    chapter: 5,
    intro: [
      'Merry Christmas.',
      'The vault is waiting, and you are holding the key.',
    ],
    objective: 'Take the Christmas Key from the Archive and open the vault.',
    scene: { kind: 'vault' },
    stages: [
      { kind: 'key', id: 'unlock', prompt: 'Insert the key and turn it.' },
    ],
    hints: [
      'The Christmas Key is in your Archive. Bring it to the vault.',
      'Drag the key into the lock, or use the "Insert the key" button.',
      'Insert the key, then turn it. That is all. Merry Christmas.',
    ],
    reveal: {
      title: 'Merry Christmas, Bub',
      body: [],
    },
    rewards: [],
    requiresEvidence: ['christmas-key'],
  },
];

export function getDay(day: number): DayContent | undefined {
  return DAYS.find((entry) => entry.day === day);
}
