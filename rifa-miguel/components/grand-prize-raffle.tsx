"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { CheckCircle, AlertCircle, Loader, Copy, X, Download } from "lucide-react"
import { getAllSelectedNumbers, saveRaffleEntry } from "@/lib/supabase"
import QRCode from "qrcode"
import axios from "axios"

interface RaffleState {
  fullName: string
  cellphone: string
  selectedNumbers: Set<number>
  takenNumbers: Set<number>
  confirmed: boolean
  loading: boolean
  error: string | null
  successMessage: string | null
}

export function GrandPrizeRaffle() {
  const qrCanvasRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<RaffleState>(() => {
    // Estado inicial sem carregar do banco (será feito no useEffect)
    return {
      fullName: "",
      cellphone: "",
      selectedNumbers: new Set(),
      takenNumbers: new Set(),
      confirmed: false,
      loading: false,
      error: null,
      successMessage: null,
    }
  })

  // Carregar os números já selecionados do banco ao montar o componente
  useEffect(() => {
    const loadTakenNumbers = async () => {
      try {
        const selectedNumbers = await getAllSelectedNumbers()
        setState((prev) => ({
          ...prev,
          takenNumbers: new Set(selectedNumbers),
        }))
      } catch (error) {
        console.error("Erro ao carregar números já selecionados:", error)
        setState((prev) => ({
          ...prev,
          error: "Erro ao carregar números disponíveis",
        }))
      }
    }

    loadTakenNumbers()
  }, [])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, fullName: e.target.value }))
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, cellphone: e.target.value }))
  }

  const handleNumberSelect = (num: number) => {
    if (!state.takenNumbers.has(num)) {
      setState((prev) => {
        const newSelectedNumbers = new Set(prev.selectedNumbers)
        if (newSelectedNumbers.has(num)) {
          newSelectedNumbers.delete(num)
        } else {
          newSelectedNumbers.add(num)
        }
        return { ...prev, selectedNumbers: newSelectedNumbers }
      })
    }
  }

  const handleSubmit = async () => {
    if (!state.fullName || !state.cellphone || state.selectedNumbers.size === 0) {
      return
    }

    // Validate phone number format (should be 10-13 digits, optionally with country code)
    const phoneDigits = state.cellphone.replace(/\D/g, "")
    if (phoneDigits.length < 10 || phoneDigits.length > 13) {
      setState((prev) => ({
        ...prev,
        error: "Telefone inválido. Use formato como 11999999999 ou 5511999999999",
      }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null, successMessage: null }))

    try {
      const response = await axios.post("/api/payment", {
        fullName: state.fullName,
        cellphone: state.cellphone,
        selectedNumbers: Array.from(state.selectedNumbers),
      })

      const data = response.data

      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        throw new Error("Missing init_point in response")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl rounded-lg border border-border bg-card p-6 shadow-lg sm:p-8 md:p-10">
        {/* Page Heading */}
        <div className="mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black tracking-tight text-foreground"> Chá Rifa do Miguel </h1>
            <p className="text-base font-normal text-muted-foreground">
              Para ajudar nos preparativos da chegada do nosso bebê, estamos realizando um Chá Rifa super especial! 💙
            </p>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Como funciona?</h1>
            <p className="text-base font-normal text-muted-foreground">Você escolhe um número da rifa e ainda concorre a um prêmio! Sua colaboração fará uma grande diferença para montarmos o enxoval e deixarmos tudo prontinho para a chegada do Miguel. ✨</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="flex-1 space-y-8">
            {/* Section 1: Your Details */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">1.Suas Informações</h2>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Full Name TextField */}
                <label className="flex flex-col">
                  <p className="pb-2 text-base font-medium text-foreground">Nome Completo</p>
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={state.fullName}
                    onChange={handleNameChange}
                    className="h-14 w-full rounded-lg border border-input bg-card p-4 text-base font-normal text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>

                {/* Cellphone Number TextField */}
                <label className="flex flex-col">
                  <p className="pb-2 text-base font-medium text-foreground">Numero de Telefone </p>
                  <input
                    type="tel"
                    placeholder="(xx) xxxx-xxxx"
                    value={state.cellphone}
                    onChange={handlePhoneChange}
                    className="h-14 w-full rounded-lg border border-input bg-card p-4 text-base font-normal text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>
              </div>
            </div>

            {/* Section 2: Pick Your Numbers */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">2.Escolha os Numeros que Deseja</h2>
                  <p className="text-sm text-muted-foreground">{state.selectedNumbers.size} selecionados</p>
                </div>
                <div className="hidden items-center gap-4 text-sm sm:flex">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border border-input bg-card"></div>
                    <span className="text-muted-foreground">Disponivel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border border-primary bg-primary"></div>
                    <span className="text-muted-foreground">Selecionados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border border-muted bg-muted"></div>
                    <span className="text-muted-foreground">Já comprados</span>
                  </div>
                </div>
              </div>

              <p className="mt-2 text-base text-muted-foreground">
                Selecione um ou mais números para participar da rifa. Cada número custa R$10,00. Boa sorte!
              </p>

              {/* Number Grid */}
              <div className="mt-6 h-80 overflow-auto rounded-lg border border-border bg-secondary p-2">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-2">
                  {Array.from({ length: 300 }, (_, i) => i + 1).map((num) => {
                    const isTaken = state.takenNumbers.has(num)
                    const isSelected = state.selectedNumbers.has(num)

                    return (
                      <button
                        key={num}
                        disabled={isTaken}
                        onClick={() => handleNumberSelect(num)}
                        className={`flex h-12 w-12 items-center justify-center rounded-lg border text-sm font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                          isTaken
                            ? "cursor-not-allowed border-muted bg-muted text-muted-foreground"
                            : isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {num}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Action and Feedback */}
            <div className="flex flex-col gap-4">
              {/* Botão de Submit */}
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <button
                  onClick={handleSubmit}
                  disabled={!state.fullName || !state.cellphone || state.selectedNumbers.size === 0 || state.loading}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {state.loading && <Loader className="h-5 w-5 animate-spin" />}
                  {state.loading ? "Confirmando..." : "Ir para o pagamento"}
                </button>

                {state.successMessage && (
                  <div className="flex items-center gap-2 text-sm text-chart-1">
                    <CheckCircle className="h-5 w-5" />
                    <span>{state.successMessage}</span>
                  </div>
                )}

                {state.error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span>{state.error}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
