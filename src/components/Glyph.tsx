import type { SVGProps } from 'react';

/**
 * A single, consistent line-icon set (24px grid, 1.5px stroke, round joins). Programmatic UI
 * iconography, drawn for this project. Decorative by default; pass a title to make it meaningful.
 */
const PATHS: Record<string, string> = {
  star: 'M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.6l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z',
  moon: 'M19.5 14.6A8 8 0 019.4 4.5a8 8 0 1010.1 10.1z',
  home: 'M3.5 11.2L12 4l8.5 7.2M6 9.4V20h12V9.4M10 20v-5.5h4V20',
  heart: 'M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0112 7.4a4.4 4.4 0 017.5 2.5C19.5 15.4 12 20 12 20z',
  key: 'M14.5 4.5a5 5 0 11-3.9 8.1L4 19.2V21h2.5v-1.5H8V18h1.5l1.9-1.9A5 5 0 0114.5 4.5zM16 8.2a.8.8 0 100 .1',
  lock: 'M6.5 10.5h11a1 1 0 011 1V20a1 1 0 01-1 1h-11a1 1 0 01-1-1v-8.5a1 1 0 011-1zM8.5 10.5V7.5a3.5 3.5 0 017 0v3M12 14.5v2.5',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3.5 2',
  record: 'M7 3.5h7.5L19 8v12.5H7zM14.5 3.5V8H19M9.5 12h7M9.5 15h7M9.5 18h4.5',
  ticket: 'M3.5 7.5h17v3a1.5 1.5 0 000 3v3h-17v-3a1.5 1.5 0 000-3zM14 7.5v9',
  envelope: 'M3.5 6.5h17v11h-17zM3.5 6.5l8.5 6.5 8.5-6.5',
  note: 'M5.5 4.5h13v15h-13zM8.5 8.5h7M8.5 11.5h7M8.5 14.5h4',
  map: 'M3.5 6l5.5-2 6 2 5.5-2v14l-5.5 2-6-2-5.5 2zM9 4v14M15 6v14',
  ring: 'M12 20.5a6 6 0 100-12 6 6 0 000 12zM9.5 8.8L8 5.5 12 3.5l4 2-1.5 3.3',
  music: 'M9 18.5V6l10-2v12.5M9 18.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19 16.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
  menu: 'M6 3.5h12v17H6zM9 8h6M9 11.5h6M9 15h4',
  calendar: 'M4 6h16v14H4zM4 10h16M8.5 3.5v4M15.5 3.5v4',
  sun: 'M12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4',
  ornament: 'M12 21a7 7 0 100-14 7 7 0 000 14zM10.5 7V5h3v2M12 5V3M5.5 13.5c4.3 1.4 8.7 1.4 13 0',
  door: 'M6 21V3.5h12V21M4 21h16M14.5 12.5v.5',
  magnifier: 'M10.5 17a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM15.3 15.3L20.5 20.5',
  lamp: 'M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9V16h7v-2.1A6 6 0 0012 3z',
  foxglove: 'M12 21V4M12 7c-2 0-3 1.5-3 3s1 2 3 2M12 11c2 0 3 1.5 3 3s-1 2-3 2M12 4c-1.4 0-2 1-2 2s.8 1.5 2 1.5',
  cake: 'M4.5 20.5h15v-7h-15zM4.5 16c2.5 1.5 5 1.5 7.5 0s5-1.5 7.5 0M8 13.5V11M12 13.5V11M16 13.5V11M8 9V8M12 9V8M16 9V8',
  gin: 'M7 3.5h10l-1.5 8a3.5 3.5 0 01-7 0zM12 15v5.5M8.5 20.5h7M8.3 7.5h7.4',
  bug: 'M12 20a5 5 0 005-5v-3a5 5 0 00-10 0v3a5 5 0 005 5zM12 9v11M7 12H3.5M20.5 12H17M7.5 16.5l-3 2M16.5 16.5l3 2M9.5 7.5L8 5M14.5 7.5L16 5',
  chocolate: 'M5.5 3.5h13v17h-13zM5.5 9h13M5.5 14.5h13M12 3.5v17',
  tendon: 'M5 8c3 0 3 8 7 8s4-8 7-8M5 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM22 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z',
  curry: 'M3.5 11.5h17a8.5 8.5 0 01-17 0zM8 8c0-1.5 1-1.5 1-3M12 8c0-1.5 1-1.5 1-3M16 8c0-1.5 1-1.5 1-3',
  dirt: 'M3.5 18.5c2-3 4-4 6-2.5s3.5-3 6-2.5 3.5 2.5 5 5zM7 13.5a1 1 0 100-.1M14.5 9.5a1 1 0 100-.1M10.5 6.5a1 1 0 100-.1',
  maroon: 'M5 5h14v14H5z',
  juice: 'M7 6.5h10l-1.3 13a1 1 0 01-1 .9H9.3a1 1 0 01-1-.9zM7.4 10.5h9.2M14 6.5l2-3',
  porch: 'M3.5 20.5h17M5 20.5v-9M19 20.5v-9M3.5 11.5L12 5l8.5 6.5M9.5 20.5v-6h5v6',
  man: 'M12 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM5 20.5c.5-4 3.5-6.5 7-6.5s6.5 2.5 7 6.5M15.5 6.5l1.2-.8',
  archive: 'M3.5 4.5h17v4h-17zM5 8.5v11h14v-11M10 12h4',
  vault: 'M4 4h16v16H4zM12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM12 10.5v3M10.5 12h3M4 8h-1.5M4 16h-1.5',
  village: 'M3 20.5h18M4.5 20.5v-7L9 10l4.5 3.5v7M13.5 20.5v-9.5L17 8l3 3v9.5M7.5 20.5v-3h3v3',
  sound: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11',
  muted: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5M21 9.5l-5 5',
  close: 'M6 6l12 12M18 6L6 18',
  back: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  turn: 'M4 12a8 8 0 0113.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 01-13.7 5.6L4 15.5M4 20v-4.5h4.5',
  zoom: 'M10.5 17a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM15.3 15.3l5.2 5.2M8 10.5h5M10.5 8v5',
  rotate: 'M20 12a8 8 0 11-2.3-5.7M20 4v4.5h-4.5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  hint: 'M9.5 18h5M10.5 21h3M12 3a5.5 5.5 0 00-3.2 10V15.5h6.4V13A5.5 5.5 0 0012 3z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L14 3h-4l-.5 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 005 12a7 7 0 00.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 002 1.2L10 21h4l.5-2.6a7 7 0 002-1.2l2.4 1 2-3.4-2-1.6A7 7 0 0019 12z',
  listen: 'M4 13.5v-1.5a8 8 0 0116 0v1.5M4 13.5a2 2 0 012-2h1v7H6a2 2 0 01-2-2zM20 13.5a2 2 0 00-2-2h-1v7h1a2 2 0 002-2z',
  gift: 'M4 9.5h16v4H4zM5.5 13.5h13v7h-13zM12 9.5v11M12 9.5c-1-3-5-4-5-1.5S12 9.5 12 9.5zM12 9.5c1-3 5-4 5-1.5S12 9.5 12 9.5z',
  tree: 'M12 3l4 5h-2.5l4 5H15l4 5H5l4-5H6.5l4-5H8zM12 18v3',
  snow: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 6l2.5-1.5M9.5 19.5L12 18l2.5 1.5',
};

export const GLYPHS = Object.keys(PATHS);

export function Glyph({ name, title, size = 24, ...rest }: { name: string; title?: string; size?: number } & SVGProps<SVGSVGElement>) {
  const d = PATHS[name] ?? PATHS.note!;
  const filled = name === 'maroon';
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path d={d} />
    </svg>
  );
}
