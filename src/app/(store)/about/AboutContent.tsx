"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Leaf, Users, Lightbulb } from "lucide-react"

import type { getPageWebsiteContent } from "@/lib/website-content/server"

const values = [
  { icon: Leaf, title: "", description: "" },
  { icon: Users, title: "", description: "" },
  { icon: Lightbulb, title: "", description: "" },
]

export default function AboutContent({
  content,
}: {
  content: Awaited<ReturnType<typeof getPageWebsiteContent>>
}) {
  const c = content
  const valueContent = [
    { title: c.values.value_1_title, description: c.values.value_1_description },
    { title: c.values.value_2_title, description: c.values.value_2_description },
    { title: c.values.value_3_title, description: c.values.value_3_description },
  ]

  return (
    <div className="bg-brand-ivory text-brand-umber">
      <section className="px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">{c.hero.label}</p>
          <h1 className="mt-4 font-heading text-5xl font-semibold leading-tight text-brand-indigo sm:text-6xl">
            {c.hero.heading}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            {c.hero.description}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">{c.who_we_are.label}</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-brand-indigo sm:text-4xl">
              {c.who_we_are.heading}
            </h2>
            <p className="mt-5 leading-7 text-muted-foreground">
              {c.who_we_are.paragraph_1}
            </p>
            <p className="mt-4 leading-7 text-muted-foreground">
              {c.who_we_are.paragraph_2}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative aspect-[4/3] overflow-hidden rounded-lg"
          >
            <Image
              src={c.who_we_are.image_url}
              alt={c.who_we_are.image_alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>
        </div>
      </section>

      <section className="bg-brand-indigo py-16 text-brand-ivory sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">{c.vision_mission.vision_label}</p>
              <p className="mt-4 font-heading text-2xl font-semibold sm:text-3xl">
                {c.vision_mission.vision_text}
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">{c.vision_mission.mission_label}</p>
              <p className="mt-4 font-heading text-2xl font-semibold sm:text-3xl">
                {c.vision_mission.mission_text}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">{c.values.label}</p>
          <h2 className="mt-3 font-heading text-4xl font-semibold text-brand-indigo">{c.values.heading}</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-lg border border-border bg-white p-6 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-indigo/10">
                <value.icon className="h-6 w-6 text-brand-crimson" />
              </div>
              <h3 className="mt-5 font-heading text-xl font-semibold text-brand-indigo">{valueContent[index].title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{valueContent[index].description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative aspect-[4/5] overflow-hidden rounded-lg lg:order-2"
          >
            <Image
              src={c.founder.image_url}
              alt={c.founder.image_alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:order-1"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">{c.founder.label}</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-brand-indigo sm:text-4xl">
              {c.founder.heading}
            </h2>
            <p className="mt-5 leading-7 text-muted-foreground">
              {c.founder.paragraph_1}
            </p>
            <p className="mt-4 leading-7 text-muted-foreground">
              {c.founder.paragraph_2}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="bg-brand-indigo py-16 text-brand-ivory sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-heading text-3xl font-semibold sm:text-4xl">{c.cta.heading}</h2>
            <p className="mt-4 text-lg text-brand-ivory/80">
              {c.cta.description}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/skills-studio"
                className="inline-flex h-12 items-center justify-center rounded-full bg-brand-saffron px-7 text-sm font-bold text-brand-umber transition hover:bg-brand-saffron/90"
              >
                {c.cta.button_primary}
              </Link>
              <Link
                href="/incubator"
                className="inline-flex h-12 items-center justify-center rounded-full border border-brand-ivory px-7 text-sm font-bold text-brand-ivory transition hover:bg-brand-ivory hover:text-brand-indigo"
              >
                {c.cta.button_secondary}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
