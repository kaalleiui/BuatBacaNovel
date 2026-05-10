'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNovelShelfStore } from '@/lib/store';
import { DEFAULT_POV_THEME } from '@/lib/types';
import type { POVTheme } from '@/lib/types';

export function ReaderPage() {
  const { novels, chapters, characters, selectedNovelId, selectedChapterId, navigate } = useNovelShelfStore();
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const isDragging = useRef(false);

  const novel = novels.find((n) => n.id === selectedNovelId);

  const novelChapters = novel
    ? chapters
        .filter((c) => c.novelId === novel.id)
        .sort((a, b) => a.order - b.order)
    : [];

  // Derive currentIndex from selectedChapterId when available
  const initialIndex = useMemo(() => {
    if (selectedChapterId && novelChapters.length > 0) {
      const idx = novelChapters.findIndex((c) => c.id === selectedChapterId);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [selectedChapterId, novelChapters]);

  const currentIndex = manualIndex ?? initialIndex;

  const goNext = useCallback(() => {
    const next = currentIndex + 1;
    if (next < novelChapters.length) {
      setManualIndex(next);
      setSwipeOffset(0);
    }
  }, [currentIndex, novelChapters.length]);

  const goPrev = useCallback(() => {
    const prev = currentIndex - 1;
    if (prev >= 0) {
      setManualIndex(prev);
      setSwipeOffset(0);
    }
  }, [currentIndex]);

  // Touch handlers for swipe mode
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!novel || novel.readMode !== 'swipe') return;
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !novel || novel.readMode !== 'swipe') return;
    touchCurrentX.current = e.touches[0].clientX;
    setSwipeOffset(touchCurrentX.current - touchStartX.current);
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || !novel || novel.readMode !== 'swipe') return;
    isDragging.current = false;
    const diff = touchCurrentX.current - touchStartX.current;
    if (diff < -80) {
      goNext();
    } else if (diff > 80) {
      goPrev();
    }
    setSwipeOffset(0);
  };

  // Early returns after all hooks
  if (!novel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Novel tidak ditemukan</p>
      </div>
    );
  }

  const currentChapter = novelChapters[currentIndex];
  const povCharacter = currentChapter
    ? characters.find((c) => c.id === currentChapter.povCharacterId)
    : null;

  const theme: POVTheme = povCharacter?.theme || DEFAULT_POV_THEME;

  const lineHeightClass =
    theme.lineHeight === 'compact'
      ? 'leading-tight'
      : theme.lineHeight === 'relaxed'
      ? 'leading-loose'
      : 'leading-normal';

  const fontClass =
    theme.fontFamily === 'serif'
      ? 'font-serif-reading'
      : theme.fontFamily === 'mono'
      ? 'font-mono-reading'
      : 'font-sans-reading';

  if (novelChapters.length === 0) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: '#FDF6EC' }}
      >
        <BookOpen className="w-16 h-16 text-primary/30 mb-4" />
        <p className="text-lg font-semibold text-foreground mb-2">Belum Ada Bab</p>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Tambahkan bab pertama untuk mulai membaca.
        </p>
        <Button onClick={() => navigate('novel-detail', novel.id)}>Kembali</Button>
      </div>
    );
  }

  // Scroll mode: all chapters in one view
  if (novel.readMode === 'scroll') {
    return (
      <div
        className="min-h-screen transition-colors duration-500"
        style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
      >
        {/* Top bar */}
        <div
          className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 backdrop-blur-md"
          style={{ backgroundColor: `${theme.backgroundColor}dd` }}
        >
          <button
            onClick={() => navigate('novel-detail', novel.id)}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: theme.textColor }} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: theme.textColor }}>
              {novel.title}
            </p>
            <p className="text-xs opacity-60">Mode Scroll</p>
          </div>
        </div>

        {/* All chapters */}
        <div className="max-w-2xl mx-auto px-5 pb-20">
          {novelChapters.map((chapter, idx) => {
            const char = characters.find((c) => c.id === chapter.povCharacterId);
            const chTheme = char?.theme || DEFAULT_POV_THEME;

            const chFontClass =
              chTheme.fontFamily === 'serif'
                ? 'font-serif-reading'
                : chTheme.fontFamily === 'mono'
                ? 'font-mono-reading'
                : 'font-sans-reading';

            const chLineHeight =
              chTheme.lineHeight === 'compact'
                ? 'leading-tight'
                : chTheme.lineHeight === 'relaxed'
                ? 'leading-loose'
                : 'leading-normal';

            return (
              <div
                key={chapter.id}
                className="py-8 transition-colors duration-500"
                style={{
                  backgroundColor: chTheme.backgroundColor,
                  color: chTheme.textColor,
                  marginLeft: '-1.25rem',
                  marginRight: '-1.25rem',
                  paddingLeft: '1.25rem',
                  paddingRight: '1.25rem',
                }}
              >
                {/* Chapter divider */}
                {idx > 0 && (
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-px flex-1" style={{ backgroundColor: `${chTheme.accentColor}40` }} />
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chTheme.accentColor }} />
                    <div className="h-px flex-1" style={{ backgroundColor: `${chTheme.accentColor}40` }} />
                  </div>
                )}

                {/* POV indicator */}
                {char && (
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: char.avatarColor }}
                    />
                    <span className="text-xs font-medium" style={{ color: chTheme.accentColor }}>
                      POV {char.name}
                    </span>
                  </div>
                )}

                {/* Chapter title */}
                <h2 className="text-xl font-bold mb-6" style={{ color: chTheme.accentColor }}>
                  Bab {idx + 1}: {chapter.title}
                </h2>

                {/* Chapter content */}
                <div
                  className={`text-base ${chFontClass} ${chLineHeight} whitespace-pre-wrap`}
                >
                  {chapter.content ? (
                    <p className="drop-cap">{chapter.content}</p>
                  ) : (
                    <p className="italic opacity-40">Belum ada konten</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Swipe mode: one chapter at a time
  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-500"
      style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: `${theme.backgroundColor}ee` }}
      >
        <button
          onClick={() => navigate('novel-detail', novel.id)}
          className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: theme.textColor }} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: theme.textColor }}>
            {novel.title}
          </p>
          <p className="text-xs opacity-60">
            Bab {currentIndex + 1} dari {novelChapters.length}
          </p>
        </div>
        {povCharacter && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: povCharacter.avatarColor }}
            />
            <span className="text-[10px] font-medium" style={{ color: theme.accentColor }}>
              {povCharacter.name}
            </span>
          </div>
        )}
      </div>

      {/* Chapter Content with Swipe */}
      <div
        className="flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentChapter?.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: swipeOffset }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="max-w-2xl mx-auto px-5 py-6 h-full overflow-y-auto"
          >
            {/* Chapter title */}
            <div className="mb-8">
              <p className="text-xs font-medium mb-1" style={{ color: theme.accentColor }}>
                Bab {currentIndex + 1}
              </p>
              <h2 className="text-2xl font-bold" style={{ color: theme.accentColor }}>
                {currentChapter?.title}
              </h2>
              <div
                className="h-0.5 w-16 mt-3 rounded-full"
                style={{ backgroundColor: theme.accentColor }}
              />
            </div>

            {/* Content */}
            <div className={`text-lg ${fontClass} ${lineHeightClass} whitespace-pre-wrap`}>
              {currentChapter?.content ? (
                <p className="drop-cap">{currentChapter.content}</p>
              ) : (
                <p className="italic opacity-40">Belum ada konten untuk bab ini.</p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div
        className="flex items-center justify-between px-5 py-4 safe-area-bottom"
        style={{ backgroundColor: `${theme.backgroundColor}ee` }}
      >
        <Button
          variant="ghost"
          size="sm"
          disabled={currentIndex === 0}
          onClick={goPrev}
          className="gap-1"
          style={{ color: theme.textColor }}
        >
          <ChevronLeft className="w-4 h-4" />
          Sebelumnya
        </Button>

        {/* Progress dots */}
        <div className="flex gap-1 flex-wrap justify-center max-w-[40%]">
          {novelChapters.map((_, i) => (
            <button
              key={i}
              onClick={() => setManualIndex(i)}
              className="transition-all duration-200"
              style={{
                width: i === currentIndex ? '16px' : '6px',
                height: '6px',
                borderRadius: '3px',
                backgroundColor: i === currentIndex ? theme.accentColor : `${theme.accentColor}40`,
              }}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={currentIndex === novelChapters.length - 1}
          onClick={goNext}
          className="gap-1"
          style={{ color: theme.textColor }}
        >
          Selanjutnya
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
