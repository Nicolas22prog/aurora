// lib/supabaseBrowser.ts ← NOVO ARQUIVO
import { supabaseBrowser } from './supabaseClient'

export async function getAllSelectedNumbers(): Promise<number[]> {
  try {
    const { data, error } = await supabaseBrowser
      .from('numero')
      .select('numero')

    if (error) throw error

    const allNumbers = new Set<number>()
    data?.forEach((record: any) => {
      if (Array.isArray(record.numero)) {
        record.numero.forEach((n: number) => allNumbers.add(n))
      }
    })

    return Array.from(allNumbers).sort((a, b) => a - b)
  } catch (error) {
    console.error('Erro ao buscar números vendidos:', error)
    return []
  }
}