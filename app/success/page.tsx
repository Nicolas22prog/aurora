"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { RaffleConfirmation } from "@/components/raffle-confirmation"

function SuccessContent() {
  const searchParams = useSearchParams()
  const numbers = searchParams.get("numbers") || ""
  const name = searchParams.get("name") || ""

  // Parse os números (podem vir como "1,2,3" ou "1")
  const numberArray = numbers ? numbers.split(",").map(n => `#${n.trim()}`) : []

  return (
    <RaffleConfirmation
      raffleNumbers={numberArray}
      email={undefined}
      announcementDate="31 de Dezembro"
      onShare={() => {
        const text = `Comprei o(s) número(s) ${numbers} da Rifa do Miguel! 🎉`
        if (navigator.share) {
          navigator.share({ title: "Rifa do Miguel", text })
        } else {
          navigator.clipboard.writeText(text)
        }
      }}
      onBack={() => {
        window.location.href = "/"
      }}
    />
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
