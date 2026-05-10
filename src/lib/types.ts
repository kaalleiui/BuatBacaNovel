import type { UserRole, ReadMode, LoreCategory } from '@prisma/client';

export interface POVTheme {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: 'serif' | 'sans' | 'mono';
  lineHeight: 'compact' | 'normal' | 'relaxed';
}

// Re-export Prisma types for convenience
export type { UserRole, ReadMode, LoreCategory };

export const GENRES = [
  'Fantasy', 'Romance', 'Sci-Fi', 'Thriller', 'Drama',
  'Horror', 'Comedy', 'Slice of Life', 'Adventure', 'Mystery', 'Lainnya'
] as const;

export const DEFAULT_POV_THEME: POVTheme = {
  backgroundColor: '#FDF6EC',
  textColor: '#3D2B1F',
  accentColor: '#C67B3C',
  fontFamily: 'serif',
  lineHeight: 'relaxed',
};

export const THEME_PRESETS: { name: string; theme: POVTheme }[] = [
  {
    name: 'Klasik Krem',
    theme: { backgroundColor: '#FDF6EC', textColor: '#3D2B1F', accentColor: '#C67B3C', fontFamily: 'serif', lineHeight: 'relaxed' },
  },
  {
    name: 'Malam Gelap',
    theme: { backgroundColor: '#1A1A2E', textColor: '#E0E0E0', accentColor: '#E94560', fontFamily: 'sans', lineHeight: 'normal' },
  },
  {
    name: 'Hutan Hijau',
    theme: { backgroundColor: '#F0F5E9', textColor: '#2D4A22', accentColor: '#5B8C5A', fontFamily: 'serif', lineHeight: 'relaxed' },
  },
  {
    name: 'Samudra Biru',
    theme: { backgroundColor: '#EBF2FA', textColor: '#1B3A4B', accentColor: '#3D7CB9', fontFamily: 'sans', lineHeight: 'normal' },
  },
  {
    name: 'Senja Hangat',
    theme: { backgroundColor: '#FFF3E0', textColor: '#4A2C2A', accentColor: '#E07B39', fontFamily: 'serif', lineHeight: 'relaxed' },
  },
  {
    name: 'Lavender Lembut',
    theme: { backgroundColor: '#F3EEFF', textColor: '#3B2D50', accentColor: '#8B5CF6', fontFamily: 'sans', lineHeight: 'normal' },
  },
];

export const COVER_COLORS = [
  '#C67B3C', '#8B6E4E', '#D4874D', '#A0522D', '#6B4423',
  '#CD853F', '#B8860B', '#D2691E', '#8B4513', '#A0522D',
  '#9B2335', '#2D5F4A', '#3D6B8E', '#6B4E71', '#4A6741',
  '#B5651D', '#CC5500', '#8B0000', '#4A5D23', '#2F4F4F',
];

// Helper to parse POV theme from JSON string (stored in DB)
export function parsePOVTheme(themeJson: string): POVTheme {
  try {
    return { ...DEFAULT_POV_THEME, ...JSON.parse(themeJson) };
  } catch {
    return { ...DEFAULT_POV_THEME };
  }
}

// Helper to serialize POV theme to JSON string (for DB storage)
export function serializePOVTheme(theme: POVTheme): string {
  return JSON.stringify(theme);
}

// Helper to parse tags from JSON string (stored in DB)
export function parseTags(tagsJson: string): string[] {
  try {
    return JSON.parse(tagsJson) as string[];
  } catch {
    return [];
  }
}

// Helper to serialize tags to JSON string (for DB storage)
export function serializeTags(tags: string[]): string {
  return JSON.stringify(tags);
}

// App navigation views
export type AppView =
  | 'home'
  | 'bookshelf'
  | 'novel-detail'
  | 'reader'
  | 'lorebook'
  | 'profile'
  | 'add-novel'
  | 'add-chapter'
  | 'add-lore'
  | 'edit-character'
  | 'login'
  | 'register';
