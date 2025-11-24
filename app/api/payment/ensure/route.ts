import { NextRequest, NextResponse } from "next/server"
import { getAllRaffleEntries, saveRaffleEntry } from "@/lib/supabase"

type EnsureBody = {
  name?: string
  numbers?: string | number[]
  cellphone?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: EnsureBody = await request.json()

    const name = (body.name || "").trim()
    let numbers: number[] = []
    const token = (body as any).token || null

    if (!body.numbers) {
      return NextResponse.json({ error: "missing_numbers" }, { status: 400 })
    }

    if (Array.isArray(body.numbers)) {
      numbers = body.numbers.map((n: any) => Number(n))
    } else if (typeof body.numbers === "string") {
      numbers = body.numbers.split(",").map((s) => Number(s.trim()))
    }

    // Normalize numbers
    numbers = numbers.filter((n) => Number.isFinite(n)).sort((a, b) => a - b)

    // If token provided, try to fetch payment via Mercado Pago and save if approved
    if (token) {
      try {
        const resp = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(token)}`, {
          headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN!}` },
        })
        if (resp.ok) {
          const json = await resp.json()
          const first = (json && (json.results || json.results?.map ? json.results[0] : null)) || null
          const details = first || null
          if (details) {
            const status = details.status || details.payment_status || "unknown"
            if (String(status).toLowerCase() === "approved") {
              let externalReference: any = details.external_reference || details.order?.external_reference || null
              try {
                if (typeof externalReference === "string") externalReference = JSON.parse(externalReference)
              } catch (err) {
                console.warn("external_reference not JSON", err)
              }
              const { fullName, cellphone, selectedNumbers } = externalReference || {}
              if (fullName && cellphone && selectedNumbers) {
                const saved = await saveRaffleEntry(fullName, cellphone, selectedNumbers)
                return NextResponse.json({ success: true, saved, source: "mp_token" }, { status: 201 })
              }
            }
          }
        }
      } catch (err) {
        console.error("Error querying Mercado Pago by token in ensure:", err)
      }
    }

    // Fetch existing entries and try to match
    const entries = await getAllRaffleEntries()

    // Try matching by cellphone first
    if (body.cellphone) {
      const match = entries.find((e: any) => e.telefone === body.cellphone && Array.isArray(e.numero) && arraysEqual(e.numero, numbers))
      if (match) return NextResponse.json({ found: true, entry: match }, { status: 200 })
    }

    // Try matching by name and numbers
    if (name) {
      const lowered = name.toLowerCase()
      const match = entries.find((e: any) => e.nome && e.nome.toLowerCase().includes(lowered) && Array.isArray(e.numero) && arraysEqual(e.numero, numbers))
      if (match) return NextResponse.json({ found: true, entry: match }, { status: 200 })
    }

    // Not found: perform fallback save (marked by appending " (fallback)" to the name)
    const saveName = name ? `${name} (fallback)` : `Desconhecido (fallback)`
    const telefone = body.cellphone || ""

    try {
      const saved = await saveRaffleEntry(saveName, telefone, numbers)
      return NextResponse.json({ success: true, saved, fallback: true }, { status: 201 })
    } catch (err) {
      console.error("Failed to save fallback entry:", err)
      return NextResponse.json({ error: "save_failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in payment ensure handler:", error)
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }
}

function arraysEqual(a: any[], b: any[]) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length !== b.length) return false
  const sa = [...a].map((x) => Number(x)).sort((x, y) => x - y)
  const sb = [...b].map((x) => Number(x)).sort((x, y) => x - y)
  for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false
  return true
}
