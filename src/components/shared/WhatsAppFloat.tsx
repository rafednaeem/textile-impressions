"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { MessageCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { extractSettings } from "@/lib/settings"

export default function WhatsAppFloat() {
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [whatsapp, setWhatsapp] = useState("")

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setVisible(window.scrollY > 200)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "store_whatsapp")
      .single()
      .then(({ data }) => {
        if (data?.value) setWhatsapp(data.value)
      })
  }, [supabase])

  if (!mounted) return null

  const href = `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hi! I'm interested in your products.")}`

  return createPortal(
    <div className="pointer-events-none sticky bottom-0 z-[70] h-0">
      <AnimatePresence>
        {visible && (
          <motion.a
            href={href}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            className="whatsapp-float pointer-events-auto absolute bottom-5 right-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-umber/20"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Chat with us</span>
          </motion.a>
        )}
      </AnimatePresence>
    </div>,
    document.body
  )
}
