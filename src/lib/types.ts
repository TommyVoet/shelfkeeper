export type BookStatus = 'owned' | 'reading' | 'read' | 'wishlist';
export type BookSource = 'scan' | 'search' | 'manual' | 'import';

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  /** Weergavenamen zoals ze op het boek staan: ["Harry Mulisch"]. */
  authors: string[];
  originalTitle?: string;
  series?: string;
  isbn13?: string;
  isbn10?: string;
  publisher?: string;
  year?: number;
  pages?: number;
  /** Taal van de uitgave, ISO-639-1 waar bekend. */
  language?: string;
  /** Sleutel bij Open Library, bijv. "/works/OL27448W". */
  olKey?: string;
  /** Adres van de omslag op internet. */
  coverUrl?: string;
  /** Sleutel in de covers-opslag (offline kopie van de omslag). */
  coverKey?: string;
  shelfIds: string[];
  tagIds: string[];
  status: BookStatus;
  /** 0 = geen oordeel, 1–5 sterren. */
  rating: number;
  notes?: string;
  addedAt: number;
  updatedAt: number;
  source: BookSource;

  /* ---- afgeleid, altijd door prepareBook() gezet ---- */
  /** "Mulisch, Harry" — voor weergave bij sorteren op auteur. */
  authorSort: string;
  /** Genormaliseerde vorm van authorSort; hierop wordt gesorteerd. */
  sortKey: string;
  /** Genormaliseerde titel; tweede sorteersleutel. */
  titleKey: string;
  /** Alles doorzoekbaar in één genormaliseerde tekst. */
  hay: string;
}

/** Wat je aanlevert om een boek te bewaren; de rest wordt afgeleid. */
export type BookInput = Partial<Omit<Book, 'authorSort' | 'sortKey' | 'titleKey' | 'hay'>> & {
  title: string;
};

export interface Shelf {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface Loan {
  id: string;
  bookId: string;
  person: string;
  lentAt: number;
  dueAt?: number;
  returnedAt?: number;
  note?: string;
}

export const BOOK_STATUSES: BookStatus[] = ['owned', 'reading', 'read', 'wishlist'];
