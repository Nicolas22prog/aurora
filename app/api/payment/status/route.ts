import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paymentId = searchParams.get("payment_id")
    const preferenceId = searchParams.get("preference_id")

    if (!paymentId && !preferenceId) {
      return NextResponse.json(
        { error: "Missing payment_id or preference_id parameter" },
        { status: 400 }
      )
    }

    // If paymentId is provided, fetch payment details
    if (paymentId) {
      const payment = new Payment(client)
      const paymentDetails = await payment.get({ id: paymentId })

      return NextResponse.json({
        status: paymentDetails.status,
        paymentId: paymentDetails.id,
        external_reference: paymentDetails.external_reference,
      })
    }

    return NextResponse.json({ status: "unknown" })
  } catch (error) {
    console.error("Error fetching payment status:", error)
    return NextResponse.json(
      { error: "Failed to fetch payment status" },
      { status: 500 }
    )
  }
}
