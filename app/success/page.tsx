"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { RaffleConfirmation } from "@/components/raffle-confirmation"

function SuccessContent() {
  const searchParams = useSearchParams()
  const numbers = searchParams.get("numbers") || ""
  const name = searchParams.get("name") || ""
  const token = searchParams.get("token") || ""

  // Parse os números (podem vir como "1,2,3" ou "1")
  const numberArray = numbers ? numbers.split(",").map(n => `#${n.trim()}`) : []

  // try to ensure the entry exists on the server; if webhook failed, this creates a fallback record
  useEffect(() => {
    const ensure = async () => {
      try {
        await fetch("/api/payment/ensure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, numbers: numberArray.map((s) => s.replace(/#/g, "")), token }),
        })
      } catch (err) {
        console.error("Ensure call failed:", err)
      }
    }

    if (numberArray.length > 0) ensure()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
