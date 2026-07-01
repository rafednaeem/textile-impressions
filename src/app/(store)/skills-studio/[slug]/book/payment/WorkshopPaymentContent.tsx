"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChevronLeft, Loader2, Check, Upload, Building2 } from "lucide-react"
import type { Workshop, WorkshopRegistration } from "@/types/workshop"
import { WORKSHOP_FORMAT_LABELS } from "@/lib/constants"

interface Props {
  workshop: Workshop
  registration: WorkshopRegistration & { guest_email: string | null }
  bankDetails: {
    bank: string
    accountName: string
    accountNumber: string
    iban: string
  }
}

export default function WorkshopPaymentContent({ workshop, registration, bankDetails }: Props) {
  const router = useRouter()
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [transactionRef, setTransactionRef] = useState("")
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const alreadySubmitted = registration.status === "payment_submitted"

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProofFile(file)
      setProofPreview(URL.createObjectURL(file))
    }
  }

  const uploadProof = async (): Promise<string | null> => {
    if (!proofFile) return null
    setUploading(true)
    const formData = new FormData()
    formData.append("file", proofFile)

    const res = await fetch("/api/upload/payment-proof", {
      method: "POST",
      body: formData,
    })

    setUploading(false)
    if (!res.ok) {
      toast.error("Failed to upload proof. Please try again.")
      return null
    }

    const data = await res.json()
    return data.url ?? null
  }

  const handleSubmit = async () => {
    if (!proofFile) {
      toast.error("Please upload your payment proof")
      return
    }

    setSubmitting(true)

    // Upload proof first
    const proofUrl = await uploadProof()
    if (!proofUrl) {
      setSubmitting(false)
      return
    }

    try {
      // Create payment record
      const payRes = await fetch("/api/workshops/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.id,
          transactionRef: transactionRef || undefined,
        }),
      })

      const payData = await payRes.json()

      if (!payRes.ok) {
        toast.error(payData.error || "Failed to submit payment")
        setSubmitting(false)
        return
      }

      // Update proof URL
      await fetch(`/api/workshops/payment/${payData.paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl }),
      })

      setSuccess(true)
      toast.success("Payment proof submitted!")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success || alreadySubmitted) {
    return (
      <div className="bg-brand-ivory px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mt-4 font-heading text-2xl font-bold text-brand-forest">Payment Proof Received!</h1>
          <p className="mt-2 text-muted-foreground">
            We have received your payment proof for <strong>{workshop.title}</strong>. Our team will verify your payment within 2-4 hours.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            You will receive an email at {registration.guest_email} once your payment is verified.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={`/skills-studio/${workshop.slug}`} className="rounded-full bg-brand-forest px-6 py-3 text-sm font-medium text-white hover:bg-brand-forest/90">
              Back to Workshop
            </Link>
            <Link href="/skills-studio" className="rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-muted">
              Browse More Workshops
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-brand-ivory px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href={`/skills-studio/${workshop.slug}/book`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-brand-forest mb-6">
          <ChevronLeft className="h-4 w-4" />
          Back to Registration
        </Link>

        <h1 className="font-heading text-2xl font-bold text-brand-forest">Complete Payment</h1>

        <div className="mt-4 rounded-xl border border-border bg-white p-4">
          <p className="font-medium text-brand-indigo">{workshop.title}</p>
          <p className="text-sm text-muted-foreground">
            {WORKSHOP_FORMAT_LABELS[workshop.format]} &middot; Rs. {workshop.fee.toLocaleString()}
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-brand-forest/10 p-2">
              <Building2 className="h-5 w-5 text-brand-forest" />
            </div>
            <p className="font-medium text-brand-forest">Bank Transfer Details</p>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Bank:</span> {bankDetails.bank}</p>
            <p><span className="text-muted-foreground">Account Name:</span> {bankDetails.accountName}</p>
            <p><span className="text-muted-foreground">Account #:</span> {bankDetails.accountNumber}</p>
            <p><span className="text-muted-foreground">IBAN:</span> {bankDetails.iban}</p>
            <p className="pt-2 font-semibold text-brand-forest">Amount: Rs. {workshop.fee.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Transaction Reference <span className="text-muted-foreground">(optional)</span></label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20"
              placeholder="e.g. TID123456"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Upload Payment Proof *</label>
            <div className="mt-1 flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-muted">
                <Upload className="h-4 w-4" />
                {proofFile ? "Change File" : "Choose File"}
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="hidden" />
              </label>
              {proofFile && <span className="text-sm text-muted-foreground">{proofFile.name}</span>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or PDF. Max 5MB.</p>
            {proofPreview && (
              <div className="relative mt-2 h-32 w-32 overflow-hidden rounded-lg border border-border">
                <Image src={proofPreview} alt="Payment proof preview" fill className="object-cover" sizes="128px" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={handleSubmit}
            disabled={submitting || uploading || !proofFile}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-forest px-6 py-3 text-sm font-medium text-white disabled:opacity-50 hover:bg-brand-forest/90"
          >
            {(submitting || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Submitting..." : uploading ? "Uploading..." : "Submit Payment Proof"}
          </button>
        </div>
      </div>
    </div>
  )
}
