import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { error } = await supabase
      .from('mercadopago_credentials')
      .delete()
      .neq('account_id', '');

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { message: 'Credenciais desconectadas com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error disconnecting credentials:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { message: `Erro ao desconectar: ${errorMessage}` },
      { status: 500 }
    );
  }
}
