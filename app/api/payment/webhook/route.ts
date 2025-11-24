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
      let externalReference: any = details.external_reference || details.order?.external_reference || null

      if (!externalReference) {
        console.warn("Payment approved but external_reference is missing on payment details for id:", paymentId)
        return NextResponse.json({ status: "no_external_reference" }, { status: 200 })
      }

      // Try parsing JSON external_reference, but allow objects too
      try {
        if (typeof externalReference === "string") {
          externalReference = JSON.parse(externalReference)
        }
      } catch (err) {
        console.warn("external_reference is not valid JSON, using raw value", externalReference)
      }

      const { fullName, cellphone, selectedNumbers } = externalReference

      if (!fullName || !cellphone || !selectedNumbers) {
        console.warn("external_reference missing expected fields:", externalReference)
        return NextResponse.json({ status: "bad_external_reference" }, { status: 200 })
      }

      try {
        await saveRaffleEntry(fullName, cellphone, selectedNumbers)
        console.log("Raffle entry saved successfully for payment:", paymentId)
      } catch (err) {
        console.error("Failed to save raffle entry from webhook:", err)
        // Return 200 so Mercado Pago doesn't retry endlessly, but log for retrying manually
        return NextResponse.json({ status: "save_failed" }, { status: 500 })
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
