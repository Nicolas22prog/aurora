import { NextResponse } from "next/server"

export async function POST(request: Request) {
  // Este webhook não é mais utilizado
  // Use /api/payment/webhook em vez disso
  return NextResponse.json({ status: "ok" }, { status: 200 })
}
