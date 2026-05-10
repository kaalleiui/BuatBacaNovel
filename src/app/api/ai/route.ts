import { NextRequest, NextResponse } from 'next/server';

// POST /api/ai — Proxy to LM Studio
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, prompt, context } = body;

    if (!prompt && type !== 'consistency') {
      return NextResponse.json({ error: 'Prompt diperlukan' }, { status: 400 });
    }

    const LM_STUDIO_URL = 'http://localhost:1234/v1/chat/completions';

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'assist':
        systemPrompt = 'Kamu adalah asisten penulis novel yang berbahasa Indonesia. Bantu penulis untuk melanjutkan cerita, memperbaiki tata bahasa, atau menulis ulang dengan gaya yang lebih baik. Tulis dalam bahasa Indonesia yang baik dan indah.';
        userPrompt = prompt;
        break;
      case 'summary':
        systemPrompt = 'Kamu adalah asisten yang merangkum teks novel bahasa Indonesia. Buat ringkasan yang padat dan jelas dalam bahasa Indonesia.';
        userPrompt = `Ringkas teks berikut:\n\n${context || prompt}`;
        break;
      case 'consistency':
        systemPrompt = 'Kamu adalah editor novel yang memeriksa konsistensi cerita. Periksa apakah konten bab bertentangan dengan lore book yang diberikan. Jelaskan inkonsistensi yang ditemukan dalam bahasa Indonesia.';
        userPrompt = `Periksa konsistensi bab ini dengan lore book:\n\nKonten Bab:\n${context || ''}\n\nLore Book:\n${prompt || 'Tidak ada lore book yang diberikan'}`;
        break;
      default:
        systemPrompt = 'Kamu adalah asisten penulis novel yang berbahasa Indonesia.';
        userPrompt = prompt;
    }

    try {
      const response = await fetch(LM_STUDIO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'local-model',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1024,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`LM Studio error: ${response.status}`);
      }

      // Stream the response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } catch {
            // ignore stream errors
          }
          controller.close();
        },
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (fetchError) {
      // LM Studio not running
      console.error('LM Studio connection error:', fetchError);
      return NextResponse.json({
        error: 'LM Studio tidak berjalan. Pastikan LM Studio aktif di localhost:1234.',
        suggestion: 'Jalankan LM Studio dan buka server API di port 1234.',
      }, { status: 503 });
    }
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json({ error: 'Gagal memproses permintaan AI' }, { status: 500 });
  }
}
