"use client"

import { useEffect, useState } from "react"
import { MapPin, Plus, Trash2, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { addressSchema } from "@/lib/validations"
import { useFieldValidation } from "@/hooks/useFieldValidation"

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

  const validation = useFieldValidation(addressSchema, {
    fullName: form.fullName,
    phone: form.phone,
    addressLine1: form.addressLine1,
    addressLine2: form.addressLine2 || undefined,
    city: form.city,
    province: form.province,
    postalCode: form.postalCode || undefined,
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

  const updateField = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
    validation.handleChange(name)
  }

  const getFieldBorder = (name: string) => {
    const error = errors[name] || validation.errors[name]
    if (error) return "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
    if (validation.getFieldState(name) === "valid" && form[name as keyof typeof form]) return "border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200"
    return "border-border focus:border-brand-forest"
  }

  const getErrorMessage = (name: string) => errors[name] || validation.errors[name]

  const save = async () => {
    validation.markAllTouched()
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
    validation.clearErrors()
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
                <input
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  onBlur={() => validation.handleBlur("fullName")}
                  aria-invalid={!!getErrorMessage("fullName")}
                  aria-describedby={getErrorMessage("fullName") ? "addr-name-error" : undefined}
                  className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none transition-colors ${getFieldBorder("fullName")}`}
                />
                {getErrorMessage("fullName") && <p id="addr-name-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">{getErrorMessage("fullName")}</p>}
              </div>
              <div>
                <label className="block text-sm">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  onBlur={() => validation.handleBlur("phone")}
                  aria-invalid={!!getErrorMessage("phone")}
                  aria-describedby={getErrorMessage("phone") ? "addr-phone-error" : undefined}
                  className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none transition-colors ${getFieldBorder("phone")}`}
                />
                {getErrorMessage("phone") && <p id="addr-phone-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">{getErrorMessage("phone")}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm">Address Line 1</label>
              <input
                value={form.addressLine1}
                onChange={(e) => updateField("addressLine1", e.target.value)}
                onBlur={() => validation.handleBlur("addressLine1")}
                aria-invalid={!!getErrorMessage("addressLine1")}
                aria-describedby={getErrorMessage("addressLine1") ? "addr-addr1-error" : undefined}
                className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none transition-colors ${getFieldBorder("addressLine1")}`}
              />
              {getErrorMessage("addressLine1") && <p id="addr-addr1-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">{getErrorMessage("addressLine1")}</p>}
            </div>
            <div>
              <label className="block text-sm">Address Line 2 <span className="text-muted-foreground">(optional)</span></label>
              <input
                value={form.addressLine2}
                onChange={(e) => updateField("addressLine2", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/20"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-sm">City</label>
                <input
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  onBlur={() => validation.handleBlur("city")}
                  aria-invalid={!!getErrorMessage("city")}
                  aria-describedby={getErrorMessage("city") ? "addr-city-error" : undefined}
                  className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none transition-colors ${getFieldBorder("city")}`}
                />
                {getErrorMessage("city") && <p id="addr-city-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">{getErrorMessage("city")}</p>}
              </div>
              <div>
                <label className="block text-sm">Province</label>
                <select
                  value={form.province}
                  onChange={(e) => updateField("province", e.target.value)}
                  onBlur={() => validation.handleBlur("province")}
                  aria-invalid={!!getErrorMessage("province")}
                  aria-describedby={getErrorMessage("province") ? "addr-province-error" : undefined}
                  className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none transition-colors ${getFieldBorder("province")}`}
                >
                  <option value="">Select</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {getErrorMessage("province") && <p id="addr-province-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">{getErrorMessage("province")}</p>}
              </div>
              <div>
                <label className="block text-sm">Postal Code <span className="text-muted-foreground">(optional)</span></label>
                <input
                  value={form.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                  onBlur={() => validation.handleBlur("postalCode")}
                  aria-invalid={!!getErrorMessage("postalCode")}
                  aria-describedby={getErrorMessage("postalCode") ? "addr-postal-error" : undefined}
                  className={`mt-1 block w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none transition-colors ${getFieldBorder("postalCode")}`}
                />
                {getErrorMessage("postalCode") && <p id="addr-postal-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">{getErrorMessage("postalCode")}</p>}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="rounded border-border text-brand-forest" />
              Set as default address
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={save} className="rounded-full bg-brand-forest px-6 py-2 text-sm font-medium text-white">Save</button>
            <button onClick={() => { setAdding(false); setErrors({}); validation.clearErrors() }} className="rounded-full border border-border px-6 py-2 text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
