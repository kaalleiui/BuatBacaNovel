'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, BookOpen, User, Plus } from 'lucide-react';
import { useNovelShelfStore } from '@/lib/store';
import { authApi, type AuthUser } from '@/lib/api';
import { HomePage } from './HomePage';
import { BookshelfPage } from './BookshelfPage';
import { NovelDetailPage } from './NovelDetailPage';
import { ReaderPage } from './ReaderPage';
import { LoreBookPage } from './LoreBookPage';
import { LoreMapPage } from './LoreMapPage';
import { ProfilePage } from './ProfilePage';
import { LoginPage } from './LoginPage';
import { AddNovelModal } from './AddNovelModal';
import { AddChapterModal } from './AddChapterModal';
import { AddLoreModal } from './AddLoreModal';
import { CharacterEditorModal } from './CharacterEditorModal';
import { ChapterEditor } from './ChapterEditor';
import { Toaster } from 'sonner';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export function AppShell() {
  const { currentView, navigate, user, setUser, isAuthenticated } = useNovelShelfStore();
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    authApi.me()
      .then((data) => {
        if (data.user) {
          setUser(data.user as AuthUser);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [setUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated && currentView !== 'register') {
    return (
      <>
        <LoginPage />
        <AddNovelModal />
        <Toaster position="top-center" />
      </>
    );
  }

  const showBottomNav = !['reader', 'add-novel', 'add-chapter', 'chapter-editor', 'add-lore', 'edit-character', 'login', 'register', 'lore-map'].includes(currentView);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage />;
      case 'bookshelf':
        return <BookshelfPage />;
      case 'novel-detail':
        return <NovelDetailPage />;
      case 'reader':
        return <ReaderPage />;
      case 'lorebook':
        return <LoreBookPage />;
      case 'lore-map':
        return <LoreMapPage />;
      case 'chapter-editor':
        return <ChapterEditor />;
      case 'profile':
        return <ProfilePage />;
      case 'login':
        return <LoginPage />;
      case 'register':
        return <LoginPage />;
      default:
        return <HomePage />;
    }
  };

  const navItems = [
    { view: 'home' as const, icon: Home, label: 'Beranda' },
    { view: 'bookshelf' as const, icon: BookOpen, label: 'Rak Buku' },
    { view: 'profile' as const, icon: User, label: 'Profil' },
  ];

  const canAddNovel = user && (user.role === 'ADMIN' || user.role === 'WRITER');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="min-h-screen"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AddNovelModal />
      <AddChapterModal />
      <AddLoreModal />
      <CharacterEditorModal />

      {/* Bottom Navigation */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
          <div className="flex items-center justify-around max-w-lg mx-auto h-16 px-4">
            {navItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => navigate(item.view)}
                  className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors"
                >
                  <div className="relative">
                    <item.icon
                      className={`w-5 h-5 transition-colors ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                    {isActive && (
                      <motion.div
                        layoutId="navIndicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                      />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
            {canAddNovel && (
              <button
                onClick={() => navigate('add-novel')}
                className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center -mt-4 shadow-lg shadow-primary/30">
                  <Plus className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">Tambah</span>
              </button>
            )}
          </div>
        </nav>
      )}

      <Toaster position="top-center" />
    </div>
  );
}
