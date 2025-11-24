import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { saveRaffleEntry } from "@/lib/supabase";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Mercado Pago Webhook received:", body);

    // Mercado Pago sends notifications for various events.
    // We are interested in 'payment' notifications.
    if (body.type === "payment" && body.data && body.data.id) {
      const paymentId = body.data.id;

      // Fetch payment details from Mercado Pago
      const payment = new Payment(client);
      const paymentDetails = await payment.get({ id: paymentId });

      console.log("Payment Details:", paymentDetails);

      if (paymentDetails.status === "approved") {
        const externalReference = JSON.parse(paymentDetails.external_reference as string);
        const { fullName, cellphone, selectedNumbers } = externalReference;

        // Save raffle entry to Supabase (nome, telefone, numero)
        await saveRaffleEntry(fullName, cellphone, selectedNumbers);
        console.log("Raffle entry saved successfully for payment:", paymentId);
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Error processing Mercado Pago webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
