"use client"

import { motion } from "framer-motion"

export default function AuthLoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-brand-ivory"
    >
      <div className="flex flex-col items-center gap-8 px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-brand-indigo/10 bg-brand-indigo">
              <span className="font-heading text-3xl font-bold text-white">TI</span>
            </div>
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full border-2 border-brand-indigo/20"
            />
          </div>

          <h1 className="font-heading text-4xl font-bold text-brand-indigo sm:text-5xl">
            Welcome Back
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col items-center gap-3"
        >
          <p className="text-lg text-brand-umber/70">
            Textile Impressions remembers you.
          </p>
          <p className="text-sm text-brand-warmgray">
            Signing you into your account...
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-2"
        >
          <div className="relative h-8 w-8">
            <div className="absolute inset-0 rounded-full border-2 border-brand-indigo/10" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-saffron"
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
