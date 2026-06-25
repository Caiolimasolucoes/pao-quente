'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  ShoppingCart,
  FileText,
  Lightbulb,
  FolderOpen,
  Users,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import { usePermissoes } from '@/contexts/PermissoesContext';
import { createClient } from '@/lib/supabase/client';

export const navItems = [
  { href: '/dashboard',              label: 'Resumo',                icon: LayoutDashboard, exact: true },
  { href: '/dashboard/faturamento',  label: 'Faturamento / Demanda', icon: TrendingUp },
  { href: '/dashboard/indicadores',  label: 'Indicadores',           icon: BarChart3 },
  { href: '/dashboard/compras',      label: 'Gestão de Compras',     icon: ShoppingCart },
  { href: '/dashboard/boletos',      label: 'Gestão de Boletos',     icon: FileText },
  { href: '/dashboard/insights',     label: 'Insights Financeiros',  icon: Lightbulb },
  { href: '/dashboard/cadastros',    label: 'Cadastros',             icon: FolderOpen },
  { href: '/dashboard/usuarios',     label: 'Usuários e Permissões', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { abasVisiveis, simulandoComo, resetarAdmin } = usePermissoes();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const itensFiltrados = navItems.filter((item) => abasVisiveis.includes(item.href));

  function isActive(item: (typeof navItems)[0]) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col" style={{ backgroundColor: '#2D1200' }}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-amber-600 flex items-center justify-center">
            <Image
              src="/logo.jpg"
              alt="Pão Quente"
              width={36}
              height={36}
              className="object-cover w-full h-full"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Pão Quente</p>
            <p className="text-amber-400 text-xs">Gestão Financeira</p>
          </div>
        </div>
      </div>

      {/* Banner de simulação */}
      {simulandoComo && (
        <div className="mx-3 mt-3 px-3 py-2 bg-blue-600/30 border border-blue-400/30 rounded-lg">
          <p className="text-blue-200 text-xs font-medium leading-tight">Simulando acesso</p>
          <p className="text-white text-xs font-semibold truncate">{simulandoComo}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {itensFiltrados.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={17} className="flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {simulandoComo && (
          <button
            onClick={resetarAdmin}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-200 hover:text-white bg-blue-600/20 hover:bg-blue-600/40 rounded-lg transition-colors"
          >
            <RotateCcw size={11} /> Restaurar acesso de Administrador
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {simulandoComo ? simulandoComo.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() : 'MS'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-medium truncate">{simulandoComo ?? 'Maria Silva'}</p>
            <p className="text-amber-400/70 text-xs truncate">{simulandoComo ? 'Simulação' : 'Administrador'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            className="text-amber-400/50 hover:text-white transition-colors flex-shrink-0"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
