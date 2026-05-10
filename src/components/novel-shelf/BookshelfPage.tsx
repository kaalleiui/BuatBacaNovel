'use client';

import { useEffect, useState, useRef } from 'react';
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
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Split novels into shelf rows (4 books per row on mobile, more on desktop)
  const shelfRows: NovelWithUser[][] = [];
  const booksPerRow = 4;
  for (let i = 0; i < filtered.length; i += booksPerRow) {
    shelfRows.push(filtered.slice(i, i + booksPerRow));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" ref={scrollRef}>
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
        <div className="px-3 sm:px-5">
          {shelfRows.map((row, rowIdx) => (
            <div key={rowIdx} className="mb-2">
              {/* Books on the shelf */}
              <div className="flex items-end gap-3 sm:gap-4 px-2 sm:px-4 pb-2 relative">
                {row.map((novel, i) => (
                  <motion.button
                    key={novel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: rowIdx * 0.1 + i * 0.03 }}
                    onClick={() => navigate('novel-detail', novel.id)}
                    className="group text-left flex-1"
                    style={{ perspective: '600px' }}
                  >
                    <div className="relative">
                      <div
                        className="aspect-[2/3] rounded-sm shadow-md group-hover:shadow-xl transition-all duration-300 overflow-hidden relative"
                        style={{
                          backgroundColor: novel.coverColor || '#C67B3C',
                          transformStyle: 'preserve-3d',
                          transform: 'rotateY(0deg)',
                          transition: 'transform 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = 'rotateY(-8deg) translateX(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = 'rotateY(0deg)';
                        }}
                      >
                        {novel.coverImage ? (
                          <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-2">
                            <span className="text-white/90 font-bold text-center text-[10px] sm:text-[11px] leading-tight line-clamp-5 drop-shadow-md" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                              {novel.title}
                            </span>
                          </div>
                        )}
                        {/* Spine detail */}
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/15 rounded-l-sm" />
                        <div className="absolute left-2 top-0 bottom-0 w-px bg-white/10" />
                        {/* Page edge detail */}
                        <div className="absolute right-0 top-1 bottom-1 w-0.5 bg-white/20 rounded-r" />
                        {/* Top highlight */}
                        <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-[11px] font-medium text-foreground mt-1.5 line-clamp-1 px-0.5 text-center">
                      {novel.title}
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-muted-foreground px-0.5 text-center">
                      {novel._count?.chapters || 0} Bab
                    </p>
                  </motion.button>
                ))}
                {/* Fill empty spots */}
                {Array.from({ length: booksPerRow - row.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex-1" />
                ))}
              </div>
              {/* Shelf surface */}
              <div className="relative">
                {/* Shelf top surface (3D effect) */}
                <div className="h-3 rounded-sm mx-1" style={{
                  background: 'linear-gradient(180deg, #A0845C 0%, #8B7355 40%, #7A6548 100%)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
                }} />
                {/* Shelf front face */}
                <div className="h-5 -mt-px mx-1 rounded-b-sm" style={{
                  background: 'linear-gradient(180deg, #7A6548 0%, #6B5840 50%, #5C4B35 100%)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                }} />
                {/* Shelf shadow */}
                <div className="h-3 mx-3" style={{
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, transparent 100%)',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
