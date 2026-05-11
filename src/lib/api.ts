// API client for NovelShelf backend

const BASE_URL = '';

interface FetchOptions extends RequestInit {
  body?: unknown;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'same-origin',
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...rest.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Terjadi kesalahan');
  }

  return data;
}

// Upload file (different from JSON API)
async function uploadFile(path: string, formData: FormData): Promise<{ url: string }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload gagal');
  return data;
}

// ============================
// AUTH
// ============================

export const authApi = {
  me: () => apiFetch<{ user: AuthUser | null }>('/api/auth/me'),

  login: (nickname: string, password: string) =>
    apiFetch<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: { nickname, password },
    }),

  register: (nickname: string, password: string, role: string) =>
    apiFetch<{ user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: { nickname, password, role },
    }),

  logout: () =>
    apiFetch<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
};

// ============================
// NOVELS
// ============================

export const novelsApi = {
  list: (params?: { genre?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.genre) searchParams.set('genre', params.genre);
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return apiFetch<{ novels: NovelWithUser[] }>(`/api/novels${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) =>
    apiFetch<{ novel: NovelDetail }>('/api/novels/' + id),

  create: (data: NovelCreateInput) =>
    apiFetch<{ novel: NovelWithUser }>('/api/novels', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: NovelUpdateInput) =>
    apiFetch<{ novel: NovelWithUser }>('/api/novels/' + id, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>('/api/novels/' + id, { method: 'DELETE' }),
};

// ============================
// CHAPTERS
// ============================

export const chaptersApi = {
  list: (novelId: string) =>
    apiFetch<{ chapters: ChapterWithPOV[] }>(`/api/novels/${novelId}/chapters`),

  create: (novelId: string, data: ChapterCreateInput) =>
    apiFetch<{ chapter: ChapterWithPOV }>(`/api/novels/${novelId}/chapters`, {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: ChapterUpdateInput) =>
    apiFetch<{ chapter: ChapterWithPOV }>('/api/chapters/' + id, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>('/api/chapters/' + id, { method: 'DELETE' }),
};

// ============================
// CHARACTERS
// ============================

export const charactersApi = {
  list: (novelId: string) =>
    apiFetch<{ characters: CharacterWithTheme[] }>(`/api/novels/${novelId}/characters`),

  create: (novelId: string, data: CharacterCreateInput) =>
    apiFetch<{ character: CharacterWithTheme }>(`/api/novels/${novelId}/characters`, {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: CharacterUpdateInput) =>
    apiFetch<{ character: CharacterWithTheme }>('/api/characters/' + id, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>('/api/characters/' + id, { method: 'DELETE' }),
};

// ============================
// LORE
// ============================

export const loreApi = {
  list: (novelId: string, category?: string) => {
    const qs = category ? `?category=${category}` : '';
    return apiFetch<{ loreEntries: LoreEntryParsed[] }>(`/api/novels/${novelId}/lore${qs}`);
  },

  create: (novelId: string, data: LoreCreateInput) =>
    apiFetch<{ loreEntry: LoreEntryParsed }>(`/api/novels/${novelId}/lore`, {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: LoreUpdateInput) =>
    apiFetch<{ loreEntry: LoreEntryParsed }>('/api/lore/' + id, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>('/api/lore/' + id, { method: 'DELETE' }),
};

// ============================
// COMMENTS
// ============================

export const commentsApi = {
  list: (novelId: string) =>
    apiFetch<{ comments: CommentWithUser[] }>(`/api/novels/${novelId}/comments`),

  create: (novelId: string, content: string, chapterId?: string) =>
    apiFetch<{ comment: CommentWithUser }>(`/api/novels/${novelId}/comments`, {
      method: 'POST',
      body: { content, chapterId },
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>('/api/comments/' + id, { method: 'DELETE' }),
};

// ============================
// UPLOAD
// ============================

export const uploadApi = {
  cover: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return uploadFile('/api/upload', formData);
  },
};

// ============================
// READING PROGRESS
// ============================

export const progressApi = {
  get: (novelId: string) =>
    apiFetch<{ progress: ReadingProgressType | null }>(`/api/progress?novelId=${novelId}`),

  getAll: () =>
    apiFetch<{ progress: ReadingProgressType[] }>('/api/progress/all'),

  upsert: (data: { novelId: string; chapterId?: string; progress: number }) =>
    apiFetch<{ progress: ReadingProgressType }>('/api/progress', { method: 'PUT', body: data }),
};

// ============================
// HIGHLIGHTS
// ============================

export const highlightsApi = {
  list: (chapterId: string) =>
    apiFetch<{ highlights: HighlightType[] }>(`/api/highlights?chapterId=${chapterId}`),

  create: (data: { chapterId: string; text: string; startOffset: number; endOffset: number; color?: string; note?: string }) =>
    apiFetch<{ highlight: HighlightType }>('/api/highlights', { method: 'POST', body: data }),

  update: (id: string, data: { color?: string; note?: string }) =>
    apiFetch<{ highlight: HighlightType }>(`/api/highlights/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/highlights/${id}`, { method: 'DELETE' }),
};

// ============================
// CHAPTER VERSIONS
// ============================

export const versionsApi = {
  list: (chapterId: string) =>
    apiFetch<{ versions: ChapterVersionType[] }>(`/api/versions?chapterId=${chapterId}`),

  restore: (id: string) =>
    apiFetch<{ chapter: ChapterWithPOV; version: ChapterVersionType }>(`/api/versions/${id}`, { method: 'POST' }),
};

// ============================
// OUTLINE
// ============================

export const outlineApi = {
  list: (chapterId: string) =>
    apiFetch<{ items: OutlineItemType[] }>(`/api/outline?chapterId=${chapterId}`),

  create: (data: { chapterId: string; content: string; order?: number }) =>
    apiFetch<{ item: OutlineItemType }>('/api/outline', { method: 'POST', body: data }),

  update: (id: string, data: { content?: string; order?: number; completed?: boolean }) =>
    apiFetch<{ item: OutlineItemType }>(`/api/outline/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/outline/${id}`, { method: 'DELETE' }),
};

// ============================
// READER SETTINGS
// ============================

export const settingsApi = {
  get: () =>
    apiFetch<{ settings: ReaderSettingsType | null }>('/api/settings'),

  upsert: (data: Partial<ReaderSettingsUpdateInput>) =>
    apiFetch<{ settings: ReaderSettingsType }>('/api/settings', { method: 'PUT', body: data }),
};

// ============================
// EXPORT
// ============================

export const exportApi = {
  novel: async (novelId: string, format: 'epub' | 'pdf') => {
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ novelId, format }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Gagal mengekspor');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novel.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

// ============================
// AI
// ============================

export const aiApi = {
  stream: async (type: 'assist' | 'summary' | 'consistency', prompt: string, context?: string) => {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, prompt, context }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Gagal menghubungi AI');
    }
    return res;
  },
};

// ============================
// TYPES
// ============================

export interface AuthUser {
  id: string;
  nickname: string;
  role: 'ADMIN' | 'WRITER' | 'READER';
  avatarColor: string;
}

export interface NovelWithUser {
  id: string;
  title: string;
  description: string;
  coverColor: string;
  coverImage: string | null;
  genre: string;
  readMode: 'swipe' | 'scroll';
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: AuthUser;
  _count?: { chapters: number };
}

export interface NovelDetail extends NovelWithUser {
  chapters: ChapterWithPOV[];
  characters: CharacterWithTheme[];
  loreEntries: LoreEntryParsed[];
  comments: CommentWithUser[];
}

export interface ChapterWithPOV {
  id: string;
  title: string;
  content: string;
  order: number;
  novelId: string;
  povCharacterId: string | null;
  createdAt: string;
  povCharacter?: CharacterWithTheme | null;
}

export interface CharacterWithTheme {
  id: string;
  name: string;
  description: string;
  avatarColor: string;
  theme: string; // JSON string
  novelId: string;
}

export interface LoreEntryParsed {
  id: string;
  title: string;
  content: string;
  category: 'character' | 'backstory' | 'worldbuilding' | 'notes';
  tags: string[];
  novelId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentWithUser {
  id: string;
  content: string;
  novelId: string;
  chapterId: string | null;
  userId: string;
  createdAt: string;
  user: AuthUser;
}

export interface NovelCreateInput {
  title: string;
  description?: string;
  coverColor?: string;
  coverImage?: string;
  genre?: string;
  readMode?: 'swipe' | 'scroll';
}

export type NovelUpdateInput = Partial<NovelCreateInput>;

export interface ChapterCreateInput {
  title: string;
  content?: string;
  order?: number;
  povCharacterId?: string | null;
}

export type ChapterUpdateInput = Partial<ChapterCreateInput>;

export interface CharacterCreateInput {
  name: string;
  description?: string;
  avatarColor?: string;
  theme?: Record<string, unknown>;
}

export interface CharacterUpdateInput extends Partial<CharacterCreateInput> {
  theme?: Record<string, unknown>;
}

export interface LoreCreateInput {
  title: string;
  content?: string;
  category?: string;
  tags?: string[];
}

export type LoreUpdateInput = Partial<LoreCreateInput>;

// New types for v3.0
export interface ReadingProgressType {
  id: string;
  progress: number;
  lastReadAt: string;
  userId: string;
  novelId: string;
  chapterId: string | null;
  novel?: { id: string; title: string; coverColor: string; coverImage: string | null };
}

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

export interface ChapterVersionType {
  id: string;
  title: string;
  content: string;
  version: number;
  createdAt: string;
  chapterId: string;
}

export interface OutlineItemType {
  id: string;
  content: string;
  order: number;
  completed: boolean;
  createdAt: string;
  chapterId: string;
}

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

export interface ReaderSettingsUpdateInput {
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: string;
  pageMargin?: number;
  theme?: string;
  customBgColor?: string;
  customTextColor?: string;
  customAccentColor?: string;
}
