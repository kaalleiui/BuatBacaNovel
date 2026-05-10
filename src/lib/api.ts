// API client for NovelShelf backend

const BASE_URL = '';

interface FetchOptions extends RequestInit {
  body?: unknown;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
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
