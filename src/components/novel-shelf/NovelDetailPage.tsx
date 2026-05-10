'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, ScrollText, Globe, StickyNote, Plus, Settings, Trash2, Edit3, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useNovelShelfStore } from '@/lib/store';
import { EmptyState } from './EmptyState';

export function NovelDetailPage() {
  const { novels, chapters, characters, loreEntries, selectedNovelId, navigate, updateNovel, deleteChapter, updateChapter } = useNovelShelfStore();
  const [activeTab, setActiveTab] = useState('chapters');
  const [loreCategory, setLoreCategory] = useState<string>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingNovel, setEditingNovel] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', author: '', description: '', genre: '' });

  const novel = novels.find((n) => n.id === selectedNovelId);
  if (!novel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Novel tidak ditemukan</p>
      </div>
    );
  }

  const novelChapters = chapters
    .filter((c) => c.novelId === novel.id)
    .sort((a, b) => a.order - b.order);

  const novelCharacters = characters.filter((c) => c.novelId === novel.id);
  const novelLore = loreEntries.filter((l) => l.novelId === novel.id);

  const filteredLore =
    loreCategory === 'all'
      ? novelLore
      : novelLore.filter((l) => l.category === loreCategory);

  const handleMoveChapter = (chapterId: string, direction: 'up' | 'down') => {
    const idx = novelChapters.findIndex((c) => c.id === chapterId);
    if (direction === 'up' && idx > 0) {
      updateChapter(chapterId, { order: novelChapters[idx - 1].order });
      updateChapter(novelChapters[idx - 1].id, { order: novelChapters[idx].order });
    } else if (direction === 'down' && idx < novelChapters.length - 1) {
      updateChapter(chapterId, { order: novelChapters[idx + 1].order });
      updateChapter(novelChapters[idx + 1].id, { order: novelChapters[idx].order });
    }
  };

  const handleDeleteNovel = () => {
    const store = useNovelShelfStore.getState();
    store.deleteNovel(novel.id);
    navigate('bookshelf');
  };

  const startEdit = () => {
    setEditForm({
      title: novel.title,
      author: novel.author,
      description: novel.description,
      genre: novel.genre,
    });
    setEditingNovel(true);
  };

  const saveEdit = () => {
    updateNovel(novel.id, editForm);
    setEditingNovel(false);
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    character: <BookOpen className="w-3.5 h-3.5" />,
    backstory: <ScrollText className="w-3.5 h-3.5" />,
    worldbuilding: <Globe className="w-3.5 h-3.5" />,
    notes: <StickyNote className="w-3.5 h-3.5" />,
  };

  const categoryLabels: Record<string, string> = {
    character: 'Karakter',
    backstory: 'Backstory',
    worldbuilding: 'Worldbuilding',
    notes: 'Catatan',
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative">
        {/* Cover Banner */}
        <div
          className="h-48 sm:h-56 relative"
          style={{ backgroundColor: novel.coverColor || '#C67B3C' }}
        >
          {novel.coverImage && (
            <img
              src={novel.coverImage}
              alt={novel.title}
              className="w-full h-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />
          <button
            onClick={() => navigate('bookshelf')}
            className="absolute top-12 left-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={startEdit}
            className="absolute top-12 right-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          >
            <Edit3 className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Novel Info */}
        <div className="px-5 -mt-12 relative z-10">
          <div className="flex gap-4">
            <div
              className="w-20 h-28 rounded-xl shadow-lg overflow-hidden flex-shrink-0 border-2 border-card"
              style={{ backgroundColor: novel.coverColor || '#C67B3C' }}
            >
              {novel.coverImage ? (
                <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-1">
                  <span className="text-white/90 font-bold text-[9px] text-center leading-tight line-clamp-4">
                    {novel.title}
                  </span>
                </div>
              )}
            </div>
            <div className="pt-10 flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground line-clamp-2">{novel.title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{novel.author}</p>
              {novel.genre && (
                <Badge variant="secondary" className="mt-2 text-[10px]">
                  {novel.genre}
                </Badge>
              )}
            </div>
          </div>
          {novel.description && (
            <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{novel.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mt-5">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="chapters" className="text-xs">
              Bab ({novelChapters.length})
            </TabsTrigger>
            <TabsTrigger value="lore" className="text-xs">
              Lore ({novelLore.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              Pengaturan
            </TabsTrigger>
          </TabsList>

          {/* Chapters Tab */}
          <TabsContent value="chapters" className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Daftar Bab</h3>
              <Button
                size="sm"
                className="gap-1 text-xs"
                onClick={() => navigate('add-chapter', novel.id)}
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Bab
              </Button>
            </div>

            {novelChapters.length === 0 ? (
              <EmptyState
                icon={<ScrollText className="w-10 h-10 text-primary" />}
                title="Belum Ada Bab"
                description="Mulai tulis ceritamu! Tambahkan bab pertama untuk novel ini."
                actionLabel="Tambah Bab"
                onAction={() => navigate('add-chapter', novel.id)}
              />
            ) : (
              <div className="space-y-2">
                {novelChapters.map((chapter, i) => {
                  const povChar = novelCharacters.find((c) => c.id === chapter.povCharacterId);
                  return (
                    <motion.div
                      key={chapter.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-2"
                    >
                      <div className="flex-1">
                        <button
                          onClick={() => navigate('reader', novel.id, chapter.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted/50 transition-colors text-left border border-border/50"
                        >
                          <span className="text-xs font-mono text-muted-foreground w-6 text-center">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-1">
                              {chapter.title}
                            </p>
                            {povChar && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: povChar.avatarColor }}
                                />
                                <span className="text-[10px] text-muted-foreground">
                                  POV {povChar.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                      {/* Reorder & Delete */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMoveChapter(chapter.id, 'up')}
                          disabled={i === 0}
                          className="p-1 rounded hover:bg-muted disabled:opacity-30"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveChapter(chapter.id, 'down')}
                          disabled={i === novelChapters.length - 1}
                          className="p-1 rounded hover:bg-muted disabled:opacity-30"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {confirmDelete === chapter.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              deleteChapter(chapter.id);
                              setConfirmDelete(null);
                            }}
                            className="p-1.5 rounded bg-destructive/10 text-destructive text-[10px]"
                          >
                            Hapus
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="p-1.5 rounded bg-muted text-[10px]"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(chapter.id)}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Lore Tab */}
          <TabsContent value="lore" className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Lore Book</h3>
              <Button
                size="sm"
                className="gap-1 text-xs"
                onClick={() => navigate('add-lore', novel.id)}
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Lore
              </Button>
            </div>

            {/* Category Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
              {['all', 'character', 'backstory', 'worldbuilding', 'notes'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setLoreCategory(cat)}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    loreCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {cat !== 'all' && categoryIcons[cat]}
                  {cat === 'all' ? 'Semua' : categoryLabels[cat]}
                </button>
              ))}
            </div>

            {filteredLore.length === 0 ? (
              <EmptyState
                icon={<Globe className="w-10 h-10 text-primary" />}
                title="Belum Ada Lore"
                description="Buat lore book untuk menyimpan karakter, backstory, worldbuilding, dan catatan penting novel ini."
                actionLabel="Tambah Lore"
                onAction={() => navigate('add-lore', novel.id)}
              />
            ) : (
              <div className="space-y-2">
                {filteredLore.map((entry, i) => (
                  <LoreEntryCard key={entry.id} entry={entry} categoryIcons={categoryIcons} categoryLabels={categoryLabels} />
                ))}
              </div>
            )}

            {/* Quick link to full Lore Book */}
            {novelLore.length > 0 && (
              <Button
                variant="outline"
                className="w-full mt-4 gap-2"
                onClick={() => navigate('lorebook', novel.id)}
              >
                <Globe className="w-4 h-4" />
                Buka Lore Book Lengkap
              </Button>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4 space-y-4">
            {/* Reading Mode */}
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-3">Mode Baca</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Swipe Horizontal</p>
                  <p className="text-xs text-muted-foreground">Geser untuk ganti bab</p>
                </div>
                <Switch
                  checked={novel.readMode === 'swipe'}
                  onCheckedChange={(checked) =>
                    updateNovel(novel.id, { readMode: checked ? 'swipe' : 'scroll' })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {novel.readMode === 'swipe'
                  ? 'Aktif: Geser kiri/kanan untuk ganti bab'
                  : 'Aktif: Scroll vertikal untuk baca semua bab'}
              </p>
            </div>

            {/* Character Management */}
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Karakter & POV Tema</h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs"
                  onClick={() => navigate('edit-character', novel.id)}
                >
                  <Plus className="w-3 h-3" />
                  Tambah
                </Button>
              </div>
              {novelCharacters.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Belum ada karakter. Tambahkan karakter untuk menggunakan fitur POV Tema.
                </p>
              ) : (
                <div className="space-y-2">
                  {novelCharacters.map((char) => (
                    <button
                      key={char.id}
                      onClick={() => navigate('edit-character', novel.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: char.avatarColor }}
                      >
                        {char.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium text-foreground">{char.name}</p>
                        <div className="flex gap-1 mt-0.5">
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: char.theme.backgroundColor }}
                            title="Background"
                          />
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: char.theme.textColor }}
                            title="Text"
                          />
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: char.theme.accentColor }}
                            title="Accent"
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
              <h3 className="text-sm font-semibold text-destructive mb-2">Zona Bahaya</h3>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1"
                onClick={handleDeleteNovel}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Novel
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Menghapus novel akan menghapus semua bab, karakter, dan lore book. Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Novel Modal */}
      <AnimatePresence>
        {editingNovel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Edit Novel</h2>
                <button onClick={() => setEditingNovel(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Judul</label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Penulis</label>
                  <input
                    value={editForm.author}
                    onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Deskripsi</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Genre</label>
                  <input
                    value={editForm.genre}
                    onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
                  />
                </div>
                <Button onClick={saveEdit} className="w-full">
                  Simpan Perubahan
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoreEntryCard({
  entry,
  categoryIcons,
  categoryLabels,
}: {
  entry: { id: string; category: string; title: string; content: string; tags: string[] };
  categoryIcons: Record<string, React.ReactNode>;
  categoryLabels: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);
  const { deleteLoreEntry } = useNovelShelfStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-xl bg-card border border-border/50"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-2 text-left"
      >
        <span className="mt-0.5 text-primary">{categoryIcons[entry.category]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground line-clamp-1">{entry.title}</p>
            <Badge variant="secondary" className="text-[9px] flex-shrink-0">
              {categoryLabels[entry.category] || entry.category}
            </Badge>
          </div>
          {!expanded && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.content}</p>
          )}
        </div>
      </button>
      {expanded && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          className="mt-2 ml-6"
        >
          <p className="text-sm text-foreground whitespace-pre-wrap">{entry.content}</p>
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[9px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <button
            onClick={() => deleteLoreEntry(entry.id)}
            className="text-xs text-destructive mt-2 hover:underline"
          >
            Hapus
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
