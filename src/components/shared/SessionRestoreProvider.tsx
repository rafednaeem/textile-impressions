"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import AuthLoadingScreen from "./AuthLoadingScreen"

interface SessionRestoreContextValue {
  isRestoringSession: boolean
}

const SessionRestoreContext = createContext<SessionRestoreContextValue>({
  isRestoringSession: false,
})

export function useSessionRestore() {
  return useContext(SessionRestoreContext)
}

export function SessionRestoreProvider({ children }: { children: ReactNode }) {
  const [isRestoringSession, setIsRestoringSession] = useState(true)
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    const restoreSession = async () => {
      if (typeof window === "undefined") return

      const hasRememberMe = localStorage.getItem("remember_me") === "1"

      if (!hasRememberMe) {
        setIsRestoringSession(false)
        return
      }

      setShowLoading(true)

      const supabase = createClient()

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user && user.app_metadata?.role !== "admin") {
          sessionStorage.setItem("ti_session_active", "1")

          await new Promise((resolve) => setTimeout(resolve, 1200))
        } else {
          localStorage.removeItem("remember_me")
        }
      } catch {
        localStorage.removeItem("remember_me")
      }

      setIsRestoringSession(false)
    }

    restoreSession()
  }, [])

  return (
    <SessionRestoreContext.Provider value={{ isRestoringSession }}>
      <AnimatePresence>
        {showLoading && <AuthLoadingScreen />}
      </AnimatePresence>
      {children}
    </SessionRestoreContext.Provider>
  )
}
