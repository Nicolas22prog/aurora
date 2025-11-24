"use client"

import { Button } from "@/components/ui/button"

interface RaffleConfirmationProps {
  raffleNumbers?: string[] | string // pode ser array ou string única
  email?: string
  announcementDate?: string
  onShare?: () => void
  onBack?: () => void
}

export function RaffleConfirmation({
  raffleNumbers = ["#137"],
  email,
  announcementDate = "10 de Janeiro",
  onBack,
}: RaffleConfirmationProps) {
  // Normaliza para array
  const numbers = Array.isArray(raffleNumbers) ? raffleNumbers : [raffleNumbers]
  // Remove # se presente e adiciona novamente para garantir formato consistente
  const formattedNumbers = numbers.map(n => n.toString().replace("#", "")).map(n => `#${n}`)
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-background">
      <div className="w-full max-w-lg rounded-xl bg-card shadow-lg border border-border p-8 sm:p-10 text-center">
        {/* Success Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <svg className="h-10 w-10 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-bold tracking-tight pb-2 text-foreground"> Obrigado por participar!</h1>

       
      

        {/* Raffle Number Display */}
        <div className="rounded-lg border-2 border-dashed border-border bg-muted p-6 mb-8">
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">O(s) seu(s) número(s) são:</h4>
          <div className="flex flex-wrap gap-3 justify-center">
            {formattedNumbers.map((num, idx) => (
              <h2 key={idx} className="text-emerald-600 text-4xl font-bold tracking-tighter">
                {num}
              </h2>
            ))}
          </div>
        </div>

        {/* Winner Announcement */}
        <p className="text-sm font-normal leading-normal text-muted-foreground pb-8">
         O ganhador será anunciado no dia 10 de Janeiro de 2026.
        </p>
      
        {/* Secondary Link */}
        <button
          onClick={onBack}
          className="text-sm font-medium text-muted-foreground hover:text-emerald-600 transition-colors"
        >
          Voltar para a página inicial
        </button>
      </div>
    </div>
  )
}
