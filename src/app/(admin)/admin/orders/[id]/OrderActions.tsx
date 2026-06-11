"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle, Truck, XCircle, ExternalLink } from "lucide-react"
import { verifyPayment, rejectPayment, updateOrderStatus } from "@/lib/admin/actions"

interface Props {
  orderId: string
  currentStatus: string
  paymentMethod: string | null
}

export default function OrderActions({ orderId, currentStatus, paymentMethod }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (action: string, fn: () => Promise<void>) => {
    setLoading(action)
    try {
      await fn()
      toast.success("Action completed")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Action failed")
    }
    setLoading(null)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {paymentMethod === "bank_transfer" && currentStatus === "payment_submitted" && (
        <>
          <button
            onClick={() => handleAction("verify", () => verifyPayment(orderId))}
            disabled={!!loading}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            {loading === "verify" ? "Verifying..." : "Verify Payment"}
          </button>
          <button
            onClick={() => {
              const reason = prompt("Rejection reason:")
              if (reason) handleAction("reject", () => rejectPayment(orderId, reason))
            }}
            disabled={!!loading}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
        </>
      )}

      {(currentStatus === "cod_pending" || currentStatus === "payment_verified") && (
        <button
          onClick={() => handleAction("dispatch", () => updateOrderStatus(orderId, "dispatched"))}
          disabled={!!loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Truck className="h-4 w-4" />
          {loading === "dispatch" ? "Updating..." : "Mark Dispatched"}
        </button>
      )}

      {currentStatus === "dispatched" && (
        <button
          onClick={() => handleAction("deliver", () => updateOrderStatus(orderId, "delivered"))}
          disabled={!!loading}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          <CheckCircle className="h-4 w-4" />
          {loading === "deliver" ? "Updating..." : "Mark Delivered"}
        </button>
      )}
    </div>
  )
}