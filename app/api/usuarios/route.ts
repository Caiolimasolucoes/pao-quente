import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const emailNormalizado = (e: string) => e.trim().toLowerCase();

export async function GET() {
  const [{ data: perfis, error }, { data: authList }] = await Promise.all([
    supabaseAdmin.from('perfis').select('*').order('nome'),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mapa userId → abas_permitidas salvas no user_metadata
  const metaMap: Record<string, string[] | null> = {};
  for (const u of authList?.users ?? []) {
    metaMap[u.id] = u.user_metadata?.abas_permitidas ?? null;
  }

  const resultado = (perfis ?? []).map(p => ({
    ...p,
    abas_permitidas: metaMap[p.id] ?? null,
  }));

  return NextResponse.json(resultado);
}

function isEmailDuplicado(msg: string) {
  const lower = msg.toLowerCase();
  return lower.includes('already registered') || lower.includes('already been registered') || lower.includes('email address is already');
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nome, email, senha, perfil, ativo, unidade_restrita,
          ver_historico_faturamento, ver_indicadores_sensiveis,
          abas_permitidas } = body;

  if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 });
  if (!email?.trim()) return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
  if (!senha?.trim()) return NextResponse.json({ error: 'Senha provisória é obrigatória.' }, { status: 400 });

  const emailNorm = emailNormalizado(email);

  // abas_permitidas vai no user_metadata do Auth, não na tabela perfis
  const perfilData = {
    nome: nome.trim(),
    email: emailNorm,
    perfil,
    ativo,
    unidade_restrita: unidade_restrita || null,
    ver_historico_faturamento,
    ver_indicadores_sensiveis,
  };

  // 1. Tentar criar o usuário no Supabase Auth (com abas_permitidas nos metadados)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: emailNorm,
    password: senha,
    email_confirm: true,
    user_metadata: { abas_permitidas: abas_permitidas ?? null },
  });

  let userId: string;

  if (authError) {
    if (!isEmailDuplicado(authError.message)) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Auth user já existe — buscar o ID pelo email
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

    const existing = listData.users.find(u => u.email === emailNorm);
    if (!existing) {
      return NextResponse.json({ error: 'E-mail já cadastrado. Não foi possível recuperar o usuário existente.' }, { status: 400 });
    }

    const { data: perfilExist } = await supabaseAdmin.from('perfis').select('id').eq('id', existing.id).maybeSingle();
    if (perfilExist) {
      return NextResponse.json({ error: 'Já existe um colaborador cadastrado com esse e-mail.' }, { status: 400 });
    }

    userId = existing.id;
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: senha,
      user_metadata: { abas_permitidas: abas_permitidas ?? null },
    });
  } else {
    userId = authData.user.id;
  }

  // 2. Inserir o perfil com o UUID do auth user
  const { error: perfisError } = await supabaseAdmin.from('perfis').insert({ id: userId, ...perfilData });

  if (perfisError) {
    if (!authError) await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: perfisError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, nome, email, perfil, ativo, unidade_restrita,
          ver_historico_faturamento, ver_indicadores_sensiveis,
          abas_permitidas } = body;

  if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 });

  // Atualiza perfis (sem abas_permitidas, que fica nos metadados Auth)
  const { data: updated, error } = await supabaseAdmin.from('perfis').update({
    nome: nome?.trim(),
    email: email ? emailNormalizado(email) : undefined,
    perfil,
    ativo,
    unidade_restrita: unidade_restrita || null,
    ver_historico_faturamento,
    ver_indicadores_sensiveis,
  }).eq('id', id).select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!updated || updated.length === 0)
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  // Salva abas_permitidas nos metadados do auth user
  if (abas_permitidas !== undefined) {
    await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { abas_permitidas },
    });
  }

  return NextResponse.json({ ok: true, data: updated[0] });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 });

  const { error: perfisError } = await supabaseAdmin.from('perfis').delete().eq('id', id);
  if (perfisError) return NextResponse.json({ error: perfisError.message }, { status: 500 });

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
