import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nome, email, perfil, ativo, unidade_restrita,
          ver_historico_faturamento, ver_indicadores_sensiveis } = body;

  if (!nome?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Nome e e-mail são obrigatórios.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('perfis').insert({
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    perfil,
    ativo,
    unidade_restrita: unidade_restrita || null,
    ver_historico_faturamento,
    ver_indicadores_sensiveis,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, nome, email, perfil, ativo, unidade_restrita,
          ver_historico_faturamento, ver_indicadores_sensiveis } = body;

  if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 });

  const { error } = await supabaseAdmin.from('perfis').update({
    nome: nome?.trim(),
    email: email?.trim().toLowerCase(),
    perfil,
    ativo,
    unidade_restrita: unidade_restrita || null,
    ver_historico_faturamento,
    ver_indicadores_sensiveis,
  }).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 });

  const { error } = await supabaseAdmin.from('perfis').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
