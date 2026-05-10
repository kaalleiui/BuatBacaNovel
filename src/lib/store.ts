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
    }),
    {
      name: 'novelshelf-session',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
