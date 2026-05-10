import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppView, UserRole } from './types';

interface AuthUser {
  id: string;
  nickname: string;
  role: UserRole;
  avatarColor: string;
}

interface NovelShelfStore {
  // Navigation
  currentView: AppView;
  selectedNovelId: string | null;
  selectedChapterId: string | null;
  navigate: (view: AppView, novelId?: string | null, chapterId?: string | null) => void;

  // Auth
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  isAuthenticated: boolean;

  // Reader settings (local cache)
  readerSettings: {
    fontSize: number;
    fontFamily: string;
    lineHeight: string;
    pageMargin: number;
    theme: string;
    customBgColor: string;
    customTextColor: string;
    customAccentColor: string;
  } | null;
  setReaderSettings: (settings: NovelShelfStore['readerSettings']) => void;
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
          ...(novelId !== undefined ? { selectedNovelId: novelId } : {}),
          ...(chapterId !== undefined ? { selectedChapterId: chapterId } : {}),
        });
      },

      user: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      isAuthenticated: false,

      readerSettings: null,
      setReaderSettings: (settings) => set({ readerSettings: settings }),
    }),
    {
      name: 'novelshelf-session',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        readerSettings: state.readerSettings,
      }),
    }
  )
);
