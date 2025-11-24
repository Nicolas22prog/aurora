import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
})

// Tipo para a tabela 'numero'
export interface NumeroRecord {
  id?: string
  nome: string
  telefone: string
  numero: number[] // Array de inteiros
  created_at?: string
  updated_at?: string
}

// Função para salvar um novo registro de rifas
export async function saveRaffleEntry(nome: string, telefone: string, numero: number[]) {
  try {
    const record: Omit<NumeroRecord, "id" | "created_at" | "updated_at"> = {
      nome,
      telefone,
      numero,
    }

    const { data: result, error } = await supabase.from("numero").insert([record]).select()

    if (error) {
      throw new Error(`Erro ao salvar dados: ${error.message}`)
    }

    return result?.[0] || null
  } catch (error) {
    console.error("Erro na operação com Supabase:", error)
    throw error
  }
}

// Função para buscar todos os registros (opcional)
export async function getAllRaffleEntries() {
  try {
    const { data, error } = await supabase.from("numero").select("*")

    if (error) {
      throw new Error(`Erro ao buscar dados: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Erro ao buscar registros:", error)
    throw error
  }
}

// Função para buscar registros por nome (opcional)
export async function getRaffleEntriesByName(nome: string) {
  try {
    const { data, error } = await supabase.from("numero").select("*").ilike("nome", `%${nome}%`)

    if (error) {
      throw new Error(`Erro ao buscar dados: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Erro ao buscar registros por nome:", error)
    throw error
  }
}

// Função para buscar todos os números já selecionados
export async function getAllSelectedNumbers(): Promise<number[]> {
  try {
    const { data, error } = await supabase.from("numero").select("numero")

    if (error) {
      throw new Error(`Erro ao buscar números: ${error.message}`)
    }

    // Combinar todos os números de todos os registros em um único array
    const allNumbers = new Set<number>()
    
    if (data && Array.isArray(data)) {
      data.forEach((record: any) => {
        if (record.numero && Array.isArray(record.numero)) {
          record.numero.forEach((num: number) => {
            allNumbers.add(num)
          })
        }
      })
    }

    return Array.from(allNumbers).sort((a, b) => a - b)
  } catch (error) {
    console.error("Erro ao buscar números selecionados:", error)
    return []
  }
}
