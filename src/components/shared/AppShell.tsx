"use client"

import { motion } from "framer-motion"
import { useSessionRestore } from "./SessionRestoreProvider"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { sessionState } = useSessionRestore()

  return (
    <motion.div
      initial={sessionState === "checking" ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-full flex flex-col"
    >
      {children}
    </motion.div>
  )
}
