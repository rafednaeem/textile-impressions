"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const statuses = ["new", "reviewing", "accepted", "rejected", "contacted"]

export default function AdminIncubatorEnquiriesPage() {
  const supabase = createClient()
  const [enquiries, setEnquiries] = useState<any[]>([])

  const fetchEnquiries = async () => {
    const { data } = await supabase.from("incubator_enquiries").select("*").order("created_at", { ascending: false })
    if (data) setEnquiries(data)
  }

  useEffect(() => {
    fetchEnquiries()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("incubator_enquiries").update({ status }).eq("id", id)
    fetchEnquiries()
  }

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold text-brand-forest">Incubator Enquiries</h1>
      <div className="space-y-3">
        {enquiries.map((enquiry) => (
          <div key={enquiry.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{enquiry.name} - {enquiry.craft_type}</p>
                <p className="text-sm text-muted-foreground">{enquiry.phone}</p>
              </div>
              <select value={enquiry.status} onChange={(e) => updateStatus(enquiry.id, e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{enquiry.description || "No description provided."}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
