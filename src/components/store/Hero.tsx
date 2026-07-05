"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

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
        Textile Impression — Education, Sampling & Production
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
  return (
    <section
      aria-label="Hero"
      className="relative flex h-[100svh] min-h-[640px] flex-col overflow-hidden bg-white sm:min-h-[700px] md:min-h-[760px]"
    >
      {/* Top-right decorative ink swirl */}
      <div className="pointer-events-none absolute -top-4 -right-8 z-0 h-[80%] w-[80%] overflow-hidden md:h-[75%] md:w-[65%] lg:w-[60%]">
        <Image
          src="/new_hero.jpeg"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 80vw, 65vw"
          className="object-cover"
          style={{ objectPosition: "top right" }}
        />
      </div>

      {/* Bottom-left decorative ink swirl */}
      <div className="pointer-events-none absolute -bottom-4 -left-8 z-0 h-[70%] w-[75%] overflow-hidden md:h-[65%] md:w-[55%] lg:w-[50%]">
        <Image
          src="/new_hero.jpeg"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 75vw, 55vw"
          className="scale-x-[-1] object-cover"
          style={{ objectPosition: "bottom left" }}
        />
      </div>

      {/* Hero content — heading, subtitle, CTAs */}
      <div className="relative z-10 flex flex-1 flex-col justify-start px-6 pt-[22vh] sm:px-10 md:px-16 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-lg md:max-w-xl"
        >
          <h1 className="font-display text-[clamp(3rem,8vw,5.25rem)] font-medium leading-[1.02] tracking-tight text-brand-indigo">
            From Craft
            <br /> to Career
          </h1>
          <p className="mt-5 max-w-md font-heading text-lg italic leading-relaxed text-brand-indigo/85 sm:text-xl">
            Handcrafted Pakistani textiles,
            <br /> artisan-led skills training,
            <br /> sustainable livelihoods
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/shop"
              className="inline-flex h-12 items-center justify-center rounded-full bg-brand-saffron px-8 text-sm font-semibold text-white transition hover:bg-brand-saffron/90 sm:text-base"
            >
              Shop the collection
            </Link>
            <Link
              href="/skills-studio"
              className="inline-flex h-12 items-center justify-center rounded-full border border-brand-indigo bg-white px-8 text-sm font-semibold text-brand-indigo transition hover:bg-brand-indigo/5 sm:text-base"
            >
              Learn a craft
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Centered wordmark + tagline at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="relative z-10 flex flex-col items-center px-4 pb-16 sm:pb-20"
      >
        <HeroWordmark />
      </motion.div>

      {/* Scroll indicator */}
      <ChevronDown
        className="absolute bottom-5 left-1/2 z-10 h-6 w-6 -translate-x-1/2 animate-bounce text-brand-indigo/60 sm:bottom-6 sm:h-7 sm:w-7"
        aria-hidden="true"
      />
    </section>
  )
}
