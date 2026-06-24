import type { StatusBoleto } from '@/types';

const config: Record<StatusBoleto, { label: string; className: string }> = {
  pago: {
    label: 'Pago',
    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  },
  pendente: {
    label: 'Pendente',
    className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  },
  vencido: {
    label: 'Vencido',
    className: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
  },
};

export default function StatusBadge({ status }: { status: StatusBoleto }) {
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
