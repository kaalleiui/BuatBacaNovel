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

export const THEME_PRESETS: { name: string; key: string; theme: POVTheme }[] = [
  {
    name: 'Klasik Krem',
    key: 'classic',
    theme: { backgroundColor: '#FDF6EC', textColor: '#3D2B1F', accentColor: '#C67B3C', fontFamily: 'serif', lineHeight: 'relaxed' },
  },
  {
    name: 'Malam Gelap',
    key: 'dark',
    theme: { backgroundColor: '#1A1A2E', textColor: '#E0E0E0', accentColor: '#E94560', fontFamily: 'sans', lineHeight: 'normal' },
  },
  {
    name: 'Sepia Hangat',
    key: 'sepia',
    theme: { backgroundColor: '#F4ECD8', textColor: '#5B4636', accentColor: '#B8860B', fontFamily: 'serif', lineHeight: 'relaxed' },
  },
  {
    name: 'Hutan Hijau',
    key: 'forest',
    theme: { backgroundColor: '#F0F5E9', textColor: '#2D4A22', accentColor: '#5B8C5A', fontFamily: 'serif', lineHeight: 'relaxed' },
  },
  {
    name: 'Samudra Biru',
    key: 'ocean',
    theme: { backgroundColor: '#EBF2FA', textColor: '#1B3A4B', accentColor: '#3D7CB9', fontFamily: 'sans', lineHeight: 'normal' },
  },
  {
    name: 'Senja Hangat',
    key: 'sunset',
    theme: { backgroundColor: '#FFF3E0', textColor: '#4A2C2A', accentColor: '#E07B39', fontFamily: 'serif', lineHeight: 'relaxed' },
  },
];

export const COVER_COLORS = [
  '#C67B3C', '#8B6E4E', '#D4874D', '#A0522D', '#6B4423',
  '#CD853F', '#B8860B', '#D2691E', '#8B4513', '#A0522D',
  '#9B2335', '#2D5F4A', '#3D6B8E', '#6B4E71', '#4A6741',
  '#B5651D', '#CC5500', '#8B0000', '#4A5D23', '#2F4F4F',
];

export const HIGHLIGHT_COLORS = [
  { name: 'Kuning', color: '#F59E0B' },
  { name: 'Hijau', color: '#22C55E' },
  { name: 'Biru', color: '#3B82F6' },
  { name: 'Merah Muda', color: '#EC4899' },
  { name: 'Oranye', color: '#F97316' },
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
  | 'lore-map'
  | 'profile'
  | 'ai-setup'
  | 'add-novel'
  | 'add-chapter'
  | 'chapter-editor'
  | 'add-lore'
  | 'edit-character'
  | 'login'
  | 'register';

// Reader themes
export type ReaderThemeKey = 'classic' | 'dark' | 'sepia' | 'forest' | 'ocean' | 'sunset' | 'custom';

// Reader settings interface (matches DB model)
export interface ReaderSettingsType {
  id: string;
  userId: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: string;
  pageMargin: number;
  theme: string;
  customBgColor: string;
  customTextColor: string;
  customAccentColor: string;
}

// Reading progress interface
export interface ReadingProgressType {
  id: string;
  progress: number;
  lastReadAt: string;
  userId: string;
  novelId: string;
  chapterId: string | null;
  novel?: { id: string; title: string; coverColor: string; coverImage: string | null };
}

// Highlight interface
export interface HighlightType {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  color: string;
  note: string | null;
  createdAt: string;
  chapterId: string;
  userId: string;
}

// Chapter version interface
export interface ChapterVersionType {
  id: string;
  title: string;
  content: string;
  version: number;
  createdAt: string;
  chapterId: string;
}

// Outline item interface
export interface OutlineItemType {
  id: string;
  content: string;
  order: number;
  completed: boolean;
  createdAt: string;
  chapterId: string;
}
