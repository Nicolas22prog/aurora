import { createClient } from "@supabase/supabase-js"

import { supabaseServer} from './supabaseServer'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
  )
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
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
  const { data, error } = await supabaseServer
  .from('numero')
  .insert({
    nome,
    telefone,
    numero
  })

  if(error) throw error
  return data
  
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
