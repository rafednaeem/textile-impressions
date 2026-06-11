"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { createDiscountCode, deleteDiscountCode } from "@/lib/admin/actions"

export default function AdminDiscountsPage() {
  const supabase = createClient()
  const [codes, setCodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    code: "", type: "percentage", value: "", min_order_amount: "",
    max_uses: "", is_active: true, expires_at: "",
  })

  const fetchCodes = async () => {
    const { data } = await supabase
      .from("discount_codes")
      .select("*")
      .order("created_at", { ascending: false })
    if (data) setCodes(data)
    setLoading(false)
  }

  useEffect(() => { fetchCodes() }, [supabase])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append("code", form.code)
    fd.append("type", form.type)
    fd.append("value", form.value)
    if (form.min_order_amount) fd.append("min_order_amount", form.min_order_amount)
    if (form.max_uses) fd.append("max_uses", form.max_uses)
    fd.append("is_active", form.is_active ? "on" : "off")
    if (form.expires_at) fd.append("expires_at", form.expires_at)

    await createDiscountCode(fd)
    resetForm()
    fetchCodes()
  }

  const resetForm = () => {
    setForm({ code: "", type: "percentage", value: "", min_order_amount: "", max_uses: "", is_active: true, expires_at: "" })
    setShowForm(false)
    setEditId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this discount code?")) return
    await deleteDiscountCode(id)
    fetchCodes()
  }

  if (loading) {
    return <div className="animate-pulse space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-muted" />
      ))}
    </div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-brand-forest">Discount Codes</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 rounded-full bg-brand-forest px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> New Code
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-brand-forest">{editId ? "Edit Code" : "New Discount Code"}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="SUMMER20" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-forest focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-forest focus:outline-none">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Value</label>
              <input type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required placeholder={form.type === "percentage" ? "20" : "500"} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-forest focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Min Order (optional)</label>
              <input type="number" min="0" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-forest focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Max Uses (optional)</label>
              <input type="number" min="1" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-forest focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Expires At (optional)</label>
              <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-forest focus:outline-none" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded border-border text-brand-forest" />
            Active
          </label>
          <div className="flex gap-2">
            <button type="submit" className="rounded-full bg-brand-forest px-6 py-2 text-sm font-medium text-white">Save</button>
            <button type="button" onClick={resetForm} className="rounded-full border border-border px-6 py-2 text-sm font-medium">Cancel</button>
          </div>
        </form>
      )}

      {codes.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">No discount codes yet</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Value</th>
                <th className="px-4 py-3 text-right font-medium">Min Order</th>
                <th className="px-4 py-3 text-center font-medium">Uses</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Expires</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-medium">{code.code}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{code.type}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {code.type === "percentage" ? `${code.value}%` : `Rs. ${Number(code.value).toLocaleString()}`}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {code.min_order_amount ? `Rs. ${Number(code.min_order_amount).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {code.used_count}/{code.max_uses || "∞"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      code.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {code.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                    {code.expires_at ? new Date(code.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Never"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleDelete(code.id)} className="text-muted-foreground hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
