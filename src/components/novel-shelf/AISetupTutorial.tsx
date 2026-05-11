'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sparkles, Download, Server, CheckCircle2, AlertTriangle,
  Monitor, Cpu, HardDrive, Globe, Terminal, ChevronDown, ChevronRight,
  Copy, Check, Wifi, WifiOff, Settings, BookOpen, Zap, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNovelShelfStore } from '@/lib/store';
import { toast } from 'sonner';

interface TutorialStep {
  id: number;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export function AISetupTutorial() {
  const { navigate } = useNovelShelfStore();
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [copied, setCopied] = useState<string | null>(null);

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'assist', prompt: 'Halo, tes koneksi.' }),
      });

      if (res.status === 503) {
        setConnectionStatus('failed');
        toast.error('LM Studio tidak terdeteksi. Pastikan server berjalan di port 1234.');
        return;
      }

      if (res.ok) {
        setConnectionStatus('connected');
        toast.success('Koneksi berhasil! LM Studio aktif dan siap digunakan.');
      } else {
        setConnectionStatus('failed');
        toast.error('Koneksi gagal. Periksa pengaturan LM Studio.');
      }
    } catch {
      setConnectionStatus('failed');
      toast.error('Gagal menghubungi server. Pastikan LM Studio berjalan.');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Tersalin ke clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleStep = (stepId: number) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const steps: TutorialStep[] = [
    {
      id: 1,
      title: 'Apa itu LM Studio?',
      icon: <BookOpen className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">LM Studio</strong> adalah aplikasi desktop yang memungkinkan kamu menjalankan model AI (Large Language Model) secara lokal di komputer kamu sendiri. Artinya, semua data dan tulisan kamu tetap privat — tidak ada yang dikirim ke server cloud eksternal.
          </p>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Kenapa LM Studio?
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong className="text-foreground">100% Privat</strong> — Semua pemrosesan dilakukan di komputermu, tidak ada data yang keluar</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Gratis</strong> — Tidak perlu langganan API berbayar seperti OpenAI atau Claude</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Offline</strong> — Bekerja tanpa koneksi internet setelah model terunduh</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Kompatibel OpenAI</strong> — API yang sama dengan ChatGPT, mudah diintegrasikan</span>
              </li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            NovelShelf menggunakan LM Studio sebagai &quot;mesin AI&quot; di balik fitur-fitur seperti <strong className="text-foreground">Asisten Penulis</strong>, <strong className="text-foreground">Ringkasan Otomatis</strong>, dan <strong className="text-foreground">Pemeriksa Konsistensi Lore</strong>. Tanpa LM Studio, fitur-fitur AI ini tidak akan bisa berjalan.
          </p>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Persyaratan Sistem',
      icon: <Monitor className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sebelum menginstal LM Studio, pastikan komputermu memenuhi spesifikasi minimum berikut. Model AI membutuhkan RAM yang cukup untuk berjalan lancar tanpa lag.
          </p>

          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Cpu className="w-4.5 h-4.5 text-blue-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Prosesor (CPU)</h4>
                <p className="text-xs text-muted-foreground mt-1">Minimal 4 core. Disarankan 6+ core untuk performa lebih baik. Prosesor modern seperti AMD Ryzen 5 atau Intel Core i5 generasi ke-10+ sudah cukup.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <HardDrive className="w-4.5 h-4.5 text-green-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">RAM (Memori)</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Minimal 8 GB</strong> untuk model kecil (3B parameter).<br />
                  <strong>Disarankan 16 GB</strong> untuk model 7B (Qwen2.5 7B, Llama 3 8B).<br />
                  <strong>32 GB+</strong> untuk model yang lebih besar (13B+ parameter).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <HardDrive className="w-4.5 h-4.5 text-purple-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Ruang Penyimpanan</h4>
                <p className="text-xs text-muted-foreground mt-1">Minimal 5 GB kosong untuk satu model. Setiap model AI berukuran antara 2–8 GB tergantung ukuran dan kuantisasi.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4.5 h-4.5 text-amber-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">GPU (Opsional, tapi sangat membantu)</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Jika kamu memiliki GPU NVIDIA/AMD dengan VRAM 6 GB+, AI akan berjalan <strong>jauh lebih cepat</strong>. Tanpa GPU, AI tetap bisa berjalan menggunakan CPU saja, hanya lebih lambat (~5–15 detik per respons).
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Rekomendasi untuk Ryzen 5 5600 + 16 GB RAM (tanpa GPU):</strong> Gunakan model Qwen2.5 7B Instruct dengan kuantisasi Q4_K_M. Ini adalah kombinasi terbaik antara kualitas tulisan dan kecepatan untuk spesifikasi tersebut.
              </span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Download & Instal LM Studio',
      icon: <Download className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ikuti langkah-langkah berikut untuk mengunduh dan menginstal LM Studio di komputermu. Proses instalasi sama seperti menginstal aplikasi biasa.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">1</div>
              <div>
                <h4 className="text-sm font-semibold">Buka website LM Studio</h4>
                <p className="text-xs text-muted-foreground mt-1">Kunjungi situs resmi LM Studio di:</p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="px-3 py-1.5 rounded-lg bg-muted text-xs font-mono text-primary">
                    https://lmstudio.ai
                  </code>
                  <button onClick={() => copyToClipboard('https://lmstudio.ai', 'url')} className="p-1 rounded hover:bg-muted">
                    {copied === 'url' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">2</div>
              <div>
                <h4 className="text-sm font-semibold">Download untuk sistem operasimu</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Klik tombol <strong>&quot;Download&quot;</strong> dan pilih versi sesuai OS-mu:
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs font-medium">Windows</p>
                    <p className="text-[10px] text-muted-foreground">.exe installer</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs font-medium">macOS</p>
                    <p className="text-[10px] text-muted-foreground">.dmg installer</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs font-medium">Linux</p>
                    <p className="text-[10px] text-muted-foreground">AppImage</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">3</div>
              <div>
                <h4 className="text-sm font-semibold">Instal aplikasi</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Jalankan file installer yang sudah diunduh. Ikuti langkah-langkah instalasi seperti aplikasi biasa. Tidak perlu pengaturan khusus — cukup klik &quot;Next&quot; hingga selesai.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">4</div>
              <div>
                <h4 className="text-sm font-semibold">Buka LM Studio</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Setelah instalasi selesai, buka LM Studio. Kamu akan melihat tampilan utama dengan kolom pencarian model di bagian atas.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: 'Download Model AI',
      icon: <Globe className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Model AI adalah &quot;otak&quot; yang memproses permintaanmu. Berikut cara mengunduh model yang direkomendasikan untuk NovelShelf.
          </p>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Model yang Direkomendasikan
            </h4>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-background border border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Qwen2.5 7B Instruct (Q4_K_M)</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Ukuran: ~4.4 GB | Kualitas: Sangat Baik | Kecepatan: Cepat</p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">Terbaik</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border/50">
                <p className="text-sm font-semibold">Llama 3.1 8B Instruct (Q4_K_M)</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Ukuran: ~4.9 GB | Kualitas: Baik | Kecepatan: Cepat</p>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border/50">
                <p className="text-sm font-semibold">Mistral 7B Instruct (Q4_K_M)</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Ukuran: ~4.4 GB | Kualitas: Baik | Kecepatan: Cepat</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">1</div>
              <div>
                <h4 className="text-sm font-semibold">Cari model di LM Studio</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Di halaman utama LM Studio, gunakan kolom pencarian di bagian atas. Ketik nama model yang ingin diunduh.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="px-3 py-1.5 rounded-lg bg-muted text-xs font-mono text-primary">
                    Qwen2.5 7B Instruct
                  </code>
                  <button onClick={() => copyToClipboard('Qwen2.5 7B Instruct', 'model-search')} className="p-1 rounded hover:bg-muted">
                    {copied === 'model-search' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">2</div>
              <div>
                <h4 className="text-sm font-semibold">Pilih versi kuantisasi yang tepat</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Setelah menemukan model, kamu akan melihat beberapa versi. Pilih versi dengan nama yang mengandung <strong>&quot;Q4_K_M&quot;</strong>:
                </p>
                <div className="mt-2 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-2">Contoh nama file yang benar:</p>
                  <code className="text-[10px] font-mono text-primary break-all">
                    qwen2.5-7b-instruct-q4_k_m.gguf
                  </code>
                </div>
                <div className="mt-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <p className="text-[10px] text-amber-700 dark:text-amber-400">
                    <strong>Apa itu Q4_K_M?</strong> Ini adalah format kuantisasi yang mengompres model menjadi sekitar 4-bit. Hasilnya, model jauh lebih kecil (4–5 GB vs 14+ GB) dengan penurunan kualitas yang minimal. &quot;M&quot; berarti mixed-precision, yang memberikan kualitas terbaik di ukuran tersebut.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">3</div>
              <div>
                <h4 className="text-sm font-semibold">Klik Download dan tunggu</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Klik tombol <strong>&quot;Download&quot;</strong> di sebelah versi Q4_K_M. Proses unduh memakan waktu tergantung kecepatan internet-mu (file berukuran ~4–5 GB). Kamu bisa melihat progress di tab <strong>&quot;Downloads&quot;</strong> di sidebar kiri.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: 'Jalankan Server LM Studio',
      icon: <Server className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Setelah model selesai diunduh, kamu perlu memulai server API lokal agar NovelShelf bisa berkomunikasi dengan model AI. Berikut caranya:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">1</div>
              <div>
                <h4 className="text-sm font-semibold">Buka tab &quot;Local Server&quot;</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Di sidebar kiri LM Studio, klik ikon <strong className="inline-flex items-center gap-1"><Server className="w-3.5 h-3.5" /> &quot;Local Server&quot;</strong> (ikon panah ganda / double-arrow). Ini akan membuka halaman konfigurasi server.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">2</div>
              <div>
                <h4 className="text-sm font-semibold">Pilih model yang sudah diunduh</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Di bagian atas halaman Local Server, klik dropdown <strong>&quot;Select a model to load&quot;</strong> dan pilih model yang sudah kamu unduh (misalnya: Qwen2.5 7B Instruct Q4_K_M). Tunggu hingga model selesai dimuat — indikator loading akan muncul.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">3</div>
              <div>
                <h4 className="text-sm font-semibold">Pastikan port adalah 1234</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Di pengaturan server, pastikan port yang digunakan adalah <strong>1234</strong>. Ini adalah port default dan yang digunakan NovelShelf untuk terhubung. Jika port berbeda, ubah ke 1234.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="px-3 py-1.5 rounded-lg bg-muted text-xs font-mono text-primary">
                    Port: 1234
                  </code>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">4</div>
              <div>
                <h4 className="text-sm font-semibold">Klik &quot;Start Server&quot;</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Klik tombol hijau <strong>&quot;Start Server&quot;</strong>. Setelah server berjalan, kamu akan melihat status berubah menjadi <strong>&quot;Server is running&quot;</strong> dengan alamat:
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="px-3 py-1.5 rounded-lg bg-muted text-xs font-mono text-primary">
                    http://localhost:1234
                  </code>
                  <button onClick={() => copyToClipboard('http://localhost:1234', 'server-url')} className="p-1 rounded hover:bg-muted">
                    {copied === 'server-url' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Server Berjalan!
            </h4>
            <p className="text-xs text-green-700 dark:text-green-400">
              Setelah server LM Studio aktif, biarkan jendela LM Studio tetap terbuka di latar belakang. NovelShelf akan otomatis terhubung ke server ini setiap kali kamu menggunakan fitur AI.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 6,
      title: 'Tes Koneksi dari NovelShelf',
      icon: <Wifi className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sekarang LM Studio sudah berjalan, saatnya memastikan NovelShelf bisa terhubung. Klik tombol di bawah untuk mengetes koneksi:
          </p>

          <div className="p-6 rounded-xl bg-card border border-border/50 text-center space-y-4">
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
              connectionStatus === 'connected' ? 'bg-green-500/10' :
              connectionStatus === 'failed' ? 'bg-red-500/10' :
              connectionStatus === 'testing' ? 'bg-amber-500/10' :
              'bg-muted'
            }`}>
              {connectionStatus === 'connected' ? (
                <Wifi className="w-7 h-7 text-green-500" />
              ) : connectionStatus === 'failed' ? (
                <WifiOff className="w-7 h-7 text-red-500" />
              ) : connectionStatus === 'testing' ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full" />
              ) : (
                <Wifi className="w-7 h-7 text-muted-foreground" />
              )}
            </div>

            {connectionStatus === 'connected' ? (
              <div>
                <p className="text-sm font-semibold text-green-600">Koneksi Berhasil!</p>
                <p className="text-xs text-muted-foreground mt-1">LM Studio aktif dan NovelShelf sudah terhubung. Fitur AI siap digunakan.</p>
              </div>
            ) : connectionStatus === 'failed' ? (
              <div>
                <p className="text-sm font-semibold text-red-500">Koneksi Gagal</p>
                <p className="text-xs text-muted-foreground mt-1">Pastikan LM Studio berjalan dan server aktif di port 1234.</p>
              </div>
            ) : connectionStatus === 'testing' ? (
              <div>
                <p className="text-sm font-semibold text-amber-600">Menguji Koneksi...</p>
                <p className="text-xs text-muted-foreground mt-1">Menghubungi LM Studio di localhost:1234...</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold">Belum Ditest</p>
                <p className="text-xs text-muted-foreground mt-1">Klik tombol di bawah untuk menguji koneksi ke LM Studio.</p>
              </div>
            )}

            <Button
              onClick={testConnection}
              disabled={connectionStatus === 'testing'}
              className="gap-2"
            >
              {connectionStatus === 'testing' ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Menguji...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  Tes Koneksi
                </>
              )}
            </Button>
          </div>

          {connectionStatus === 'connected' && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <h4 className="text-sm font-semibold text-primary mb-2">Cara Menggunakan Fitur AI</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Asisten Penulis:</strong> Di editor bab, klik ikon <Sparkles className="w-3 h-3 inline" /> di toolbar atas. Ketik instruksi seperti &quot;Lanjutkan cerita&quot; atau &quot;Perbaiki tata bahasa&quot;.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Ringkasan:</strong> Di panel AI, pilih tab &quot;Ringkasan&quot; untuk mendapatkan ringkasan otomatis bab yang sedang kamu baca/sunting.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Cek Konsistensi:</strong> Pilih tab &quot;Cek Konsistensi&quot; dan tempelkan lore book untuk memeriksa apakah tulisanmu bertentangan dengan lore yang sudah dibuat.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 7,
      title: 'Pemecahan Masalah',
      icon: <Settings className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Jika kamu mengalami masalah, coba solusi berikut berdasarkan gejala yang muncul:
          </p>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-4 h-4" /> &quot;LM Studio tidak berjalan&quot;
              </h4>
              <p className="text-xs text-muted-foreground mt-2">Pesan ini muncul saat NovelShelf tidak bisa terhubung ke LM Studio. Solusi:</p>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary">1.</span> Pastikan aplikasi LM Studio terbuka dan berjalan</li>
                <li className="flex items-start gap-2"><span className="text-primary">2.</span> Pastikan server sudah di-start (klik &quot;Start Server&quot; di tab Local Server)</li>
                <li className="flex items-start gap-2"><span className="text-primary">3.</span> Pastikan port server adalah 1234</li>
                <li className="flex items-start gap-2"><span className="text-primary">4.</span> Coba buka <code className="px-1.5 py-0.5 bg-muted rounded text-[10px]">http://localhost:1234/v1/models</code> di browser — jika muncul JSON, server berjalan</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/50">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-4 h-4" /> Respons AI sangat lambat
              </h4>
              <p className="text-xs text-muted-foreground mt-2">Jika AI membutuhkan waktu lama untuk merespons:</p>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary">1.</span> Pastikan tidak ada aplikasi lain yang memakan RAM (browser dengan banyak tab, dll)</li>
                <li className="flex items-start gap-2"><span className="text-primary">2.</span> Di LM Studio, coba turunkan pengaturan &quot;GPU Offload&quot; jika CPU-mode lebih stabil</li>
                <li className="flex items-start gap-2"><span className="text-primary">3.</span> Gunakan model yang lebih kecil (3B parameter) untuk kecepatan lebih, atau lebih besar (7B) untuk kualitas lebih</li>
                <li className="flex items-start gap-2"><span className="text-primary">4.</span> Pastikan model menggunakan format GGUF (bukan format lain)</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/50">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-4 h-4" /> Respons AI tidak relevan / kacau
              </h4>
              <p className="text-xs text-muted-foreground mt-2">Jika output AI tidak sesuai harapan:</p>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary">1.</span> Pastikan model yang dimuat adalah varian <strong>&quot;Instruct&quot;</strong> (bukan base model)</li>
                <li className="flex items-start gap-2"><span className="text-primary">2.</span> Di LM Studio, coba turunkan <strong>Temperature</strong> ke 0.5–0.7 untuk respons yang lebih fokus</li>
                <li className="flex items-start gap-2"><span className="text-primary">3.</span> Berikan instruksi yang lebih spesifik dan detail di prompt</li>
                <li className="flex items-start gap-2"><span className="text-primary">4.</span> Model Q4_K_M sudah cukup baik, tapi Q5_K_M bisa memberikan kualitas lebih baik (ukuran lebih besar)</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/50">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-4 h-4" /> Komputer menjadi lambat saat AI berjalan
              </h4>
              <p className="text-xs text-muted-foreground mt-2">Jika komputer kesulitan saat model AI dimuat:</p>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary">1.</span> Ini normal — model AI membutuhkan banyak RAM. Pastikan RAM yang tersisa cukup untuk OS dan aplikasi lain</li>
                <li className="flex items-start gap-2"><span className="text-primary">2.</span> Tutup aplikasi berat lainnya saat menggunakan fitur AI</li>
                <li className="flex items-start gap-2"><span className="text-primary">3.</span> Gunakan model yang lebih kecil (3B) jika 7B terlalu berat</li>
                <li className="flex items-start gap-2"><span className="text-primary">4.</span> Di LM Studio, atur &quot;Context Length&quot; ke 2048 atau 4096 (bukan 8192) untuk menghemat RAM</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/50">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-blue-500">
                <Terminal className="w-4 h-4" /> Tes Manual via Terminal/CMD
              </h4>
              <p className="text-xs text-muted-foreground mt-2">Untuk memastikan server LM Studio berjalan, coba jalankan perintah ini di terminal:</p>
              <div className="mt-2 space-y-2">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Windows (PowerShell):</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-1.5 rounded-lg bg-muted text-[10px] font-mono text-primary">
                      Invoke-RestMethod -Uri http://localhost:1234/v1/models
                    </code>
                    <button onClick={() => copyToClipboard('Invoke-RestMethod -Uri http://localhost:1234/v1/models', 'ps-cmd')} className="p-1 rounded hover:bg-muted">
                      {copied === 'ps-cmd' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">macOS / Linux:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-1.5 rounded-lg bg-muted text-[10px] font-mono text-primary">
                      curl http://localhost:1234/v1/models
                    </code>
                    <button onClick={() => copyToClipboard('curl http://localhost:1234/v1/models', 'curl-cmd')} className="p-1 rounded hover:bg-muted">
                      {copied === 'curl-cmd' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Jika perintah mengembalikan daftar model dalam format JSON, berarti server berjalan dengan baik.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('profile')} className="p-1.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-primary" />
              Panduan Setup AI
            </h1>
            <p className="text-[10px] text-muted-foreground">Hubungkan NovelShelf dengan LM Studio</p>
          </div>
          {connectionStatus === 'connected' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10">
              <Wifi className="w-3.5 h-3.5 text-green-500" />
              <span className="text-[10px] font-medium text-green-600">Terhubung</span>
            </div>
          ) : connectionStatus === 'failed' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10">
              <WifiOff className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[10px] font-medium text-red-500">Gagal</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-1.5">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex-1 flex items-center gap-1.5">
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${
                expandedStep && step.id <= expandedStep ? 'bg-primary' : 'bg-muted'
              }`} />
              {idx < steps.length - 1 && null}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          Langkah {expandedStep || 1} dari {steps.length}
        </p>
      </div>

      {/* Quick Connection Test Banner */}
      {connectionStatus !== 'connected' && (
        <div className="px-5 py-2">
          <button
            onClick={testConnection}
            disabled={connectionStatus === 'testing'}
            className="w-full p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-primary" />
              <div className="text-left">
                <p className="text-xs font-semibold text-primary">Sudah setup? Tes koneksi sekarang</p>
                <p className="text-[10px] text-muted-foreground">Cek apakah LM Studio sudah terhubung</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Steps */}
      <div className="px-5 py-2 space-y-2">
        {steps.map((step) => (
          <motion.div
            key={step.id}
            initial={false}
            className="rounded-xl border border-border/50 bg-card overflow-hidden"
          >
            <button
              onClick={() => toggleStep(step.id)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                expandedStep === step.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-muted-foreground">Langkah {step.id}</span>
                  {step.id <= (expandedStep || 1) && expandedStep !== step.id && (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  )}
                </div>
                <h3 className="text-sm font-semibold">{step.title}</h3>
              </div>
              <div className="flex-shrink-0">
                {expandedStep === step.id ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {expandedStep === step.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    <div className="w-full h-px bg-border/30 mb-4" />
                    {step.content}

                    {/* Navigation buttons */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStep(Math.max(1, step.id - 1))}
                        disabled={step.id === 1}
                        className="gap-1"
                      >
                        <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Sebelumnya
                      </Button>
                      {step.id < steps.length ? (
                        <Button
                          size="sm"
                          onClick={() => toggleStep(step.id + 1)}
                          className="gap-1"
                        >
                          Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => navigate('home')}
                          className="gap-1"
                        >
                          Mulai Menulis <Sparkles className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Summary Card at Bottom */}
      <div className="px-5 py-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Ringkasan Cepat
          </h3>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">1</span>
              Download LM Studio dari lmstudio.ai
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">2</span>
              Download model Qwen2.5 7B Instruct (Q4_K_M)
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">3</span>
              Buka tab Local Server, muat model, klik Start Server
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">4</span>
              Tes koneksi dari NovelShelf — selesai!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
