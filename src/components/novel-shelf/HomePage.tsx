'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { useNovelShelfStore } from '@/lib/store';
import { novelsApi, type NovelWithUser } from '@/lib/api';
import { EmptyState } from './EmptyState';

export function HomePage() {
  const { navigate, user } = useNovelShelfStore();
  const [novels, setNovels] = useState<NovelWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    novelsApi.list()
      .then((data) => setNovels(data.novels))
      .catch(() => setNovels([]))
      .finally(() => setLoading(false));
  }, []);

  const recentNovels = novels.slice(0, 6);
  const totalChapters = novels.reduce((sum, n) => sum + (n._count?.chapters || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-muted-foreground text-sm">Selamat datang,</p>
          <h1 className="text-2xl font-bold text-foreground mt-1">{user?.nickname || 'Penulis'} ✨</h1>
        </motion.div>
      </div>

      {/* Hero Banner */}
      <div className="px-5 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-accent to-primary/70 p-6 text-primary-foreground"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Perpustakaanmu</span>
            </div>
            <p className="text-3xl font-bold">{novels.length} Novel</p>
            <p className="text-sm opacity-80 mt-1">{totalChapters} Bab tertulis</p>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
            <BookOpen className="w-32 h-32" />
          </div>
        </motion.div>
      </div>

      {novels.length === 0 ? (
        <EmptyState
          title="Perpustakaan Kosong"
          description="Mulai petualangan menulismu! Tambahkan novel pertamamu dan isi rak buku kosong ini."
          actionLabel="Tambah Novel Pertama"
          onAction={() => navigate('add-novel')}
        />
      ) : (
        <>
          {/* Lanjut Baca */}
          {recentNovels.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between px-5 mb-3">
                <h2 className="text-lg font-semibold text-foreground">Lanjut Baca</h2>
                <button
                  onClick={() => navigate('bookshelf')}
                  className="text-sm text-primary font-medium flex items-center gap-1"
                >
                  Lihat Semua
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-4 px-5 overflow-x-auto pb-2 scrollbar-hide">
                {recentNovels.map((novel, i) => (
                  <motion.button
                    key={novel.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => navigate('novel-detail', novel.id)}
                    className="flex-shrink-0 group"
                  >
                    <div className="w-28">
                      <div
                        className="w-28 h-40 rounded-xl shadow-md group-hover:shadow-lg transition-shadow overflow-hidden relative"
                        style={{ backgroundColor: novel.coverColor || '#C67B3C' }}
                      >
                        {novel.coverImage ? (
                          <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-3">
                            <span className="text-white/90 font-bold text-center text-sm leading-tight line-clamp-3 drop-shadow-md">
                              {novel.title}
                            </span>
                          </div>
                        )}
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/10 rounded-l-xl" />
                      </div>
                      <p className="text-xs font-medium text-foreground mt-2 line-clamp-1 text-left">
                        {novel.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground text-left">
                        {novel._count?.chapters || 0} Bab
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Novel Terbaru Grid */}
          <div className="px-5">
            <h2 className="text-lg font-semibold text-foreground mb-3">Novel Terbaru</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {recentNovels.map((novel, i) => (
                <motion.button
                  key={novel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate('novel-detail', novel.id)}
                  className="text-left group"
                >
                  <div
                    className="aspect-[3/4] rounded-xl shadow-sm group-hover:shadow-md transition-shadow overflow-hidden relative"
                    style={{ backgroundColor: novel.coverColor || '#C67B3C' }}
                  >
                    {novel.coverImage ? (
                      <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <span className="text-white/90 font-bold text-center text-sm leading-tight line-clamp-4 drop-shadow-md">
                          {novel.title}
                        </span>
                      </div>
                    )}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/10 rounded-l-xl" />
                    {novel.genre && (
                      <span className="absolute top-2 right-2 bg-black/20 text-white text-[9px] px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                        {novel.genre}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground mt-2 line-clamp-1">{novel.title}</p>
                  <p className="text-xs text-muted-foreground">
                    oleh {novel.user.nickname} · {novel._count?.chapters || 0} Bab
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
