
import { MercadoPagoConfig } from "mercadopago";
import { saveRaffleEntry } from "./supabase";
import crypto from "crypto"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

interface Payer {
  fullName: string;
  cellphone: string;
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
      success: `${baseUrl}/success?token=${token}&numbers=${selectedNumbers.join(",")}&name=${encodeURIComponent(payer.fullName)}`,
      failure: `${baseUrl}/failure`,
      pending: `${baseUrl}/pending`,
    },
    // include auto_return only when defined
    ...(autoReturn ? { auto_return: autoReturn } : {}),
    external_reference: JSON.stringify({ token, ...payer, selectedNumbers }),
    notification_url: `${baseUrl}/api/webhook`,
  };

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN!}`,
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
