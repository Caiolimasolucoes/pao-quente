import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(null);

  const { data } = await supabaseAdmin
    .from('perfis')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json(data ?? null);
}
