import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { saveRaffleEntry } from "@/lib/supabase";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Mercado Pago Webhook received body:", JSON.stringify(body))

    // Different Mercado Pago notifications may have different shapes.
    // Common pattern: { type: 'payment', data: { id: '12345' } }
    const paymentId = body?.data?.id || body?.id || null

    if (!paymentId) {
      console.warn("Webhook received without recognizable payment id. Skipping.")
      return NextResponse.json({ status: "ignored" }, { status: 200 })
    }

    // Fetch payment details from Mercado Pago
    const payment = new Payment(client)
    let paymentDetails: any
    try {
      paymentDetails = await payment.get({ id: paymentId })
    } catch (err) {
      console.error("Error fetching payment details from Mercado Pago:", err)
      return NextResponse.json({ error: "failed_fetch" }, { status: 500 })
    }

    // Some SDKs return an object with `body`; prefer that when present.
    const details = paymentDetails?.body ?? paymentDetails
    console.log("Fetched payment details:", JSON.stringify(details))

    const status = (details && (details.status || details.payment_status)) || "unknown"

    if (String(status).toLowerCase() === "approved") {
  // === NOVA FORMA 100% CONFIÁVEL EM 2025 (usa metadata) ===
  const metadata = details.metadata || {}

  const fullName = metadata.nome || metadata.fullName
  const cellphone = metadata.telefone || metadata.cellphone
  const selectedNumbers = metadata.numeros || metadata.selectedNumbers

  if (!fullName || !cellphone || !selectedNumbers || !Array.isArray(selectedNumbers)) {
    console.warn("Webhook: metadata incompleto ou inválido", metadata)
    return NextResponse.json({ status: "bad_metadata" }, { status: 200 })
  }

  try {
    await saveRaffleEntry(
      fullName.trim(),
      cellphone.replace(/\D/g, ''),
      selectedNumbers
    )
    console.log(`✅ Números salvos com sucesso: ${selectedNumbers.join(", ")} - ${fullName}`)
    return NextResponse.json({ status: "saved" }, { status: 200 })
  } catch (err) {
    console.error("❌ Erro ao salvar no Supabase:", err)
    return NextResponse.json({ status: "save_error" }, { status: 500 })
  }
} else {
      console.log("Payment status is not approved (skipping save):", status)
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Error processing Mercado Pago webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
