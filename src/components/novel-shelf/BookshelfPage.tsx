'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNovelShelfStore } from '@/lib/store';
import { novelsApi, type NovelWithUser } from '@/lib/api';
import { EmptyState } from './EmptyState';

export function BookshelfPage() {
  const { navigate } = useNovelShelfStore();
  const [novels, setNovels] = useState<NovelWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('all');

  useEffect(() => {
    novelsApi.list()
      .then((data) => setNovels(data.novels))
      .catch(() => setNovels([]))
      .finally(() => setLoading(false));
  }, []);

  const allGenres = [...new Set(novels.map((n) => n.genre).filter(Boolean))];

  const filtered = novels.filter((n) => {
    const matchSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.user.nickname.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genreFilter === 'all' || n.genre === genreFilter;
    return matchSearch && matchGenre;
  });

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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Rak Buku</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {novels.length} novel di perpustakaan
          </p>
        </motion.div>
      </div>

      {/* Search & Filter */}
      {novels.length > 0 && (
        <div className="px-5 mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari novel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          {allGenres.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setGenreFilter('all')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  genreFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                Semua
              </button>
              {allGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setGenreFilter(genre)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    genreFilter === genre ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bookshelf */}
      {novels.length === 0 ? (
        <EmptyState
          title="Rak Kosong"
          description="Perpustakaanmu masih kosong. Tambahkan novel pertamamu untuk mulai mengisi rak ini!"
          actionLabel="Tambah Novel"
          onAction={() => navigate('add-novel')}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Tidak ada novel yang cocok</p>
        </div>
      ) : (
        <div className="px-5">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {filtered.map((novel, i) => (
              <motion.button
                key={novel.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate('novel-detail', novel.id)}
                className="group text-left"
              >
                <div className="relative">
                  <div
                    className="aspect-[2/3] rounded-lg shadow-sm group-hover:shadow-lg transition-all duration-200 group-hover:-translate-y-1 overflow-hidden relative"
                    style={{ backgroundColor: novel.coverColor || '#C67B3C' }}
                  >
                    {novel.coverImage ? (
                      <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <span className="text-white/90 font-bold text-center text-[11px] leading-tight line-clamp-5 drop-shadow-md">
                          {novel.title}
                        </span>
                      </div>
                    )}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/15 rounded-l-lg" />
                    <div className="absolute right-0 top-1 bottom-1 w-0.5 bg-white/20 rounded-r" />
                  </div>
                  <div className="h-2 bg-gradient-to-b from-black/8 to-transparent rounded-b-lg mx-1" />
                </div>
                <p className="text-[11px] font-medium text-foreground mt-1 line-clamp-1 px-0.5">
                  {novel.title}
                </p>
                <p className="text-[9px] text-muted-foreground px-0.5">
                  {novel._count?.chapters || 0} Bab
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
