import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(null);

  const { data: perfil } = await supabaseAdmin
    .from('perfis')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!perfil) return NextResponse.json(null);

  // Lê abas_permitidas do user_metadata (não precisa de coluna no banco)
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
  const abas_permitidas = authUser?.user?.user_metadata?.abas_permitidas ?? null;

  return NextResponse.json({ ...perfil, abas_permitidas });
}
