"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"

interface CounterProps {
  target: number
  suffix?: string
  label: string
  duration?: number
}

function Counter({ target, suffix = "", label, duration = 2 }: CounterProps) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const increment = target / (duration * 60)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [isInView, target, duration])

  return (
    <div ref={ref} className="text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <span className="font-heading text-4xl font-bold text-brand-saffron sm:text-5xl">
          {count.toLocaleString()}{suffix}
        </span>
        <p className="mt-2 text-sm text-brand-ivory/70">{label}</p>
      </motion.div>
    </div>
  )
}

export default function ImpactCounters() {
  return (
    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
      <Counter target={500} suffix="+" label="Products Crafted" />
      <Counter target={50} suffix="+" label="Artisan Families" />
      <Counter target={2000} suffix="+" label="Workshop Graduates" />
      <Counter target={7} suffix=" years" label="Building Livelihoods" />
    </div>
  )
}