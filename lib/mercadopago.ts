
import { saveRaffleEntry, supabase } from "./supabase";
import crypto from "crypto"

interface Payer {
  fullName: string;
  cellphone: string;
}

// Função auxiliar para obter o token do banco de dados
async function getMercadoPagoAccessToken(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('mercadopago_credentials')
      .select(
        'access_token, refresh_token, expires_in, updated_at, account_id'
      )
      .single();

    if (error || !data) {
      // Se não encontrar no banco, tentar usar variável de ambiente (fallback)
      const envToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (envToken) {
        console.warn("Using fallback access token from environment variable");
        return envToken;
      }
      throw new Error("Nenhuma credencial do Mercado Pago configurada. Acesse /admin para conectar sua conta.");
    }

    // refresh token automaticamente se expirado ou próximo de expirar
    if (
      data.expires_in &&
      data.updated_at &&
      data.refresh_token &&
      Date.now() >
        new Date(data.updated_at).getTime() + data.expires_in * 1000 - 60_000
    ) {
      console.log("Access token está expirando, renovando...");
      return await refreshMercadoPagoToken(data.refresh_token, data.account_id);
    }

    return data.access_token;
  } catch (err) {
    console.error("Error fetching Mercado Pago credentials:", err);
    throw err;
  }
}

// helper para trocar o refresh_token por um novo access_token
async function refreshMercadoPagoToken(
  refreshToken: string,
  accountId: string
): Promise<string> {
  const clientId = process.env.MERCADOPAGO_CLIENT_ID!;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET!;

  const body = {
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  };

  const resp = await fetch('https://api.mercadopago.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error('Failed to refresh MP token', resp.status, text);
    throw new Error('Não foi possível renovar token Mercado Pago');
  }

  const data: any = await resp.json();

  await supabase
    .from('mercadopago_credentials')
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_in: data.expires_in,
      updated_at: new Date().toISOString(),
    })
    .eq('account_id', accountId);

  return data.access_token;
}

export const createPayment = async (payer: Payer, selectedNumbers: number[]) => {
  // generate a unique token to correlate preference/payment with our app
  const token = crypto.randomUUID()
  // Ensure we have a base URL for redirection/notification.
  // Prefer explicit `NEXT_PUBLIC_URL`. If running on Vercel, use the `VERCEL_URL`
  // environment variable (automatically provided by Vercel) and ensure it has https://.
  const inferredVercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
  const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_VERCEL_URL || inferredVercel || "http://localhost:3000"

  if (baseUrl.startsWith("http://localhost") || baseUrl.includes("127.0.0.1")) {
    console.warn("Using a localhost BACK_URL for Mercado Pago. Webhooks will not reach your machine unless you use a tunnel (ngrok). Data will be saved immediately on preference creation instead.")
  }

  const isLocalhost = baseUrl.startsWith("http://localhost") || baseUrl.includes("127.0.0.1")

  // Only set auto_return when using a secure (https) baseUrl. Mercado Pago may reject
  // non-HTTPS back URLs when auto_return is used — in local dev we omit it.
  const autoReturn: string | undefined = isLocalhost ? undefined : "approved"

  // Parse phone number: remove non-digits and extract area_code and number correctly
  // Expected formats: 55 (country) + 11 (area) + 9 digits (13 total)
  // or 11 (area) + 9 digits (11 total) for Brazil
  const phoneDigits = payer.cellphone.replace(/\D/g, "")
  let areaCode = "55"
  let phoneNumber = phoneDigits

  if (phoneDigits.length === 13 && phoneDigits.startsWith("55")) {
    // Full format: 55XXYYYYYY (country + area + number)
    areaCode = phoneDigits.substring(2, 4)
    phoneNumber = phoneDigits.substring(4)
  } else if (phoneDigits.length === 11) {
    // Compact format: XXYYYYYY (area + number, assumes Brazil)
    areaCode = phoneDigits.substring(0, 2)
    phoneNumber = phoneDigits.substring(2)
  } else if (phoneDigits.length === 10) {
    // Legacy format: XXYYYYYY (area + 8-digit number)
    areaCode = phoneDigits.substring(0, 2)
    phoneNumber = phoneDigits.substring(2)
  }

  // IMPORTANTE: Em desenvolvimento local, salva os dados IMEDIATAMENTE para que funcionem sem webhooks
  // Em produção com HTTPS, confiar no webhook é mais seguro, mas isto garante que dados sejam salvos
  if (isLocalhost) {
    console.log("Dev mode: saving raffle entry immediately to Supabase")
    try {
      await saveRaffleEntry(payer.fullName, payer.cellphone, selectedNumbers)
      console.log("Raffle entry saved successfully in dev mode")
    } catch (err) {
      console.error("Error saving raffle entry in dev mode:", err)
      // Continua mesmo se falhar — o webhook pode ainda salvar em produção
    }
  }

  console.log("Creating Mercado Pago preference with back_urls using baseUrl:", baseUrl)

  const body: any = {
    items: selectedNumbers.map((number) => ({
      id: number.toString(),
      title: `Rifa do Miguel - Número ${number}`,
      quantity: 1,
      unit_price: 10, // Preço por número
    })),
    metadata: {
      nome: payer.fullName.trim(),
      telefone: payer.cellphone.replace(/\D/g, ""),
      numeros: selectedNumbers,
    },
    payer: {
      name: payer.fullName,
      phone: {
        area_code: areaCode,
        number: phoneNumber,
      },
    },
    back_urls: {
      success: `${baseUrl}/success?token=${token}&numbers=${selectedNumbers.join(",")}&name=${encodeURIComponent(payer.fullName)}&cellphone=${encodeURIComponent(payer.cellphone)}`,
      failure: `${baseUrl}/failure`,
      pending: `${baseUrl}/success?token=${token}&numbers=${selectedNumbers.join(",")}&name=${encodeURIComponent(payer.fullName)}&cellphone=${encodeURIComponent(payer.cellphone)}`,
    },
    // include auto_return only when defined
    ...(autoReturn ? { auto_return: autoReturn } : {}),
    external_reference: JSON.stringify({ token, ...payer, selectedNumbers }),
    notification_url: `${baseUrl}/api/payment/webhook`,
  };

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await getMercadoPagoAccessToken()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error creating Mercado Pago preference:", error);
    throw new Error("Failed to create payment");
  }

  const preference = await response.json();
  return { id: preference.id, init_point: preference.init_point, token };
};
