import { CartProvider } from "@/hooks/useCart"
import Header from "@/components/store/Header"
import Footer from "@/components/store/Footer"
import { Toaster } from "@/components/ui/sonner"
import WhatsAppFloat from "@/components/shared/WhatsAppFloat"

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
      <Toaster />
    </CartProvider>
  )
}
