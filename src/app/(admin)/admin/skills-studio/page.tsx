import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Plus } from "lucide-react"
import { WORKSHOP_FORMAT_LABELS, WORKSHOP_LEVEL_LABELS, WORKSHOP_STATUS_LABELS } from "@/lib/constants"

export const dynamic = "force-dynamic"

export default async function AdminSkillsStudioPage() {
  const supabase = await createClient()

  const { data: workshops } = await supabase
    .from("workshops")
    .select("id, title, slug, format, level, status, date_start, fee, max_seats, seats_remaining, is_featured")
    .order("created_at", { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Skills Studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage workshops and training sessions.</p>
        </div>
        <Link
          href="/admin/skills-studio/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-forest px-4 py-2 text-sm font-medium text-white hover:bg-brand-forest/90"
        >
          <Plus className="h-4 w-4" />
          New Workshop
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Format</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Level</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fee</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Seats</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(workshops || []).map((w) => (
              <tr key={w.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{w.title}</td>
                <td className="px-4 py-3">{WORKSHOP_FORMAT_LABELS[w.format] || w.format}</td>
                <td className="px-4 py-3">{WORKSHOP_LEVEL_LABELS[w.level] || w.level}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    w.status === "published" ? "bg-green-100 text-green-700" :
                    w.status === "completed" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {WORKSHOP_STATUS_LABELS[w.status] || w.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {w.date_start ? new Date(w.date_start).toLocaleDateString() : "-"}
                </td>
                <td className="px-4 py-3">{w.fee === 0 ? "Free" : `Rs. ${w.fee}`}</td>
                <td className="px-4 py-3">{w.seats_remaining ?? w.max_seats ?? "-"}</td>
                <td className="px-4 py-3 space-x-2">
                  <Link href={`/admin/skills-studio/${w.id}/edit`} className="text-sm text-brand-forest hover:underline">
                    Edit
                  </Link>
                  <Link href={`/admin/skills-studio/${w.id}/registrations`} className="text-sm text-brand-terracotta hover:underline">
                    Registrations
                  </Link>
                </td>
              </tr>
            ))}
            {(!workshops || workshops.length === 0) && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No workshops yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}