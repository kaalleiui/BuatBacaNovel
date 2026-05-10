'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, BookOpen, ScrollText, Globe, StickyNote, Plus, Settings, Trash2, Edit3, GripVertical, X, MessageCircle, Send, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useNovelShelfStore } from '@/lib/store';
import { novelsApi, chaptersApi, charactersApi, loreApi, commentsApi, exportApi, type NovelDetail, type ChapterWithPOV, type CommentWithUser } from '@/lib/api';
import { parsePOVTheme } from '@/lib/types';
import { EmptyState } from './EmptyState';
import { toast } from 'sonner';

export function NovelDetailPage() {
  const { selectedNovelId, navigate, user } = useNovelShelfStore();
  const [novel, setNovel] = useState<NovelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chapters');
  const [loreCategory, setLoreCategory] = useState<string>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingNovel, setEditingNovel] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', genre: '' });
  const [commentText, setCommentText] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const loadNovel = useCallback(async () => {
    if (!selectedNovelId) return;
    try {
      const data = await novelsApi.get(selectedNovelId);
      setNovel(data.novel);
    } catch {
      setNovel(null);
    } finally {
      setLoading(false);
    }
  }, [selectedNovelId]);

  useEffect(() => { loadNovel(); }, [loadNovel]);

  const isOwner = user && novel && (novel.userId === user.id || user.role === 'ADMIN');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    if (!novel) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const novelChapters = novel.chapters.sort((a, b) => a.order - b.order);
    const oldIndex = novelChapters.findIndex((c) => c.id === active.id);
    const newIndex = novelChapters.findIndex((c) => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(novelChapters, oldIndex, newIndex);

    // Update local state immediately
    setNovel({ ...novel, chapters: reordered });

    // Update orders via API
    try {
      const updates = reordered.map((ch, idx) =>
        chaptersApi.update(ch.id, { order: idx })
      );
      await Promise.all(updates);
    } catch {
      toast.error('Gagal menyimpan urutan');
      loadNovel();
    }
  }, [novel, loadNovel]);

  const handleDeleteChapter = async (id: string) => {
    await chaptersApi.delete(id);
    setConfirmDelete(null);
    loadNovel();
    toast.success('Bab dihapus');
  };

  const handleDeleteNovel = async () => {
    await novelsApi.delete(novel.id);
    navigate('bookshelf');
    toast.success('Novel dihapus');
  };

  const startEdit = () => {
    setEditForm({ title: novel.title, description: novel.description, genre: novel.genre });
    setEditingNovel(true);
  };

  const saveEdit = async () => {
    await novelsApi.update(novel.id, editForm);
    setEditingNovel(false);
    loadNovel();
    toast.success('Novel diperbarui');
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await commentsApi.create(novel.id, commentText.trim());
    setCommentText('');
    loadNovel();
    toast.success('Komentar ditambahkan');
  };

  const handleDeleteComment = async (id: string) => {
    await commentsApi.delete(id);
    loadNovel();
    toast.success('Komentar dihapus');
  };

  const handleExport = async (format: 'epub' | 'pdf') => {
    setExporting(true);
    setShowExportMenu(false);
    try {
      await exportApi.novel(novel.id, format);
      toast.success(`Berhasil mengekspor ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengekspor');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Novel tidak ditemukan</p>
      </div>
    );
  }

  const novelChapters = novel.chapters.sort((a, b) => a.order - b.order);
  const novelCharacters = novel.characters;
  const novelLore = novel.loreEntries;
  const filteredLore = loreCategory === 'all' ? novelLore : novelLore.filter((l) => l.category === loreCategory);

  const categoryIcons: Record<string, React.ReactNode> = {
    character: <BookOpen className="w-3.5 h-3.5" />,
    backstory: <ScrollText className="w-3.5 h-3.5" />,
    worldbuilding: <Globe className="w-3.5 h-3.5" />,
    notes: <StickyNote className="w-3.5 h-3.5" />,
  };
  const categoryLabels: Record<string, string> = {
    character: 'Karakter', backstory: 'Backstory', worldbuilding: 'Worldbuilding', notes: 'Catatan',
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="relative">
        <div className="h-48 sm:h-56 relative" style={{ backgroundColor: novel.coverColor || '#C67B3C' }}>
          {novel.coverImage && <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover opacity-60" />}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />
          <button onClick={() => navigate('bookshelf')} className="absolute top-12 left-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          {isOwner && (
            <button onClick={startEdit} className="absolute top-12 right-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <Edit3 className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
        <div className="px-5 -mt-12 relative z-10">
          <div className="flex gap-4">
            <div className="w-20 h-28 rounded-xl shadow-lg overflow-hidden flex-shrink-0 border-2 border-card" style={{ backgroundColor: novel.coverColor || '#C67B3C' }}>
              {novel.coverImage ? (
                <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-1">
                  <span className="text-white/90 font-bold text-[9px] text-center leading-tight line-clamp-4">{novel.title}</span>
                </div>
              )}
            </div>
            <div className="pt-10 flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground line-clamp-2">{novel.title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">oleh {novel.user.nickname}</p>
              {novel.genre && <Badge variant="secondary" className="mt-2 text-[10px]">{novel.genre}</Badge>}
            </div>
          </div>
          {novel.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{novel.description}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mt-5">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="chapters" className="text-xs">Bab ({novelChapters.length})</TabsTrigger>
            <TabsTrigger value="lore" className="text-xs">Lore ({novelLore.length})</TabsTrigger>
            <TabsTrigger value="comments" className="text-xs">💬 ({novel.comments.length})</TabsTrigger>
            {isOwner && <TabsTrigger value="settings" className="text-xs">⚙️</TabsTrigger>}
          </TabsList>

          {/* Chapters Tab */}
          <TabsContent value="chapters" className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Daftar Bab</h3>
              {isOwner && (
                <Button size="sm" className="gap-1 text-xs" onClick={() => navigate('add-chapter', novel.id)}>
                  <Plus className="w-3.5 h-3.5" /> Tambah Bab
                </Button>
              )}
            </div>
            {novelChapters.length === 0 ? (
              <EmptyState icon={<ScrollText className="w-10 h-10 text-primary" />} title="Belum Ada Bab" description="Mulai tulis ceritamu!" actionLabel="Tambah Bab" onAction={() => navigate('add-chapter', novel.id)} />
            ) : isOwner ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={novelChapters.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {novelChapters.map((chapter, i) => (
                      <SortableChapterItem
                        key={chapter.id}
                        chapter={chapter}
                        index={i}
                        isOwner={!!isOwner}
                        confirmDelete={confirmDelete}
                        setConfirmDelete={setConfirmDelete}
                        onDelete={handleDeleteChapter}
                        onNavigate={() => navigate('reader', novel.id, chapter.id)}
                        onEdit={() => navigate('chapter-editor', novel.id, chapter.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="space-y-2">
                {novelChapters.map((chapter, i) => {
                  const povChar = chapter.povCharacter;
                  return (
                    <motion.div key={chapter.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <button onClick={() => navigate('reader', novel.id, chapter.id)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted/50 transition-colors text-left border border-border/50">
                        <span className="text-xs font-mono text-muted-foreground w-6 text-center">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-1">{chapter.title}</p>
                          {povChar && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: povChar.avatarColor }} />
                              <span className="text-[10px] text-muted-foreground">POV {povChar.name}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Lore Tab */}
          <TabsContent value="lore" className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Lore Book</h3>
              {isOwner && (
                <Button size="sm" className="gap-1 text-xs" onClick={() => navigate('add-lore', novel.id)}>
                  <Plus className="w-3.5 h-3.5" /> Tambah Lore
                </Button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
              {['all', 'character', 'backstory', 'worldbuilding', 'notes'].map((cat) => (
                <button key={cat} onClick={() => setLoreCategory(cat)} className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${loreCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {cat !== 'all' && categoryIcons[cat]} {cat === 'all' ? 'Semua' : categoryLabels[cat]}
                </button>
              ))}
            </div>
            {filteredLore.length === 0 ? (
              <EmptyState icon={<Globe className="w-10 h-10 text-primary" />} title="Belum Ada Lore" description="Buat lore book untuk menyimpan detail dunia novel ini." actionLabel="Tambah Lore" onAction={() => navigate('add-lore', novel.id)} />
            ) : (
              <div className="space-y-2">
                {filteredLore.map((entry, i) => (
                  <LoreEntryCard key={entry.id} entry={entry} categoryIcons={categoryIcons} categoryLabels={categoryLabels} onDelete={async (id) => { await loreApi.delete(id); loadNovel(); toast.success('Lore dihapus'); }} isOwner={!!isOwner} />
                ))}
              </div>
            )}
            {novelLore.length > 0 && (
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => navigate('lorebook', novel.id)}>
                  <Globe className="w-4 h-4" /> Buka Lore Book
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => navigate('lore-map', novel.id)}>
                  <Globe className="w-4 h-4" /> Peta Lore
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="mt-4">
            <h3 className="text-sm font-semibold mb-3">Komentar ({novel.comments.length})</h3>
            {user && (
              <div className="flex gap-2 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: user.avatarColor }}>
                  {user.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Tulis komentar..."
                    className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <Button size="icon" onClick={handleAddComment} disabled={!commentText.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            {novel.comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada komentar. Jadilah yang pertama!</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {novel.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-3 rounded-xl bg-card border border-border/50">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: comment.user.avatarColor }}>
                      {comment.user.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{comment.user.nickname}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                    {(user && (comment.userId === user.id || isOwner)) && (
                      <button onClick={() => handleDeleteComment(comment.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab (owner only) */}
          {isOwner && (
            <TabsContent value="settings" className="mt-4 space-y-4">
              <div className="p-4 rounded-xl bg-card border border-border/50">
                <h3 className="text-sm font-semibold mb-3">Mode Baca</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Swipe Horizontal</p>
                    <p className="text-xs text-muted-foreground">Geser untuk ganti bab</p>
                  </div>
                  <Switch
                    checked={novel.readMode === 'swipe'}
                    onCheckedChange={async (checked) => {
                      await novelsApi.update(novel.id, { readMode: checked ? 'swipe' : 'scroll' });
                      loadNovel();
                    }}
                  />
                </div>
              </div>

              {/* Export */}
              <div className="p-4 rounded-xl bg-card border border-border/50">
                <h3 className="text-sm font-semibold mb-3">Ekspor Novel</h3>
                <div className="flex gap-2 relative">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={exporting}
                  >
                    <Download className="w-4 h-4" />
                    {exporting ? 'Mengekspor...' : 'Ekspor'}
                  </Button>
                  <AnimatePresence>
                    {showExportMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-1 left-0 right-0 bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden z-10"
                      >
                        <button onClick={() => handleExport('epub')} className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left">
                          <FileText className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">EPUB</p>
                            <p className="text-[10px] text-muted-foreground">Format buku digital</p>
                          </div>
                        </button>
                        <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-t border-border/50">
                          <FileText className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">PDF</p>
                            <p className="text-[10px] text-muted-foreground">Format dokumen cetak</p>
                          </div>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Karakter & POV Tema</h3>
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => navigate('edit-character', novel.id)}>
                    <Plus className="w-3 h-3" /> Tambah
                  </Button>
                </div>
                {novelCharacters.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Belum ada karakter.</p>
                ) : (
                  <div className="space-y-2">
                    {novelCharacters.map((char) => {
                      const theme = parsePOVTheme(char.theme);
                      return (
                        <button key={char.id} onClick={() => navigate('edit-character', novel.id)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: char.avatarColor }}>{char.name.charAt(0).toUpperCase()}</div>
                          <div className="text-left flex-1">
                            <p className="text-sm font-medium">{char.name}</p>
                            <div className="flex gap-1 mt-0.5">
                              <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: theme.backgroundColor }} />
                              <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: theme.textColor }} />
                              <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: theme.accentColor }} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <h3 className="text-sm font-semibold text-destructive mb-2">Zona Bahaya</h3>
                <Button variant="destructive" size="sm" className="gap-1" onClick={handleDeleteNovel}>
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Novel
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Menghapus novel akan menghapus semua bab, karakter, dan lore book.</p>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Edit Novel Modal */}
      <AnimatePresence>
        {editingNovel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="bg-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Edit Novel</h2>
                <button onClick={() => setEditingNovel(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Judul</label>
                  <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Deskripsi</label>
                  <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Genre</label>
                  <input value={editForm.genre} onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm" />
                </div>
                <Button onClick={saveEdit} className="w-full">Simpan Perubahan</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sortable Chapter Item
function SortableChapterItem({ chapter, index, isOwner, confirmDelete, setConfirmDelete, onDelete, onNavigate, onEdit }: {
  chapter: ChapterWithPOV;
  index: number;
  isOwner: boolean;
  confirmDelete: string | null;
  setConfirmDelete: (id: string | null) => void;
  onDelete: (id: string) => void;
  onNavigate: () => void;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const povChar = chapter.povCharacter;

  return (
    <motion.div ref={setNodeRef} style={style} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="flex items-center gap-2">
      {isOwner && (
        <button {...attributes} {...listeners} className="p-1.5 rounded-lg hover:bg-muted cursor-grab active:cursor-grabbing touch-none">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
      <div className="flex-1">
        <button onClick={onNavigate} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted/50 transition-colors text-left border border-border/50">
          <span className="text-xs font-mono text-muted-foreground w-6 text-center">{index + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-1">{chapter.title}</p>
            {povChar && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: povChar.avatarColor }} />
                <span className="text-[10px] text-muted-foreground">POV {povChar.name}</span>
              </div>
            )}
          </div>
        </button>
      </div>
      {isOwner && (
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Edit bab">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          {confirmDelete === chapter.id ? (
            <div className="flex gap-1">
              <button onClick={() => onDelete(chapter.id)} className="p-1.5 rounded bg-destructive/10 text-destructive text-[10px]">Hapus</button>
              <button onClick={() => setConfirmDelete(null)} className="p-1.5 rounded bg-muted text-[10px]">Batal</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(chapter.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

function LoreEntryCard({ entry, categoryIcons, categoryLabels, onDelete, isOwner }: {
  entry: { id: string; category: string; title: string; content: string; tags: string[] };
  categoryIcons: Record<string, React.ReactNode>;
  categoryLabels: Record<string, string>;
  onDelete: (id: string) => void;
  isOwner: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-card border border-border/50">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-start gap-2 text-left">
        <span className="mt-0.5 text-primary">{categoryIcons[entry.category]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium line-clamp-1">{entry.title}</p>
            <Badge variant="secondary" className="text-[9px] flex-shrink-0">{categoryLabels[entry.category]}</Badge>
          </div>
          {!expanded && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.content}</p>}
        </div>
      </button>
      {expanded && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="mt-2 ml-6">
          <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">{entry.tags.map((tag) => <Badge key={tag} variant="outline" className="text-[9px]">{tag}</Badge>)}</div>
          )}
          {isOwner && <button onClick={() => onDelete(entry.id)} className="text-xs text-destructive mt-2 hover:underline">Hapus</button>}
        </motion.div>
      )}
    </motion.div>
  );
}
