"use client"

import { useSearchParams } from "next/navigation"
import { RaffleConfirmation } from "@/components/raffle-confirmation"

export default function SuccessPage() {
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
