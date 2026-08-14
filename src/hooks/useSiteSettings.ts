"use client"

import { useEffect, useState } from "react"
import { getSiteSettings } from "@/lib/site-settings"

export function useSiteSettings() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getSiteSettings().then((data) => {
      if (mounted) {
        setSettings(data)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  return { settings, loading, whatsappNumber: settings?.store_whatsapp || "" }
}
