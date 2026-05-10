'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNovelShelfStore } from '@/lib/store';
import { novelsApi, uploadApi } from '@/lib/api';
import { GENRES, COVER_COLORS } from '@/lib/types';
import { toast } from 'sonner';

export function AddNovelModal() {
  const { currentView, navigate } = useNovelShelfStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);
  const [coverImage, setCoverImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOpen = currentView === 'add-novel';

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran gambar maksimal 5MB'); return; }
    setUploading(true);
    try {
      const data = await uploadApi.cover(file);
      setCoverImage(data.url);
      toast.success('Cover berhasil diupload!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload gagal');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Judul novel wajib diisi'); return; }
    setSaving(true);
    try {
      const data = await novelsApi.create({
        title: title.trim(),
        description: description.trim(),
        coverColor,
        coverImage: coverImage || undefined,
        genre: genre || undefined,
      });
      toast.success('Novel berhasil ditambahkan! 📚');
      navigate('novel-detail', data.novel.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah novel');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => navigate('home');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="bg-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border/50 sticky top-0 bg-card z-10 rounded-t-2xl">
              <h2 className="text-lg font-semibold">Tambah Novel Baru</h2>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-center mb-2">
                <div className="w-28 h-40 rounded-xl shadow-md overflow-hidden relative group cursor-pointer" style={{ backgroundColor: coverColor }} onClick={() => fileInputRef.current?.click()}>
                  {coverImage ? (
                    <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3"><span className="text-white/90 font-bold text-center text-sm leading-tight drop-shadow-md">{title || 'Judul Novel'}</span></div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/10 rounded-l-xl" />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
              {uploading && <p className="text-xs text-center text-muted-foreground">Mengupload...</p>}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Judul Novel *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masukkan judul novel" className="bg-background" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Deskripsi</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Sinopsis atau deskripsi singkat..." rows={3} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Genre</label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((g) => (
                    <button key={g} onClick={() => setGenre(genre === g ? '' : g)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${genre === g ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Warna Cover</label>
                <div className="flex flex-wrap gap-2">
                  {COVER_COLORS.map((color) => (
                    <button key={color} onClick={() => { setCoverColor(color); setCoverImage(''); }} className={`w-8 h-8 rounded-full border-2 transition-transform ${coverColor === color && !coverImage ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
                {coverImage && <button onClick={() => setCoverImage('')} className="text-xs text-primary mt-2 hover:underline">Hapus gambar, gunakan warna</button>}
              </div>
              <Button onClick={handleSubmit} className="w-full" size="lg" disabled={saving}>{saving ? 'Menyimpan...' : 'Tambah Novel'}</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
