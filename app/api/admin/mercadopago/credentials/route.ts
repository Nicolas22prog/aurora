import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('mercadopago_credentials')
      .select('id, account_id, account_email, created_at, updated_at')
      .single();

    if (error && error.code === 'PGRST116') {
      // Nenhum registro encontrado
      return NextResponse.json(null, { status: 200 });
    }

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { message: `Erro ao buscar credenciais: ${errorMessage}` },
      { status: 500 }
    );
  }
}
