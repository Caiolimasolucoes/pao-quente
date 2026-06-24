'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => router.push('/dashboard'), 800);
  }

  return (
    <div className="min-h-full flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative"
        style={{ backgroundColor: '#2D1200' }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, #F59E0B 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #D97706 0%, transparent 50%)`,
          }}
        />
        <div className="relative text-center">
          <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-6 bg-amber-600 flex items-center justify-center shadow-2xl">
            <Image
              src="/logo.jpg"
              alt="Pão Quente"
              width={96}
              height={96}
              className="object-cover w-full h-full"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Pão Quente</h1>
          <p className="text-amber-300 text-lg mb-12">Gestão Financeira</p>
          <div className="space-y-4 text-left">
            {[
              { icon: '📊', text: 'DRE e indicadores em tempo real' },
              { icon: '🛒', text: 'Controle de compras por fornecedor' },
              { icon: '💡', text: 'Insights automáticos com IA' },
              { icon: '🔒', text: 'Acesso por colaborador com permissões' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-amber-100/80">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-amber-600 flex items-center justify-center">
              <Image src="/logo.jpg" alt="Pão Quente" width={64} height={64} className="object-cover" />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h2>
            <p className="text-gray-500 mt-1 text-sm">Entre com suas credenciais para acessar o sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
              />
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-xs text-amber-700 hover:text-amber-900">
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-70"
              style={{ backgroundColor: '#D97706' }}
              onMouseEnter={(e) => !loading && ((e.target as HTMLButtonElement).style.backgroundColor = '#B45309')}
              onMouseLeave={(e) => !loading && ((e.target as HTMLButtonElement).style.backgroundColor = '#D97706')}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Pão Quente © 2026 — Sistema de Gestão Financeira
          </p>
        </div>
      </div>
    </div>
  );
}
