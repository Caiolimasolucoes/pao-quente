import { type NextRequest, NextResponse } from 'next/server';
import { getInsights } from '@/lib/insights-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gerar-insights
 *
 * - Chamado pelo cron do Vercel toda segunda-feira às 6h (BRT)
 *   com o header Authorization: Bearer <CRON_SECRET>  → força atualização
 * - Chamado pelo botão "Atualizar" na tela de Insights
 *   sem Authorization                                  → retorna cache se válido
 */
export async function GET(request: NextRequest) {
  const authHeader   = request.headers.get('authorization');
  const isCron       = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  try {
    const data = await getInsights(isCron);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/gerar-insights]', error);
    return NextResponse.json({ error: 'Falha ao gerar insights' }, { status: 500 });
  }
}
