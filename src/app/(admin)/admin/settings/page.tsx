"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import type { SiteSetting } from "@/types/database"

export default function AdminSettingsPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<SiteSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [edits, setEdits] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("site_settings").select("*").order("key")
      if (data) {
        setSettings(data)
        const editsMap: Record<string, string> = {}
        data.forEach((s) => { editsMap[s.key] = s.value })
        setEdits(editsMap)
      }
      setLoading(false)
    }
    fetchSettings()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const [key, value] of Object.entries(edits)) {
        const existing = settings.find((s) => s.key === key)
        if (existing) {
          await supabase.from("site_settings").update({ value }).eq("key", key)
        } else {
          await supabase.from("site_settings").insert({ key, value })
        }
      }
      toast.success("Settings saved")
    } catch {
      toast.error("Failed to save settings")
    }
    setSaving(false)
  }

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

      <div className="mt-6 space-y-4">
        {Object.entries(edits).map(([key, value]) => (
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
    </div>
  )
}