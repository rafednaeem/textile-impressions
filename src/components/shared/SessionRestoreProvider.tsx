"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import AuthLoadingScreen from "./AuthLoadingScreen"

type SessionState = "checking" | "authenticated" | "unauthenticated"

interface SessionRestoreContextValue {
  sessionState: SessionState
}

const SessionRestoreContext = createContext<SessionRestoreContextValue>({
  sessionState: "unauthenticated",
})

export function useSessionRestore() {
  return useContext(SessionRestoreContext)
}

export function SessionRestoreProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>("checking")
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const restoreSession = async () => {
      if (typeof window === "undefined") return

      const hasRememberMe = localStorage.getItem("remember_me") === "1"

      if (!hasRememberMe) {
        if (!cancelled) setSessionState("unauthenticated")
        return
      }

      setShowLoading(true)

      const supabase = createClient()

      try {
        const {
          data: { user },
          error,
        } = await Promise.race([
          supabase.auth.getUser(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Session check timed out")), 8000)
          ),
        ])

        if (cancelled) return

        if (error) {
          console.error("[SessionRestore] Auth error:", error.message)
          localStorage.removeItem("remember_me")
          setSessionState("unauthenticated")
          return
        }

        if (user && user.app_metadata?.role !== "admin") {
          sessionStorage.setItem("ti_session_active", "1")
          setSessionState("authenticated")
          await new Promise((resolve) => setTimeout(resolve, 1200))
        } else {
          localStorage.removeItem("remember_me")
          setSessionState("unauthenticated")
        }
      } catch (err) {
        console.error("[SessionRestore] Failed to restore session:", err)
        if (!cancelled) {
          localStorage.removeItem("remember_me")
          setSessionState("unauthenticated")
        }
      } finally {
        if (!cancelled) {
          setShowLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <SessionRestoreContext.Provider value={{ sessionState }}>
      <AnimatePresence>
        {showLoading && <AuthLoadingScreen />}
      </AnimatePresence>
      {children}
    </SessionRestoreContext.Provider>
  )
}
