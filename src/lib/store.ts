import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Novel, Chapter, Character, LoreEntry, AppView, POVTheme, DEFAULT_POV_THEME } from './types';

interface NovelShelfStore {
  currentView: AppView;
  selectedNovelId: string | null;
  selectedChapterId: string | null;
  navigate: (view: AppView, novelId?: string | null, chapterId?: string | null) => void;

  novels: Novel[];
  chapters: Chapter[];
  characters: Character[];
  loreEntries: LoreEntry[];

  addNovel: (novel: Omit<Novel, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateNovel: (id: string, data: Partial<Novel>) => void;
  deleteNovel: (id: string) => void;

  addChapter: (chapter: Omit<Chapter, 'id' | 'createdAt'>) => string;
  updateChapter: (id: string, data: Partial<Chapter>) => void;
  deleteChapter: (id: string) => void;
  reorderChapters: (novelId: string, chapterIds: string[]) => void;

  addCharacter: (character: Omit<Character, 'id'>) => string;
  updateCharacter: (id: string, data: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;

  addLoreEntry: (entry: Omit<LoreEntry, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateLoreEntry: (id: string, data: Partial<LoreEntry>) => void;
  deleteLoreEntry: (id: string) => void;

  authorName: string;
  setAuthorName: (name: string) => void;
}

export const useNovelShelfStore = create<NovelShelfStore>()(
  persist(
    (set, get) => ({
      currentView: 'home',
      selectedNovelId: null,
      selectedChapterId: null,

      navigate: (view, novelId, chapterId) => {
        set({
          currentView: view,
          selectedNovelId: novelId ?? get().selectedNovelId,
          selectedChapterId: chapterId ?? get().selectedChapterId,
        });
      },

      novels: [],
      chapters: [],
      characters: [],
      loreEntries: [],

      addNovel: (novel) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        set((s) => ({
          novels: [...s.novels, { ...novel, id, createdAt: now, updatedAt: now }],
        }));
        return id;
      },

      updateNovel: (id, data) => {
        set((s) => ({
          novels: s.novels.map((n) =>
            n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n
          ),
        }));
      },

      deleteNovel: (id) => {
        set((s) => ({
          novels: s.novels.filter((n) => n.id !== id),
          chapters: s.chapters.filter((c) => c.novelId !== id),
          characters: s.characters.filter((c) => c.novelId !== id),
          loreEntries: s.loreEntries.filter((l) => l.novelId !== id),
        }));
      },

      addChapter: (chapter) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        set((s) => ({
          chapters: [...s.chapters, { ...chapter, id, createdAt: now }],
        }));
        return id;
      },

      updateChapter: (id, data) => {
        set((s) => ({
          chapters: s.chapters.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }));
      },

      deleteChapter: (id) => {
        set((s) => ({
          chapters: s.chapters.filter((c) => c.id !== id),
        }));
      },

      reorderChapters: (novelId, chapterIds) => {
        set((s) => ({
          chapters: s.chapters.map((c) => {
            if (c.novelId !== novelId) return c;
            const newOrder = chapterIds.indexOf(c.id);
            return newOrder >= 0 ? { ...c, order: newOrder } : c;
          }),
        }));
      },

      addCharacter: (character) => {
        const id = uuidv4();
        set((s) => ({
          characters: [...s.characters, { ...character, id }],
        }));
        return id;
      },

      updateCharacter: (id, data) => {
        set((s) => ({
          characters: s.characters.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }));
      },

      deleteCharacter: (id) => {
        set((s) => ({
          characters: s.characters.filter((c) => c.id !== id),
          chapters: s.chapters.map((c) =>
            c.povCharacterId === id ? { ...c, povCharacterId: null } : c
          ),
        }));
      },

      addLoreEntry: (entry) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        set((s) => ({
          loreEntries: [...s.loreEntries, { ...entry, id, createdAt: now, updatedAt: now }],
        }));
        return id;
      },

      updateLoreEntry: (id, data) => {
        set((s) => ({
          loreEntries: s.loreEntries.map((l) =>
            l.id === id ? { ...l, ...data, updatedAt: new Date().toISOString() } : l
          ),
        }));
      },

      deleteLoreEntry: (id) => {
        set((s) => ({
          loreEntries: s.loreEntries.filter((l) => l.id !== id),
        }));
      },

      authorName: 'Penulis',
      setAuthorName: (name) => set({ authorName: name }),
    }),
    {
      name: 'novelshelf-storage',
    }
  )
);
