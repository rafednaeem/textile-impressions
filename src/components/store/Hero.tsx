"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import ShaderBackground from "./ShaderBackground"

function YarnBallIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M12 24c0-7 5.5-12 12-12s12 5 12 12-5 12-12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M24 10v28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 24h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 15l18 18M15 33l18-18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M35 35c3 3 5 7 5 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function HeroWordmark() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="flex flex-col items-center text-brand-indigo"
    >
      <span className="sr-only">
        Textile Impression — Education, Sampling &amp; Production
      </span>
      <div aria-hidden className="flex flex-col items-center">
        <span className="font-heading text-[10px] font-medium uppercase tracking-[0.5em] sm:text-xs md:text-sm">
          Textile
        </span>
        <div className="flex items-center font-heading text-2xl font-normal uppercase tracking-[0.22em] sm:text-3xl md:text-4xl lg:text-5xl">
          <span>IMPRESS</span>
          <YarnBallIcon className="-mx-0.5 h-6 w-6 sm:h-7 sm:w-7 md:h-9 md:w-9 lg:h-11 lg:w-11" />
          <span>N</span>
        </div>
      </div>
      <span className="mt-2 font-heading text-[9px] font-medium uppercase tracking-[0.3em] text-brand-indigo/80 sm:text-[10px] md:text-xs">
        Education, Sampling &amp; Production
      </span>
    </motion.div>
  )
}

export default function Hero() {
  function scrollToNextSection() {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
    }
  }

  return (
    <section
      aria-label="Hero"
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-white"
    >
      {/* Animated ink/dye shader background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <ShaderBackground />
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-1 flex-col justify-start px-6 pt-[18vh] sm:px-10 sm:pt-[20vh] md:px-16 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto w-full max-w-7xl"
        >
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <h1 className="font-display text-[clamp(3.5rem,15vw,6.5rem)] font-medium leading-[0.9] tracking-tight text-brand-indigo md:text-[clamp(4.5rem,10vw,7.5rem)]">
              From Craft
              <br /> to Career
            </h1>
            <p className="mt-6 max-w-md font-heading text-lg italic leading-relaxed text-brand-indigo/80 sm:text-xl md:mt-8 md:text-2xl">
              Handcrafted Pakistani textiles, artisan-led skills training,
              sustainable livelihoods.
            </p>
            <div className="mt-8 flex w-full flex-col items-stretch gap-4 sm:w-auto sm:flex-row sm:items-center md:mt-10">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center rounded-full bg-brand-saffron px-10 text-center text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-brand-saffron/20 transition hover:bg-brand-saffron/90 sm:h-14 sm:min-w-[220px] sm:text-xs"
              >
                Shop the Collection
              </Link>
              <Link
                href="/skills-studio"
                className="inline-flex h-12 items-center justify-center rounded-full border border-brand-indigo/40 bg-white px-10 text-center text-[11px] font-bold uppercase tracking-wider text-brand-indigo transition hover:border-brand-indigo hover:bg-brand-indigo/5 sm:h-14 sm:min-w-[180px] sm:text-xs"
              >
                Learn a Craft
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Centered wordmark + tagline at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="relative z-10 flex flex-col items-center px-4 pb-10 pt-10 sm:pb-12 sm:pt-12"
      >
        <HeroWordmark />
      </motion.div>

      {/* Scroll indicator */}
      <button
        type="button"
        onClick={scrollToNextSection}
        className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 text-brand-indigo/40 transition-colors hover:text-brand-saffron sm:bottom-6"
        aria-label="Scroll to next section"
      >
        <ChevronDown className="h-6 w-6 animate-bounce sm:h-7 sm:w-7" aria-hidden="true" />
      </button>
    </section>
  )
}
