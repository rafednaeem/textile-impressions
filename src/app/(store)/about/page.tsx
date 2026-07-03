import type { Metadata } from "next"
import Script from "next/script"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Leaf, Users, Lightbulb } from "lucide-react"
import { storeName, baseUrl } from "@/lib/constants"
import { canonicalUrl, breadcrumbSchema } from "@/lib/seo"

export const metadata: Metadata = {
  title: `About — ${storeName}`,
  description:
    "Textile Impressions is a first-of-its-kind facility advancing Pakistan’s social development through education, sampling, and production in textiles.",
  alternates: { canonical: canonicalUrl("/about") },
  openGraph: {
    title: `About — ${storeName}`,
    description: "Education, sampling & production for Pakistan’s textile future.",
    url: `${baseUrl}/about`,
    type: "website",
  },
}

const values = [
  {
    title: "Sustainable Responsibility",
    description: "We choose materials and methods that respect people and planet.",
    icon: Leaf,
  },
  {
    title: "Self Sufficiency",
    description: "We build skills so artisans and businesses can stand on their own.",
    icon: Users,
  },
  {
    title: "Flexible Entrepreneurship",
    description: "We adapt, experiment, and turn craft into independent enterprise.",
    icon: Lightbulb,
  },
]

export default function AboutPage() {
  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: canonicalUrl("/") },
    { name: "About", url: canonicalUrl("/about") },
  ])

  return (
    <>
      <Script id="breadcrumb-about" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(breadcrumb)}
      </Script>

      <div className="bg-brand-ivory text-brand-umber">
        <section className="px-4 pb-16 pt-32 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">About Us</p>
            <h1 className="mt-4 font-heading text-5xl font-semibold leading-tight text-brand-indigo sm:text-6xl">
              Textile Impressions
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Education, sampling & production for Pakistan’s textile future.
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
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">Who We Are</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-brand-indigo sm:text-4xl">
                A new kind of textile facility
              </h2>
              <p className="mt-5 leading-7 text-muted-foreground">
                We are a first-of-its-kind facility that continues Pakistan’s strive for social development.
                By introducing international technology to local businesses, we help makers make socially
                responsible and cost-effective decisions.
              </p>
              <p className="mt-4 leading-7 text-muted-foreground">
                Our work sits at the intersection of craft, education, and enterprise — connecting traditional
                knowledge with contemporary practice so Pakistan’s textile sector can grow with integrity.
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
                src="https://picsum.photos/seed/textile-studio/1200/900"
                alt="Textile Impressions studio workspace"
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
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">Our Vision</p>
                <p className="mt-4 font-heading text-2xl font-semibold sm:text-3xl">
                  Textile awareness through education and collaboration.
                </p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">Our Mission</p>
                <p className="mt-4 font-heading text-2xl font-semibold sm:text-3xl">
                  Build a community of past and present textile talents to revive the sector in Pakistan.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">Our Values</p>
            <h2 className="mt-3 font-heading text-4xl font-semibold text-brand-indigo">What guides us</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {values.map((value) => (
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
                <h3 className="mt-5 font-heading text-xl font-semibold text-brand-indigo">{value.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{value.description}</p>
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
                src="https://picsum.photos/seed/textile-founder/1000/1250"
                alt="Dr. Sitara Tanveer, founder of Textile Impressions"
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
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-saffron">Behind the venture</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-brand-indigo sm:text-4xl">
                Dr. Sitara Tanveer
              </h2>
              <p className="mt-5 leading-7 text-muted-foreground">
                Textile Impressions is led by Dr. Sitara Tanveer, a textile professional whose career began in
                the early 1990s in directorial roles with Pakistani textile giants including Al-Abid and
                Nakshbandi Industries. Her passion for craft led her to distinguished trainings in Germany and
                Switzerland, and later to a PhD in Applied Chemistry from the HEJ Institute, University of
                Karachi, focused on fiber reactive dyes and color fastness on cotton.
              </p>
              <p className="mt-4 leading-7 text-muted-foreground">
                She continues to collaborate with leading institutes across Pakistan — including the Textile
                Institute of Pakistan, SMARTI, NED University, Karachi University, and the Federal Urdu
                University of Arts, Science and Technology. Her aim is to revive Pakistan’s textile sector by
                equipping young talent with the skills, sustainability practices, and quality standards needed
                to compete internationally.
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
              <h2 className="font-heading text-3xl font-semibold sm:text-4xl">Be part of the revival</h2>
              <p className="mt-4 text-lg text-brand-ivory/80">
                Whether you want to learn, create, or grow a textile business, there is a place for you here.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/skills-studio"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-brand-saffron px-7 text-sm font-bold text-brand-umber transition hover:bg-brand-saffron/90"
                >
                  Explore Skills Studio
                </Link>
                <Link
                  href="/incubator"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-brand-ivory px-7 text-sm font-bold text-brand-ivory transition hover:bg-brand-ivory hover:text-brand-indigo"
                >
                  Join the incubator
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  )
}
