'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Settings, Highlighter, MessageSquare, X, Check, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useNovelShelfStore } from '@/lib/store';
import { novelsApi, progressApi, settingsApi, highlightsApi, type NovelDetail, type ChapterWithPOV, type HighlightType } from '@/lib/api';
import { DEFAULT_POV_THEME, parsePOVTheme, THEME_PRESETS, HIGHLIGHT_COLORS } from '@/lib/types';
import type { POVTheme, ReaderSettingsType } from '@/lib/types';
import { toast } from 'sonner';

export function ReaderPage() {
  const { selectedNovelId, selectedChapterId, navigate, user, readerSettings, setReaderSettings } = useNovelShelfStore();
  const [novel, setNovel] = useState<NovelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [chapterHighlights, setChapterHighlights] = useState<HighlightType[]>([]);
  const [selectedText, setSelectedText] = useState<{ text: string; startOffset: number; endOffset: number } | null>(null);
  const [showHighlightToolbar, setShowHighlightToolbar] = useState(false);
  const [localSettings, setLocalSettings] = useState<ReaderSettingsType | null>(null);
  const [povThemeEnabled, setPovThemeEnabled] = useState(true);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const isDragging = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedNovelId) return;
    novelsApi.get(selectedNovelId)
      .then((data) => setNovel(data.novel))
      .catch(() => setNovel(null))
      .finally(() => setLoading(false));
  }, [selectedNovelId]);

  // Load reader settings
  useEffect(() => {
    settingsApi.get()
      .then((data) => {
        if (data.settings) {
          setLocalSettings(data.settings);
          setReaderSettings(data.settings);
        }
      })
      .catch(() => {});
  }, [setReaderSettings]);

  // Load reading progress and navigate to last read chapter
  useEffect(() => {
    if (!selectedNovelId) return;
    progressApi.get(selectedNovelId)
      .then((data) => {
        if (data.progress && data.progress.chapterId && !selectedChapterId) {
          navigate('reader', selectedNovelId, data.progress.chapterId);
        }
      })
      .catch(() => {});
  }, [selectedNovelId, selectedChapterId, navigate]);

  const novelChapters = novel
    ? [...novel.chapters].sort((a, b) => a.order - b.order)
    : [];

  const initialIndex = useMemo(() => {
    if (selectedChapterId && novelChapters.length > 0) {
      const idx = novelChapters.findIndex((c) => c.id === selectedChapterId);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [selectedChapterId, novelChapters]);

  const currentIndex = manualIndex ?? initialIndex;

  // Computed reading progress based on current chapter
  const readingProgress = novelChapters.length > 0 ? ((currentIndex + 1) / novelChapters.length) * 100 : 0;

  // Load highlights for current chapter
  useEffect(() => {
    const ch = novelChapters[currentIndex];
    if (ch) {
      highlightsApi.list(ch.id)
        .then((data) => setChapterHighlights(data.highlights))
        .catch(() => setChapterHighlights([]));
    }
  }, [currentIndex, novelChapters]);

  // Update progress on chapter change
  useEffect(() => {
    if (!selectedNovelId || !novelChapters[currentIndex]) return;
    const progress = ((currentIndex + 1) / novelChapters.length) * 100;
    progressApi.upsert({
      novelId: selectedNovelId,
      chapterId: novelChapters[currentIndex].id,
      progress,
    }).catch(() => {});
  }, [currentIndex, selectedNovelId, novelChapters]);

  const goNext = useCallback(() => {
    const next = currentIndex + 1;
    if (next < novelChapters.length) { setManualIndex(next); setSwipeOffset(0); }
  }, [currentIndex, novelChapters.length]);

  const goPrev = useCallback(() => {
    const prev = currentIndex - 1;
    if (prev >= 0) { setManualIndex(prev); setSwipeOffset(0); }
  }, [currentIndex]);

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
    if (diff < -80) goNext();
    else if (diff > 80) goPrev();
    setSwipeOffset(0);
  };

  // Text selection for highlights
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setShowHighlightToolbar(false);
      setSelectedText(null);
      return;
    }
    const text = selection.toString().trim();
    const range = selection.getRangeAt(0);
    const preRange = range.cloneRange();
    preRange.selectNodeContents(contentRef.current || document.body);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const endOffset = startOffset + text.length;
    setSelectedText({ text, startOffset, endOffset });
    setShowHighlightToolbar(true);
  }, []);

  const createHighlight = async (color: string) => {
    if (!selectedText || !novelChapters[currentIndex]) return;
    try {
      const data = await highlightsApi.create({
        chapterId: novelChapters[currentIndex].id,
        text: selectedText.text,
        startOffset: selectedText.startOffset,
        endOffset: selectedText.endOffset,
        color,
      });
      setChapterHighlights([...chapterHighlights, data.highlight]);
      setShowHighlightToolbar(false);
      setSelectedText(null);
      window.getSelection()?.removeAllRanges();
      toast.success('Highlight ditambahkan');
    } catch {
      toast.error('Gagal membuat highlight');
    }
  };

  const deleteHighlight = async (id: string) => {
    try {
      await highlightsApi.delete(id);
      setChapterHighlights(chapterHighlights.filter((h) => h.id !== id));
      toast.success('Highlight dihapus');
    } catch {
      toast.error('Gagal menghapus highlight');
    }
  };

  // Save settings
  const updateSettings = async (updates: Partial<ReaderSettingsType>) => {
    const newSettings = { ...(localSettings || { id: '', userId: user?.id || '', fontSize: 18, fontFamily: 'serif', lineHeight: 'relaxed', pageMargin: 20, theme: 'classic', customBgColor: '#FDF6EC', customTextColor: '#3D2B1F', customAccentColor: '#C67B3C' }), ...updates };
    setLocalSettings(newSettings as ReaderSettingsType);
    setReaderSettings(newSettings as ReaderSettingsType);
    try {
      await settingsApi.upsert(updates);
    } catch {
      // Silent fail for settings
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!novel) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Novel tidak ditemukan</p></div>;
  }

  const currentChapter = novelChapters[currentIndex];
  const povCharacter = currentChapter?.povCharacter;
  const povTheme: POVTheme = povCharacter && povThemeEnabled ? parsePOVTheme(povCharacter.theme) : DEFAULT_POV_THEME;

  // Determine effective theme based on reader settings
  const settingsTheme = localSettings?.theme || 'classic';
  let effectiveTheme: POVTheme;

  if (settingsTheme === 'custom' && localSettings) {
    effectiveTheme = {
      backgroundColor: localSettings.customBgColor || DEFAULT_POV_THEME.backgroundColor,
      textColor: localSettings.customTextColor || DEFAULT_POV_THEME.textColor,
      accentColor: localSettings.customAccentColor || DEFAULT_POV_THEME.accentColor,
      fontFamily: (localSettings.fontFamily as POVTheme['fontFamily']) || 'serif',
      lineHeight: (localSettings.lineHeight as POVTheme['lineHeight']) || 'relaxed',
    };
  } else if (settingsTheme !== 'classic') {
    const preset = THEME_PRESETS.find((p) => p.key === settingsTheme);
    effectiveTheme = preset ? preset.theme : DEFAULT_POV_THEME;
  } else {
    effectiveTheme = povTheme;
  }

  // Apply font/margin from settings
  const fontSize = localSettings?.fontSize || 18;
  const pageMargin = localSettings?.pageMargin || 20;

  const lineHeightClass = effectiveTheme.lineHeight === 'compact' ? 'leading-tight' : effectiveTheme.lineHeight === 'relaxed' ? 'leading-loose' : 'leading-normal';
  const fontClass = effectiveTheme.fontFamily === 'serif' ? 'font-serif-reading' : effectiveTheme.fontFamily === 'mono' ? 'font-mono-reading' : 'font-sans-reading';

  if (novelChapters.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: effectiveTheme.backgroundColor }}>
        <BookOpen className="w-16 h-16 mb-4" style={{ color: effectiveTheme.accentColor, opacity: 0.3 }} />
        <p className="text-lg font-semibold mb-2" style={{ color: effectiveTheme.textColor }}>Belum Ada Bab</p>
        <Button onClick={() => navigate('novel-detail', novel.id)} variant="outline">Kembali</Button>
      </div>
    );
  }

  // Render highlighted content
  const renderContent = (content: string) => {
    if (!content) return <p className="italic opacity-40">Belum ada konten untuk bab ini.</p>;

    // Simple approach: render content and overlay highlights
    // For a production app, we'd need a more sophisticated approach
    // but for now we'll use a simple text replacement
    let html = content;
    // Sort highlights by startOffset
    const sorted = [...chapterHighlights].sort((a, b) => b.startOffset - a.startOffset);
    const plainText = content.replace(/<[^>]*>/g, '');

    // For HTML content, we just render it as-is with the highlights shown separately
    return (
      <div
        className={`text-base sm:text-lg ${fontClass} ${lineHeightClass} whitespace-pre-wrap`}
        style={{ fontSize: `${fontSize}px` }}
        ref={contentRef}
        onMouseUp={handleTextSelection}
        onTouchEnd={() => setTimeout(handleTextSelection, 100)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  // Scroll mode
  if (novel.readMode === 'scroll') {
    return (
      <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: effectiveTheme.backgroundColor, color: effectiveTheme.textColor }}>
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 backdrop-blur-md" style={{ backgroundColor: `${effectiveTheme.backgroundColor}dd` }}>
          <button onClick={() => navigate('novel-detail', novel.id)} className="p-1.5 rounded-lg hover:bg-black/10"><ArrowLeft className="w-5 h-5" style={{ color: effectiveTheme.textColor }} /></button>
          <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{ color: effectiveTheme.textColor }}>{novel.title}</p><p className="text-xs opacity-60">Mode Scroll</p></div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowHighlights(!showHighlights)} className="p-1.5 rounded-lg hover:bg-black/10"><Highlighter className="w-4 h-4" style={{ color: effectiveTheme.textColor }} /></button>
            <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded-lg hover:bg-black/10"><Settings className="w-4 h-4" style={{ color: effectiveTheme.textColor }} /></button>
          </div>
        </div>
        <div className="max-w-2xl mx-auto" style={{ paddingLeft: `${pageMargin}px`, paddingRight: `${pageMargin}px`, paddingBottom: '80px' }}>
          {novelChapters.map((chapter, idx) => {
            const char = chapter.povCharacter;
            const chTheme = char && povThemeEnabled ? parsePOVTheme(char.theme) : DEFAULT_POV_THEME;
            const chFont = chTheme.fontFamily === 'serif' ? 'font-serif-reading' : chTheme.fontFamily === 'mono' ? 'font-mono-reading' : 'font-sans-reading';
            const chLH = chTheme.lineHeight === 'compact' ? 'leading-tight' : chTheme.lineHeight === 'relaxed' ? 'leading-loose' : 'leading-normal';
            return (
              <div key={chapter.id} className="py-8 transition-colors duration-500" style={{ backgroundColor: chTheme.backgroundColor, color: chTheme.textColor, marginLeft: `-${pageMargin}px`, marginRight: `-${pageMargin}px`, paddingLeft: `${pageMargin}px`, paddingRight: `${pageMargin}px` }}>
                {idx > 0 && <div className="flex items-center gap-3 mb-8"><div className="h-px flex-1" style={{ backgroundColor: `${chTheme.accentColor}40` }} /><div className="w-2 h-2 rounded-full" style={{ backgroundColor: chTheme.accentColor }} /><div className="h-px flex-1" style={{ backgroundColor: `${chTheme.accentColor}40` }} /></div>}
                {char && <div className="flex items-center gap-2 mb-4"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: char.avatarColor }} /><span className="text-xs font-medium" style={{ color: chTheme.accentColor }}>POV {char.name}</span></div>}
                <h2 className="text-xl font-bold mb-6" style={{ color: chTheme.accentColor }}>Bab {idx + 1}: {chapter.title}</h2>
                <div className={`text-base ${chFont} ${chLH} whitespace-pre-wrap`} style={{ fontSize: `${fontSize}px` }}>
                  {chapter.content ? <p className="drop-cap">{chapter.content}</p> : <p className="italic opacity-40">Belum ada konten</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="fixed bottom-0 left-0 right-0 z-10" style={{ backgroundColor: `${effectiveTheme.backgroundColor}ee` }}>
          <div className="h-1 w-full" style={{ backgroundColor: `${effectiveTheme.accentColor}20` }}>
            <div className="h-full transition-all duration-500" style={{ width: `${readingProgress}%`, backgroundColor: effectiveTheme.accentColor }} />
          </div>
          <div className="px-4 py-2 text-center">
            <span className="text-[10px]" style={{ color: effectiveTheme.textColor, opacity: 0.6 }}>{Math.round(readingProgress)}% dibaca</span>
          </div>
        </div>

        {/* Settings Panel */}
        <ReaderSettingsPanel
          show={showSettings}
          onClose={() => setShowSettings(false)}
          settings={localSettings}
          onUpdate={updateSettings}
          theme={effectiveTheme}
          povThemeEnabled={povThemeEnabled}
          onTogglePovTheme={() => setPovThemeEnabled(!povThemeEnabled)}
        />

        {/* Highlights Panel */}
        <HighlightsPanel
          show={showHighlights}
          onClose={() => setShowHighlights(false)}
          highlights={chapterHighlights}
          onDelete={deleteHighlight}
          theme={effectiveTheme}
        />

        {/* Highlight Toolbar */}
        <HighlightToolbar show={showHighlightToolbar} onSelectColor={createHighlight} theme={effectiveTheme} />
      </div>
    );
  }

  // Swipe mode
  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500" style={{ backgroundColor: effectiveTheme.backgroundColor, color: effectiveTheme.textColor }}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: `${effectiveTheme.backgroundColor}ee` }}>
        <button onClick={() => navigate('novel-detail', novel.id)} className="p-1.5 rounded-lg hover:bg-black/10"><ArrowLeft className="w-5 h-5" style={{ color: effectiveTheme.textColor }} /></button>
        <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{ color: effectiveTheme.textColor }}>{novel.title}</p><p className="text-xs opacity-60">Bab {currentIndex + 1} dari {novelChapters.length}</p></div>
        <div className="flex items-center gap-1">
          {povCharacter && <div className="flex items-center gap-1.5 mr-1"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: povCharacter.avatarColor }} /><span className="text-[10px] font-medium" style={{ color: effectiveTheme.accentColor }}>{povCharacter.name}</span></div>}
          <button onClick={() => setShowHighlights(!showHighlights)} className="p-1.5 rounded-lg hover:bg-black/10"><Highlighter className="w-4 h-4" style={{ color: effectiveTheme.textColor }} /></button>
          <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded-lg hover:bg-black/10"><Settings className="w-4 h-4" style={{ color: effectiveTheme.textColor }} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <AnimatePresence mode="wait">
          <motion.div key={currentChapter?.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: swipeOffset }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="max-w-2xl mx-auto py-6 h-full overflow-y-auto" style={{ paddingLeft: `${pageMargin}px`, paddingRight: `${pageMargin}px` }}>
            <div className="mb-8">
              <p className="text-xs font-medium mb-1" style={{ color: effectiveTheme.accentColor }}>Bab {currentIndex + 1}</p>
              <h2 className="text-2xl font-bold" style={{ color: effectiveTheme.accentColor }}>{currentChapter?.title}</h2>
              <div className="h-0.5 w-16 mt-3 rounded-full" style={{ backgroundColor: effectiveTheme.accentColor }} />
            </div>
            {renderContent(currentChapter?.content || '')}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom bar with progress */}
      <div className="px-5 pt-2 pb-2 safe-area-bottom" style={{ backgroundColor: `${effectiveTheme.backgroundColor}ee` }}>
        {/* Progress bar */}
        <div className="h-1 w-full rounded-full mb-2" style={{ backgroundColor: `${effectiveTheme.accentColor}20` }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${readingProgress}%`, backgroundColor: effectiveTheme.accentColor }} />
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" disabled={currentIndex === 0} onClick={goPrev} className="gap-1" style={{ color: effectiveTheme.textColor }}><ChevronLeft className="w-4 h-4" /> Sebelumnya</Button>
          <span className="text-[10px] opacity-60">{Math.round(readingProgress)}% dibaca</span>
          <Button variant="ghost" size="sm" disabled={currentIndex === novelChapters.length - 1} onClick={goNext} className="gap-1" style={{ color: effectiveTheme.textColor }}>Selanjutnya <ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Settings Panel */}
      <ReaderSettingsPanel
        show={showSettings}
        onClose={() => setShowSettings(false)}
        settings={localSettings}
        onUpdate={updateSettings}
        theme={effectiveTheme}
        povThemeEnabled={povThemeEnabled}
        onTogglePovTheme={() => setPovThemeEnabled(!povThemeEnabled)}
      />

      {/* Highlights Panel */}
      <HighlightsPanel
        show={showHighlights}
        onClose={() => setShowHighlights(false)}
        highlights={chapterHighlights}
        onDelete={deleteHighlight}
        theme={effectiveTheme}
      />

      {/* Highlight Toolbar */}
      <HighlightToolbar show={showHighlightToolbar} onSelectColor={createHighlight} theme={effectiveTheme} />
    </div>
  );
}

// Reader Settings Panel
function ReaderSettingsPanel({ show, onClose, settings, onUpdate, theme, povThemeEnabled, onTogglePovTheme }: {
  show: boolean;
  onClose: () => void;
  settings: ReaderSettingsType | null;
  onUpdate: (updates: Partial<ReaderSettingsType>) => void;
  theme: POVTheme;
  povThemeEnabled: boolean;
  onTogglePovTheme: () => void;
}) {
  const fontSize = settings?.fontSize || 18;
  const fontFamily = settings?.fontFamily || 'serif';
  const lineHeight = settings?.lineHeight || 'relaxed';
  const pageMargin = settings?.pageMargin || 20;
  const currentTheme = settings?.theme || 'classic';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-40 bg-card border-t border-border/50 rounded-t-2xl shadow-xl max-h-[70vh] overflow-y-auto"
        >
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><Palette className="w-4 h-4" /> Pengaturan Pembaca</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-5">
              {/* POV Theme Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Tema POV Karakter</p>
                  <p className="text-xs text-muted-foreground">Gunakan warna tema karakter</p>
                </div>
                <button
                  onClick={onTogglePovTheme}
                  className={`w-10 h-6 rounded-full transition-colors ${povThemeEnabled ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${povThemeEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Font Size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Ukuran Font</p>
                  <span className="text-xs text-muted-foreground">{fontSize}px</span>
                </div>
                <Slider
                  value={[fontSize]}
                  onValueChange={([v]) => onUpdate({ fontSize: v })}
                  min={14}
                  max={28}
                  step={1}
                />
              </div>

              {/* Font Family */}
              <div>
                <p className="text-sm font-medium mb-2">Jenis Font</p>
                <div className="flex gap-2">
                  {[
                    { key: 'serif', label: 'Serif', className: 'font-serif-reading' },
                    { key: 'sans', label: 'Sans-serif', className: 'font-sans-reading' },
                    { key: 'mono', label: 'Mono', className: 'font-mono-reading' },
                  ].map((f) => (
                    <button key={f.key} onClick={() => onUpdate({ fontFamily: f.key })} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${fontFamily === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} ${f.className}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Height */}
              <div>
                <p className="text-sm font-medium mb-2">Jarak Baris</p>
                <div className="flex gap-2">
                  {[
                    { key: 'compact', label: 'Rapat' },
                    { key: 'normal', label: 'Normal' },
                    { key: 'relaxed', label: 'Longgar' },
                  ].map((l) => (
                    <button key={l.key} onClick={() => onUpdate({ lineHeight: l.key })} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${lineHeight === l.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page Margin */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Margin Halaman</p>
                  <span className="text-xs text-muted-foreground">{pageMargin}px</span>
                </div>
                <Slider
                  value={[pageMargin]}
                  onValueChange={([v]) => onUpdate({ pageMargin: v })}
                  min={10}
                  max={40}
                  step={2}
                />
              </div>

              {/* Theme */}
              <div>
                <p className="text-sm font-medium mb-2">Tema</p>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_PRESETS.map((preset) => (
                    <button key={preset.key} onClick={() => onUpdate({ theme: preset.key })} className={`p-2 rounded-xl border-2 transition-all ${currentTheme === preset.key ? 'border-primary' : 'border-transparent'}`}>
                      <div className="flex gap-1 mb-1 justify-center">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.theme.backgroundColor, border: '1px solid rgba(0,0,0,0.1)' }} />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.theme.textColor }} />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.theme.accentColor }} />
                      </div>
                      <p className="text-[10px] font-medium text-center">{preset.name}</p>
                    </button>
                  ))}
                  <button onClick={() => onUpdate({ theme: 'custom' })} className={`p-2 rounded-xl border-2 transition-all ${currentTheme === 'custom' ? 'border-primary' : 'border-transparent'}`}>
                    <div className="flex gap-1 mb-1 justify-center">
                      <div className="w-3 h-3 rounded-full border border-dashed border-muted-foreground" style={{ backgroundColor: settings?.customBgColor || '#FDF6EC' }} />
                      <div className="w-3 h-3 rounded-full border border-dashed border-muted-foreground" style={{ backgroundColor: settings?.customTextColor || '#3D2B1F' }} />
                      <div className="w-3 h-3 rounded-full border border-dashed border-muted-foreground" style={{ backgroundColor: settings?.customAccentColor || '#C67B3C' }} />
                    </div>
                    <p className="text-[10px] font-medium text-center">Kustom</p>
                  </button>
                </div>
              </div>

              {/* Custom theme colors */}
              {currentTheme === 'custom' && (
                <div className="space-y-3 p-3 rounded-xl bg-muted/30">
                  <p className="text-sm font-medium">Warna Kustom</p>
                  {[
                    { key: 'customBgColor' as const, label: 'Latar Belakang', defaultVal: '#FDF6EC' },
                    { key: 'customTextColor' as const, label: 'Teks', defaultVal: '#3D2B1F' },
                    { key: 'customAccentColor' as const, label: 'Aksen', defaultVal: '#C67B3C' },
                  ].map((c) => (
                    <div key={c.key} className="flex items-center gap-3">
                      <input
                        type="color"
                        value={(settings?.[c.key] as string) || c.defaultVal}
                        onChange={(e) => onUpdate({ [c.key]: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground">{c.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Highlights Panel
function HighlightsPanel({ show, onClose, highlights, onDelete, theme }: {
  show: boolean;
  onClose: () => void;
  highlights: HighlightType[];
  onDelete: (id: string) => void;
  theme: POVTheme;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-40 bg-card border-t border-border/50 rounded-t-2xl shadow-xl max-h-[60vh] overflow-y-auto"
        >
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><Highlighter className="w-4 h-4" /> Catatan ({highlights.length})</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            {highlights.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada highlight di bab ini. Pilih teks untuk menandai.</p>
            ) : (
              <div className="space-y-2">
                {highlights.map((h) => (
                  <div key={h.id} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-start gap-2">
                      <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: h.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">&ldquo;{h.text}&rdquo;</p>
                        {h.note && <p className="text-xs text-muted-foreground mt-1">{h.note}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(h.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <button onClick={() => onDelete(h.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Highlight Toolbar (floating, shown on text selection)
function HighlightToolbar({ show, onSelectColor, theme }: {
  show: boolean;
  onSelectColor: (color: string) => void;
  theme: POVTheme;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-2 rounded-xl shadow-xl bg-card border border-border/50"
        >
          {HIGHLIGHT_COLORS.map((hc) => (
            <button
              key={hc.color}
              onClick={() => onSelectColor(hc.color)}
              className="w-8 h-8 rounded-full transition-transform hover:scale-110 border-2 border-white/50 shadow-sm"
              style={{ backgroundColor: hc.color }}
              title={hc.name}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
