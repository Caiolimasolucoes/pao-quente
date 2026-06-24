'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DREMes } from '@/types';

const COLORS = ['#D97706', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#F59E0B'];

interface Props {
  data: DREMes;
}

export default function ExpensePieChart({ data }: Props) {
  const chartData = [
    { name: 'Compra Insumos', value: data.compraInsumos },
    { name: 'Folha Pagto', value: data.folhaPagamento },
    { name: 'Pró Labore + Sócio', value: data.proLabore + data.retiraSocio },
    { name: 'Impostos', value: data.impostos },
    { name: 'Despesas ADM', value: data.despesasAdm },
    { name: 'Manutenção', value: data.manutencao },
  ].filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) =>
            typeof value === 'number'
              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
              : value
          }
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
