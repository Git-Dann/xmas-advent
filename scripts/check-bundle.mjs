/**
 * Fails the build if private answers, solution identifiers or personal family details appear in
 * the public build output (dist/). Puzzle content and answers must only ever live in the
 * server-side Pages Functions bundle.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const FORBIDDEN = [
  'Edge Hill', 'Edgehill', 'Gulliver', 'Formby', 'Little Things', 'One Direction', 'Foxglove Way', 'Elephant Juice',
  'Chunky and Grey', 'Universal Studios', 'Lindsay', 'Oliver', 'George', '9186', '2510', 'tp-k2', 'w-s9', 'o-4r',
  'bin-a', 'pos-n', 'Merry Christmas, Bub', 'porch door', 'Story of Us', 'Wedding Breakfast', 'Her story comes first',
];
const TEXT = /\.(js|css|html|json|txt|webmanifest|svg|map)$/;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const problems = [];
for (const file of walk('dist').filter((f) => TEXT.test(f))) {
  const text = readFileSync(file, 'utf8');
  for (const word of FORBIDDEN) if (text.includes(word)) problems.push(`${file}: contains "${word}"`);
}
if (problems.length) {
  console.error('Private content found in the public build:\n' + problems.join('\n'));
  process.exit(1);
}
console.log('Bundle privacy check passed: no answers or private details in dist/.');
