'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, BookOpen, FileText, PenTool, ChevronRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNovelShelfStore } from '@/lib/store';
import { novelsApi, authApi } from '@/lib/api';
import { toast } from 'sonner';

export function ProfilePage() {
  const { user, setUser, navigate } = useNovelShelfStore();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.nickname || '');
  const [stats, setStats] = useState({ novels: 0, chapters: 0 });

  // Load stats
  useState(() => {
    novelsApi.list().then((data) => {
      const myNovels = user ? data.novels.filter((n) => n.userId === user.id) : data.novels;
      const totalChapters = myNovels.reduce((sum, n) => sum + (n._count?.chapters || 0), 0);
      setStats({ novels: myNovels.length, chapters: totalChapters });
    });
  });

  const saveName = () => {
    // In a full implementation, this would call an API to update nickname
    setEditingName(false);
    toast.info('Fitur ganti nickname akan datang di update berikutnya');
  };

  const handleLogout = async () => {
    await authApi.logout();
    setUser(null);
    navigate('home');
    toast.success('Berhasil keluar');
  };

  const roleLabels: Record<string, string> = {
    ADMIN: '👑 Admin',
    WRITER: '✍️ Penulis',
    READER: '📖 Pembaca',
  };

  const statItems = [
    { label: 'Novel', value: stats.novels, icon: BookOpen, color: '#C67B3C' },
    { label: 'Bab', value: stats.chapters, icon: FileText, color: '#8B6E4E' },
    { label: 'Peran', value: roleLabels[user?.role || 'READER'] || 'Pembaca', icon: User, color: '#D4874D' },
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-12 pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-primary">{user?.nickname?.charAt(0).toUpperCase() || '?'}</span>
          </div>
          {editingName ? (
            <div className="flex items-center gap-2 justify-center mb-2">
              <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="max-w-[200px] text-center" autoFocus onKeyDown={(e) => e.key === 'Enter' && saveName()} />
              <Button size="sm" onClick={saveName}>Simpan</Button>
            </div>
          ) : (
            <button onClick={() => { setNameInput(user?.nickname || ''); setEditingName(true); }} className="flex items-center gap-2 justify-center mb-1 group">
              <h1 className="text-2xl font-bold">{user?.nickname || 'Anonim'}</h1>
            </button>
          )}
          <p className="text-sm text-muted-foreground">{roleLabels[user?.role || 'READER']}</p>
        </motion.div>
      </div>

      <div className="px-5 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {statItems.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-4 rounded-xl bg-card border border-border/50 text-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${stat.color}15` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-5">
        <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          Keluar
        </Button>
      </div>
    </div>
  );
}
