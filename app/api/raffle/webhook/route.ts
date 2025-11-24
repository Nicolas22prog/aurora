import { NextResponse } from "next/server"

// Este arquivo não é mais utilizado
// O webhook de pagamento está em /api/payment/webhook
export async function POST() {
  return NextResponse.json({ status: "deprecated" }, { status: 200 })
}
