import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const phone = url.searchParams.get("phone")
    const number = url.searchParams.get("number")

    if (!phone || !number) {
      return NextResponse.json({ error: "Missing query params: phone and number are required" }, { status: 400 })
    }

    // Try to find a record where telefone matches and numero array contains the number
    const { data, error } = await supabase
      .from("numero")
      .select("*")
      .ilike("telefone", phone)
      .contains("numero", [Number(number)])

    if (error) {
      console.error("Error querying entry:", error)
      return NextResponse.json({ error: "Database query failed" }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}

