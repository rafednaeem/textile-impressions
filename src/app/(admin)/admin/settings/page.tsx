"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import type { SiteSetting } from "@/types/database"

const SHIPPING_PROVINCES = [
  { key: "shipping_punjab", label: "Punjab" },
  { key: "shipping_sindh", label: "Sindh" },
  { key: "shipping_kpk", label: "Khyber Pakhtunkhwa (KPK)" },
  { key: "shipping_balochistan", label: "Balochistan" },
  { key: "shipping_gilgit_baltistan", label: "Gilgit-Baltistan (GB)" },
  { key: "shipping_ajk", label: "Azad Jammu & Kashmir (AJK)" },
  { key: "shipping_islamabad", label: "Islamabad Capital Territory (ICT)" },
] as const

const DEFAULT_SHIPPING = "200"

export default function AdminSettingsPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<SiteSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [edits, setEdits] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSettings = async () => {
    const { data } = await supabase.from("site_settings").select("*").order("key")
    if (data) {
      setSettings(data)
      const editsMap: Record<string, string> = {}
      data.forEach((s) => { editsMap[s.key] = s.value })
      SHIPPING_PROVINCES.forEach(({ key }) => {
        if (!editsMap[key]) editsMap[key] = DEFAULT_SHIPPING
      })
      setEdits(editsMap)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const [key, value] of Object.entries(edits)) {
        const existing = settings.find((s) => s.key === key)
        const { error } = existing
          ? await supabase.from("site_settings").update({ value }).eq("key", key)
          : await supabase.from("site_settings").insert({ key, value })
        if (error) throw new Error(error.message)
      }
      await fetchSettings()
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to save settings")
    }
    setSaving(false)
  }

  const generalSettings = Object.entries(edits).filter(([key]) => !key.startsWith("shipping_"))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage site-wide configuration.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-forest px-4 py-2 text-sm font-medium text-white hover:bg-brand-forest/90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className="mt-6 space-y-8">
        <section>
          <h2 className="text-lg font-semibold">Store Information</h2>
          <p className="text-sm text-muted-foreground">Business details shown to customers.</p>
          <div className="mt-3 space-y-4">
            {generalSettings.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-border bg-card p-4">
                <label className="block text-sm font-medium">{key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</label>
                <textarea
                  value={value}
                  onChange={(e) => setEdits({ ...edits, [key]: e.target.value })}
                  rows={key.includes("text") || key.includes("policy") ? 3 : 1}
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-forest focus:outline-none focus:ring-1 focus:ring-brand-forest"
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Shipping Charges</h2>
          <p className="text-sm text-muted-foreground">Shipping cost per province (in PKR). Used at checkout.</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SHIPPING_PROVINCES.map(({ key, label }) => (
              <div key={key} className="rounded-xl border border-border bg-card p-4">
                <label className="block text-sm font-medium">{label}</label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    value={edits[key] ?? DEFAULT_SHIPPING}
                    onChange={(e) => setEdits({ ...edits, [key]: e.target.value })}
                    className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand-forest focus:outline-none focus:ring-1 focus:ring-brand-forest"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
