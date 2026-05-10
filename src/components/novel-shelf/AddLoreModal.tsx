'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, ScrollText, Globe, StickyNote, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNovelShelfStore } from '@/lib/store';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'backstory' as const, label: 'Backstory', icon: ScrollText },
  { id: 'worldbuilding' as const, label: 'Worldbuilding', icon: Globe },
  { id: 'notes' as const, label: 'Catatan', icon: StickyNote },
];

export function AddLoreModal() {
  const { currentView, selectedNovelId, navigate, addLoreEntry } = useNovelShelfStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'backstory' | 'worldbuilding' | 'notes'>('backstory');
  const [tagsInput, setTagsInput] = useState('');

  const isOpen = currentView === 'add-lore';

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Judul lore wajib diisi');
      return;
    }
    if (!content.trim()) {
      toast.error('Konten lore wajib diisi');
      return;
    }
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addLoreEntry({
      novelId: selectedNovelId!,
      category,
      title: title.trim(),
      content: content.trim(),
      tags,
    });
    toast.success('Lore berhasil ditambahkan! 📖');
    navigate('novel-detail', selectedNovelId);
  };

  const handleClose = () => {
    navigate('novel-detail', selectedNovelId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-border/50 sticky top-0 bg-card z-10 rounded-t-2xl">
              <h2 className="text-lg font-semibold">Tambah Lore</h2>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Category */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Kategori
                </label>
                <div className="flex gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                        category === cat.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <cat.icon className="w-3.5 h-3.5" />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Judul *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Asal Usul Kerajaan Aethon"
                  className="bg-background"
                />
              </div>

              {/* Content */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Konten *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tulis lore di sini..."
                  rows={8}
                  className="w-full px-3 py-3 rounded-lg bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Tags (pisahkan dengan koma)
                </label>
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Contoh: kerajaan, sejarah, politik"
                  className="bg-background"
                />
              </div>

              {/* Submit */}
              <Button onClick={handleSubmit} className="w-full" size="lg">
                Simpan Lore
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
