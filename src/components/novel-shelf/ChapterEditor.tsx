'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3,
  Quote, List, ListOrdered, Link as LinkIcon, Undo2, Redo2, Save,
  History, ListTree, PenLine, ChevronRight, X, Check, Plus, Trash2, GripVertical, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNovelShelfStore } from '@/lib/store';
import { chaptersApi, charactersApi, versionsApi, outlineApi, type ChapterWithPOV, type CharacterWithTheme, type ChapterVersionType, type OutlineItemType } from '@/lib/api';
import { toast } from 'sonner';

type SaveStatus = 'saved' | 'saving' | 'unsaved';

export function ChapterEditor() {
  const { selectedNovelId, selectedChapterId, navigate } = useNovelShelfStore();
  const [chapter, setChapter] = useState<ChapterWithPOV | null>(null);
  const [characters, setCharacters] = useState<CharacterWithTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [mode, setMode] = useState<'write' | 'outline'>('write');
  const [title, setTitle] = useState('');
  const [povCharacterId, setPovCharacterId] = useState<string | null>(null);
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [versions, setVersions] = useState<ChapterVersionType[]>([]);
  const [outlineItems, setOutlineItems] = useState<OutlineItemType[]>([]);
  const [newOutlineText, setNewOutlineText] = useState('');
  const [previewVersion, setPreviewVersion] = useState<ChapterVersionType | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [wordCount, setWordCount] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Mulai menulis ceritamu di sini...',
      }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setSaveStatus('unsaved');
      setWordCount(editor.getText().split(/\s+/).filter(Boolean).length);
      // Debounced auto-save (3 seconds)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        handleSave(editor.getHTML());
      }, 3000);
    },
  });

  const loadChapter = useCallback(async () => {
    if (!selectedChapterId) return;
    try {
      const chapters = await chaptersApi.list(selectedNovelId!);
      const ch = chapters.chapters.find((c) => c.id === selectedChapterId);
      if (ch) {
        setChapter(ch);
        setTitle(ch.title);
        setPovCharacterId(ch.povCharacterId);
        if (editor && ch.content) {
          editor.commands.setContent(ch.content);
        }
        setWordCount(ch.content ? ch.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length : 0);
      }
    } catch {
      toast.error('Gagal memuat bab');
    } finally {
      setLoading(false);
    }
  }, [selectedChapterId, selectedNovelId, editor]);

  useEffect(() => {
    if (selectedNovelId) {
      charactersApi.list(selectedNovelId).then((d) => setCharacters(d.characters)).catch(() => {});
    }
  }, [selectedNovelId]);

  useEffect(() => {
    loadChapter();
  }, [loadChapter]);

  useEffect(() => {
    if (selectedChapterId && mode === 'outline') {
      outlineApi.list(selectedChapterId).then((d) => setOutlineItems(d.items)).catch(() => {});
    }
    if (selectedChapterId) {
      versionsApi.list(selectedChapterId).then((d) => setVersions(d.versions)).catch(() => {});
    }
  }, [selectedChapterId, mode]);

  const handleSave = useCallback(async (htmlContent?: string) => {
    if (!selectedChapterId) return;
    setSaveStatus('saving');
    try {
      const content = htmlContent || editor?.getHTML() || '';
      await chaptersApi.update(selectedChapterId, {
        title: title.trim(),
        content,
        povCharacterId,
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('unsaved');
      toast.error('Gagal menyimpan');
    }
  }, [selectedChapterId, title, povCharacterId, editor]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSaveStatus('unsaved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => handleSave(), 3000);
  };

  const handleBack = () => {
    if (saveStatus === 'unsaved') {
      handleSave();
    }
    navigate('novel-detail', selectedNovelId);
  };

  // Outline operations
  const addOutlineItem = async () => {
    if (!selectedChapterId || !newOutlineText.trim()) return;
    try {
      const data = await outlineApi.create({ chapterId: selectedChapterId, content: newOutlineText.trim() });
      setOutlineItems([...outlineItems, data.item]);
      setNewOutlineText('');
    } catch {
      toast.error('Gagal menambah outline');
    }
  };

  const toggleOutlineItem = async (item: OutlineItemType) => {
    try {
      const data = await outlineApi.update(item.id, { completed: !item.completed });
      setOutlineItems(outlineItems.map((i) => (i.id === item.id ? data.item : i)));
    } catch {
      toast.error('Gagal mengupdate outline');
    }
  };

  const deleteOutlineItem = async (id: string) => {
    try {
      await outlineApi.delete(id);
      setOutlineItems(outlineItems.filter((i) => i.id !== id));
    } catch {
      toast.error('Gagal menghapus outline');
    }
  };

  const moveOutlineItem = async (item: OutlineItemType, direction: 'up' | 'down') => {
    const idx = outlineItems.findIndex((i) => i.id === item.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= outlineItems.length) return;
    const swapItem = outlineItems[swapIdx];
    try {
      await outlineApi.update(item.id, { order: swapItem.order });
      await outlineApi.update(swapItem.id, { order: item.order });
      setOutlineItems(
        outlineItems.map((i) => {
          if (i.id === item.id) return { ...i, order: swapItem.order };
          if (i.id === swapItem.id) return { ...i, order: item.order };
          return i;
        }).sort((a, b) => a.order - b.order)
      );
    } catch {
      toast.error('Gagal memindahkan outline');
    }
  };

  // Version restore
  const handleRestore = async (version: ChapterVersionType) => {
    try {
      const data = await versionsApi.restore(version.id);
      if (editor) {
        editor.commands.setContent(data.chapter.content);
      }
      setTitle(data.chapter.title);
      setPreviewVersion(null);
      setShowVersionPanel(false);
      loadChapter();
      toast.success('Versi berhasil dipulihkan');
    } catch {
      toast.error('Gagal memulihkan versi');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const saveLabel = saveStatus === 'saved' ? 'Tersimpan' : saveStatus === 'saving' ? 'Menyimpan...' : 'Belum disimpan';
  const saveColor = saveStatus === 'saved' ? 'text-green-600' : saveStatus === 'saving' ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-card/95 backdrop-blur-sm sticky top-0 z-20">
        <button onClick={handleBack} className="p-1.5 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1 min-w-0">
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Judul Bab"
            className="w-full text-base font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground"
          />
        </div>
        <span className={`text-xs font-medium ${saveColor} flex items-center gap-1`}>
          <Save className="w-3 h-3" /> {saveLabel}
        </span>
        <button onClick={() => setShowVersionPanel(!showVersionPanel)} className="p-1.5 rounded-lg hover:bg-muted" title="Riwayat Versi">
          <History className="w-4 h-4" />
        </button>
        <button onClick={() => setShowAIPanel(!showAIPanel)} className="p-1.5 rounded-lg hover:bg-muted" title="AI Asisten">
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      {/* POV Selector */}
      {characters.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-muted/30 overflow-x-auto">
          <span className="text-xs text-muted-foreground flex-shrink-0">POV:</span>
          <button onClick={() => setPovCharacterId(null)} className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${povCharacterId === null ? 'bg-muted text-foreground' : 'bg-muted/50 text-muted-foreground'}`}>
            Tanpa
          </button>
          {characters.map((char) => (
            <button key={char.id} onClick={() => setPovCharacterId(char.id)} className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${povCharacterId === char.id ? 'text-white' : 'bg-muted/50 text-muted-foreground'}`} style={povCharacterId === char.id ? { backgroundColor: char.avatarColor } : {}}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: char.avatarColor }} />{char.name}
            </button>
          ))}
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border/30 bg-muted/20">
        <button onClick={() => setMode('write')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mode === 'write' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
          <PenLine className="w-3.5 h-3.5" /> Tulis
        </button>
        <button onClick={() => setMode('outline')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mode === 'outline' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
          <ListTree className="w-3.5 h-3.5" /> Outline
        </button>
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground">{wordCount} kata</span>
      </div>

      {/* Editor / Outline Content */}
      <div className="flex-1 relative">
        {mode === 'write' ? (
          <div className="max-w-3xl mx-auto">
            {/* Toolbar */}
            {editor && (
              <div className="flex items-center gap-0.5 px-4 py-2 border-b border-border/30 bg-muted/10 overflow-x-auto sticky top-[105px] z-10">
                <ToolbarButton icon={<Bold className="w-4 h-4" />} onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} />
                <ToolbarButton icon={<Italic className="w-4 h-4" />} onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} />
                <ToolbarButton icon={<UnderlineIcon className="w-4 h-4" />} onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} />
                <div className="w-px h-5 bg-border/50 mx-1" />
                <ToolbarButton icon={<Heading1 className="w-4 h-4" />} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} />
                <ToolbarButton icon={<Heading2 className="w-4 h-4" />} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} />
                <ToolbarButton icon={<Heading3 className="w-4 h-4" />} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} />
                <div className="w-px h-5 bg-border/50 mx-1" />
                <ToolbarButton icon={<Quote className="w-4 h-4" />} onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} />
                <ToolbarButton icon={<List className="w-4 h-4" />} onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} />
                <ToolbarButton icon={<ListOrdered className="w-4 h-4" />} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} />
                <ToolbarButton icon={<LinkIcon className="w-4 h-4" />} onClick={() => {
                  const url = window.prompt('URL:');
                  if (url) editor.chain().focus().setLink({ href: url }).run();
                }} active={editor.isActive('link')} />
                <div className="w-px h-5 bg-border/50 mx-1" />
                <ToolbarButton icon={<Undo2 className="w-4 h-4" />} onClick={() => editor.chain().focus().undo().run()} />
                <ToolbarButton icon={<Redo2 className="w-4 h-4" />} onClick={() => editor.chain().focus().redo().run()} />
              </div>
            )}

            {/* Editor */}
            <div className="px-4 sm:px-8 py-6 min-h-[60vh] prose prose-sm max-w-none focus:outline-none">
              <EditorContent editor={editor} className="tiptap-editor" />
            </div>

            {/* Outline sidebar reference (when in write mode with outline items) */}
            {outlineItems.length > 0 && (
              <div className="fixed right-0 top-1/2 -translate-y-1/2 z-10">
                <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-l-lg shadow-lg p-3 max-w-48">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-2">Outline</p>
                  {outlineItems.map((item) => (
                    <div key={item.id} className={`text-[10px] mb-1 ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.completed ? '✓' : '○'} {item.content}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Outline Mode */
          <div className="max-w-2xl mx-auto px-4 py-6">
            <h3 className="text-lg font-semibold mb-4">Outline Bab</h3>
            <div className="space-y-2 mb-4">
              {outlineItems.sort((a, b) => a.order - b.order).map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-2 p-3 rounded-xl border ${item.completed ? 'bg-muted/30 border-border/30' : 'bg-card border-border/50'}`}
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <button onClick={() => toggleOutlineItem(item)} className="flex-shrink-0">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${item.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                      {item.completed && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                  <span className={`flex-1 text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.content}</span>
                  <div className="flex gap-0.5">
                    <button onClick={() => moveOutlineItem(item, 'up')} disabled={idx === 0} className="p-1 rounded hover:bg-muted disabled:opacity-30">
                      <ChevronRight className="w-3 h-3 rotate-[-90deg]" />
                    </button>
                    <button onClick={() => moveOutlineItem(item, 'down')} disabled={idx === outlineItems.length - 1} className="p-1 rounded hover:bg-muted disabled:opacity-30">
                      <ChevronRight className="w-3 h-3 rotate-90" />
                    </button>
                    <button onClick={() => deleteOutlineItem(item.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newOutlineText}
                onChange={(e) => setNewOutlineText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addOutlineItem()}
                placeholder="Tambah poin outline..."
                className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
              />
              <Button size="sm" onClick={addOutlineItem} disabled={!newOutlineText.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Version History Panel */}
      <AnimatePresence>
        {showVersionPanel && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-80 max-w-full bg-card border-l border-border/50 z-30 shadow-xl overflow-y-auto"
          >
            <div className="flex items-center justify-between p-4 border-b border-border/50 sticky top-0 bg-card z-10">
              <h3 className="font-semibold">Riwayat Versi</h3>
              <button onClick={() => { setShowVersionPanel(false); setPreviewVersion(null); }} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            {previewVersion ? (
              <div className="p-4">
                <button onClick={() => setPreviewVersion(null)} className="text-xs text-primary mb-3 flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Kembali ke daftar
                </button>
                <h4 className="font-semibold text-sm mb-1">v{previewVersion.version} — {previewVersion.title}</h4>
                <p className="text-[10px] text-muted-foreground mb-3">{new Date(previewVersion.createdAt).toLocaleString('id-ID')}</p>
                <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap mb-4 p-3 rounded-lg bg-muted/30">
                  {previewVersion.content.replace(/<[^>]*>/g, '')}
                </div>
                <Button onClick={() => handleRestore(previewVersion)} className="w-full gap-1" size="sm">
                  <History className="w-3.5 h-3.5" /> Pulihkan Versi Ini
                </Button>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {versions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Belum ada riwayat versi</p>
                ) : (
                  versions.map((v) => (
                    <button key={v.id} onClick={() => setPreviewVersion(v)} className="w-full text-left p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">v{v.version}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(v.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{v.title}</p>
                      <p className="text-[10px] text-muted-foreground">{v.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length} kata</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Assistant Panel */}
      <AnimatePresence>
        {showAIPanel && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 max-h-[60vh] bg-card border-t border-border/50 z-30 shadow-xl rounded-t-2xl overflow-y-auto"
          >
            <AIAssistantPanel
              chapterContent={editor?.getText() || ''}
              onClose={() => setShowAIPanel(false)}
              onInsert={(text) => {
                if (editor) {
                  editor.chain().focus().insertContent(text).run();
                }
                setShowAIPanel(false);
              }}
              novelId={selectedNovelId!}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolbarButton({ icon, onClick, active }: { icon: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}
    >
      {icon}
    </button>
  );
}

function AIAssistantPanel({ chapterContent, onClose, onInsert, novelId }: {
  chapterContent: string;
  onClose: () => void;
  onInsert: (text: string) => void;
  novelId: string;
}) {
  const [mode, setMode] = useState<'assist' | 'summary' | 'consistency'>('assist');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: mode,
          prompt: mode === 'consistency' ? prompt : prompt,
          context: mode === 'summary' ? chapterContent : mode === 'consistency' ? chapterContent : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Gagal menghubungi AI');
        setLoading(false);
        return;
      }

      // Try streaming
      const reader = res.body?.getReader();
      if (!reader) {
        setError('Gagal membaca respons');
        setLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE data
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                setResponse(fullText);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      if (!fullText) {
        setResponse('Tidak ada respons dari AI.');
      }
    } catch {
      setError('LM Studio tidak berjalan. Pastikan LM Studio aktif di localhost:1234.');
    } finally {
      setLoading(false);
    }
  };

  const modes = [
    { key: 'assist' as const, label: 'Asisten Tulis', icon: <PenLine className="w-3.5 h-3.5" /> },
    { key: 'summary' as const, label: 'Ringkasan', icon: <List className="w-3.5 h-3.5" /> },
    { key: 'consistency' as const, label: 'Cek Konsistensi', icon: <Check className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">AI Asisten</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex gap-1 mb-3">
        {modes.map((m) => (
          <button key={m.key} onClick={() => setMode(m.key)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${mode === m.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            mode === 'assist' ? 'Tulis instruksi untuk AI (mis: "Lanjutkan cerita tentang...")...' :
            mode === 'summary' ? 'Klik kirim untuk meringkas bab ini...' :
            'Tempelkan lore book di sini untuk mengecek konsistensi...'
          }
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none"
        />
        <Button onClick={handleSubmit} disabled={loading || (mode !== 'summary' && !prompt.trim())} size="sm" className="w-full gap-1">
          {loading ? (
            <><div className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Memproses...</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /> {mode === 'summary' ? 'Ringkas' : mode === 'consistency' ? 'Cek' : 'Kirim'}</>
          )}
        </Button>
      </div>

      {error && <p className="text-xs text-destructive mt-3 p-2 rounded-lg bg-destructive/10">{error}</p>}

      {response && (
        <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm whitespace-pre-wrap">{response}</p>
          <Button onClick={() => onInsert(response)} size="sm" className="mt-2 gap-1" variant="outline">
            Sisipkan ke Editor
          </Button>
        </div>
      )}
    </div>
  );
}
