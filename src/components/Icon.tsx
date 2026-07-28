/** Lijn-iconen, 24×24, één stijl (stroke 1.75, ronde uiteinden). */
export type IconName =
  | 'library'
  | 'shelves'
  | 'plus'
  | 'loan'
  | 'more'
  | 'search'
  | 'close'
  | 'back'
  | 'scan'
  | 'settings'
  | 'star'
  | 'star-filled'
  | 'trash'
  | 'edit'
  | 'check'
  | 'tag'
  | 'book'
  | 'chart'
  | 'sort'
  | 'grid'
  | 'list'
  | 'filter'
  | 'chevron-right'
  | 'keyboard'
  | 'dice';

const PATHS: Record<IconName, string[]> = {
  library: [
    'M12 6.6C10.4 5.2 8.4 4.6 5.8 4.6c-1 0-1.9.1-2.6.3v13.2c.7-.2 1.6-.3 2.6-.3 2.6 0 4.6.6 6.2 2 1.6-1.4 3.6-2 6.2-2 1 0 1.9.1 2.6.3V4.9c-.7-.2-1.6-.3-2.6-.3-2.6 0-4.6.6-6.2 2Z',
    'M12 6.6v13.2',
  ],
  shelves: ['M3.5 4.5h17v15h-17z', 'M3.5 12h17', 'M7 8.5v-4', 'M10 8.5v-4', 'M14 19.5v-4'],
  plus: ['M12 5.5v13', 'M5.5 12h13'],
  loan: ['M12 3.5v11', 'M8 7.5 12 3.5l4 4', 'M4.5 14.5v4a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4'],
  more: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
  search: ['M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z', 'M16 16l4 4'],
  close: ['M6 6l12 12', 'M18 6 6 18'],
  back: ['M15 5l-7 7 7 7'],
  scan: [
    'M3.5 8V6a2.5 2.5 0 0 1 2.5-2.5h2',
    'M16 3.5h2A2.5 2.5 0 0 1 20.5 6v2',
    'M20.5 16v2a2.5 2.5 0 0 1-2.5 2.5h-2',
    'M8 20.5H6A2.5 2.5 0 0 1 3.5 18v-2',
    'M3.5 12h17',
  ],
  settings: [
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    'M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z',
  ],
  star: ['M12 4.2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 9.9l5.4-.8z'],
  'star-filled': ['M12 4.2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 9.9l5.4-.8z'],
  trash: ['M4 7h16', 'M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7', 'M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12'],
  edit: ['M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z', 'M14.5 7.5l2 2'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  tag: ['M4 4.5h6.4l9 9-6.4 6.4-9-9V4.5Z', 'M8 8.5h.01'],
  book: ['M5 4.5h11a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2v-13Z', 'M5 17.5h13'],
  chart: ['M4 20h16', 'M7.5 20v-7', 'M12 20V5', 'M16.5 20v-10'],
  sort: ['M4 7h11', 'M4 12h8', 'M4 17h5', 'M17.5 8.5v9', 'M15 15l2.5 2.5L20 15'],
  grid: ['M4 4.5h6.5V11H4z', 'M13.5 4.5H20V11h-6.5z', 'M4 13h6.5v6.5H4z', 'M13.5 13H20v6.5h-6.5z'],
  list: ['M4 6.5h16', 'M4 12h16', 'M4 17.5h16'],
  filter: ['M4 6h16', 'M7 12h10', 'M10 18h4'],
  'chevron-right': ['M9 5l7 7-7 7'],
  keyboard: ['M3.5 6.5h17v11h-17z', 'M7 10h.01', 'M11 10h.01', 'M15 10h.01', 'M8 14h8'],
  dice: ['M4.5 4.5h15v15h-15z', 'M9 9h.01', 'M15 15h.01', 'M12 12h.01'],
};

interface Props {
  name: IconName;
  size?: number;
  class?: string;
  'aria-hidden'?: boolean;
}

export function Icon({ name, size = 24, class: className }: Props) {
  const filled = name === 'star-filled';
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      stroke-width={1.75}
      stroke-linecap="round"
      stroke-linejoin="round"
      class={className}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
