import { Phone, Mail, MapPin } from "lucide-react"
import Link from "next/link"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-brand-forest text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="font-heading text-lg font-semibold text-white">Textile Impressions</h3>
            <p className="mt-2 text-sm text-white/70">
              Handcrafted Pakistani fashion, made with love. Premium quality kurtas, dupattas,
              suits, and accessories.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/80">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/shop" className="transition-colors hover:text-white">
                  Shop All
                </Link>
              </li>
              <li>
                <Link href="/colors" className="transition-colors hover:text-white">
                  Colors & Paints
                </Link>
              </li>
              <li>
                <Link href="/skills-studio" className="transition-colors hover:text-white">
                  Skills Studio
                </Link>
              </li>
              <li>
                <Link href="/custom-orders" className="transition-colors hover:text-white">
                  Custom Orders
                </Link>
              </li>
              <li>
                <Link href="/incubator" className="transition-colors hover:text-white">
                  Incubator
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/80">
              Payment Methods
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-terracotta" />
                Bank Transfer
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-terracotta" />
                Cash on Delivery (Karachi)
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/80">
              Contact Us
            </h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                <a href="tel:+923001234567" className="transition-colors hover:text-white">
                  +92 300 1234567
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <a href="mailto:hello@textileimpressions.com" className="transition-colors hover:text-white">
                  hello@textileimpressions.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Lahore, Pakistan</span>
              </li>
              <li>
                <a
                  href="https://wa.me/923001234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-terracotta px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-terracotta/90"
                >
                  <Phone className="h-4 w-4" />
                  WhatsApp Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          &copy; {currentYear} Textile Impressions. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
