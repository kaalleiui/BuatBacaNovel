'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNovelShelfStore } from '@/lib/store';
import { authApi, type AuthUser } from '@/lib/api';
import { toast } from 'sonner';

export function LoginPage() {
  const { navigate, setUser } = useNovelShelfStore();
  const [isRegister, setIsRegister] = useState(false);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'WRITER' | 'READER'>('WRITER');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        const data = await authApi.register(nickname, password, role);
        setUser(data.user as AuthUser);
        toast.success(`Selamat datang, ${data.user.nickname}! 🎉`);
      } else {
        const data = await authApi.login(nickname, password);
        setUser(data.user as AuthUser);
        toast.success(`Halo, ${data.user.nickname}! 👋`);
      }
      navigate('home');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">NovelShelf</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Perpustakaan Novel Pribadi
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Nickname
            </label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Masukkan nickname"
              className="bg-card"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="bg-card pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role selection (register only) */}
          {isRegister && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Peran
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('WRITER')}
                  className={`p-3 rounded-xl text-center transition-colors ${
                    role === 'WRITER'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground border border-border/50'
                  }`}
                >
                  <span className="text-sm font-medium">✍️ Penulis</span>
                  <p className="text-[10px] mt-0.5 opacity-80">
                    Bisa bikin & edit novel
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('READER')}
                  className={`p-3 rounded-xl text-center transition-colors ${
                    role === 'READER'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground border border-border/50'
                  }`}
                >
                  <span className="text-sm font-medium">📖 Pembaca</span>
                  <p className="text-[10px] mt-0.5 opacity-80">
                    Baca & komentar saja
                  </p>
                </button>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Memproses...' : isRegister ? 'Daftar' : 'Masuk'}
          </Button>
        </form>

        {/* Toggle login/register */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-primary font-medium hover:underline"
          >
            {isRegister ? 'Masuk' : 'Daftar'}
          </button>
        </p>

        {/* Default accounts info */}
        <div className="mt-6 p-3 rounded-xl bg-muted/50 border border-border/30">
          <p className="text-[10px] text-muted-foreground text-center mb-1">
            Akun default:
          </p>
          <p className="text-[10px] text-muted-foreground text-center">
            👑 admin / admin123 &nbsp;·&nbsp; ✍️ Penulis / writer123
          </p>
        </div>
      </motion.div>
    </div>
  );
}
