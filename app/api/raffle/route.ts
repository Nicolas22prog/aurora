import { saveRaffleEntry } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { nome, telefone, numeros } = body

    // Validação básica
    if (!nome || !telefone || !numeros || !Array.isArray(numeros)) {
      return NextResponse.json(
        { error: "Nome, telefone e array de números são obrigatórios" },
        { status: 400 }
      )
    }

    if (numeros.length === 0) {
      return NextResponse.json(
        { error: "Você deve selecionar pelo menos um número" },
        { status: 400 }
      )
    }

    // Salvar no banco de dados
    const result = await saveRaffleEntry(
      nome.trim(),
      telefone.trim(),
      numeros.sort((a: number, b: number) => a - b)
    )

    return NextResponse.json(
      {
        success: true,
        message: "Participação registrada com sucesso!",
        data: result,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erro ao processar requisição:", error)

    return NextResponse.json(
      {
        error: "Erro ao salvar participação. Tente novamente.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}
