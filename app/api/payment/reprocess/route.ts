import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { saveRaffleEntry } from "@/lib/supabase"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const paymentId = body?.payment_id || body?.paymentId || null
    const preferenceId = body?.preference_id || body?.preferenceId || null
    const token = body?.token || null

    if (!paymentId && !preferenceId && !token) {
      return NextResponse.json({ error: "missing_payment_or_preference_id_or_token" }, { status: 400 })
    }

    let paymentDetails: any = null

    // If token provided, try searching payments by external_reference via Mercado Pago REST API
    if (token) {
      try {
        const resp = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(token)}`, {
          headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN!}` },
        })
        if (!resp.ok) throw new Error(`MP search failed: ${resp.status}`)
        const json = await resp.json()
        // json.results is array of payments (SDK returns different shapes depending on API)
        const first = (json && (json.results || json.results?.map ? json.results[0] : null)) || (json?.paging ? json.results?.[0] : null) || null
        paymentDetails = first || null
      } catch (err) {
        console.error("Error searching payment by token:", err)
        // proceed to try by ids if provided
      }
    }

    // If still not found, and we have paymentId/preferenceId, fetch directly
    if (!paymentDetails && (paymentId || preferenceId)) {
      const idToFetch = paymentId || preferenceId
      const payment = new Payment(client)
      try {
        paymentDetails = await payment.get({ id: idToFetch })
      } catch (err) {
        console.error("Error fetching payment details for reprocess:", err)
        return NextResponse.json({ error: "fetch_failed" }, { status: 500 })
      }
    }

    const details = paymentDetails?.body ?? paymentDetails
    console.log("Reprocess fetched payment details:", JSON.stringify(details))

    const status = (details && (details.status || details.payment_status)) || "unknown"

    if (String(status).toLowerCase() !== "approved") {
      return NextResponse.json({ status: "not_approved", paymentStatus: status }, { status: 200 })
    }

    let externalReference: any = details.external_reference || details.order?.external_reference || null

    if (!externalReference) {
      return NextResponse.json({ error: "no_external_reference" }, { status: 400 })
    }

    try {
      if (typeof externalReference === "string") {
        externalReference = JSON.parse(externalReference)
      }
    } catch (err) {
      console.warn("external_reference not JSON, using raw value", externalReference)
    }

    const { fullName, cellphone, selectedNumbers } = externalReference

    if (!fullName || !cellphone || !selectedNumbers) {
      return NextResponse.json({ error: "invalid_external_reference", externalReference }, { status: 400 })
    }

    try {
      const saved = await saveRaffleEntry(fullName, cellphone, selectedNumbers)
      return NextResponse.json({ success: true, saved }, { status: 201 })
    } catch (err) {
      console.error("Failed to save raffle entry during reprocess:", err)
      return NextResponse.json({ error: "save_failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("Reprocess handler error:", error)
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }
}
