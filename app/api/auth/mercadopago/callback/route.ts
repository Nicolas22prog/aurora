import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface MercadoPagoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token?: string;
  public_key: string;
}

interface MercadoPagoUserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();

    if (!code) {
      return NextResponse.json(
        { message: 'Código de autorização não fornecido' },
        { status: 400 }
      );
    }

    const clientId = process.env.MERCADOPAGO_CLIENT_ID;
    const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_VERCEL_URL}/admin`;

    if (!clientId || !clientSecret) {
      console.error('Mercado Pago credentials not configured');
      return NextResponse.json(
        { message: 'Credenciais do Mercado Pago não configuradas no servidor' },
        { status: 500 }
      );
    }

    // 1. Trocar o código por um access token
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('Token exchange failed:', error);
      return NextResponse.json(
        { message: 'Erro ao trocar código por token' },
        { status: tokenResponse.status }
      );
    }

    const tokenData: MercadoPagoTokenResponse = await tokenResponse.json();

    // 2. Obter informações da conta do usuário
    const userResponse = await fetch('https://api.mercadopago.com/v1/users/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const error = await userResponse.json();
      console.error('Failed to get user info:', error);
      return NextResponse.json(
        { message: 'Erro ao obter informações da conta' },
        { status: userResponse.status }
      );
    }

    const userData: MercadoPagoUserResponse = await userResponse.json();

    // 3. Salvar as credenciais no banco de dados
    const { data, error } = await supabase
      .from('mercadopago_credentials')
      .upsert(
        {
          account_id: userData.id.toString(),
          account_email: userData.email,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          token_type: tokenData.token_type,
          expires_in: tokenData.expires_in,
          scope: tokenData.scope,
          public_key: tokenData.public_key,
        },
        {
          onConflict: 'account_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { message: 'Erro ao salvar credenciais no banco de dados' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { message: `Erro durante autenticação: ${errorMessage}` },
      { status: 500 }
    );
  }
}
