/**
 * De app draait onder een submap op GitHub Pages (`/shelfkeeper/`).
 * preact-iso matcht op het volledige pad, dus elk routepad krijgt die basis mee.
 */
const RAW_BASE = import.meta.env.BASE_URL || '/';
/** '/shelfkeeper' — zonder afsluitende schuine streep (zo normaliseert de router paden ook). */
export const BASE = RAW_BASE.replace(/\/+$/, '');

/** to('/add') → '/shelfkeeper/add' */
export const to = (p: string): string => BASE + p;

export const ROUTES = {
  library: BASE || '/',
  add: to('/add'),
  book: to('/book/:id'),
  shelves: to('/shelves'),
  loans: to('/loans'),
  more: to('/more'),
  stats: to('/stats'),
  settings: to('/settings'),
  data: to('/data'),
} as const;

export const bookPath = (id: string): string => to(`/book/${encodeURIComponent(id)}`);
