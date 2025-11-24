
import { NextRequest, NextResponse } from "next/server";
import { createPayment } from "@/lib/mercadopago";

export async function POST(request: NextRequest) {
  try {
    const { fullName, cellphone, selectedNumbers } = await request.json();

    if (!fullName || !cellphone || !selectedNumbers || selectedNumbers.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payment = await createPayment({ fullName, cellphone }, selectedNumbers);

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error creating Mercado Pago preference:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
