import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import type { Insight } from '@/types';
import {
  dreAtual, dreAtualU1, dreAtualU2,
  dreMensal,
  insights as insightsMock,
  analiseIA as analiseMock,
} from '@/lib/mock-data';

export interface InsightsCache {
  geradoEm: string;
  fonte: 'claude' | 'mock';
  insights: Insight[];
  analise: string;
}

// Dev → data/insights-cache.json  |  Vercel prod → /tmp (ephemeral, ok para protótipo)
const CACHE_FILE =
  process.env.NODE_ENV === 'production'
    ? '/tmp/pq-insights-cache.json'
    : path.join(process.cwd(), 'data', 'insights-cache.json');

// Retorna a última segunda-feira à meia-noite (horário local)
function ultimaSegunda(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0=Dom 1=Seg … 6=Sáb
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

function cacheValido(c: InsightsCache): boolean {
  return new Date(c.geradoEm) >= ultimaSegunda();
}

function lerCache(): InsightsCache | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')) as InsightsCache;
  } catch {
    return null;
  }
}

function salvarCache(data: InsightsCache): void {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[insights-service] Falha ao salvar cache:', e);
  }
}

function buildContexto() {
  const meses     = dreMensal.map(m => m.mes);
  const fatAcum   = dreMensal.reduce((a, m) => a + m.faturamentoTotal, 0);
  const despAcum  = dreMensal.reduce((a, m) => a + m.despesasTotal, 0);
  const lucroAcum = dreMensal.reduce((a, m) => a + m.lucro, 0);

  return {
    periodo: `${meses[0]} a ${meses.at(-1)} de 2026`,
    mesAtual: meses.at(-1),
    consolidadoMesAtual: {
      faturamentoTotal:  dreAtual.faturamentoTotal,
      faturamentoReal:   dreAtual.faturamentoReal,
      compraInsumos:     dreAtual.compraInsumos,
      folhaPagamento:    dreAtual.folhaPagamento,
      impostos:          dreAtual.impostos,
      despesasAdm:       dreAtual.despesasAdm,
      manutencao:        dreAtual.manutencao,
      investimento:      dreAtual.investimento,
      proLabore:         dreAtual.proLabore,
      retiraSocio:       dreAtual.retiraSocio,
      despesasTotal:     dreAtual.despesasTotal,
      lucro:             dreAtual.lucro,
    },
    unidadeCentro: {
      faturamentoTotal: dreAtualU1.faturamentoTotal,
      faturamentoReal:  dreAtualU1.faturamentoReal,
      lucro:            dreAtualU1.lucro,
      compraInsumos:    dreAtualU1.compraInsumos,
      folhaPagamento:   dreAtualU1.folhaPagamento,
      proLabore:        dreAtualU1.proLabore,
    },
    unidadeBairro: {
      faturamentoTotal: dreAtualU2.faturamentoTotal,
      faturamentoReal:  dreAtualU2.faturamentoReal,
      lucro:            dreAtualU2.lucro,
      compraInsumos:    dreAtualU2.compraInsumos,
      folhaPagamento:   dreAtualU2.folhaPagamento,
      proLabore:        dreAtualU2.proLabore,
    },
    acumuladoAno: { faturamento: fatAcum, despesas: despAcum, lucro: lucroAcum, meses: meses.length },
    evolucaoMensal: dreMensal.map(m => ({
      mes:              m.mes,
      faturamento:      m.faturamentoTotal,
      despesas:         m.despesasTotal,
      lucro:            m.lucro,
      compraInsumos:    m.compraInsumos,
      folhaPagamento:   m.folhaPagamento,
    })),
  };
}

async function chamarClaude(): Promise<Pick<InsightsCache, 'insights' | 'analise'>> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const ctx    = buildContexto();

  const prompt = `Você é um analista financeiro especializado em padarias e confeitarias no Brasil.
Analise os dados financeiros da "Padaria Pão Quente" (2 unidades: Centro e Bairro) e retorne insights acionáveis.

DADOS FINANCEIROS (valores em R$):
${JSON.stringify(ctx, null, 2)}

BENCHMARKS DO SETOR (padarias de médio porte, Brasil):
- CMV (Compra de Insumos / Faturamento Real): ideal ≤ 40%
- Custo de Pessoal (Folha + Pró Labore / Faturamento Real): ideal ≤ 28%
- Margem Líquida (Lucro / Faturamento Real): saudável ≥ 10%
- Impostos / Faturamento: esperado 6–8% (Simples Nacional)
- Despesas ADM: referência ≤ 5% do faturamento real

Retorne SOMENTE um JSON válido (sem markdown, sem texto fora do JSON):
{
  "insights": [
    {
      "id": "1",
      "tipo": "alerta" | "atencao" | "positivo",
      "titulo": "título direto (máx 90 caracteres)",
      "descricao": "descrição detalhada e acionável com os números reais (máx 220 caracteres)",
      "valor": "valor de destaque, ex: 41,2% do fat. ou R$ 12.800",
      "categoria": "Custos | Faturamento | Recursos Humanos | Pagamentos | Comparativo Unidades | Compras | Lucro"
    }
  ],
  "analise": "análise narrativa em múltiplos parágrafos separados por \\n\\n, usando **negrito** para dados importantes. Aborde: desempenho geral, comparativo entre unidades, pontos críticos, tendência e recomendações para a próxima semana."
}

Gere entre 5 e 8 insights. Priorize os mais críticos. Use apenas números dos dados fornecidos.`;

  const msg  = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 2048,
    messages:   [{ role: 'user', content: prompt }],
  });

  const raw     = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '{}';
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

  try {
    return JSON.parse(cleaned) as Pick<InsightsCache, 'insights' | 'analise'>;
  } catch {
    console.error('[insights-service] Falha ao parsear resposta do Claude');
    return { insights: [], analise: cleaned };
  }
}

/**
 * Retorna insights do cache (se válido) ou chama o Claude.
 * @param forcarAtualizacao  true → ignora cache e chama Claude de imediato
 */
export async function getInsights(forcarAtualizacao = false): Promise<InsightsCache> {
  // 1. Cache válido?
  if (!forcarAtualizacao) {
    const cache = lerCache();
    if (cache && cacheValido(cache)) return cache;
  }

  // 2. Sem chave configurada → mock estático
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[insights-service] ANTHROPIC_API_KEY não configurada — usando mock estático');
    const fallback: InsightsCache = {
      geradoEm: new Date().toISOString(),
      fonte:    'mock',
      insights: insightsMock,
      analise:  analiseMock.trim(),
    };
    salvarCache(fallback);
    return fallback;
  }

  // 3. Chama Claude
  const resultado = await chamarClaude();
  const cache: InsightsCache = {
    geradoEm: new Date().toISOString(),
    fonte:    'claude',
    ...resultado,
  };
  salvarCache(cache);
  return cache;
}
