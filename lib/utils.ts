export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function calcPercent(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

export function calcVariation(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
