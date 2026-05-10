'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, ScrollText, Globe, StickyNote, Plus, Trash2, Edit3, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNovelShelfStore } from '@/lib/store';
import { EmptyState } from './EmptyState';

export function LoreBookPage() {
  const { novels, characters, loreEntries, selectedNovelId, navigate, deleteLoreEntry, updateLoreEntry } = useNovelShelfStore();
  const [activeSection, setActiveSection] = useState<string>('character');
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', tags: '' });

  const novel = novels.find((n) => n.id === selectedNovelId);
  if (!novel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Novel tidak ditemukan</p>
      </div>
    );
  }

  const novelCharacters = characters.filter((c) => c.novelId === novel.id);
  const novelLore = loreEntries.filter((l) => l.novelId === novel.id);

  const sectionItems = [
    { id: 'character', label: 'Karakter', icon: BookOpen, count: novelCharacters.length },
    { id: 'backstory', label: 'Backstory', icon: ScrollText, count: novelLore.filter((l) => l.category === 'backstory').length },
    { id: 'worldbuilding', label: 'Worldbuilding', icon: Globe, count: novelLore.filter((l) => l.category === 'worldbuilding').length },
    { id: 'notes', label: 'Catatan', icon: StickyNote, count: novelLore.filter((l) => l.category === 'notes').length },
  ];

  const startEdit = (entry: typeof novelLore[0]) => {
    setEditForm({
      title: entry.title,
      content: entry.content,
      tags: entry.tags.join(', '),
    });
    setEditingEntry(entry.id);
  };

  const saveEdit = () => {
    if (!editingEntry) return;
    updateLoreEntry(editingEntry, {
      title: editForm.title,
      content: editForm.content,
      tags: editForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setEditingEntry(null);
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => navigate('novel-detail', novel.id)}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Lore Book</h1>
          <p className="text-xs text-muted-foreground">{novel.title}</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 px-5 overflow-x-auto pb-3 scrollbar-hide">
        {sectionItems.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted-foreground border border-border/50'
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeSection === section.id
                  ? 'bg-primary-foreground/20'
                  : 'bg-muted'
              }`}
            >
              {section.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-5 mt-2">
        {/* Characters Section */}
        {activeSection === 'character' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Karakter</h3>
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
              <EmptyState
                icon={<BookOpen className="w-10 h-10 text-primary" />}
                title="Belum Ada Karakter"
                description="Tambahkan karakter untuk menggunakan fitur POV Tema yang unik saat membaca."
                actionLabel="Tambah Karakter"
                onAction={() => navigate('edit-character', novel.id)}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {novelCharacters.map((char, i) => (
                  <motion.button
                    key={char.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate('edit-character', novel.id)}
                    className="p-4 rounded-xl bg-card border border-border/50 text-center hover:shadow-sm transition-shadow"
                  >
                    <div
                      className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: char.avatarColor }}
                    >
                      {char.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold mt-2 line-clamp-1">{char.name}</p>
                    {char.description && (
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                        {char.description}
                      </p>
                    )}
                    {/* Theme preview */}
                    <div className="flex justify-center gap-1 mt-2">
                      <div
                        className="w-4 h-4 rounded-full border border-border/50"
                        style={{ backgroundColor: char.theme.backgroundColor }}
                        title="Background"
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-border/50"
                        style={{ backgroundColor: char.theme.textColor }}
                        title="Text"
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-border/50"
                        style={{ backgroundColor: char.theme.accentColor }}
                        title="Accent"
                      />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Lore entries for backstory, worldbuilding, notes */}
        {['backstory', 'worldbuilding', 'notes'].includes(activeSection) && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                {sectionItems.find((s) => s.id === activeSection)?.label}
              </h3>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-xs"
                onClick={() => navigate('add-lore', novel.id)}
              >
                <Plus className="w-3 h-3" />
                Tambah
              </Button>
            </div>
            {novelLore.filter((l) => l.category === activeSection).length === 0 ? (
              <EmptyState
                icon={
                  activeSection === 'backstory' ? (
                    <ScrollText className="w-10 h-10 text-primary" />
                  ) : activeSection === 'worldbuilding' ? (
                    <Globe className="w-10 h-10 text-primary" />
                  ) : (
                    <StickyNote className="w-10 h-10 text-primary" />
                  )
                }
                title={`Belum Ada ${
                  activeSection === 'backstory'
                    ? 'Backstory'
                    : activeSection === 'worldbuilding'
                    ? 'Worldbuilding'
                    : 'Catatan'
                }`}
                description={`Simpan ${
                  activeSection === 'backstory'
                    ? 'riwayat masa lalu karakter dan peristiwa penting'
                    : activeSection === 'worldbuilding'
                    ? 'detail dunia, sistem, budaya, dan geografi'
                    : 'ide, referensi, dan catatan penting'
                } di sini.`}
                actionLabel="Tambah Entri"
                onAction={() => navigate('add-lore', novel.id)}
              />
            ) : (
              <div className="space-y-3">
                {novelLore
                  .filter((l) => l.category === activeSection)
                  .map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-xl bg-card border border-border/50"
                    >
                      {editingEntry === entry.id ? (
                        <div className="space-y-2">
                          <input
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
                            placeholder="Judul"
                          />
                          <textarea
                            value={editForm.content}
                            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none"
                            placeholder="Konten"
                          />
                          <input
                            value={editForm.tags}
                            onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
                            placeholder="Tags (pisahkan dengan koma)"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEdit}>
                              Simpan
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingEntry(null)}>
                              Batal
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-semibold">{entry.title}</h4>
                              {entry.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {entry.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-[9px]">
                                      <Tag className="w-2.5 h-2.5 mr-0.5" />
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => startEdit(entry)}
                                className="p-1.5 rounded-lg hover:bg-muted"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteLoreEntry(entry.id)}
                                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                            {entry.content}
                          </p>
                        </>
                      )}
                    </motion.div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
