"use client"

import { useEffect, useState } from "react"
import { MapPin, Plus, Trash2, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { addressSchema } from "@/lib/validations"

const PROVINCES = ["Punjab", "Sindh", "KPK", "Balochistan", "Gilgit-Baltistan", "AJK"]

export default function AddressesPage() {
  const supabase = createClient()
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    fullName: "", phone: "", addressLine1: "", addressLine2: "",
    city: "", province: "", postalCode: "", isDefault: false,
  })

  const fetchAddresses = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
    if (data) setAddresses(data)
    setLoading(false)
  }

  useEffect(() => { fetchAddresses() }, [])

  const save = async () => {
    const result = addressSchema.safeParse({
      fullName: form.fullName,
      phone: form.phone,
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2 || undefined,
      city: form.city,
      province: form.province,
      postalCode: form.postalCode || undefined,
    })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string
        if (!fieldErrors[path]) fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (form.isDefault) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id)
    }

    await supabase.from("addresses").insert({
      user_id: user.id,
      full_name: result.data.fullName,
      phone: result.data.phone,
      address_line1: result.data.addressLine1,
      address_line2: result.data.addressLine2 || null,
      city: result.data.city,
      province: result.data.province,
      postal_code: result.data.postalCode || null,
      is_default: form.isDefault || addresses.length === 0,
    })

    setForm({ fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", province: "", postalCode: "", isDefault: false })
    setErrors({})
    setAdding(false)
    fetchAddresses()
  }

  const remove = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id)
    fetchAddresses()
  }

  const setDefault = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id)
    await supabase.from("addresses").update({ is_default: true }).eq("id", id)
    fetchAddresses()
  }

  if (loading) {
    return <div className="animate-pulse space-y-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-muted" />
      ))}
    </div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-brand-forest">Saved Addresses</h2>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 rounded-full bg-brand-forest px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {addresses.length === 0 && !adding && (
        <div className="rounded-xl border border-border p-12 text-center">
          <MapPin className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No saved addresses</p>
        </div>
      )}

      {addresses.map((addr) => (
        <div key={addr.id} className="flex items-start justify-between rounded-xl border border-border p-4">
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <p className="font-medium">{addr.full_name}</p>
              {addr.is_default && (
                <span className="rounded-full bg-brand-forest/10 px-2 py-0.5 text-xs text-brand-forest">Default</span>
              )}
            </div>
            <p className="text-muted-foreground">{addr.phone}</p>
            <p className="text-muted-foreground">
              {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ""}
              <br />{addr.city}, {addr.province}{addr.postal_code ? ` - ${addr.postal_code}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!addr.is_default && (
              <button onClick={() => setDefault(addr.id)} className="text-xs text-muted-foreground underline hover:text-brand-forest" title="Set as default">
                <Check className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => remove(addr.id)} className="text-muted-foreground hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {adding && (
        <div className="rounded-xl border border-border p-4">
          <h3 className="mb-4 text-sm font-semibold text-brand-forest">New Address</h3>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm">Full Name</label>
                <input value={form.fullName} onChange={(e) => { setForm({ ...form, fullName: e.target.value }); if (errors.fullName) setErrors((p) => ({ ...p, fullName: "" })) }} className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none ${errors.fullName ? "border-red-400 focus:border-red-500" : "border-border focus:border-brand-forest"}`} />
                {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
              </div>
              <div>
                <label className="block text-sm">Phone</label>
                <input value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); if (errors.phone) setErrors((p) => ({ ...p, phone: "" })) }} className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none ${errors.phone ? "border-red-400 focus:border-red-500" : "border-border focus:border-brand-forest"}`} />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm">Address Line 1</label>
              <input value={form.addressLine1} onChange={(e) => { setForm({ ...form, addressLine1: e.target.value }); if (errors.addressLine1) setErrors((p) => ({ ...p, addressLine1: "" })) }} className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none ${errors.addressLine1 ? "border-red-400 focus:border-red-500" : "border-border focus:border-brand-forest"}`} />
              {errors.addressLine1 && <p className="mt-1 text-xs text-red-500">{errors.addressLine1}</p>}
            </div>
            <div>
              <label className="block text-sm">Address Line 2 <span className="text-muted-foreground">(optional)</span></label>
              <input value={form.addressLine2} onChange={(e) => { setForm({ ...form, addressLine2: e.target.value }); if (errors.addressLine2) setErrors((p) => ({ ...p, addressLine2: "" })) }} className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none ${errors.addressLine2 ? "border-red-400 focus:border-red-500" : "border-border focus:border-brand-forest"}`} />
              {errors.addressLine2 && <p className="mt-1 text-xs text-red-500">{errors.addressLine2}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-sm">City</label>
                <input value={form.city} onChange={(e) => { setForm({ ...form, city: e.target.value }); if (errors.city) setErrors((p) => ({ ...p, city: "" })) }} className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none ${errors.city ? "border-red-400 focus:border-red-500" : "border-border focus:border-brand-forest"}`} />
                {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
              </div>
              <div>
                <label className="block text-sm">Province</label>
                <select value={form.province} onChange={(e) => { setForm({ ...form, province: e.target.value }); if (errors.province) setErrors((p) => ({ ...p, province: "" })) }} className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none ${errors.province ? "border-red-400 focus:border-red-500" : "border-border focus:border-brand-forest"}`}>
                  <option value="">Select</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.province && <p className="mt-1 text-xs text-red-500">{errors.province}</p>}
              </div>
              <div>
                <label className="block text-sm">Postal Code <span className="text-muted-foreground">(optional)</span></label>
                <input value={form.postalCode} onChange={(e) => { setForm({ ...form, postalCode: e.target.value }); if (errors.postalCode) setErrors((p) => ({ ...p, postalCode: "" })) }} className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none ${errors.postalCode ? "border-red-400 focus:border-red-500" : "border-border focus:border-brand-forest"}`} />
                {errors.postalCode && <p className="mt-1 text-xs text-red-500">{errors.postalCode}</p>}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="rounded border-border text-brand-forest" />
              Set as default address
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={save} className="rounded-full bg-brand-forest px-6 py-2 text-sm font-medium text-white">Save</button>
            <button onClick={() => setAdding(false)} className="rounded-full border border-border px-6 py-2 text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
