import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nome, email, senha, perfil, ativo, unidade_restrita,
          ver_historico_faturamento, ver_indicadores_sensiveis } = body;

  if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 });
  if (!email?.trim()) return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
  if (!senha?.trim()) return NextResponse.json({ error: 'Senha provisória é obrigatória.' }, { status: 400 });

  // 1. Criar usuário no Supabase Auth (gera o UUID real)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password: senha,
    email_confirm: true,
  });

  if (authError) {
    const msg = authError.message.includes('already registered')
      ? 'Já existe um usuário com esse e-mail.'
      : authError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const userId = authData.user.id;

  // 2. Inserir perfil com o mesmo UUID do auth user
  const { error: perfisError } = await supabaseAdmin.from('perfis').insert({
    id: userId,
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    perfil,
    ativo,
    unidade_restrita: unidade_restrita || null,
    ver_historico_faturamento,
    ver_indicadores_sensiveis,
  });

  if (perfisError) {
    // Rollback: remover o auth user criado para não deixar órfão
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: perfisError.message }, { status: 500 });
  }

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

  // Remove do auth (cascade apaga o perfil via FK, ou apagamos manualmente)
  const { error: perfisError } = await supabaseAdmin.from('perfis').delete().eq('id', id);
  if (perfisError) return NextResponse.json({ error: perfisError.message }, { status: 500 });

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
