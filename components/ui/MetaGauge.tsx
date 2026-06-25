'use client';

import { formatCurrency } from '@/lib/utils';

export type GaugeTipo = 'despesa' | 'lucro' | 'faturamento';

function corGauge(rawPct: number, tipo: GaugeTipo): string {
  if (tipo === 'despesa') {
    return rawPct > 100 ? '#EF4444' : rawPct >= 85 ? '#F59E0B' : '#10B981';
  }
  return rawPct < 50 ? '#EF4444' : rawPct < 85 ? '#F59E0B' : '#10B981';
}

interface MetaGaugeProps {
  titulo: string;
  valor: number;
  meta: number;
  tipo: GaugeTipo;
  unidade?: 'currency' | 'percent';
}

export function MetaGauge({
  titulo, valor, meta, tipo, unidade = 'currency',
}: MetaGaugeProps) {
  const rawPct   = meta > 0 ? (valor / meta) * 100 : 0;
  const fillPct  = Math.max(0, Math.min(rawPct, 100));
  const cor      = corGauge(rawPct, tipo);

  // ── SVG layout ──────────────────────────────────────────────
  const W = 200, H = 112;
  const cx = W / 2, cy = H - 14;   // cy=98; arco vai só para cima de cy
  const rOuter = 70, rInner = 50;
  const rTick0 = rOuter + 4, rTick1 = rOuter + 12, rLabel = rOuter + 22;

  function polar(r: number, angleDeg: number): [number, number] {
    const rad = (angleDeg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
  }

  // Sector anular: ambos os arcos com sweep=0 (CCW pelo topo) + fillRule="evenodd"
  // O evenodd garante o buraco do donut sem depender de winding direction.
  function sectorPath(startDeg: number, endDeg: number): string {
    const span = Math.abs(startDeg - endDeg);
    if (span < 0.1) return '';
    const [sx,  sy]  = polar(rOuter, startDeg);
    const [ex,  ey]  = polar(rOuter, endDeg);
    const [sx2, sy2] = polar(rInner, endDeg);
    const [ex2, ey2] = polar(rInner, startDeg);
    const la = span > 180 ? 1 : 0;
    return [
      `M ${sx.toFixed(2)} ${sy.toFixed(2)}`,
      `A ${rOuter} ${rOuter} 0 ${la} 0 ${ex.toFixed(2)} ${ey.toFixed(2)}`,
      `L ${sx2.toFixed(2)} ${sy2.toFixed(2)}`,
      `A ${rInner} ${rInner} 0 ${la} 0 ${ex2.toFixed(2)} ${ey2.toFixed(2)}`,
      'Z',
    ].join(' ');
  }

  // 0% → 180° (left), 100% → 0° (right), through top
  const fillEnd = 180 - (fillPct * 180) / 100;

  // 11 tick marks: 0%→180°, 10%→162°, …, 100%→0°
  const ticks = Array.from({ length: 11 }, (_, i) => ({
    pct: i * 10,
    angle: 180 - i * 18,
  }));

  const fmtValor = unidade === 'percent' ? `${valor.toFixed(1)}%` : formatCurrency(valor);
  const fmtMeta  = unidade === 'percent' ? `${meta.toFixed(1)}%`  : formatCurrency(meta);

  return (
    <div className="flex flex-col items-center" style={{ width: W }}>
      {/* Título — ACIMA do gauge, nunca sobreposto */}
      <p className="text-[11px] font-semibold text-gray-600 text-center leading-tight mb-2 px-2">
        {titulo}
      </p>

      {/* Gauge SVG — NENHUM texto ou número dentro */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {/* Pista de fundo (cinza) — evenodd cria o buraco do donut */}
        <path d={sectorPath(180, 0)} fill="#E5E7EB" fillRule="evenodd" />

        {/* Arco preenchido (colorido) */}
        {fillPct > 0.1 && (
          <path d={sectorPath(180, fillEnd)} fill={cor} fillRule="evenodd" />
        )}

        {/* Marcações externas ao arco */}
        {ticks.map(({ pct, angle }) => {
          const [x0, y0] = polar(rTick0, angle);
          const [x1, y1] = polar(rTick1, angle);
          const [lx, ly] = polar(rLabel, angle);
          const isMajor  = pct % 50 === 0;
          return (
            <g key={pct}>
              <line
                x1={x0.toFixed(2)} y1={y0.toFixed(2)}
                x2={x1.toFixed(2)} y2={y1.toFixed(2)}
                stroke="#C9CDD4"
                strokeWidth={isMajor ? 1.5 : 1}
              />
              {isMajor && (
                <text
                  x={lx.toFixed(2)} y={ly.toFixed(2)}
                  fontSize="8" fill="#9CA3AF"
                  textAnchor="middle" dominantBaseline="middle"
                >
                  {pct}%
                </text>
              )}
            </g>
          );
        })}

        {/* Ponteiro na posição atual */}
        {fillPct > 1.5 && fillPct < 98.5 && (() => {
          const midR = (rOuter + rInner) / 2;
          const [dx, dy] = polar(midR, fillEnd);
          return (
            <circle
              cx={dx.toFixed(2)} cy={dy.toFixed(2)}
              r="4" fill="white" stroke={cor} strokeWidth="2.5"
            />
          );
        })()}
      </svg>

      {/* Valores — ABAIXO do gauge, com espaçamento garantido */}
      <div className="mt-3 text-center space-y-0.5">
        <p className="text-xl font-bold tabular-nums leading-tight" style={{ color: cor }}>
          {rawPct.toFixed(1)}%
        </p>
        <p className="text-sm font-semibold tabular-nums text-gray-800 leading-tight">
          {fmtValor}
        </p>
        <p className="text-[10px] text-gray-400 tabular-nums">
          meta: {fmtMeta}
        </p>
      </div>
    </div>
  );
}
