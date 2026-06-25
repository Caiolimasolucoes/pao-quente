'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RefreshInsightsButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      await fetch('/api/gerar-insights');
      router.refresh(); // re-renderiza o server component com os novos dados
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold border border-amber-200 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-wait rounded-lg px-3 py-1.5 transition-colors"
    >
      <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
      {loading ? 'Atualizando…' : 'Atualizar agora'}
    </button>
  );
}
