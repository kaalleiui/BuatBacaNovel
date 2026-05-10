'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, Type, AlignVerticalSpaceAround, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNovelShelfStore } from '@/lib/store';
import { THEME_PRESETS, DEFAULT_POV_THEME, COVER_COLORS } from '@/lib/types';
import type { POVTheme, Character } from '@/lib/types';
import { toast } from 'sonner';

export function CharacterEditorModal() {
  const {
    currentView,
    selectedNovelId,
    characters,
    navigate,
    addCharacter,
    updateCharacter,
    deleteCharacter,
  } = useNovelShelfStore();

  const novelCharacters = characters.filter((c) => c.novelId === selectedNovelId);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarColor, setAvatarColor] = useState(COVER_COLORS[0]);
  const [theme, setTheme] = useState<POVTheme>({ ...DEFAULT_POV_THEME });

  const isOpen = currentView === 'edit-character';

  const selectedChar = novelCharacters.find((c) => c.id === selectedCharId);

  const selectCharacter = (char: Character) => {
    setSelectedCharId(char.id);
    setIsCreating(false);
    setName(char.name);
    setDescription(char.description);
    setAvatarColor(char.avatarColor);
    setTheme({ ...char.theme });
  };

  const startCreate = () => {
    setSelectedCharId(null);
    setIsCreating(true);
    setName('');
    setDescription('');
    setAvatarColor(COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)]);
    setTheme({ ...DEFAULT_POV_THEME });
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Nama karakter wajib diisi');
      return;
    }
    if (selectedCharId) {
      updateCharacter(selectedCharId, {
        name: name.trim(),
        description: description.trim(),
        avatarColor,
        theme,
      });
      toast.success('Karakter berhasil diperbarui! 🎨');
    } else {
      addCharacter({
        novelId: selectedNovelId!,
        name: name.trim(),
        description: description.trim(),
        avatarColor,
        theme,
      });
      toast.success('Karakter berhasil ditambahkan! 🎭');
    }
    navigate('novel-detail', selectedNovelId);
  };

  const handleDelete = (id: string) => {
    deleteCharacter(id);
    setSelectedCharId(null);
    toast.success('Karakter dihapus');
  };

  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setTheme({ ...preset.theme });
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
              <h2 className="text-lg font-semibold">Karakter & POV Tema</h2>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Character List */}
              {novelCharacters.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Pilih Karakter
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {novelCharacters.map((char) => (
                      <button
                        key={char.id}
                        onClick={() => selectCharacter(char)}
                        className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                          selectedCharId === char.id
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-muted/50 border-2 border-transparent'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: char.avatarColor }}
                        >
                          {char.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[10px] font-medium line-clamp-1 max-w-[60px]">
                          {char.name}
                        </span>
                      </button>
                    ))}
                    <button
                      onClick={startCreate}
                      className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl bg-muted/50 border-2 border-dashed border-border"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-lg font-bold">+</span>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">Baru</span>
                    </button>
                  </div>
                </div>
              )}

              {(isCreating || selectedCharId || novelCharacters.length === 0) && (
                <>
                  {/* Name & Description */}
                  <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {name ? name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <button
                        onClick={() =>
                          setAvatarColor(
                            COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)]
                          )
                        }
                        className="text-[9px] text-primary hover:underline"
                      >
                        Ganti warna
                      </button>
                    </div>
                    <div className="space-y-2">
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama Karakter *"
                        className="bg-background"
                      />
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Deskripsi singkat karakter..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  {/* Avatar Color Picker */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Warna Avatar
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COVER_COLORS.slice(0, 12).map((color) => (
                        <button
                          key={color}
                          onClick={() => setAvatarColor(color)}
                          className={`w-7 h-7 rounded-full border-2 transition-transform ${
                            avatarColor === color
                              ? 'border-foreground scale-110'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* POV Theme */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" />
                      POV Tema
                    </label>
                    <p className="text-[10px] text-muted-foreground mb-3">
                      Saat membaca bab dari POV karakter ini, tampilan reader akan otomatis mengikuti tema di bawah.
                    </p>

                    {/* Presets */}
                    <div className="mb-4">
                      <label className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Preset Tema
                      </label>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {THEME_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => applyPreset(preset)}
                            className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex gap-0.5">
                              <div
                                className="w-4 h-4 rounded-full border border-border/30"
                                style={{ backgroundColor: preset.theme.backgroundColor }}
                              />
                              <div
                                className="w-4 h-4 rounded-full border border-border/30"
                                style={{ backgroundColor: preset.theme.textColor }}
                              />
                              <div
                                className="w-4 h-4 rounded-full border border-border/30"
                                style={{ backgroundColor: preset.theme.accentColor }}
                              />
                            </div>
                            <span className="text-[9px] font-medium">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Colors */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                            Background
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={theme.backgroundColor}
                              onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                              className="w-8 h-8 rounded-lg cursor-pointer border-0"
                            />
                            <Input
                              value={theme.backgroundColor}
                              onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                              className="text-xs bg-background"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                            Teks
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={theme.textColor}
                              onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
                              className="w-8 h-8 rounded-lg cursor-pointer border-0"
                            />
                            <Input
                              value={theme.textColor}
                              onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
                              className="text-xs bg-background"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                            Aksen
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={theme.accentColor}
                              onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                              className="w-8 h-8 rounded-lg cursor-pointer border-0"
                            />
                            <Input
                              value={theme.accentColor}
                              onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                              className="text-xs bg-background"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Font Family */}
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                          <Type className="w-3 h-3" />
                          Font
                        </label>
                        <div className="flex gap-2">
                          {[
                            { value: 'serif' as const, label: 'Serif', className: 'font-serif-reading' },
                            { value: 'sans' as const, label: 'Sans', className: 'font-sans-reading' },
                            { value: 'mono' as const, label: 'Mono', className: 'font-mono-reading' },
                          ].map((font) => (
                            <button
                              key={font.value}
                              onClick={() => setTheme({ ...theme, fontFamily: font.value })}
                              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${font.className} ${
                                theme.fontFamily === font.value
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {font.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Line Height */}
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                          <AlignVerticalSpaceAround className="w-3 h-3" />
                          Jarak Baris
                        </label>
                        <div className="flex gap-2">
                          {[
                            { value: 'compact' as const, label: 'Rapat' },
                            { value: 'normal' as const, label: 'Normal' },
                            { value: 'relaxed' as const, label: 'Longgar' },
                          ].map((lh) => (
                            <button
                              key={lh.value}
                              onClick={() => setTheme({ ...theme, lineHeight: lh.value })}
                              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                                theme.lineHeight === lh.value
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {lh.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Live Preview */}
                    <div className="mt-4">
                      <label className="text-[10px] font-medium text-muted-foreground mb-1.5 block">
                        Preview
                      </label>
                      <div
                        className="rounded-xl p-4 transition-all duration-300"
                        style={{
                          backgroundColor: theme.backgroundColor,
                          color: theme.textColor,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: avatarColor }}
                          />
                          <span className="text-xs font-medium" style={{ color: theme.accentColor }}>
                            POV {name || 'Karakter'}
                          </span>
                        </div>
                        <p
                          className={`text-sm ${
                            theme.fontFamily === 'serif'
                              ? 'font-serif-reading'
                              : theme.fontFamily === 'mono'
                              ? 'font-mono-reading'
                              : 'font-sans-reading'
                          } ${
                            theme.lineHeight === 'compact'
                              ? 'leading-tight'
                              : theme.lineHeight === 'relaxed'
                              ? 'leading-loose'
                              : 'leading-normal'
                          }`}
                        >
                          Ini contoh teks dengan tema karakter ini. Perhatikan warna background, teks, aksen, font, dan jarak baris. Saat membaca bab dari POV karakter ini, seluruh tampilan reader akan berubah mengikuti.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="flex-1">
                      {selectedCharId ? 'Simpan Perubahan' : 'Tambah Karakter'}
                    </Button>
                    {selectedCharId && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(selectedCharId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </>
              )}

              {!isCreating && !selectedCharId && novelCharacters.length > 0 && (
                <Button onClick={startCreate} className="w-full gap-2">
                  Tambah Karakter Baru
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
