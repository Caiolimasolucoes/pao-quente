import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: number;
  variation: number;
  icon: React.ReactNode;
  iconBg: string;
  format?: 'currency' | 'number';
  variationLabel?: string;
}

export default function KpiCard({
  title,
  value,
  variation,
  icon,
  iconBg,
  format = 'currency',
  variationLabel = 'vs mês anterior',
}: KpiCardProps) {
  const isPositive = variation >= 0;
  const formattedValue = format === 'currency' ? formatCurrency(value) : value.toLocaleString('pt-BR');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>

      <div>
        <p className="text-2xl font-bold text-gray-900">{formattedValue}</p>
      </div>

      <div className="flex items-center gap-1.5">
        {isPositive ? (
          <TrendingUp size={14} className="text-emerald-500" />
        ) : (
          <TrendingDown size={14} className="text-red-500" />
        )}
        <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{formatPercent(variation)}
        </span>
        <span className="text-xs text-gray-400">{variationLabel}</span>
      </div>
    </div>
  );
}
