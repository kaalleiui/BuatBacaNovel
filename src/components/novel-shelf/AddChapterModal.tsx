'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNovelShelfStore } from '@/lib/store';
import { toast } from 'sonner';

export function AddChapterModal() {
  const { currentView, selectedNovelId, chapters, characters, navigate, addChapter } = useNovelShelfStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [povCharacterId, setPovCharacterId] = useState<string | null>(null);

  const isOpen = currentView === 'add-chapter';
  const novelCharacters = characters.filter((c) => c.novelId === selectedNovelId);
  const novelChapters = chapters.filter((c) => c.novelId === selectedNovelId);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Judul bab wajib diisi');
      return;
    }
    const id = addChapter({
      novelId: selectedNovelId!,
      title: title.trim(),
      content: content.trim(),
      povCharacterId,
      order: novelChapters.length,
    });
    toast.success('Bab berhasil ditambahkan! ✍️');
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
            className="bg-card w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-border/50 sticky top-0 bg-card z-10 rounded-t-2xl">
              <h2 className="text-lg font-semibold">Tambah Bab Baru</h2>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Chapter Title */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Judul Bab *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Pertemuan di Hutan"
                  className="bg-background"
                />
              </div>

              {/* POV Character */}
              {novelCharacters.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    POV Karakter
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setPovCharacterId(null)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        povCharacterId === null
                          ? 'bg-muted text-foreground'
                          : 'bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      Tanpa POV
                    </button>
                    {novelCharacters.map((char) => (
                      <button
                        key={char.id}
                        onClick={() => setPovCharacterId(char.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          povCharacterId === char.id
                            ? 'text-white'
                            : 'bg-muted/50 text-muted-foreground'
                        }`}
                        style={
                          povCharacterId === char.id
                            ? { backgroundColor: char.avatarColor }
                            : {}
                        }
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: char.avatarColor }}
                        />
                        {char.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Content */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Konten Bab
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tulis ceritamu di sini..."
                  rows={12}
                  className="w-full px-3 py-3 rounded-lg bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {content.split(/\s+/).filter(Boolean).length} kata
                </p>
              </div>

              {/* Submit */}
              <Button onClick={handleSubmit} className="w-full" size="lg">
                Simpan Bab
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
