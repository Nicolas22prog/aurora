import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface SalesData {
  latestSales: Array<{
    id: string;
    nome: string;
    telefone: string;
    numero: number[];
    created_at: string;
    total: number;
  }>;
  totalRevenue: number;
  totalSales: number;
  averageTicket: number;
}

export async function GET(request: NextRequest) {
  try {
    // Buscar os últimos 10 registros
    const { data: latestSales, error: salesError } = await supabase
      .from('numero')
      .select('id, nome, telefone, numero, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (salesError) {
      throw salesError;
    }

    // Buscar todos os registros para calcular totais
    const { data: allSales, error: totalError } = await supabase
      .from('numero')
      .select('numero');

    if (totalError) {
      throw totalError;
    }

    // Calcular totais
    let totalRevenue = 0;
    let totalSales = 0;

    if (allSales && Array.isArray(allSales)) {
      totalSales = allSales.length;
      allSales.forEach((record: any) => {
        if (record.numero && Array.isArray(record.numero)) {
          totalRevenue += record.numero.length * 10; // R$ 10 por número
        }
      });
    }

    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Formatar resposta com valores calculados
    const formattedSales = (latestSales || []).map((sale: any) => ({
      id: sale.id,
      nome: sale.nome,
      telefone: sale.telefone,
      numero: sale.numero || [],
      created_at: sale.created_at,
      total: (sale.numero?.length || 0) * 10,
    }));

    const response: SalesData = {
      latestSales: formattedSales,
      totalRevenue,
      totalSales,
      averageTicket: Math.round(averageTicket * 100) / 100,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching sales data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { message: `Erro ao buscar dados de vendas: ${errorMessage}` },
      { status: 500 }
    );
  }
}
