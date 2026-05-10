'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNovelShelfStore } from '@/lib/store';
import { chaptersApi, charactersApi } from '@/lib/api';
import type { CharacterWithTheme } from '@/lib/api';
import { toast } from 'sonner';

export function AddChapterModal() {
  const { currentView, selectedNovelId, navigate } = useNovelShelfStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [povCharacterId, setPovCharacterId] = useState<string | null>(null);
  const [characters, setCharacters] = useState<CharacterWithTheme[]>([]);
  const [saving, setSaving] = useState(false);

  const isOpen = currentView === 'add-chapter';

  useEffect(() => {
    if (selectedNovelId && isOpen) {
      charactersApi.list(selectedNovelId).then((data) => setCharacters(data.characters)).catch(() => setCharacters([]));
    }
  }, [selectedNovelId, isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Judul bab wajib diisi'); return; }
    setSaving(true);
    try {
      const result = await chaptersApi.create(selectedNovelId!, {
        title: title.trim(),
        content: content.trim(),
        povCharacterId,
      });
      toast.success('Bab berhasil ditambahkan! ✍️');
      // Navigate to chapter editor for the new chapter
      navigate('chapter-editor', selectedNovelId, result.chapter.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah bab');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => navigate('novel-detail', selectedNovelId);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="bg-card w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border/50 sticky top-0 bg-card z-10 rounded-t-2xl">
              <h2 className="text-lg font-semibold">Tambah Bab Baru</h2>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Judul Bab *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Pertemuan di Hutan" className="bg-background" />
              </div>
              {characters.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">POV Karakter</label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setPovCharacterId(null)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${povCharacterId === null ? 'bg-muted text-foreground' : 'bg-muted/50 text-muted-foreground'}`}>Tanpa POV</button>
                    {characters.map((char) => (
                      <button key={char.id} onClick={() => setPovCharacterId(char.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${povCharacterId === char.id ? 'text-white' : 'bg-muted/50 text-muted-foreground'}`} style={povCharacterId === char.id ? { backgroundColor: char.avatarColor } : {}}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: char.avatarColor }} />{char.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Konten Awal (opsional)</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tulis konten awal bab, atau edit nanti di editor..." rows={6} className="w-full px-3 py-3 rounded-lg bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed" />
                <p className="text-xs text-muted-foreground mt-1">{content.split(/\s+/).filter(Boolean).length} kata</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleClose} variant="outline" className="flex-1">Batal</Button>
                <Button onClick={handleSubmit} className="flex-1" size="lg" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan & Edit'}</Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
