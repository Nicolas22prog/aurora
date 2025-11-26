"use client"

import { useEffect, useState } from "react"
import { Loader } from "lucide-react"

export default function PendingPage() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
  const token = params?.get("token") || ""
  const numbers = params?.get("numbers") || ""
  const name = params?.get("name") || ""

  const [status, setStatus] = useState<string>("pending")
  const [attempts, setAttempts] = useState(0)
  const maxAttempts = 24 // poll up to 2 minutes (24 * 5s)

  useEffect(() => {
    let mounted = true
    let timer: any = null

    const tryReprocess = async () => {
      if (!token || attempts >= maxAttempts) {
        setStatus("not_confirmed")
        return
      }

      try {
        const res = await fetch("/api/payment/reprocess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })

        const data = await res.json()
        if (!mounted) return

        if (res.ok && data.success) {
          // Saved — redirect to success page
          const redirectUrl = `/success?numbers=${encodeURIComponent(numbers)}&name=${encodeURIComponent(name)}`
          window.location.href = redirectUrl
          return
        }

        // not approved yet, schedule another try
        setAttempts((a) => a + 1)
        timer = setTimeout(tryReprocess, 5000)
      } catch (err) {
        console.error("Error polling reprocess:", err)
        setAttempts((a) => a + 1)
        timer = setTimeout(tryReprocess, 5000)
      }
    }

    tryReprocess()

    return () => {
      mounted = false
      if (timer) clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-xl rounded-lg border border-border bg-card p-8 text-center">
        <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
        <h1 className="text-2xl font-bold">Pagamento pendente</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Estamos aguardando a confirmação do pagamento. Este processo pode levar alguns segundos a minutos dependendo do método de pagamento.
        </p>
        <p className="mt-4 text-sm">Tentando confirmar automaticamente ({attempts}/{maxAttempts})...</p>
        {status === "not_confirmed" && (
          <div className="mt-4 text-sm text-destructive">
            Não foi possível confirmar o pagamento automaticamente. Se já pagou, entre em contato ou aguarde alguns minutos e tente novamente.
          </div>
        )}
      </div>
    </div>
  )
}
