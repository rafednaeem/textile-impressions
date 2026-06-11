import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function RegistrationsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: workshop } = await supabase
    .from("workshops")
    .select("id, title, max_seats, seats_remaining")
    .eq("id", id)
    .single()

  if (!workshop) notFound()

  const { data: registrations } = await supabase
    .from("workshop_registrations")
    .select("*")
    .eq("workshop_id", id)
    .order("registered_at", { ascending: false })

  return (
    <div>
      <Link href="/admin/skills-studio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> Back to Skills Studio
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {workshop.title} —             {workshop.seats_remaining ?? "-"} / {workshop.max_seats ?? "-"} seats remaining
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(registrations || []).map((reg) => (
              <tr key={reg.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{reg.guest_name || "User"}</td>
                <td className="px-4 py-3 text-muted-foreground">{reg.guest_email || "-"}</td>
                <td className="px-4 py-3 text-muted-foreground">{reg.guest_phone || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    reg.status === "registered" ? "bg-green-100 text-green-700" :
                    reg.status === "cancelled" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {reg.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(reg.registered_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {(!registrations || registrations.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No registrations yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}