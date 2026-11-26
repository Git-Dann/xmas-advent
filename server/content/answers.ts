import type { Matcher } from '../validation/matchers';

/**
 * PRIVATE answer configuration. Server-only. Never imported by anything under src/.
 * The build check (scripts/check-bundle.mjs) fails if any of these values reach dist/.
 * Dan can override any matcher from the admin area; overrides are stored in D1.
 *
 * Keyed by day, then stage id.
 */
export const ANSWERS: Record<number, Record<string, Matcher>> = {
  1: { place: { type: 'text', accept: ['Edge Hill', 'Edgehill', 'Edge Hill University', 'Edgehill University'] } },
  2: { year: { type: 'code', value: '2010' } },
  3: {
    pieces: { type: 'mapping', map: { left: 'tp-k2', centre: 'tp-m7', right: 'tp-x4' } },
    film: { type: 'text', accept: ["Gulliver's Island", 'Gullivers Island', "Gulliver's Travels", 'Gullivers Travels', 'Gulliver'] },
  },
  4: { years: { type: 'fields', fields: { her: { type: 'code', value: '1991' }, his: { type: 'code', value: '1986' } } } },
  5: {
    activity: {
      type: 'text',
      accept: [
        'Talking', 'Chatting', 'Texting', 'Talking all night', 'Staying up talking', 'Talking to each other',
        'Talk', 'Chat', 'Talked', 'Chatted', 'Staying up all night talking', 'Talking all night long', 'Talking for hours',
      ],
    },
  },
  6: { combination: { type: 'code', value: '9186' } },
  7: { place: { type: 'text', accept: ['Formby', 'Formby Beach', 'Formby Point'] } },
  8: { creature: { type: 'choice', value: 'w-s9' } },
  9: { phrase: { type: 'sequence', items: ['TWO', 'PEOPLE', 'ONE', 'PROMISE'], compare: 'text' } },
  10: {
    title: { type: 'sequence', items: ['Little', 'Things'], compare: 'text' },
    artist: { type: 'any', of: [{ type: 'choice', value: 'a-7q' }, { type: 'text', accept: ['One Direction', '1D', '1 Direction'] }] },
  },
  11: { dish: { type: 'choice', value: 'm-c4' } },
  12: { combination: { type: 'code', value: '2510' } },
  13: {
    trip: {
      type: 'fields',
      fields: {
        destination: { type: 'any', of: [{ type: 'choice', value: 'd-8f' }, { type: 'text', accept: ['Florida', 'Orlando', 'Orlando Florida'] }] },
        attraction: {
          type: 'any',
          of: [
            { type: 'choice', value: 'x-4u' },
            { type: 'text', accept: ['Universal Studios', 'Universal', 'Universal Orlando', 'Universal Orlando Resort', 'Universal Studios Florida', 'Universal Studios Orlando'] },
          ],
        },
      },
    },
  },
  14: { street: { type: 'text', accept: ['Foxglove Way', 'Foxglove'] } },
  15: { correction: { type: 'fields', fields: { field: { type: 'choice', value: 'f-c' }, value: { type: 'code', value: '2010' } } } },
  16: {
    sort: {
      type: 'mapping',
      map: { 'o-4r': 'bin-a', 'o-6c': 'bin-a', 'o-2k': 'bin-a', 'o-8w': 'bin-a', 'o-7f': 'bin-b', 'o-1m': 'bin-b', 'o-9d': 'bin-b', 'o-3x': 'bin-b' },
    },
  },
  17: {
    conclusion: {
      type: 'any',
      of: [
        { type: 'fields', fields: { who: { type: 'choice', value: 'w-3d' }, what: { type: 'choice', value: 'v-4c' }, object: { type: 'choice', value: 'b-1d' } } },
        {
          type: 'text',
          accept: [
            'Dan crashed into the porch door', 'Crashed into the porch door', 'Dan crashed into the porch', 'Crashed into the porch',
            'Dan hit the porch door', 'Hit the porch door', 'Dan drove into the porch door', 'Drove into the porch door',
            'He crashed into the porch door', 'Dan crashed into my parents porch door', 'Dan crashed into the porch door at my parents house',
          ],
        },
      ],
    },
  },
  18: {
    slots: {
      type: 'fields',
      fields: {
        street: { type: 'evidenceOrText', evidence: ['address-label', 'house-key'], text: { type: 'text', accept: ['Foxglove Way', 'Foxglove'] } },
        colour: { type: 'evidenceOrText', evidence: ['maroon-ornament'], text: { type: 'text', accept: ['Maroon'] } },
        year: { type: 'evidenceOrText', evidence: ['dated-record', 'intercepted-correction'], text: { type: 'code', value: '2010' } },
      },
    },
  },
  19: { birthday: { type: 'date', day: 1, month: 12 } },
  20: { match: { type: 'mapping', map: { 'slot-o': 'inv-a', 'slot-g': 'inv-b' } } },
  21: { birthday: { type: 'date', day: 30, month: 9 } },
  22: {
    phrase: {
      type: 'any',
      of: [{ type: 'sequence', items: ['Elephant', 'Juice'], compare: 'text' }, { type: 'text', accept: ['Elephant Juice'] }],
    },
  },
  23: {
    board: { type: 'set', items: ['note-bub', 'note-chunky', 'wedding-song-record', 'incident-report', 'university-record'] },
    name: { type: 'text', accept: ['Dan', 'Daniel', 'Dan Lindsay', 'Daniel Lindsay', 'My husband', 'Husband', 'Chunky and Grey'] },
  },
  24: {
    combination: { type: 'code', value: '0130' },
    seals: { type: 'mapping', map: { 'pos-n': 'star-seal', 'pos-e': 'moon-seal', 'pos-s': 'home-seal', 'pos-w': 'heart-seal' } },
  },
  25: { unlock: { type: 'evidence', id: 'christmas-key' } },
};

/** Default final message. Dan edits this privately in the admin area before Christmas. */
export const FINAL_MESSAGE = {
  title: 'Merry Christmas, Bub.',
  letter: [
    'The best thing about this Christmas isn\'t what\'s waiting underneath the tree.',
    'It\'s everything that brought us here.',
    'From those first glimpses at Edge Hill, to staying up all night talking, to a very windy beach, curry at our wedding, Florida, our first home and the two incredible little people who changed everything.',
    'I\'d do it all again with you.',
    'Every ridiculous, wonderful bit of it.',
    'Elephant Juice.',
  ],
  signature: 'Love, Chunky and Grey, Oliver and George.',
  closing: 'Now go and open your presents.',
};

/** Supportive responses for incorrect answers. Never reveal or hint at the answer. */
export const GENTLE_RESPONSES = [
  'Not quite. The collection is patient.',
  'Not this time. Have another look at the evidence.',
  'Close the drawer, take a breath, and try again.',
  'The lock stays put for now. No rush.',
  'Not yet. A hint is always there if you want one.',
];
