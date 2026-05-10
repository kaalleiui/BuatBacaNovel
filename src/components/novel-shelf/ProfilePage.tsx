'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, BookOpen, FileText, PenTool, Settings, ChevronRight, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNovelShelfStore } from '@/lib/store';

export function ProfilePage() {
  const { novels, chapters, characters, loreEntries, authorName, setAuthorName, navigate } = useNovelShelfStore();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(authorName);

  const totalWords = chapters.reduce((sum, ch) => sum + (ch.content?.split(/\s+/).length || 0), 0);

  const saveName = () => {
    setAuthorName(nameInput.trim() || 'Penulis');
    setEditingName(false);
  };

  const stats = [
    { label: 'Novel', value: novels.length, icon: BookOpen, color: '#C67B3C' },
    { label: 'Bab', value: chapters.length, icon: FileText, color: '#8B6E4E' },
    { label: 'Karakter', value: characters.length, icon: User, color: '#D4874D' },
    { label: 'Kata', value: totalWords.toLocaleString(), icon: PenTool, color: '#A0522D' },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-primary" />
          </div>

          {/* Author Name */}
          {editingName ? (
            <div className="flex items-center gap-2 justify-center mb-2">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="max-w-[200px] text-center"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
              />
              <Button size="sm" onClick={saveName}>
                Simpan
              </Button>
            </div>
          ) : (
            <button
              onClick={() => {
                setNameInput(authorName);
                setEditingName(true);
              }}
              className="flex items-center gap-2 justify-center mb-1 group"
            >
              <h1 className="text-2xl font-bold">{authorName}</h1>
              <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <p className="text-sm text-muted-foreground">Penulis Novel</p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl bg-card border border-border/50"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Novel List */}
      <div className="px-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">Novel Saya</h2>
        {novels.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-3">Belum ada novel</p>
            <Button size="sm" onClick={() => navigate('add-novel')}>
              Tambah Novel
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {[...novels]
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((novel) => {
                const chapterCount = chapters.filter((c) => c.novelId === novel.id).length;
                const charCount = characters.filter((c) => c.novelId === novel.id).length;
                return (
                  <button
                    key={novel.id}
                    onClick={() => navigate('novel-detail', novel.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:shadow-sm transition-shadow text-left"
                  >
                    <div
                      className="w-10 h-14 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: novel.coverColor || '#C67B3C' }}
                    >
                      {novel.coverImage ? (
                        <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-[8px] font-bold text-center leading-tight p-0.5">
                          {novel.title.substring(0, 10)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{novel.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {chapterCount} Bab · {charCount} Karakter
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
