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
    const { code, state, codeVerifier } = await request.json();

    console.log('OAuth Callback - Received code:', code ? 'YES' : 'NO');
    console.log('OAuth Callback - State:', state);
    console.log('OAuth Callback - Code Verifier:', codeVerifier ? 'YES' : 'NO');

    if (!code) {
      return NextResponse.json(
        { message: 'Código de autorização não fornecido' },
        { status: 400 }
      );
    }

    const clientId = process.env.MERCADOPAGO_CLIENT_ID;
    const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_VERCEL_URL}/admin`;

    console.log('OAuth Callback - Client ID:', clientId ? 'CONFIGURED' : 'MISSING');
    console.log('OAuth Callback - Client Secret:', clientSecret ? 'CONFIGURED' : 'MISSING');
    console.log('OAuth Callback - Redirect URI:', redirectUri);

    if (!clientId || !clientSecret) {
      console.error('Mercado Pago credentials not configured');
      return NextResponse.json(
        { message: 'Credenciais do Mercado Pago não configuradas no servidor' },
        { status: 500 }
      );
    }

    // 1. Trocar o código por um access token
    console.log('OAuth Callback - Requesting token from Mercado Pago...');
    
    const tokenBody: any = {
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    };

    // Se PKCE está habilitado, incluir o code_verifier
    if (codeVerifier) {
      tokenBody.code_verifier = codeVerifier;
      console.log('OAuth Callback - Using PKCE code_verifier');
    }

    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenBody),
    });

    console.log('OAuth Callback - Token Response Status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('Token exchange failed:', error);
      return NextResponse.json(
        { message: `Erro ao trocar código por token: ${error.message || JSON.stringify(error)}` },
        { status: tokenResponse.status }
      );
    }

    const tokenData: MercadoPagoTokenResponse = await tokenResponse.json();
    console.log('OAuth Callback - Access Token obtained');

    // 2. Obter informações da conta do usuário
    console.log('OAuth Callback - Requesting user info from Mercado Pago...');
    const userResponse = await fetch('https://api.mercadopago.com/v1/users/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    console.log('OAuth Callback - User Response Status:', userResponse.status);

    if (!userResponse.ok) {
      const error = await userResponse.json();
      console.error('Failed to get user info:', error);
      return NextResponse.json(
        { message: `Erro ao obter informações da conta: ${error.message}` },
        { status: userResponse.status }
      );
    }

    const userData: MercadoPagoUserResponse = await userResponse.json();
    console.log('OAuth Callback - User info obtained:', userData.id);

    // 3. Salvar as credenciais no banco de dados
    console.log('OAuth Callback - Saving credentials to database...');
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
        { message: `Erro ao salvar credenciais no banco de dados: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('OAuth Callback - Credentials saved successfully');
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
