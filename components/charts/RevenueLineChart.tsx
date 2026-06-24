'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { DREMes } from '@/types';

interface Props {
  data: DREMes[];
}

function formatK(value: number) {
  return `R$ ${(value / 1000).toFixed(0)}k`;
}

export default function RevenueLineChart({ data }: Props) {
  const chartData = data.map((d) => ({
    mes: d.mes,
    Faturamento: d.faturamentoTotal,
    Despesas: d.despesasTotal,
    Lucro: d.lucro,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatK} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} width={55} />
        <Tooltip
          formatter={(value) =>
            typeof value === 'number'
              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
              : value
          }
          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
        />
        <Legend wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
        <Line
          type="monotone"
          dataKey="Faturamento"
          stroke="#D97706"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#D97706' }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="Despesas"
          stroke="#EF4444"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#EF4444' }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="Lucro"
          stroke="#10B981"
          strokeWidth={2.5}
          strokeDasharray="5 5"
          dot={{ r: 4, fill: '#10B981' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
